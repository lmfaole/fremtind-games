// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver (se docs/jokul.md).
"use client";
import { Button } from "@fremtind/jokul/button";
import { Text } from "@fremtind/jokul/typography";
import { useEffect, useRef, useState } from "react";
import { track } from "@/analytics";
import styles from "./PwaInit.module.scss";
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

    if (!waiting) {
        return null;
    }

    return (
        <div className={styles.banner} role="status" data-theme="dark">
            <Text size="s">Ny versjon tilgjengelig</Text>
            <Button
                variant="secondary"
                onClick={() => {
                    applying.current = true;
                    // Send hvis workeren er borte (allerede aktivert i en annen fane): last på nytt.
                    waiting.postMessage({ type: "SKIP_WAITING" });
                    window.setTimeout(() => {
                        if (applying.current) {
                            window.location.reload();
                        }
                    }, 3000);
                }}
            >
                Last på nytt
            </Button>
        </div>
    );
};
