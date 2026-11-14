"use client";

import { useEffect } from "react";
import { initPostHog } from "./posthog";

/** Starter PostHog én gang når siden er hydrert. Rendrer ingenting. */
export const PostHogInit = () => {
    useEffect(() => {
        void initPostHog();
    }, []);
    return null;
};
