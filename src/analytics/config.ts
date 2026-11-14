/** Inlines ved bygg. Tom verdi betyr at statistikk er slått av. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export const analyticsEnabled = API_URL !== "";

/** Prosenter vises først når nok har svart, så få svar ikke gir misvisende tall. */
export const MIN_SVAR_FOR_STATISTIKK = 20;

/** Offentlig, skrivebeskyttet prosjekttoken (phc_…). Tom verdi slår PostHog helt av. */
export const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_TOKEN ?? "";

/** Ingest-vert. Prosjektet ligger i EU-regionen. */
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export const posthogEnabled = POSTHOG_TOKEN !== "";

/**
 * Feature flags (PostHog-eksperimenter) som er aktive. Variantene sendes med hvert svar til
 * backenden, så svar kan krysses mot variant. Tom liste = ingen pågående A/B-tester.
 */
export const EXPERIMENT_FLAGS: readonly string[] = [];
