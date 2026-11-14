import { EXPERIMENT_FLAGS, POSTHOG_HOST, POSTHOG_TOKEN, posthogEnabled } from "./config";

type PostHog = typeof import("posthog-js").default;

// posthog-js lastes først ved behov, så den ikke ligger i hovedbunten og ikke
// kjøres i det hele tatt når token mangler.
let client: Promise<PostHog | null> | undefined;
let loaded: PostHog | null = null;

export const initPostHog = (): Promise<PostHog | null> => {
    if (!posthogEnabled || typeof window === "undefined") {
        return Promise.resolve(null);
    }

    client ??= import("posthog-js")
        .then(({ default: posthog }) => {
            posthog.init(POSTHOG_TOKEN, {
                api_host: POSTHOG_HOST,
                // Bare eksplisitte hendelser: autocapture kunne ellers fange tekst fra
                // feltene der folk skriver lagnavn og medlemsnavn.
                autocapture: false,
                capture_pageview: "history_change",
                disable_session_recording: true,
                // Ingenting lagres i nettleseren (verken cookie eller storage): da trengs ikke
                // samtykke etter ekomloven § 3-15. Anonym id lever bare til siden lastes på nytt.
                persistence: "memory",
                person_profiles: "identified_only",
                ip: false,
            });
            loaded = posthog;
            return posthog;
        })
        .catch(() => null);

    return client;
};

/** Sender en hendelse. Aldri persondata: ingen navn, ingen fritekst. */
export const track = (event: string, properties?: Record<string, string | number | boolean>) => {
    void initPostHog().then((posthog) => posthog?.capture(event, properties));
};

/** Variant for ett eksperiment, eller undefined før flaggene er lastet / uten eksperiment. */
export const getVariant = (flag: string): string | undefined => {
    const value = loaded?.getFeatureFlag(flag);
    return typeof value === "string" ? value : value === true ? "true" : undefined;
};

/** Kort streng for backenden (maks 32 tegn), f.eks. «layout=b». Undefined uten eksperimenter. */
export const experimentVariant = (): string | undefined => {
    const parts = EXPERIMENT_FLAGS.flatMap((flag) => {
        const variant = getVariant(flag);
        return variant === undefined ? [] : [`${flag}=${variant}`];
    });
    return parts.length > 0 ? parts.join(",").slice(0, 32) : undefined;
};
