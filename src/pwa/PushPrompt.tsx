// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver (se docs/jokul.md).
"use client";
import { Button } from "@fremtind/jokul/button";
import { Text } from "@fremtind/jokul/typography";
import { useEffect, useState } from "react";
import { track } from "@/analytics";
import { currentSubscription, pushSupport, type PushSupport, subscribe, unsubscribe } from "./push";

type State = "loading" | "off" | "on" | "denied" | "failed";

/** Opt-in til varsler. Rendrer ingenting når push ikke er konfigurert eller støttet. */
export const PushPrompt = () => {
    const [support, setSupport] = useState<PushSupport>("unsupported");
    const [state, setState] = useState<State>("loading");

    useEffect(() => {
        const result = pushSupport();
        setSupport(result);
        if (result !== "ok") {
            return;
        }
        if (Notification.permission === "denied") {
            setState("denied");
            return;
        }
        void currentSubscription().then((sub) => {
            setState(sub ? "on" : "off");
            if (!sub) {
                track("push_prompt_shown");
            }
        });
    }, []);

    if (support === "unsupported" || state === "loading") {
        return null;
    }

    if (support === "needs-install") {
        return (
            <Text size="s" subdued>
                Vil du ha varsler? Legg først quizen til på Hjem-skjermen, og åpne den derfra.
            </Text>
        );
    }

    if (state === "denied") {
        return (
            <Text size="s" subdued>
                Varsler er blokkert i nettleseren. Tillat dem i nettstedinnstillingene for å slå dem
                på.
            </Text>
        );
    }

    if (state === "on") {
        return (
            <Button
                variant="ghost"
                onClick={async () => {
                    await unsubscribe();
                    setState("off");
                }}
            >
                Slå av varsler
            </Button>
        );
    }

    return (
        <>
            <Button
                variant="ghost"
                onClick={async () => {
                    const result = await subscribe();
                    setState(result === "granted" ? "on" : result);
                }}
            >
                Slå på varsler
            </Button>
            {state === "failed" && (
                <Text size="s" subdued>
                    Kunne ikke slå på varsler akkurat nå. Prøv igjen senere.
                </Text>
            )}
        </>
    );
};
