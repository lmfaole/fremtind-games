// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Button } from "@fremtind/jokul/button";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import { questions } from "@/quiz/questions";
import styles from "./page.module.scss";

const Home = () => (
    <main className={styles.hero} data-theme="dark">
        <Flex direction="column" gap="l" className={styles.content}>
            <Flex as="hgroup" direction="column" gap="xs">
                <Text size="s" bold>
                    fremtind.games
                </Text>
                <Title as="h1" size="xl">
                    Norge og Sverige
                </Title>
            </Flex>
            <Text size="l">
                En quiz om popkultur og historie på begge sider av kjølen. {questions.length}{" "}
                spørsmål, ett om gangen.
            </Text>
            <Flex>
                <Button variant="primary" as="a" href="/quiz/">
                    Start quizen
                </Button>
            </Flex>
        </Flex>
    </main>
);

export default Home;
