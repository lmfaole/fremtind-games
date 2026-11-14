import { track } from "@/analytics";
import { API_URL } from "@/analytics/config";
import { isStandalone } from "./index";

/** Offentlig VAPID-nøkkel (base64url). Tom verdi slår push av. Inlines ved bygg. */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export const pushConfigured = VAPID_PUBLIC_KEY !== "" && API_URL !== "";

const toBytes = (base64Url: string) => {
    const base64 = base64Url
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

const isIos = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export type PushSupport = "ok" | "needs-install" | "unsupported";

/** iOS støtter bare push for appen installert på Hjem-skjermen. */
export const pushSupport = (): PushSupport => {
    if (
        !pushConfigured ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
    ) {
        return "unsupported";
    }
    return isIos() && !isStandalone() ? "needs-install" : "ok";
};

// Service workeren registreres bare i produksjonsbygg, så ikke vent på `ready` i dev.
const registration = async () => navigator.serviceWorker.getRegistration();

export const currentSubscription = async (): Promise<PushSubscription | null> => {
    const reg = await registration();
    return reg ? reg.pushManager.getSubscription() : null;
};

const post = (path: string, body: unknown) =>
    fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

/** Må kalles fra et brukertrykk (krav på iOS). Abonnementet kobles aldri til lagnavn eller svar. */
export const subscribe = async (): Promise<"granted" | "denied" | "failed"> => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            track("push_denied");
            return "denied";
        }
        const reg = await registration();
        if (!reg) {
            throw new Error("Ingen service worker");
        }
        const sub =
            (await reg.pushManager.getSubscription()) ??
            (await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: toBytes(VAPID_PUBLIC_KEY),
            }));
        const { endpoint, keys } = sub.toJSON();
        const response = await post("/push/subscribe", { endpoint, keys });
        if (!response.ok) {
            await sub.unsubscribe();
            throw new Error(`HTTP ${response.status}`);
        }
        track("push_granted");
        return "granted";
    } catch {
        track("push_subscribe_failed");
        return "failed";
    }
};

export const unsubscribe = async (): Promise<void> => {
    const sub = await currentSubscription();
    if (!sub) {
        return;
    }
    // Meld av hos nettleseren først, så brukeren aldri får varsler selv om backenden ikke svarer.
    await sub.unsubscribe();
    try {
        await post("/push/unsubscribe", { endpoint: sub.endpoint });
    } catch {
        // Backenden rydder uansett opp ved første 404/410.
    }
    track("push_unsubscribed");
};
