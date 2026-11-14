import { QuestionPage } from "@/quiz/QuestionPage";
import { quizzes } from "@/quizzes";

export const generateStaticParams = () =>
    quizzes.flatMap((quiz) =>
        quiz.questions.map((_, index) => ({ slug: quiz.slug, step: String(index + 1) })),
    );

const Step = async ({ params }: { params: Promise<{ slug: string; step: string }> }) => {
    const { slug, step } = await params;

    return <QuestionPage slug={slug} index={Number(step) - 1} />;
};

export default Step;
