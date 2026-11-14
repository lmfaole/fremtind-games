"use client";
import { ButtonGroup } from "@fremtind/jokul/button-group";
import { Flex } from "@fremtind/jokul/flex";
import { NavLink } from "@fremtind/jokul/nav-link";
import { TextInput } from "@fremtind/jokul/text-input";
import { Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { type FormEventHandler, useEffect, useState } from "react";
import styles from "@/quiz/QuestionPage.module.scss";
import { QuizGate } from "@/quiz/QuizGate";
import { readTeamName, saveTeamName } from "@/quiz/storage";
import { useCompletedRedirect } from "@/quiz/useCompletedRedirect";
import { useQuiz } from "@/quiz/useQuiz";

// Lagnavnet er ikke et spørsmål i quizen, og teller ikke med i poengene eller
// i `/quizer/<slug>/N`. Det vises først.
const TeamPageForm = () => {
    const router = useRouter();
    const { slug } = useQuiz();
    useCompletedRedirect(slug);
    const [name, setName] = useState("");
    const [error, setError] = useState<string>();

    useEffect(() => setName(readTeamName(slug)), [slug]);

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            setError("Du må skrive inn et lagnavn for å gå videre.");
            return;
        }

        saveTeamName(slug, trimmed);
        router.push(`/quizer/${slug}/medlemmer/`);
    };

    return (
        <>
            <Flex className={styles.header}>
                <NavLink back href="/">
                    Forsiden
                </NavLink>
            </Flex>
            <Flex as="form" direction="column" gap="m" className={styles.form} onSubmit={submit}>
                <Title as="h1" size="l">
                    Hva heter laget ditt?
                </Title>
                <TextInput
                    label="Lagnavn"
                    value={name}
                    autoComplete="off"
                    errorLabel={error}
                    onChange={(event) => {
                        setName(event.target.value);
                        setError(undefined);
                    }}
                />
                <ButtonGroup
                    className={styles.actions}
                    mainAction={{ type: "submit", children: "Fortsett" }}
                />
            </Flex>
        </>
    );
};

const TeamPage = () => (
    <QuizGate>
        <TeamPageForm />
    </QuizGate>
);

export default TeamPage;
