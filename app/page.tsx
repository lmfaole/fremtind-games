// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Button } from "@fremtind/jokul/button";
import { Card } from "@fremtind/jokul/card";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { questions } from "@/quiz/questions";
import styles from "./page.module.scss";

const Home = () => (
    <main className={styles.hero} data-theme="dark">
        <Card padding="xl" className={styles.card}>
            <Flex direction="column" gap="l">
                <Title as="h1" size="xl">
                    Norge og Sverige
                </Title>
                <Text size="l">
                    En quiz om popkultur og historie på begge sider av kjølen. {questions.length}{" "}
                    spørsmål, ett om gangen.
                </Text>
                <Flex>
                    <Button variant="primary" as="a" href="/quiz/1/">
                        Start quizen
                    </Button>
                </Flex>
            </Flex>
        </Card>
    </main>
);

export default Home;
