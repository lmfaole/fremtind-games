import { Redirect } from "@/quiz/Redirect";
import { getQuiz } from "@/quizzes";

// Gamle URL-er (`/quiz/N`), fra før det fantes flere quizer, hører til den første quizen.
const LEGACY_SLUG = "norge-sverige-1";

export const generateStaticParams = () =>
    (getQuiz(LEGACY_SLUG)?.questions ?? []).map((_, index) => ({ step: String(index + 1) }));

const Step = async ({ params }: { params: Promise<{ step: string }> }) => {
    const { step } = await params;

    return <Redirect to={`/quizer/${LEGACY_SLUG}/${step}/`} />;
};

export default Step;
