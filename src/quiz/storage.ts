const KEY = "fremtind-games:svar";

// sessionStorage kan være utilgjengelig (privat modus, blokkerte cookies) og
// innholdet kan være tuklet med, så lesing og skriving må tåle å feile.
export const readAnswers = (): Record<string, string> => {
    try {
        const stored = window.sessionStorage.getItem(KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

export const saveAnswer = (id: string, value: string) => {
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
