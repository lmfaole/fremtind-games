"use client";
import { Button } from "@fremtind/jokul/button";
import { ExpandablePanel } from "@fremtind/jokul/expander";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isCorrect, type Question, questions } from "@/quiz/questions";
import { clearAnswers, readAnswers } from "@/quiz/storage";

const formatAnswer = (question: Question) =>
    Array.isArray(question.answer) ? question.answer.join(", ") : String(question.answer);

const ResultPage = () => {
    const router = useRouter();
    const [score, setScore] = useState<number>();

    useEffect(() => {
        const answers = readAnswers();
        setScore(questions.filter((question) => isCorrect(question, answers[question.id] ?? [])).length);
    }, []);

    const restart = () => {
        clearAnswers();
        router.push("/quiz/1/");
    };

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
            <ExpandablePanel outlined>
                <ExpandablePanel.Header>Se riktige svar</ExpandablePanel.Header>
                <ExpandablePanel.Content>
                    <Flex as="ol" direction="column" gap="m">
                        {questions.map((question) => (
                            <li key={question.id}>
                                <Text subdued>{question.question}</Text>
                                <Text>{formatAnswer(question)}</Text>
                            </li>
                        ))}
                    </Flex>
                </ExpandablePanel.Content>
            </ExpandablePanel>
            <Button variant="primary" onClick={restart}>
                Prøv igjen
            </Button>
        </Flex>
    );
};

export default ResultPage;
