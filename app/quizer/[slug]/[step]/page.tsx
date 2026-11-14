import { QuestionPage } from "@/quiz/QuestionPage";
import { QuizGate } from "@/quiz/QuizGate";
import { quizzes } from "@/quizzes";

export const generateStaticParams = () =>
    quizzes.flatMap((quiz) =>
        quiz.questions.map((_, index) => ({ slug: quiz.slug, step: String(index + 1) })),
    );

const Step = async ({ params }: { params: Promise<{ slug: string; step: string }> }) => {
    const { slug, step } = await params;

    return (
        <QuizGate>
            <QuestionPage slug={slug} index={Number(step) - 1} />
        </QuizGate>
    );
};

export default Step;
