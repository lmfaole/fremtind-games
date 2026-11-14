"use client";
import { ButtonGroup } from "@fremtind/jokul/button-group";
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
import { sendAnswer, track } from "@/analytics";
import styles from "./QuestionPage.module.scss";
import { answerKeys, isAnswered, isCorrect, sectionOf } from "./answers";
import type { Question } from "./types";
import { getQuiz } from "@/quizzes";
import { useCompletedRedirect } from "./useCompletedRedirect";
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

export const QuestionPage = ({ slug, index }: { slug: string; index: number }) => {
    const router = useRouter();
    const quiz = getQuiz(slug);
    if (!quiz) {
        throw new Error(`Ukjent quiz: ${slug}`);
    }
    const { questions } = quiz;
    useCompletedRedirect(slug);
    const [value, setValue] = useState<string[]>([]);
    const [error, setError] = useState<string>();

    const question = questions[index];
    const isLast = index === questions.length - 1;
    const single = value[0] ?? "";

    // Lagrede svar finnes bare i nettleseren, så feltet fylles etter hydrering.
    useEffect(() => {
        setValue(readAnswers(slug)[question.id] ?? []);
        setError(undefined);
    }, [slug, question.id]);

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

    const next = () =>
        router.push(isLast ? `/quizer/${slug}/resultat/` : `/quizer/${slug}/${index + 2}/`);

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        if (!isAnswered(value)) {
            setError(emptyMessage(question));
            return;
        }

        // Bare nye eller endrede svar sendes, så tilbake/frem ikke gir dobbeltsending.
        const previous = answerKeys(question, readAnswers(slug)[question.id] ?? []);
        const current = answerKeys(question, value);
        if (previous.join("\n") !== current.join("\n")) {
            sendAnswer(question, value);
        }
        track("question_answered", {
            quiz: slug,
            question_id: question.id,
            section: question.section,
            step: index + 1,
            correct: isCorrect(question, value),
        });

        saveAnswer(slug, question.id, value);
        next();
    };

    // Et tidligere svar fjernes, slik at resultatet viser «Ikke besvart».
    const skip = () => {
        track("question_skipped", { quiz: slug, question_id: question.id, step: index + 1 });
        saveAnswer(slug, question.id, []);
        next();
    };

    return (
        <>
            <Flex direction="column" gap="xs" className={styles.header}>
                <ProgressBar
                    aria-valuenow={index + 1}
                    aria-valuemax={questions.length}
                    aria-valuetext={`Spørsmål ${index + 1} av ${questions.length}`}
                />
                <Text size="s" subdued>
                    {sectionOf(quiz, question).title} · Spørsmål {index + 1} av {questions.length}
                </Text>
            </Flex>
            <Flex className={styles.header}>
                <NavLink
                    back
                    href={index === 0 ? `/quizer/${slug}/medlemmer/` : `/quizer/${slug}/${index}/`}
                >
                    {index === 0 ? "Lagmedlemmer" : "Forrige spørsmål"}
                </NavLink>
            </Flex>
            <Flex as="form" direction="column" gap="m" className={styles.form} onSubmit={submit}>
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
                <ButtonGroup
                    className={styles.actions}
                    mainAction={{ type: "submit", children: isLast ? "Se resultat" : "Fortsett" }}
                    secondaryAction={{ type: "button", children: "Hopp over", onClick: skip }}
                />
            </Flex>
        </>
    );
};
