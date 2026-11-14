// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Card, CardImage } from "@fremtind/jokul/card";
import { Flex } from "@fremtind/jokul/flex";
import { Select } from "@fremtind/jokul/select";
import { Text, Title } from "@fremtind/jokul/typography";
import { useEffect, useState } from "react";
import { brands, readBrand, setBrand } from "@/brand";
import { readScore } from "@/quiz/score";
import { formatQuizTime, type QuizStatus, quizStatus } from "@/quiz/status";
import { quizzes } from "@/quizzes";
import styles from "./page.module.scss";

const Home = () => {
    const [brand, setBrandState] = useState("");
    // Fullført resultat finnes bare i nettleseren, så det leses etter hydrering.
    const [scores, setScores] = useState<Record<string, number | null>>({});

    // Klokka finnes bare i nettleseren, så åpningstider vurderes etter hydrering. Til da er kort
    // for quizer med tidsrom nøytrale i stedet for å vise en tilstand som kan være feil.
    const [statuses, setStatuses] = useState<Record<string, QuizStatus>>({});

    useEffect(() => {
        setStatuses(Object.fromEntries(quizzes.map((quiz) => [quiz.slug, quizStatus(quiz)])));
        setBrandState(readBrand());
        setScores(Object.fromEntries(quizzes.map((quiz) => [quiz.slug, readScore(quiz)])));
    }, []);

    return (
        <main className={styles.page} data-theme="dark">
            <Flex direction="column" gap="l" className={styles.content}>
                <Title as="h1" size="xl" className={styles.title}>
                    Velg en quiz
                </Title>
                <ul className={styles.list}>
                    {quizzes.map((quiz) => {
                        const score = scores[quiz.slug] ?? null;
                        const status = statuses[quiz.slug];
                        const hasWindow = quiz.opens !== undefined || quiz.closes !== undefined;
                        // Fullført quiz viser alltid resultatet. Ellers kan bare en åpen quiz startes.
                        const blocked = score === null && hasWindow && status !== "open";
                        const href = `/quizer/${quiz.slug}/${score === null ? "lag" : "resultat"}/`;

                        const content = (
                            <>
                                <CardImage
                                    src={quiz.image}
                                    alt={quiz.imageAlt}
                                    className={styles.image}
                                />
                                <Flex direction="column" gap="xs">
                                    <Title as="h2" size="m">
                                        {quiz.title}
                                    </Title>
                                    <Text size="s" subdued>
                                        {quiz.questions.length} spørsmål
                                    </Text>
                                    {score !== null && (
                                        <Text>
                                            <strong>
                                                {score} av {quiz.questions.length} riktige
                                            </strong>
                                        </Text>
                                    )}
                                    {blocked && status === "upcoming" && quiz.opens && (
                                        <Text>
                                            <strong>Åpner {formatQuizTime(quiz.opens)}</strong>
                                        </Text>
                                    )}
                                    {blocked && status === "closed" && (
                                        <Text>
                                            <strong>Stengt</strong>
                                        </Text>
                                    )}
                                </Flex>
                            </>
                        );

                        return (
                            <li key={quiz.slug}>
                                {blocked ? (
                                    <Card
                                        padding="m"
                                        className={`${styles.card} ${styles.disabled}`}
                                        aria-disabled="true"
                                    >
                                        {content}
                                    </Card>
                                ) : (
                                    <Card as="a" href={href} padding="m" className={styles.card}>
                                        {content}
                                    </Card>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <Flex direction="column" gap="s" className={styles.footer}>
                    <Select
                        label="Velg tema"
                        width="100%"
                        value={brand}
                        items={brands.map(({ value, label }) => ({ value, label }))}
                        onChange={(event) => {
                            setBrandState(event.target.value);
                            setBrand(event.target.value);
                        }}
                    />
                    <Text size="s" subdued>
                        <a href="/personvern/" className={styles.link}>
                            Personvern
                        </a>
                    </Text>
                </Flex>
            </Flex>
        </main>
    );
};

export default Home;
