import { useParams } from "next/navigation";
import { getQuiz } from "@/quizzes";

/**
 * Quizen som hører til `[slug]` i URL-en. `generateStaticParams` lager bare sider for kjente
 * quizer, så en ukjent slug er en feil i koden og ikke noe brukeren kan havne på.
 */
export const useQuiz = () => {
    const { slug } = useParams<{ slug: string }>();
    const quiz = getQuiz(slug);
    if (!quiz) {
        throw new Error(`Ukjent quiz: ${slug}`);
    }
    return quiz;
};
