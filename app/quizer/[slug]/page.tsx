// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Button } from "@fremtind/jokul/button";
import { Card } from "@fremtind/jokul/card";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { useEffect, useState } from "react";
import { readScore } from "@/quiz/score";
import { formatQuizTime, quizStatus, type QuizStatus } from "@/quiz/status";
import { hasStarted } from "@/quiz/storage";
import { useQuiz } from "@/quiz/useQuiz";
import styles from "./page.module.scss";

interface State {
    status: QuizStatus;
    score: number | null;
    started: boolean;
}

// Quizens egen forside: beskrivelse og start, med quizens eget heldekkende bilde. Tilstanden
// (åpningstid, fullført, påbegynt) finnes bare i nettleseren, så den leses etter hydrering og
// den statiske HTML-en viser aldri en knapp som kan være feil.
const QuizHome = () => {
    const quiz = useQuiz();
    const [state, setState] = useState<State>();

    useEffect(() => {
        setState({
            status: quizStatus(quiz),
            score: readScore(quiz),
            started: hasStarted(quiz.slug),
        });
    }, [quiz]);

    const completed = state?.score != null;
    const canStart =
        state !== undefined && !completed && (state.status === "open" || state.started);

    // Uten tilstand (før hydrering) eller når quizen ikke kan startes, er «Alle quizer» eneste valg.
    const primary =
        state === undefined
            ? undefined
            : completed
              ? { href: `/quizer/${quiz.slug}/resultat/`, label: "Se resultatet ditt" }
              : canStart
                ? {
                      href: `/quizer/${quiz.slug}/lag/`,
                      label: state.started ? "Fortsett quizen" : "Start quizen",
                  }
                : undefined;

    return (
        <main
            className={styles.hero}
            data-theme="dark"
            style={{ backgroundImage: `url("${quiz.heroImage}")` }}
        >
            <Card padding="xl" className={styles.card}>
                <Flex direction="column" gap="l">
                    <Title as="h1" size="xl">
                        {quiz.title}
                    </Title>
                    <Text size="l">{quiz.description}</Text>
                    <Text size="s" subdued>
                        {quiz.questions.length} spørsmål
                    </Text>
                    {completed && (
                        <Text>
                            <strong>
                                Du fikk {state.score} av {quiz.questions.length} riktige
                            </strong>
                        </Text>
                    )}
                    {state &&
                        !completed &&
                        !canStart &&
                        state.status === "upcoming" &&
                        quiz.opens && <Text>Åpner {formatQuizTime(quiz.opens)}.</Text>}
                    {state &&
                        !completed &&
                        !canStart &&
                        state.status === "closed" &&
                        quiz.closes && <Text>Stengte {formatQuizTime(quiz.closes)}.</Text>}
                    {/* Vanlige lenker, ikke knapper med router.push: de virker uten JavaScript og
                        gir riktig oppførsel for åpne-i-ny-fane. Samme layout som ButtonGroup. */}
                    <Flex
                        className="jkl-button-group"
                        direction="column"
                        alignItems="center"
                        gap="8"
                    >
                        {primary && (
                            <Button as="a" href={primary.href} variant="primary">
                                {primary.label}
                            </Button>
                        )}
                        <Button as="a" href="/" variant={primary ? "ghost" : "primary"}>
                            Alle quizer
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </main>
    );
};

export default QuizHome;
