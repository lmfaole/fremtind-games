import type { ReactNode } from "react";
import { quizzes } from "@/quizzes";

// Barnesidene (forsiden, lag, medlemmer, N, resultat) arver sluggen herfra. `[step]` legger til
// sine egne kombinasjoner av slug og steg. Rammen rundt selve quizsidene ligger i `(steg)/layout.tsx`.
export const generateStaticParams = () => quizzes.map((quiz) => ({ slug: quiz.slug }));

const QuizSlugLayout = ({ children }: { children: ReactNode }) => children;

export default QuizSlugLayout;
