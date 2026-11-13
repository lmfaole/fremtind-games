interface BaseQuestion {
    id: string;
    question: string;
    description?: string;
}

export interface ChoiceQuestion extends BaseQuestion {
    type: "choice";
    options: string[];
    answer: string;
}

export interface MultiQuestion extends BaseQuestion {
    type: "multi";
    options: string[];
    /** Svaret må treffe akkurat disse alternativene – ikke flere, ikke færre. */
    answer: string[];
}

export interface TextQuestion extends BaseQuestion {
    type: "text";
    /** Kort benevnelse på selve inputfeltet, i tillegg til spørsmålet. */
    label: string;
    answer: string;
}

export interface NumberQuestion extends BaseQuestion {
    type: "number";
    label: string;
    answer: number;
    min?: number;
    max?: number;
}

export type Question = ChoiceQuestion | MultiQuestion | TextQuestion | NumberQuestion;

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Svar lagres alltid som en liste, også for typene som bare tar én verdi. */
export const isAnswered = (value: string[]) => value.some((entry) => entry.trim() !== "");

export const isCorrect = (question: Question, value: string[]) => {
    switch (question.type) {
        case "multi": {
            const given = new Set(value.map(normalize));
            const expected = question.answer.map(normalize);
            return given.size === expected.length && expected.every((option) => given.has(option));
        }
        case "number": {
            const given = value[0]?.trim();
            return !!given && Number(given) === question.answer;
        }
        default:
            return normalize(value[0] ?? "") === normalize(question.answer);
    }
};

export const questions: Question[] = [
    {
        type: "choice",
        id: "abba",
        question: "Hvilken låt vant ABBA Eurovision Song Contest med i 1974?",
        options: ["Waterloo", "Dancing Queen", "Mamma Mia", "SOS"],
        answer: "Waterloo",
    },
    {
        type: "number",
        id: "union",
        question: "Hvilket år ble unionen mellom Norge og Sverige oppløst?",
        label: "Årstall",
        answer: 1905,
        min: 1800,
        max: 2000,
    },
    {
        type: "choice",
        id: "take-on-me",
        question: "Hvilket norsk band står bak «Take On Me»?",
        options: ["Madrugada", "Röyksopp", "a-ha", "Turbonegro"],
        answer: "a-ha",
    },
    {
        type: "multi",
        id: "svenske-band",
        question: "Hvilke av disse banda er svenske?",
        description: "Flere svar er riktige.",
        options: ["ABBA", "a-ha", "Roxette", "Kent", "Madrugada"],
        answer: ["ABBA", "Roxette", "Kent"],
    },
    {
        type: "text",
        id: "pippi",
        question: "Hvilken svensk forfatter skrev bøkene om Pippi Langstrømpe?",
        description: "Både fornavn og etternavn.",
        label: "Forfatter",
        answer: "Astrid Lindgren",
    },
    {
        type: "choice",
        id: "kalmar",
        question: "Hva het unionen som knyttet Danmark, Norge og Sverige sammen fra 1397?",
        options: ["Hansaforbundet", "Kalmarunionen", "Den nordiske union", "Vasaunionen"],
        answer: "Kalmarunionen",
    },
    {
        type: "text",
        id: "stiklestad",
        question: "Hvor stod slaget i 1030 som står sentralt i kristningen av Norge?",
        description: "Stedet ligger i Trøndelag.",
        label: "Stedsnavn",
        answer: "Stiklestad",
    },
    {
        type: "number",
        id: "grunnlov",
        question: "Hvilket år ble Norges grunnlov vedtatt på Eidsvoll?",
        label: "Årstall",
        answer: 1814,
        min: 1700,
        max: 1900,
    },
    {
        type: "multi",
        id: "svenske-merker",
        question: "Hvilke av disse merkene er svenske?",
        description: "Flere svar er riktige.",
        options: ["IKEA", "Nokia", "Volvo", "Lego", "Spotify"],
        answer: ["IKEA", "Volvo", "Spotify"],
    },
    {
        type: "choice",
        id: "stromming",
        question: "Hvilken svensk tjeneste gjorde strømming av musikk til allemannseie?",
        options: ["Deezer", "SoundCloud", "Tidal", "Spotify"],
        answer: "Spotify",
    },
    {
        type: "text",
        id: "skam",
        question: "Hvilken norsk TV-serie fra 2015 ble en internasjonal ungdomssuksess?",
        label: "Tittel",
        answer: "Skam",
    },
];
