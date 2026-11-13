"use client";
import { ButtonGroup } from "@fremtind/jokul/button-group";
import { Flex } from "@fremtind/jokul/flex";
import { NavLink } from "@fremtind/jokul/nav-link";
import { TextInput } from "@fremtind/jokul/text-input";
import { Title } from "@fremtind/jokul/typography";
import { useRouter } from "next/navigation";
import { type FormEventHandler, useEffect, useState } from "react";
import styles from "@/quiz/QuestionPage.module.scss";
import { readMembers, saveMembers } from "@/quiz/storage";

const MAX_MEMBERS = 4;

// Medlemmene er ikke et spørsmål i quizen. Tomme felt ignoreres, og navnene
// sendes med i SMS-en.
const MembersPage = () => {
    const router = useRouter();
    const [members, setMembers] = useState<string[]>([""]);

    useEffect(() => {
        const stored = readMembers().slice(0, MAX_MEMBERS);
        setMembers(stored.length > 0 ? stored : [""]);
    }, []);

    const update = (index: number, value: string) =>
        setMembers((current) => current.map((member, i) => (i === index ? value : member)));

    const add = () => setMembers((current) => [...current, ""].slice(0, MAX_MEMBERS));

    const submit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        saveMembers(members.map((member) => member.trim()).filter(Boolean));
        router.push("/quiz/1/");
    };

    return (
        <>
            <Flex className={styles.header}>
                <NavLink back href="/quiz/lag/">
                    Lagnavn
                </NavLink>
            </Flex>
            <Flex as="form" direction="column" gap="m" className={styles.form} onSubmit={submit}>
                <Title as="h1" size="l">
                    Hvem er med på laget?
                </Title>
                {members.map((member, index) => (
                    <TextInput
                        key={index}
                        label={`Person ${index + 1}`}
                        value={member}
                        autoComplete="off"
                        onChange={(event) => update(index, event.target.value)}
                    />
                ))}
                <ButtonGroup
                    className={styles.actions}
                    mainAction={{ type: "submit", children: "Start quizen" }}
                    secondaryAction={
                        members.length < MAX_MEMBERS
                            ? { type: "button", children: "Legg til person", onClick: add }
                            : undefined
                    }
                />
            </Flex>
        </>
    );
};

export default MembersPage;
