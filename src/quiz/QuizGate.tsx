"use client";
import { ButtonGroup } from "@fremtind/jokul/button-group";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import styles from "./QuestionPage.module.scss";
import { formatQuizTime, quizStatus } from "./status";
import { hasStarted, readCompleted } from "./storage";
import { useQuiz } from "./useQuiz";

type Access = "checking" | "allowed" | "blocked";

/**
 * Slipper bare inn den som kan starte quizen nå, eller som allerede har begynt (så den som
 * er midt i quizen får fullføre selv om den stenger). Klokka finnes bare i nettleseren, så
 * den statiske HTML-en viser nøytral lasting og aldri spørsmålsinnhold før sjekken er gjort.
 *
 * Dette er klientside-håndheving og kan omgås ved å endre enhetens klokke.
 */
export const QuizGate = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const quiz = useQuiz();
    const [access, setAccess] = useState<Access>("checking");

    useEffect(() => {
        if (readCompleted(quiz.slug)) {
            // Fullført quiz skal til resultatet, ikke til «ikke åpen», uansett tidsrom.
            router.replace(`/quizer/${quiz.slug}/resultat/`);
            return;
        }
        setAccess(quizStatus(quiz) === "open" || hasStarted(quiz.slug) ? "allowed" : "blocked");
    }, [quiz, router]);

    if (access === "allowed") {
        return children;
    }

    if (access === "checking") {
        return (
            <Text size="s" subdued role="status">
                Laster …
            </Text>
        );
    }

    return (
        <Flex direction="column" gap="m" className={styles.form}>
            <Title as="h1" size="l">
                Quizen er ikke åpen
            </Title>
            <Text>{quiz.title}</Text>
            {quiz.opens && quizStatus(quiz) === "upcoming" && (
                <Text>Åpner {formatQuizTime(quiz.opens)}.</Text>
            )}
            {quiz.closes && quizStatus(quiz) === "closed" && (
                <Text>Stengte {formatQuizTime(quiz.closes)}.</Text>
            )}
            <ButtonGroup
                className={styles.actions}
                mainAction={{
                    type: "button",
                    children: "Til forsiden",
                    onClick: () => router.push("/"),
                }}
            />
        </Flex>
    );
};
