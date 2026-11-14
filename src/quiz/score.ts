import { sumPoints } from "./answers";
import { readCompleted } from "./storage";
import type { Quiz } from "./types";

/** Poengsummen hvis quizen er fullført i denne nettleseren, ellers null. Maks er antall spørsmål. */
export const readScore = (quiz: Quiz): number | null => {
    const answers = readCompleted(quiz.slug);
    return answers ? sumPoints(quiz.questions, answers) : null;
};
