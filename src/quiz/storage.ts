const KEY = "fremtind-games:svar";

const isStringList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "string");

// sessionStorage kan være utilgjengelig (privat modus, blokkerte cookies) og
// innholdet kan være tuklet med, så lesing og skriving må tåle å feile.
export const readAnswers = (): Record<string, string[]> => {
    try {
        const stored = window.sessionStorage.getItem(KEY);
        const parsed = stored ? JSON.parse(stored) : null;

        if (!parsed || typeof parsed !== "object") {
            return {};
        }

        return Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, string[]] =>
                isStringList(entry[1]),
            ),
        );
    } catch {
        return {};
    }
};

export const saveAnswer = (id: string, value: string[]) => {
    try {
        window.sessionStorage.setItem(KEY, JSON.stringify({ ...readAnswers(), [id]: value }));
    } catch {
        // Svaret går tapt ved refresh, men quizen fungerer videre.
    }
};

const TEAM_KEY = "fremtind-games:lag";

export const readTeamName = (): string => {
    try {
        return window.sessionStorage.getItem(TEAM_KEY) ?? "";
    } catch {
        return "";
    }
};

export const saveTeamName = (name: string) => {
    try {
        window.sessionStorage.setItem(TEAM_KEY, name);
    } catch {
        // Lagnavnet går tapt ved refresh, men quizen fungerer videre.
    }
};

const MEMBERS_KEY = "fremtind-games:medlemmer";

export const readMembers = (): string[] => {
    try {
        const parsed: unknown = JSON.parse(window.sessionStorage.getItem(MEMBERS_KEY) ?? "[]");
        return isStringList(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const saveMembers = (members: string[]) => {
    try {
        window.sessionStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    } catch {
        // Medlemmene går tapt ved refresh, men quizen fungerer videre.
    }
};

const COMPLETED_KEY = "fremtind-games:fullfort";

// Quizen kan bare besvares én gang per nettleser. Markeringen ligger i localStorage, ikke
// sessionStorage, så den overlever at fanen lukkes. Den kan omgås (annen nettleser, privat
// modus, tømt lagring); det finnes ingen innlogging å håndheve det mot.
export const readCompleted = (): Record<string, string[]> | null => {
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(COMPLETED_KEY) ?? "null");
        if (!parsed || typeof parsed !== "object") {
            return null;
        }
        return Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, string[]] =>
                isStringList(entry[1]),
            ),
        );
    } catch {
        return null;
    }
};

export const saveCompleted = (answers: Record<string, string[]>) => {
    try {
        window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(answers));
    } catch {
        // Uten lagring kan quizen tas på nytt, men resultatet vises fortsatt nå.
    }
};
