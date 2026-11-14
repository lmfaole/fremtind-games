"use client";
import { Text } from "@fremtind/jokul/typography";
import { answerKeys, correctValue } from "@/quiz/answers";
import type { Question } from "@/quiz/types";
import styles from "./QuestionStats.module.scss";
import { MIN_SVAR_FOR_STATISTIKK, type QuestionStats as Stats } from "./index";

const percent = (count: number | undefined, total: number) =>
    Math.round(((count ?? 0) / total) * 100);

interface Props {
    question: Question;
    /** Brukerens lagrede svar; tomt hvis spørsmålet ble hoppet over. */
    value: string[];
    stats: Stats | undefined;
}

/**
 * Viser hvor mange andre som svarte hva. Rendrer ingenting uten nok data,
 * slik at manglende eller feilende backend aldri synes for brukeren.
 */
export const QuestionStats = ({ question, value, stats }: Props) => {
    if (!stats || !(stats.total >= MIN_SVAR_FOR_STATISTIKK)) {
        return null;
    }

    const { total, counts = {} } = stats;
    const mine = new Set(answerKeys(question, value));
    const correct = new Set(answerKeys(question, correctValue(question)));
    const footer = (
        <Text size="s" subdued>
            Basert på {total} svar
        </Text>
    );

    if (question.type === "text" || question.type === "number") {
        const [correctKey] = correct;
        const [myKey] = mine;

        return (
            <div className={styles.stats}>
                <Text size="s">
                    {percent(counts[correctKey], total)} % svarte riktig svar
                    {myKey !== undefined &&
                        ` · ${percent(counts[myKey], total)} % svarte det samme som deg`}
                </Text>
                {footer}
            </div>
        );
    }

    return (
        <div className={styles.stats}>
            <ul className={styles.list} aria-label="Slik svarte andre">
                {question.options.map((option) => {
                    const share = percent(counts[option], total);
                    const tags = [correct.has(option) && "riktig", mine.has(option) && "ditt svar"]
                        .filter(Boolean)
                        .join(", ");

                    return (
                        <li key={option} className={styles.row}>
                            <Text size="s" className={styles.label}>
                                {option}
                                {tags && <span className={styles.tags}> ({tags})</span>}
                            </Text>
                            <Text size="s" className={styles.percent}>
                                {share} %
                            </Text>
                            <span className={styles.track} aria-hidden="true">
                                <span className={styles.fill} style={{ inlineSize: `${share}%` }} />
                            </span>
                        </li>
                    );
                })}
            </ul>
            {footer}
        </div>
    );
};
