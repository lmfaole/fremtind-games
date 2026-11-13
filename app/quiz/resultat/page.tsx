"use client";
import { ButtonGroup } from "@fremtind/jokul/button-group";
import { Accordion, ExpandablePanel } from "@fremtind/jokul/expander";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isCorrect, questions, sections } from "@/quiz/questions";
import styles from "./page.module.scss";
import { clearAnswers, readAnswers, readMembers, readTeamName } from "@/quiz/storage";

const SMS_NUMBER = "+4790713472";

const formatAnswer = (answer: string | number | string[]) =>
    Array.isArray(answer) ? answer.join(", ") : String(answer);

const ResultPage = () => {
    const router = useRouter();
    const [score, setScore] = useState<number>();
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [team, setTeam] = useState("");
    const [members, setMembers] = useState<string[]>([]);

    useEffect(() => {
        const answers = readAnswers();
        setAnswers(answers);
        setTeam(readTeamName());
        setMembers(readMembers());
        setScore(questions.filter((question) => isCorrect(question, answers[question.id] ?? [])).length);
    }, []);

    const restart = () => {
        clearAnswers();
        router.push("/quiz/lag/");
    };

    const smsBody = [
        `Lag: ${team || "Uten navn"}`,
        ...(members.length > 0 ? [`Medlemmer: ${members.join(", ")}`] : []),
        `Svar på quizen: ${score ?? 0} av ${questions.length} riktige`,
        ...questions.map(
            (question, index) =>
                `${index + 1}. ${formatAnswer(answers[question.id] ?? []) || "Ikke besvart"}`,
        ),
    ].join("\n");
    // Mottakeren er fylt inn på forhånd.
    const smsHref = `sms:${SMS_NUMBER}?&body=${encodeURIComponent(smsBody)}`;

    return (
        <Flex direction="column" gap="m" alignItems="center" className={styles.page}>
            <Title as="h1" size="l" center>
                {score === undefined
                    ? "Regner ut resultatet …"
                    : `Du fikk ${score} av ${questions.length} riktige`}
            </Title>
            <Accordion outlined>
                {sections.map((section) => {
                    const inSection = questions.filter((question) => question.section === section.id);
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
                    children: "Send svar på SMS",
                    onClick: () => {
                        window.location.href = smsHref;
                    },
                }}
                secondaryAction={{ type: "button", children: "Prøv igjen", onClick: restart }}
            />
        </Flex>
    );
};

export default ResultPage;
