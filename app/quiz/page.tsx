"use client";
import { Text } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// `/quiz` er ikke et spørsmål i seg selv. Statisk eksport har ingen
// omdirigering på serversiden, så den skjer i nettleseren.
const QuizIndex = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace("/quiz/1/");
    }, [router]);

    return (
        <Text size="s" subdued>
            Starter quizen …
        </Text>
    );
};

export default QuizIndex;
