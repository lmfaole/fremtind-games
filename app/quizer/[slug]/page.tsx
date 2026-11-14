"use client";
import { Text } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuiz } from "@/quiz/useQuiz";

// `/quizer/<slug>` er ikke et spørsmål i seg selv. Statisk eksport har ingen
// omdirigering på serversiden, så den skjer i nettleseren.
const QuizIndex = () => {
    const router = useRouter();
    const quiz = useQuiz();

    useEffect(() => {
        router.replace(`/quizer/${quiz.slug}/lag/`);
    }, [router, quiz.slug]);

    return (
        <Text size="s" subdued>
            Starter quizen …
        </Text>
    );
};

export default QuizIndex;
