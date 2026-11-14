const key = (slug: string, name: string) => `fremtind-games:${slug}:${name}`;

const isStringList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "string");

const toAnswers = (parsed: unknown): Record<string, string[]> => {
    if (!parsed || typeof parsed !== "object") {
        return {};
    }

    return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string[]] =>
            isStringList(entry[1]),
        ),
    );
};

// sessionStorage kan være utilgjengelig (privat modus, blokkerte cookies) og
// innholdet kan være tuklet med, så lesing og skriving må tåle å feile.
export const readAnswers = (slug: string): Record<string, string[]> => {
    try {
        const stored = window.sessionStorage.getItem(key(slug, "svar"));
        return toAnswers(stored ? JSON.parse(stored) : null);
    } catch {
        return {};
    }
};

export const saveAnswer = (slug: string, id: string, value: string[]) => {
    try {
        window.sessionStorage.setItem(
            key(slug, "svar"),
            JSON.stringify({ ...readAnswers(slug), [id]: value }),
        );
    } catch {
        // Svaret går tapt ved refresh, men quizen fungerer videre.
    }
};

export const readTeamName = (slug: string): string => {
    try {
        return window.sessionStorage.getItem(key(slug, "lag")) ?? "";
    } catch {
        return "";
    }
};

export const saveTeamName = (slug: string, name: string) => {
    try {
        window.sessionStorage.setItem(key(slug, "lag"), name);
    } catch {
        // Lagnavnet går tapt ved refresh, men quizen fungerer videre.
    }
};

export const readMembers = (slug: string): string[] => {
    try {
        const parsed: unknown = JSON.parse(
            window.sessionStorage.getItem(key(slug, "medlemmer")) ?? "[]",
        );
        return isStringList(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const saveMembers = (slug: string, members: string[]) => {
    try {
        window.sessionStorage.setItem(key(slug, "medlemmer"), JSON.stringify(members));
    } catch {
        // Medlemmene går tapt ved refresh, men quizen fungerer videre.
    }
};

/** Er quizen påbegynt i denne økten? Brukes til å la den som har begynt fullføre etter at den stenger. */
export const hasStarted = (slug: string): boolean =>
    Object.keys(readAnswers(slug)).length > 0 ||
    readTeamName(slug) !== "" ||
    readMembers(slug).length > 0;

// Før quizene fikk hver sin nøkkel lå det eneste fullførte resultatet her, for quizen som nå
// heter `norge-sverige-1`.
const LEGACY_COMPLETED_KEY = "fremtind-games:fullfort";
const LEGACY_SLUG = "norge-sverige-1";

// Flytter den gamle nøkkelen til den nye. Trygt å kjøre flere ganger: uten gammel nøkkel skjer
// ingenting, og et allerede lagret resultat under den nye nøkkelen overskrives aldri.
const migrateCompleted = (slug: string) => {
    if (slug !== LEGACY_SLUG) {
        return;
    }
    try {
        const legacy = window.localStorage.getItem(LEGACY_COMPLETED_KEY);
        if (legacy === null) {
            return;
        }
        if (window.localStorage.getItem(key(slug, "fullfort")) === null) {
            window.localStorage.setItem(key(slug, "fullfort"), legacy);
        }
        window.localStorage.removeItem(LEGACY_COMPLETED_KEY);
    } catch {
        // Uten lagring finnes det ikke noe resultat å flytte.
    }
};

// Quizen kan bare besvares én gang per nettleser. Markeringen ligger i localStorage, ikke
// sessionStorage, så den overlever at fanen lukkes. Den kan omgås (annen nettleser, privat
// modus, tømt lagring); det finnes ingen innlogging å håndheve det mot.
export const readCompleted = (slug: string): Record<string, string[]> | null => {
    migrateCompleted(slug);
    try {
        const parsed: unknown = JSON.parse(
            window.localStorage.getItem(key(slug, "fullfort")) ?? "null",
        );
        return parsed && typeof parsed === "object" ? toAnswers(parsed) : null;
    } catch {
        return null;
    }
};

export const saveCompleted = (slug: string, answers: Record<string, string[]>) => {
    try {
        window.localStorage.setItem(key(slug, "fullfort"), JSON.stringify(answers));
    } catch {
        // Uten lagring kan quizen tas på nytt, men resultatet vises fortsatt nå.
    }
};
