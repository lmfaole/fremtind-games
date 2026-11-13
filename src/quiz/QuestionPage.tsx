"use client";
import { Button } from "@fremtind/jokul/button";
import { CheckboxPanel } from "@fremtind/jokul/checkbox-panel";
import { Flex } from "@fremtind/jokul/flex";
import { FieldGroup } from "@fremtind/jokul/input-group";
import { NavLink } from "@fremtind/jokul/nav-link";
import { NumberInput } from "@fremtind/jokul/number-input";
import { ProgressBar } from "@fremtind/jokul/progress-bar";
import { RadioPanel } from "@fremtind/jokul/radio-panel";
import { TextInput } from "@fremtind/jokul/text-input";
import { Text } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { type FormEventHandler, useEffect, useState } from "react";
import styles from "./QuestionPage.module.scss";
import { isAnswered, type Question, questions, sectionOf } from "./questions";
import { readAnswers, saveAnswer } from "./storage";

const emptyMessage = (question: Question) => {
    switch (question.type) {
        case "choice":
            return "Du må velge et alternativ for å gå videre.";
        case "multi":
            return "Du må velge minst ett alternativ for å gå videre.";
        case "number":
            return "Du må skrive inn et tall for å gå videre.";
        default:
            return "Du må skrive inn et svar for å gå videre.";
    }
};

export const QuestionPage = ({ index }: { index: number }) => {
    const router = useRouter();
    const [value, setValue] = useState<string[]>([]);
    const [error, setError] = useState<string>();

    const question = questions[index];
    const isLast = index === questions.length - 1;
    const single = value[0] ?? "";

    // Lagrede svar finnes bare i nettleseren, så feltet fylles etter hydrering.
    useEffect(() => {
        setValue(readAnswers()[question.id] ?? []);
        setError(undefined);
    }, [question.id]);

    const selectSingle = (next: string) => {
        setValue(next.trim() === "" ? [] : [next]);
        setError(undefined);
    };

    const toggleOption = (option: string) => {
        setValue((current) =>
            current.includes(option)
                ? current.filter((entry) => entry !== option)
                : [...current, option],
        );
        setError(undefined);
    };

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        if (!isAnswered(value)) {
            setError(emptyMessage(question));
            return;
        }

        saveAnswer(question.id, value);
        router.push(isLast ? "/quiz/resultat/" : `/quiz/${index + 2}/`);
    };

    return (
        <>
            <Flex className={styles.header}>
                <NavLink back href={index === 0 ? "/" : `/quiz/${index}/`}>
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
                    {sectionOf(question).title} · Spørsmål {index + 1} av {questions.length}
                </Text>
                <Flex direction="column" gap="m" asChild>
                    <FieldGroup
                        legend={question.question}
                        description={question.description}
                        errorLabel={error}
                        labelProps={{ variant: "large", pageHeading: true }}
                    >
                        {question.type === "choice" &&
                            question.options.map((option) => (
                                <RadioPanel
                                    key={option}
                                    name={question.id}
                                    label={option}
                                    value={option}
                                    checked={single === option}
                                    onChange={(event) => selectSingle(event.target.value)}
                                />
                            ))}
                        {question.type === "multi" &&
                            question.options.map((option) => (
                                <CheckboxPanel
                                    key={option}
                                    name={question.id}
                                    label={option}
                                    value={option}
                                    checked={value.includes(option)}
                                    onChange={() => toggleOption(option)}
                                />
                            ))}
                        {question.type === "text" && (
                            <TextInput
                                label={question.label}
                                value={single}
                                autoComplete="off"
                                onChange={(event) => selectSingle(event.target.value)}
                            />
                        )}
                        {question.type === "number" && (
                            <NumberInput
                                label={question.label}
                                value={single}
                                min={question.min}
                                max={question.max}
                                autoComplete="off"
                                onChange={(event) => selectSingle(event.target.value)}
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
