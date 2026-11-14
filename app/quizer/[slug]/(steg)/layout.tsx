import type { ReactNode } from "react";
import styles from "@/quiz/Layout.module.scss";

// Felles ramme for lag, medlemmer, spørsmål og resultat. Quizens egen forside ligger utenfor
// gruppen, siden den skal dekke hele skjermen med eget bilde.
const StepLayout = ({ children }: { children: ReactNode }) => (
    <main className={styles.page}>{children}</main>
);

export default StepLayout;
