import { isCorrect, questions } from "./quiz/questions";
import { readCompleted } from "./quiz/storage";

export interface QuizSummary {
    id: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    questionCount: number;
    /** Der quizen starter, og der resultatet vises når den er fullført. */
    startHref: string;
    resultHref: string;
}

/**
 * Alle quizene på forsiden. Foreløpig finnes bare én, og den bor under `/quiz/…` med spørsmål
 * fra `src/quiz/questions.ts`. En ny quiz trenger egne ruter, egne spørsmål og egen lagring av
 * fullført resultat (se `readCompleted`, som i dag gjelder én quiz).
 */
export const quizzes: readonly QuizSummary[] = [
    {
        id: "norge-sverige-1",
        title: "Norge-Sverige del 1",
        description: "Popkultur, historie, teknologi og alt annet som binder naboene sammen.",
        image: "/goteborg.jpg",
        imageAlt: "Gothia Towers i Göteborg",
        questionCount: questions.length,
        startHref: "/quiz/lag/",
        resultHref: "/quiz/resultat/",
    },
];

/** Antall riktige hvis quizen er fullført i denne nettleseren, ellers null. */
export const readScore = (quiz: QuizSummary): number | null => {
    if (quiz.id !== "norge-sverige-1") {
        return null;
    }
    const answers = readCompleted();
    return answers
        ? questions.filter((question) => isCorrect(question, answers[question.id] ?? [])).length
        : null;
};
