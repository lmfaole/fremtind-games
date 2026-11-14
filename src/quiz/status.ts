import type { Quiz } from "./types.ts";

export type QuizStatus = "upcoming" | "open" | "closed";

// Datoer må ha tidssone-offset (`+01:00` eller `Z`), ellers tolkes de i enhetens tidssone og
// åpningstiden ville blitt forskjellig for hver bruker.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/** Tidspunktet i millisekunder, eller null hvis strengen ikke er en gyldig ISO 8601-dato med offset. */
export const parseQuizTime = (value: string): number | null => {
    if (!ISO_WITH_OFFSET.test(value)) {
        return null;
    }
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
};

/**
 * Kan quizen startes nå? `opens` er inkludert og `closes` eksklusiv, så quizen er åpen i
 * halvåpent intervall `[opens, closes)`. Uten datoer er den alltid åpen.
 */
export const quizStatus = (
    quiz: Pick<Quiz, "opens" | "closes">,
    now: number = Date.now(),
): QuizStatus => {
    const opens = quiz.opens === undefined ? null : parseQuizTime(quiz.opens);
    const closes = quiz.closes === undefined ? null : parseQuizTime(quiz.closes);

    if (opens !== null && now < opens) {
        return "upcoming";
    }
    if (closes !== null && now >= closes) {
        return "closed";
    }
    return "open";
};

/** For eksempel «1. desember 2026 kl. 12:00», alltid i norsk tid uansett enhetens tidssone. */
export const formatQuizTime = (value: string): string =>
    new Intl.DateTimeFormat("nb-NO", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Oslo",
    }).format(new Date(value));
