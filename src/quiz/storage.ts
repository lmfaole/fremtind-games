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
