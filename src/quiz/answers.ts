import type { Question, Quiz } from "./types.ts";

export const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Svar lagres alltid som en liste, også for typene som bare tar én verdi. */
export const isAnswered = (value: string[]) => value.some((entry) => entry.trim() !== "");

export const isCorrect = (question: Question, value: string[]) => {
    switch (question.type) {
        case "multi": {
            const given = new Set(value.map(normalize));
            const expected = question.answer.map(normalize);
            return given.size === expected.length && expected.every((option) => given.has(option));
        }
        case "number": {
            const given = value[0]?.trim();
            return !!given && Number(given) === question.answer;
        }
        default:
            return normalize(value[0] ?? "") === normalize(question.answer);
    }
};

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
            // Komma som desimaltegn og mellomrom som tusenskille, som i «1 905».
            const given = value[0].replace(/\s+/g, "").replace(",", ".");
            return given !== "" && Number.isFinite(Number(given)) ? [String(Number(given))] : [];
        }
        default:
            return [normalize(value[0])];
    }
};

export const sectionOf = (quiz: Quiz, question: Question) =>
    quiz.sections.find((section) => section.id === question.section) ?? quiz.sections[0];
