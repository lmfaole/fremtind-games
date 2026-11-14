import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { readCompleted } from "./storage";

/** Sender den som allerede har fullført quizen til resultatsiden, så den ikke kan tas på nytt. */
export const useCompletedRedirect = (slug: string) => {
    const router = useRouter();

    useEffect(() => {
        if (readCompleted(slug)) {
            router.replace(`/quizer/${slug}/resultat/`);
        }
    }, [router, slug]);
};
