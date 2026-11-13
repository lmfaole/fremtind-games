"use client";

import { Button } from "@fremtind/jokul/button";
import { Flex } from "@fremtind/jokul/flex";
import { FieldGroup } from "@fremtind/jokul/input-group";
import { ProgressBar } from "@fremtind/jokul/progress-bar";
import { RadioPanel } from "@fremtind/jokul/radio-panel";
import { TextInput } from "@fremtind/jokul/text-input";
import { Text, Title } from "@fremtind/jokul/typography";
import { type FormEventHandler, useState } from "react";
import styles from "./Quiz.module.scss";
import { isCorrect, questions } from "./questions";

export const Quiz = () => {
    const [index, setIndex] = useState(0);
    const [value, setValue] = useState("");
    const [error, setError] = useState<string>();
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const question = questions[index];
    const isLast = index === questions.length - 1;

    const restart = () => {
        setIndex(0);
        setValue("");
        setError(undefined);
        setCorrectCount(0);
        setFinished(false);
    };

    const answer = (next: string) => {
        setValue(next);
        setError(undefined);
    };

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        if (!value.trim()) {
            setError(
                question.type === "text"
                    ? "Du må skrive inn et svar for å gå videre."
                    : "Du må velge et alternativ for å gå videre.",
            );
            return;
        }

        if (isCorrect(question, value)) {
            setCorrectCount((count) => count + 1);
        }

        setValue("");
        setError(undefined);

        if (isLast) {
            setFinished(true);
        } else {
            setIndex((current) => current + 1);
        }
    };

    if (finished) {
        return (
            <Flex direction="column" gap="l" alignItems="center">
                <Title as="h1" size="l" center>
                    Du fikk {correctCount} av {questions.length} riktige
                </Title>
                <Button variant="primary" onClick={restart}>
                    Prøv igjen
                </Button>
            </Flex>
        );
    }

    return (
        <Flex as="form" direction="column" gap="l" className={styles.form} onSubmit={submit}>
            <ProgressBar
                aria-valuenow={index + 1}
                aria-valuemax={questions.length}
                aria-valuetext={`Spørsmål ${index + 1} av ${questions.length}`}
            />
            <Text size="s" subdued>
                Spørsmål {index + 1} av {questions.length}
            </Text>
            <Flex direction="column" gap="m" asChild>
                <FieldGroup
                    legend={question.question}
                    description={question.description}
                    errorLabel={error}
                    labelProps={{ variant: "large", pageHeading: true }}
                >
                    {question.type === "choice" ? (
                        question.options.map((option) => (
                            <RadioPanel
                                key={option}
                                name={question.id}
                                label={option}
                                value={option}
                                checked={value === option}
                                onChange={(event) => answer(event.target.value)}
                            />
                        ))
                    ) : (
                        <TextInput
                            label={question.label}
                            value={value}
                            autoComplete="off"
                            onChange={(event) => answer(event.target.value)}
                        />
                    )}
                </FieldGroup>
            </Flex>
            <Flex justifyContent="center">
                <Button type="submit" variant="primary">
                    {isLast ? "Se resultat" : "Fortsett"}
                </Button>
            </Flex>
        </Flex>
    );
};
