import type { ReactNode } from "react";
import styles from "@/quiz/Layout.module.scss";

// Gamle URL-er (`/quiz/…`) er bare omdirigeringer, men deler utseendet med de nye.
const QuizLayout = ({ children }: { children: ReactNode }) => (
    <main className={styles.page}>{children}</main>
);

export default QuizLayout;
