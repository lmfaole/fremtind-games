// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Card, CardImage } from "@fremtind/jokul/card";
import { Flex } from "@fremtind/jokul/flex";
import { Select } from "@fremtind/jokul/select";
import { Text, Title } from "@fremtind/jokul/typography";
import { useEffect, useState } from "react";
import { brands, readBrand, setBrand } from "@/brand";
import { quizzes, readScore } from "@/quizzes";
import styles from "./page.module.scss";

const Home = () => {
    const [brand, setBrandState] = useState("");
    // Fullført resultat finnes bare i nettleseren, så det leses etter hydrering.
    const [scores, setScores] = useState<Record<string, number | null>>({});

    useEffect(() => {
        setBrandState(readBrand());
        setScores(Object.fromEntries(quizzes.map((quiz) => [quiz.id, readScore(quiz)])));
    }, []);

    return (
        <main className={styles.page} data-theme="dark">
            <Flex direction="column" gap="l" className={styles.content}>
                <Title as="h1" size="xl" className={styles.title}>
                    Velg en quiz
                </Title>
                <ul className={styles.list}>
                    {quizzes.map((quiz) => {
                        const score = scores[quiz.id] ?? null;
                        const href = score === null ? quiz.startHref : quiz.resultHref;

                        return (
                            <li key={quiz.id}>
                                <Card as="a" href={href} padding="m" className={styles.card}>
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
                                            {quiz.questionCount} spørsmål
                                        </Text>
                                        {score !== null && (
                                            <Text>
                                                <strong>
                                                    {score} av {quiz.questionCount} riktige
                                                </strong>
                                            </Text>
                                        )}
                                    </Flex>
                                </Card>
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
