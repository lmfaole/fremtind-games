const fallbackId = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });

// crypto.randomUUID finnes bare i sikre kontekster, så http-preview trenger en reserve.
const newId = () => (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackId());

// Bevisst bare i minnet: å lagre id-en i nettleseren (cookie, sessionStorage …) ville utløst
// kravet om samtykke etter ekomloven § 3-15, siden statistikk ikke er nødvendig funksjonalitet.
// En refresh gir derfor ny id. Dobbelttelling hindres av at klienten bare sender svar som er nye
// eller endret siden forrige lagrede svar (som ligger i sessionStorage som nødvendig funksjon).
let sessionId: string | undefined;

/** Tilfeldig id uten kobling til lagnavn eller personer. Brukes bare til å dedupe svar. */
export const getSessionId = (): string => (sessionId ??= newId());
