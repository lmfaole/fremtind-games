"use client";
import { ButtonGroup } from "@fremtind/jokul/button-group";
import { Accordion, ExpandablePanel } from "@fremtind/jokul/expander";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchStats, track, type Stats } from "@/analytics";
import { QuestionStats } from "@/analytics/QuestionStats";
import { isCorrect } from "@/quiz/answers";
import styles from "./page.module.scss";
import { readAnswers, readCompleted, saveCompleted } from "@/quiz/storage";
import { useQuiz } from "@/quiz/useQuiz";

const formatAnswer = (answer: string | number | string[]) =>
    Array.isArray(answer) ? answer.join(", ") : String(answer);

const ResultPage = () => {
    const router = useRouter();
    const { slug, questions, sections } = useQuiz();
    const [score, setScore] = useState<number>();
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        // Et fullført resultat ligger varig i localStorage. Ellers leses svarene fra økten, og
        // låses først når alle spørsmålene har et svar (også tomt, fra «Hopp over»).
        const completed = readCompleted(slug);
        const answers = completed ?? readAnswers(slug);
        setAnswers(answers);
        const correct = questions.filter((question) =>
            isCorrect(question, answers[question.id] ?? []),
        ).length;
        setScore(correct);

        if (!completed && questions.every((question) => question.id in answers)) {
            saveCompleted(slug, answers);
            track("quiz_finished", { quiz: slug, score: correct, total: questions.length });
        }

        // Statistikk er kosmetikk: feil gir null og ingenting vises.
        let cancelled = false;
        fetchStats().then((result) => {
            if (!cancelled) setStats(result);
        });
        return () => {
            cancelled = true;
        };
    }, [slug, questions]);

    return (
        <Flex direction="column" gap="m" alignItems="center" className={styles.page}>
            <Title as="h1" size="l" center>
                {score === undefined
                    ? "Regner ut resultatet …"
                    : `Du fikk ${score} av ${questions.length} riktige`}
            </Title>
            <Accordion outlined>
                {sections.map((section) => {
                    const inSection = questions.filter(
                        (question) => question.section === section.id,
                    );
                    const correct = inSection.filter((question) =>
                        isCorrect(question, answers[question.id] ?? []),
                    ).length;

                    return (
                        <ExpandablePanel key={section.id}>
                            <ExpandablePanel.Header>
                                {section.title}: {correct} av {inSection.length} riktige
                            </ExpandablePanel.Header>
                            <ExpandablePanel.Content>
                                <Flex as="ol" direction="column" gap="m">
                                    {inSection.map((question) => (
                                        <li key={question.id}>
                                            <Text subdued>{question.question}</Text>
                                            <Text>
                                                Ditt svar:{" "}
                                                {formatAnswer(answers[question.id] ?? []) ||
                                                    "Ikke besvart"}
                                            </Text>
                                            <Text>Fasit: {formatAnswer(question.answer)}</Text>
                                            <QuestionStats
                                                question={question}
                                                value={answers[question.id] ?? []}
                                                stats={stats?.[question.id]}
                                            />
                                        </li>
                                    ))}
                                </Flex>
                            </ExpandablePanel.Content>
                        </ExpandablePanel>
                    );
                })}
            </Accordion>
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

export default ResultPage;
