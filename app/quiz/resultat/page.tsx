"use client";
import { Button } from "@fremtind/jokul/button";
import { ExpandablePanel } from "@fremtind/jokul/expander";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isCorrect, questions, sections } from "@/quiz/questions";
import { clearAnswers, readAnswers } from "@/quiz/storage";

const SMS_NUMBER = "+4790713472";

const formatAnswer = (answer: string | number | string[]) =>
    Array.isArray(answer) ? answer.join(", ") : String(answer);

const ResultPage = () => {
    const router = useRouter();
    const [score, setScore] = useState<number>();
    const [answers, setAnswers] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const answers = readAnswers();
        setAnswers(answers);
        setScore(questions.filter((question) => isCorrect(question, answers[question.id] ?? [])).length);
    }, []);

    const restart = () => {
        clearAnswers();
        router.push("/quiz/1/");
    };

    const smsBody = [
        `Mine svar på quizen: ${score ?? 0} av ${questions.length} riktige`,
        ...questions.map(
            (question, index) =>
                `${index + 1}. ${formatAnswer(answers[question.id] ?? []) || "Ikke besvart"}`,
        ),
    ].join("\n");
    // Mottakeren er fylt inn på forhånd.
    const smsHref = `sms:${SMS_NUMBER}?&body=${encodeURIComponent(smsBody)}`;

    return (
        <Flex direction="column" gap="l" alignItems="center">
            <Title as="h1" size="l" center>
                {score === undefined
                    ? "Regner ut resultatet …"
                    : `Du fikk ${score} av ${questions.length} riktige`}
            </Title>
            <Text size="s" subdued center>
                Svarene ligger i nettleserfanen, og nullstilles når du starter på nytt.
            </Text>
            {score !== undefined && (
                <Flex direction="column" gap="xs" alignItems="center">
                    {sections.map((section) => {
                        const inSection = questions.filter((question) => question.section === section.id);
                        const correct = inSection.filter((question) =>
                            isCorrect(question, answers[question.id] ?? []),
                        ).length;

                        return (
                            <Text key={section.id}>
                                {section.title}: {correct} av {inSection.length}
                            </Text>
                        );
                    })}
                </Flex>
            )}
            <ExpandablePanel outlined>
                <ExpandablePanel.Header>Se riktige svar</ExpandablePanel.Header>
                <ExpandablePanel.Content>
                    <Flex direction="column" gap="l">
                        {sections.map((section) => (
                            <Flex as="section" direction="column" gap="m" key={section.id}>
                                <Title as="h2" size="s">
                                    {section.title}
                                </Title>
                                <Flex as="ol" direction="column" gap="m">
                                    {questions
                                        .filter((question) => question.section === section.id)
                                        .map((question) => (
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
                            </Flex>
                        ))}
                    </Flex>
                </ExpandablePanel.Content>
            </ExpandablePanel>
            <Button variant="primary" as="a" href={smsHref}>
                Send svar på SMS
            </Button>
            <Button variant="secondary" onClick={restart}>
                Prøv igjen
            </Button>
        </Flex>
    );
};

export default ResultPage;
