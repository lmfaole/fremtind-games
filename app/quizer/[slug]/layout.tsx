import type { ReactNode } from "react";
import styles from "@/quiz/Layout.module.scss";
import { quizzes } from "@/quizzes";

// Barnesidene (lag, medlemmer, N, resultat) arver sluggen herfra. `[step]` legger til sine egne
// kombinasjoner av slug og steg.
export const generateStaticParams = () => quizzes.map((quiz) => ({ slug: quiz.slug }));

const QuizLayout = ({ children }: { children: ReactNode }) => (
    <main className={styles.page}>{children}</main>
);

export default QuizLayout;
