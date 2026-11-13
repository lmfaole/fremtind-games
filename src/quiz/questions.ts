interface BaseQuestion {
    id: string;
    question: string;
    description?: string;
    answer: string;
}

export interface ChoiceQuestion extends BaseQuestion {
    type: "choice";
    options: string[];
}

export interface TextQuestion extends BaseQuestion {
    type: "text";
    /** Kort benevnelse på selve inputfeltet, i tillegg til spørsmålet. */
    label: string;
}

export type Question = ChoiceQuestion | TextQuestion;

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const isCorrect = (question: Question, value: string) =>
    normalize(value) === normalize(question.answer);

export const questions: Question[] = [
    {
        type: "choice",
        id: "abba",
        question: "Hvilken låt vant ABBA Eurovision Song Contest med i 1974?",
        options: ["Waterloo", "Dancing Queen", "Mamma Mia", "SOS"],
        answer: "Waterloo",
    },
    {
        type: "text",
        id: "union",
        question: "Hvilket år ble unionen mellom Norge og Sverige oppløst?",
        label: "Årstall",
        answer: "1905",
    },
    {
        type: "choice",
        id: "take-on-me",
        question: "Hvilket norsk band står bak «Take On Me»?",
        options: ["Madrugada", "Röyksopp", "a-ha", "Turbonegro"],
        answer: "a-ha",
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
