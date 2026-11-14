// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver (se docs/jokul.md).
"use client";
import { Button } from "@fremtind/jokul/button";
import { Text } from "@fremtind/jokul/typography";
import { useEffect, useState } from "react";
import { isStandalone } from "./index";

// Ikke del av standard DOM-typene ennå.
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIos = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS utgir seg for å være en Mac, men har berøringsskjerm.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Liten, ikke-påtrengende installasjonshjelp. Rendrer ingenting når appen allerede er installert
 * eller nettleseren ikke støtter installasjon. Valget «ikke nå» lever bare i minnet.
 */
export const InstallPrompt = () => {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [ios, setIos] = useState(false);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        if (isStandalone()) {
            return;
        }
        setHidden(false);
        setIos(isIos());

        const onPrompt = (event: Event) => {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
        };
        const onInstalled = () => setHidden(true);
        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onPrompt);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    if (hidden) {
        return null;
    }

    if (deferred) {
        return (
            <Button
                variant="ghost"
                onClick={async () => {
                    const prompt = deferred;
                    setDeferred(null);
                    await prompt.prompt();
                    // pwa_installed sendes av `appinstalled`-hendelsen i PwaInit.
                    if ((await prompt.userChoice).outcome === "accepted") {
                        setHidden(true);
                    }
                }}
            >
                Installer som app
            </Button>
        );
    }

    if (ios) {
        return (
            <Text size="s" subdued>
                Vil du bruke quizen som app? Trykk på del-ikonet i Safari og velg «Legg til på
                Hjem-skjerm».
            </Text>
        );
    }

    return null;
};
