import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { readCompleted } from "./storage";

/** Sender den som allerede har fullført quizen til resultatsiden, så den ikke kan tas på nytt. */
export const useCompletedRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        if (readCompleted()) {
            router.replace("/quiz/resultat/");
        }
    }, [router]);
};
