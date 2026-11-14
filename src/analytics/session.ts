/** sessionStorage-nøkkel for anonym økt-id. Slettes når fanen lukkes. */
export const SESSION_KEY = "fremtind-games:sessionId";

const fallbackId = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });

// crypto.randomUUID finnes bare i sikre kontekster, så http-preview trenger en reserve.
const newId = () => (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackId());

/** Tilfeldig id uten kobling til lagnavn eller personer. Brukes bare til å dedupe svar. */
export const getSessionId = (): string => {
    try {
        const stored = window.sessionStorage.getItem(SESSION_KEY);
        if (stored) {
            return stored;
        }
        const id = newId();
        window.sessionStorage.setItem(SESSION_KEY, id);
        return id;
    } catch {
        // Uten lagring får hvert kall en ny id, men quizen virker.
        return newId();
    }
};
