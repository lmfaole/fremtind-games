"use client";
import { Flex } from "@fremtind/jokul/flex";
import { NavLink } from "@fremtind/jokul/nav-link";
import { Quiz } from "@/quiz/Quiz";
import styles from "./page.module.scss";

const QuizPage = () => (
    <Flex as="main" direction="column" alignItems="center" className={styles.page} gap="xl">
        <Flex className={styles.header}>
            <NavLink back href="/">
                Forsiden
            </NavLink>
        </Flex>
        <Quiz />
    </Flex>
);

export default QuizPage;
