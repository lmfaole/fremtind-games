// Delt mellom alle quizer. Importerer med relative stier og `.ts`, siden `pnpm check` kjører
// filene direkte i Node uten Next.js sin `@/`-alias.

export interface Section {
    id: string;
    title: string;
}

interface BaseQuestion {
    id: string;
    section: string;
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
    /**
     * Største avstand fra svaret som fortsatt gir delpoeng. Poengene synker lineært fra 1 (eksakt)
     * til 0 (på toleransen). Uten verdi må svaret treffe nøyaktig.
     */
    tolerance?: number;
    min?: number;
    max?: number;
}

export type Question = ChoiceQuestion | MultiQuestion | TextQuestion | NumberQuestion;

/** En quiz med egne spørsmål, seksjoner og eventuelt et tidsrom den kan startes i. */
export interface Quiz {
    /** Brukes i URL-en (`/quizer/<slug>/`) og i nøklene i nettleserens lagring. */
    slug: string;
    title: string;
    description: string;
    /** Bildet på quizens kort på forsiden. Sti under `public/`, f.eks. `/goteborg.jpg`. */
    image: string;
    imageAlt: string;
    /** Heldekkende bakgrunn på quizens egen forside (`/quizer/<slug>/`). Sti under `public/`. */
    heroImage: string;
    sections: Section[];
    /** Spørsmålene i visningsrekkefølge: seksjon for seksjon, i rekkefølgen i `sections`. */
    questions: Question[];
    /** Spørsmålene slik de er skrevet, også de med ukjent seksjon. Brukes av `pnpm check`. */
    allQuestions: Question[];
    /** Quizen kan startes fra og med dette tidspunktet. Uten verdi er den åpen fra begynnelsen. */
    opens?: string;
    /** Quizen kan ikke startes fra og med dette tidspunktet. Uten verdi stenger den aldri. */
    closes?: string;
}

export type QuizDefinition = Omit<Quiz, "questions" | "allQuestions"> & {
    /** Rekkefølgen her spiller ingen rolle: spørsmålene sorteres etter seksjon. */
    questions: Question[];
};

export const defineQuiz = ({ questions, ...quiz }: QuizDefinition): Quiz => ({
    ...quiz,
    allQuestions: questions,
    questions: quiz.sections.flatMap((section) =>
        questions.filter((question) => question.section === section.id),
    ),
});
