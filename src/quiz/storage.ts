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

export const clearAnswers = () => {
    try {
        window.sessionStorage.removeItem(KEY);
    } catch {
        // Ignorer – neste svar overskriver uansett.
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
