// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver (se docs/jokul.md).
"use client";
import { ToastProvider, useToast } from "@fremtind/jokul/toast";
import { useEffect, useRef, useState } from "react";
import { track } from "@/analytics";
import { trackLaunchOnce } from "./index";

const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Registrerer service workeren (bare i produksjonsbygg) og viser en melding når en ny versjon
 * ligger klar. Den nye workeren aktiveres først når brukeren ber om det, så en quiz i gang
 * ikke bytter kode midt i.
 */
export const PwaInit = () => {
    const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
    const applying = useRef(false);

    useEffect(() => {
        trackLaunchOnce();

        const onInstalled = () => track("pwa_installed");
        window.addEventListener("appinstalled", onInstalled);

        if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
            return () => window.removeEventListener("appinstalled", onInstalled);
        }

        let interval: number | undefined;
        let cancelled = false;

        const watch = (registration: ServiceWorkerRegistration) => {
            // Finnes det en kontroller, er dette en oppdatering og ikke første installasjon.
            const offer = (worker: ServiceWorker | null) => {
                if (worker && navigator.serviceWorker.controller && !cancelled) {
                    setWaiting(worker);
                }
            };
            offer(registration.waiting);
            registration.addEventListener("updatefound", () => {
                const worker = registration.installing;
                worker?.addEventListener("statechange", () => {
                    if (worker.state === "installed") {
                        offer(worker);
                    }
                });
            });
            interval = window.setInterval(() => {
                registration.update().catch(() => {});
            }, UPDATE_CHECK_MS);
        };

        const onControllerChange = () => {
            // Bare når brukeren selv valgte oppdatering, ikke ved første kontroll (clients.claim).
            if (applying.current) {
                track("sw_update_applied");
                window.location.reload();
            }
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        navigator.serviceWorker
            .register("/sw.js", { scope: "/", updateViaCache: "none" })
            .then(watch)
            .catch(() => {
                // Registrering kan feile (privat modus, blokkert). Nettstedet virker uten.
            });

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            window.removeEventListener("appinstalled", onInstalled);
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
    }, []);

    return (
        <ToastProvider>
            <UpdateToast
                waiting={waiting}
                onApply={() => {
                    applying.current = true;
                    // Send hvis workeren er borte (allerede aktivert i en annen fane): last på nytt.
                    waiting?.postMessage({ type: "SKIP_WAITING" });
                    window.setTimeout(() => {
                        if (applying.current) {
                            window.location.reload();
                        }
                    }, 3000);
                }}
            />
        </ToastProvider>
    );
};

/** Viser Jøkuls toast så lenge en ny versjon venter. Ingen timeout: valget skal ikke forsvinne. */
const UpdateToast = ({
    waiting,
    onApply,
}: {
    waiting: ServiceWorker | null;
    onApply: () => void;
}) => {
    const toast = useToast();
    const apply = useRef(onApply);
    apply.current = onApply;

    useEffect(() => {
        if (!waiting) {
            return;
        }
        const key = toast.add("Ny versjon tilgjengelig", {
            variant: "info",
            timeout: "off",
            action: { label: "Last på nytt", onClick: () => apply.current() },
        });
        return () => toast.close(key);
    }, [waiting, toast]);

    return null;
};
