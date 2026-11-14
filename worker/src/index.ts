import { corsHeaders, json } from "./http.ts";
import { handlePush, type PushEnv } from "./push.ts";

export interface Env extends PushEnv {
    DB: D1Database;
}

/** Det vi trenger av Cache API; lar testene bruke en enkel fake. */
export interface CacheLike {
    match(request: Request): Promise<Response | undefined>;
    put(request: Request, response: Response): Promise<void>;
}

const MAX_BODY_BYTES = 2048;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID = /^[a-z0-9_-]{1,64}$/;
const CACHE_CONTROL = "public, max-age=60";

type Stats = { total: number; counts: Record<string, number> };

type Parsed =
    | { ok: true; sessionId: string; questionId: string; keys: string[]; variant: string | null }
    | { ok: false; error: string };

export function validateAnswer(input: unknown): Parsed {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { ok: false, error: "Ugyldig body" };
    }
    const { sessionId, questionId, keys, variant } = input as Record<string, unknown>;
    if (typeof sessionId !== "string" || !UUID.test(sessionId)) {
        return { ok: false, error: "Ugyldig sessionId" };
    }
    if (typeof questionId !== "string" || !ID.test(questionId)) {
        return { ok: false, error: "Ugyldig questionId" };
    }
    if (!Array.isArray(keys) || keys.length < 1 || keys.length > 10) {
        return { ok: false, error: "keys må ha 1-10 elementer" };
    }
    for (const k of keys) {
        if (typeof k !== "string" || k.length < 1 || k.length > 100) {
            return { ok: false, error: "Ugyldig nøkkel" };
        }
    }
    if (variant !== undefined && (typeof variant !== "string" || variant.length > 32)) {
        return { ok: false, error: "Ugyldig variant" };
    }
    return {
        ok: true,
        sessionId: sessionId.toLowerCase(),
        questionId,
        // Duplikater ville telle samme respondent to ganger på én nøkkel.
        keys: [...new Set(keys as string[])],
        variant: variant === undefined || variant === "" ? null : variant,
    };
}

async function postAnswer(request: Request, env: Env): Promise<Response> {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
        return json(request, { error: "For stor body" }, 400);
    }
    let body: unknown;
    try {
        body = JSON.parse(raw);
    } catch {
        return json(request, { error: "Ugyldig JSON" }, 400);
    }
    const v = validateAnswer(body);
    if (!v.ok) return json(request, { error: v.error }, 400);

    // changes() gir antall rader fra forrige fullførte statement i batchen. Er raden et duplikat
    // blir answers-insert 0, og det forplanter seg: totals blir 0, og dermed counts også.
    // Rekkefølgen answers -> totals -> counts må derfor beholdes.
    const db = env.DB;
    await db.batch([
        db
            .prepare(
                "INSERT OR IGNORE INTO answers (session_id, question_id, variant, answer_keys, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            )
            .bind(
                v.sessionId,
                v.questionId,
                v.variant,
                JSON.stringify(v.keys),
                Math.floor(Date.now() / 1000),
            ),
        db
            .prepare(
                "INSERT INTO totals (question_id, total) SELECT ?1, 1 WHERE changes() > 0 ON CONFLICT(question_id) DO UPDATE SET total = total + 1",
            )
            .bind(v.questionId),
        db
            .prepare(
                "INSERT INTO counts (question_id, answer_key, count) SELECT ?1, value, 1 FROM json_each(?2) WHERE changes() > 0 ON CONFLICT(question_id, answer_key) DO UPDATE SET count = count + 1",
            )
            .bind(v.questionId, JSON.stringify(v.keys)),
    ]);
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function readStats(env: Env, questionId?: string): Promise<Record<string, Stats>> {
    const where = questionId ? " WHERE question_id = ?1" : "";
    const bind = (sql: string) => {
        const stmt = env.DB.prepare(sql + where);
        return questionId ? stmt.bind(questionId) : stmt;
    };
    const [totals, counts] = await env.DB.batch<Record<string, unknown>>([
        bind("SELECT question_id, total FROM totals"),
        bind("SELECT question_id, answer_key, count FROM counts"),
    ]);
    const out: Record<string, Stats> = {};
    for (const r of totals.results) {
        out[r.question_id as string] = { total: r.total as number, counts: {} };
    }
    for (const r of counts.results) {
        const q = (out[r.question_id as string] ??= { total: 0, counts: {} });
        q.counts[r.answer_key as string] = r.count as number;
    }
    return out;
}

async function getStats(request: Request, env: Env, cache: CacheLike | undefined, path: string) {
    const cacheKey = new Request(new URL(request.url).origin + path, { method: "GET" });
    const hit = await cache?.match(cacheKey);
    let payload: string;
    if (hit) {
        payload = await hit.text();
    } else {
        let data: unknown;
        if (path === "/statistikk") {
            data = { questions: await readStats(env) };
        } else {
            const id = path.slice("/statistikk/".length);
            if (!ID.test(id)) {
                return json(request, { error: "Ugyldig questionId" }, 400);
            }
            data = (await readStats(env, id))[id] ?? { total: 0, counts: {} };
        }
        payload = JSON.stringify(data);
        await cache?.put(
            cacheKey,
            new Response(payload, {
                headers: { "Content-Type": "application/json", "Cache-Control": CACHE_CONTROL },
            }),
        );
    }
    // CORS legges på per forespørsel, så cachen kan deles mellom origins.
    return new Response(payload, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": CACHE_CONTROL,
            ...corsHeaders(request),
        },
    });
}

export async function handle(
    request: Request,
    env: Env,
    cache?: CacheLike,
    fetchFn: typeof fetch = fetch,
): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    if (path.startsWith("/push/")) return handlePush(request, env, path, fetchFn);
    const isStats = path === "/statistikk" || path.startsWith("/statistikk/");
    if (path !== "/svar" && !isStats) {
        return json(request, { error: "Ikke funnet" }, 404);
    }

    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders(request),
                "Access-Control-Allow-Methods": path === "/svar" ? "POST, OPTIONS" : "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    if (path === "/svar") {
        if (request.method !== "POST") {
            return json(request, { error: "Metoden er ikke tillatt" }, 405, {
                Allow: "POST, OPTIONS",
            });
        }
        return postAnswer(request, env);
    }

    if (request.method !== "GET") {
        return json(request, { error: "Metoden er ikke tillatt" }, 405, { Allow: "GET, OPTIONS" });
    }
    return getStats(request, env, cache, path);
}

export default {
    fetch(request: Request, env: Env): Promise<Response> {
        const cache =
            typeof caches !== "undefined"
                ? (caches as unknown as { default: CacheLike }).default
                : undefined;
        return handle(request, env, cache);
    },
};
