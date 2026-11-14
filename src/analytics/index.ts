import { answerKeys } from "@/quiz/answers";
import type { Question } from "@/quiz/types";
import { analyticsEnabled, API_URL } from "./config";
import { experimentVariant, track } from "./posthog";
import { getSessionId } from "./session";

export { analyticsEnabled, MIN_SVAR_FOR_STATISTIKK } from "./config";
export { getVariant, track } from "./posthog";

export interface QuestionStats {
    total: number;
    counts: Record<string, number>;
}

export type Stats = Record<string, QuestionStats>;

const TIMEOUT_MS = 4000;

/**
 * Sender ett anonymt svar: bare økt-id, spørsmåls-id og normaliserte nøkler.
 * Aldri lagnavn, medlemmer eller fritekst-label. Blokkerer aldri og svelger feil.
 */
export const sendAnswer = (question: Question, value: string[]): void => {
    if (!analyticsEnabled) {
        return;
    }

    const keys = answerKeys(question, value);
    if (keys.length === 0) {
        return;
    }

    try {
        fetch(`${API_URL}/svar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: getSessionId(),
                questionId: question.id,
                keys,
                variant: experimentVariant(),
            }),
            // Lar kallet fullføre selv om siden byttes rett etter.
            keepalive: true,
        }).catch(() => {});
    } catch {
        // Statistikk er valgfritt.
    }
};

const isRecord = (value: unknown): value is Stats =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Henter aggregert statistikk. Gir null ved feil, timeout eller manglende backend. */
export const fetchStats = async (): Promise<Stats | null> => {
    if (!analyticsEnabled) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/statistikk`, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!response.ok) {
            return null;
        }
        const data: unknown = await response.json();
        const stats = (data as { questions?: unknown } | null)?.questions;
        return isRecord(stats) ? stats : null;
    } catch {
        return null;
    }
};
