"use client";
import { Text } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Statisk eksport har ingen omdirigering på serversiden, så den skjer i nettleseren. */
export const Redirect = ({ to }: { to: string }) => {
    const router = useRouter();

    useEffect(() => {
        router.replace(to);
    }, [router, to]);

    return (
        <Text size="s" subdued>
            Flytter deg videre …
        </Text>
    );
};
