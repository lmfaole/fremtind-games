import { QuestionPage } from "@/quiz/QuestionPage";
import { questions } from "@/quiz/questions";

export const generateStaticParams = () =>
    questions.map((_, index) => ({ step: String(index + 1) }));

const Step = async ({ params }: { params: Promise<{ step: string }> }) => {
    const { step } = await params;

    return <QuestionPage index={Number(step) - 1} />;
};

export default Step;
