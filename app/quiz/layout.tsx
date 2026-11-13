import type { ReactNode } from "react";
import styles from "./layout.module.scss";

const QuizLayout = ({ children }: { children: ReactNode }) => (
    <main className={styles.page}>{children}</main>
);

export default QuizLayout;
