import { isCorrect } from "./answers";
import { readCompleted } from "./storage";
import type { Quiz } from "./types";

/** Antall riktige hvis quizen er fullført i denne nettleseren, ellers null. */
export const readScore = (quiz: Quiz): number | null => {
    const answers = readCompleted(quiz.slug);
    return answers
        ? quiz.questions.filter((question) => isCorrect(question, answers[question.id] ?? []))
              .length
        : null;
};
