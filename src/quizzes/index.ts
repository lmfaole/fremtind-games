import type { Quiz } from "../quiz/types.ts";
import norgeSverige1 from "./norge-sverige-1.ts";
import norgeSverige2 from "./norge-sverige-2.ts";

/** Alle quizene, i den rekkefølgen de vises på forsiden. Legg nye quizer til her. */
export const quizzes: readonly Quiz[] = [norgeSverige1, norgeSverige2];

export const getQuiz = (slug: string): Quiz | undefined =>
    quizzes.find((quiz) => quiz.slug === slug);
