/** Inlines ved bygg. Tom verdi betyr at statistikk er slått av. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export const analyticsEnabled = API_URL !== "";

/** Prosenter vises først når nok har svart, så få svar ikke gir misvisende tall. */
export const MIN_SVAR_FOR_STATISTIKK = 20;
