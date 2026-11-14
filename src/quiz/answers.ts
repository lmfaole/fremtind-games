import type { Question, Quiz } from "./types.ts";

export const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Svar lagres alltid som en liste, også for typene som bare tar én verdi. */
export const isAnswered = (value: string[]) => value.some((entry) => entry.trim() !== "");

/** Tall slik folk skriver dem: komma som desimaltegn og mellomrom som tusenskille («1 905»). */
export const parseNumber = (value: string | undefined) => {
    const given = (value ?? "").replace(/\s+/g, "").replace(",", ".");
    return given !== "" && Number.isFinite(Number(given)) ? Number(given) : null;
};

/**
 * Poeng for ett svar, fra 0 til 1. Hvert spørsmål teller likt.
 *
 * - `choice` og `text`: 1 for riktig, ellers 0.
 * - `multi`: hvert riktig valg gir 1/n av poengene, og hvert feil valg trekker like mye. Aldri
 *   under 0. Alle riktige og ingen feil gir 1.
 * - `number`: 1 for eksakt treff. Har spørsmålet `tolerance`, synker poengene lineært fra 1 til 0
 *   jo nærmere avstanden kommer toleransen, så et svar akkurat på toleransen gir 0.
 */
export const pointsFor = (question: Question, value: string[]): number => {
    switch (question.type) {
        case "multi": {
            const given = new Set(value.map(normalize).filter((entry) => entry !== ""));
            const expected = new Set(question.answer.map(normalize));
            let right = 0;
            let wrong = 0;
            for (const entry of given) {
                if (expected.has(entry)) {
                    right += 1;
                } else {
                    wrong += 1;
                }
            }
            return Math.max(0, (right - wrong) / expected.size);
        }
        case "number": {
            const given = parseNumber(value[0]);
            if (given === null) {
                return 0;
            }
            const distance = Math.abs(given - question.answer);
            if (distance === 0) {
                return 1;
            }
            return question.tolerance ? Math.max(0, 1 - distance / question.tolerance) : 0;
        }
        default:
            return normalize(value[0] ?? "") === normalize(question.answer) ? 1 : 0;
    }
};

/** Helt riktig svar (full pott). Delpoeng teller ikke som riktig. */
export const isCorrect = (question: Question, value: string[]) => pointsFor(question, value) === 1;

/** Sum av poengene for et utvalg spørsmål. */
export const sumPoints = (questions: Question[], answers: Record<string, string[]>) =>
    questions.reduce((sum, question) => sum + pointsFor(question, answers[question.id] ?? []), 0);

/** Poeng som tekst: maks én desimal, komma som desimaltegn, uten overflødig «,0». */
export const formatPoints = (points: number) =>
    (Math.round(points * 10) / 10).toLocaleString("nb-NO", { maximumFractionDigits: 1 });

/** Riktig svar på samme form som lagrede svar (`string[]`). */
export const correctValue = (question: Question): string[] =>
    Array.isArray(question.answer) ? question.answer : [String(question.answer)];

/**
 * Normaliserte svarnøkler som sendes til statistikk-backenden. Tomt svar gir
 * ingen nøkler. Må være stabile: de brukes som nøkler i aggregeringen.
 */
export const answerKeys = (question: Question, value: string[]): string[] => {
    if (!isAnswered(value)) {
        return [];
    }

    switch (question.type) {
        case "choice":
            return [value[0]];
        case "multi":
            return [...new Set(value.filter((entry) => entry.trim() !== ""))];
        case "number": {
            const given = parseNumber(value[0]);
            return given !== null ? [String(given)] : [];
        }
        default:
            return [normalize(value[0])];
    }
};

export const sectionOf = (quiz: Quiz, question: Question) =>
    quiz.sections.find((section) => section.id === question.section) ?? quiz.sections[0];
