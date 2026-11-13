"use client";
import { Button } from "@fremtind/jokul/button";
import { Flex } from "@fremtind/jokul/flex";
import { FieldGroup } from "@fremtind/jokul/input-group";
import { NavLink } from "@fremtind/jokul/nav-link";
import { ProgressBar } from "@fremtind/jokul/progress-bar";
import { RadioPanel } from "@fremtind/jokul/radio-panel";
import { TextInput } from "@fremtind/jokul/text-input";
import { Text } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { type FormEventHandler, useEffect, useState } from "react";
import styles from "./QuestionPage.module.scss";
import { questions } from "./questions";
import { readAnswers, saveAnswer } from "./storage";

export const QuestionPage = ({ index }: { index: number }) => {
    const router = useRouter();
    const [value, setValue] = useState("");
    const [error, setError] = useState<string>();

    const question = questions[index];
    const isLast = index === questions.length - 1;

    // Lagrede svar finnes bare i nettleseren, så feltet fylles etter hydrering.
    useEffect(() => {
        setValue(readAnswers()[question.id] ?? "");
        setError(undefined);
    }, [question.id]);

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

        saveAnswer(question.id, value);
        router.push(isLast ? "/quiz/resultat/" : `/quiz/${index + 2}/`);
    };

    const answer = (next: string) => {
        setValue(next);
        setError(undefined);
    };

    return (
        <>
            <Flex className={styles.header}>
                <NavLink back href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${index === 0 ? "/" : `/quiz/${index}/`}`}>
                    {index === 0 ? "Forsiden" : "Forrige spørsmål"}
                </NavLink>
            </Flex>
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
        </>
    );
};
