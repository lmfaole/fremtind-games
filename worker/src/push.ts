import { corsHeaders, json } from "./http.ts";
import { b64urlDecode, encryptPayload, vapidAuthorization, type VapidKeys } from "./webpush.ts";

export interface PushEnv {
    DB: D1Database;
    VAPID_PUBLIC_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    VAPID_SUBJECT?: string;
    PUSH_ADMIN_TOKEN?: string;
    /** Maks abonnement per /push/send-kall. Standard 40, under grensen for subrequests på gratisplanen. */
    PUSH_BATCH_LIMIT?: string;
}

const MAX_BODY_BYTES = 4096;
const MAX_ENDPOINT = 2048;
const CONCURRENCY = 10;
const DEFAULT_BATCH = 40;
const TTL_SECONDS = 86400;

type Fetch = typeof fetch;

function config(env: PushEnv): VapidKeys | null {
    const { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey } = env;
    const subject = env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject || !env.PUSH_ADMIN_TOKEN) return null;
    return { publicKey, privateKey, subject };
}

async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return { ok: false };
    try {
        return { ok: true, body: JSON.parse(raw) };
    } catch {
        return { ok: false };
    }
}

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validEndpoint(v: unknown): v is string {
    if (typeof v !== "string" || v.length < 1 || v.length > MAX_ENDPOINT) return false;
    try {
        const u = new URL(v);
        return u.protocol === "https:" && !u.username && !u.password && u.hostname.includes(".");
    } catch {
        return false;
    }
}

export type SubscribeParsed =
    { ok: true; endpoint: string; p256dh: string; auth: string } | { ok: false; error: string };

export function validateSubscription(input: unknown): SubscribeParsed {
    if (!isObject(input)) return { ok: false, error: "Ugyldig body" };
    const { endpoint, keys } = input;
    if (!validEndpoint(endpoint)) return { ok: false, error: "Ugyldig endpoint" };
    if (!isObject(keys)) return { ok: false, error: "Mangler keys" };
    const { p256dh, auth } = keys;
    const p = typeof p256dh === "string" ? b64urlDecode(p256dh) : null;
    if (!p || p.length !== 65 || p[0] !== 4) return { ok: false, error: "Ugyldig p256dh" };
    const a = typeof auth === "string" ? b64urlDecode(auth) : null;
    if (!a || a.length !== 16) return { ok: false, error: "Ugyldig auth" };
    return { ok: true, endpoint, p256dh: p256dh as string, auth: auth as string };
}

export type SendParsed =
    | { ok: true; title: string; body: string; url: string; after: number }
    | { ok: false; error: string };

export function validateSend(input: unknown): SendParsed {
    if (!isObject(input)) return { ok: false, error: "Ugyldig body" };
    const { title, body, url, after } = input;
    if (typeof title !== "string" || title.length < 1 || title.length > 100) {
        return { ok: false, error: "Ugyldig title" };
    }
    if (body !== undefined && (typeof body !== "string" || body.length > 500)) {
        return { ok: false, error: "Ugyldig body-tekst" };
    }
    // Bare relativ sti på samme nettsted: ikke "//vert", ikke "\", ikke kontrolltegn.
    if (
        url !== undefined &&
        (typeof url !== "string" ||
            url.length > 200 ||
            !/^\/(?![/\\])[^\\\u0000-\u001f]*$/.test(url))
    ) {
        return { ok: false, error: "url må være en relativ sti" };
    }
    if (after !== undefined && (!Number.isInteger(after) || (after as number) < 0)) {
        return { ok: false, error: "Ugyldig after" };
    }
    return {
        ok: true,
        title,
        body: (body as string | undefined) ?? "",
        url: (url as string | undefined) ?? "/",
        after: (after as number | undefined) ?? 0,
    };
}

/** Sammenligner SHA-256-hasher i konstant tid, så tokenet ikke lekker via timing. */
async function tokenMatches(given: string, expected: string): Promise<boolean> {
    const h = async (s: string) =>
        new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
    const [a, b] = await Promise.all([h(given), h(expected)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

async function subscribe(request: Request, env: PushEnv): Promise<Response> {
    const parsed = await readJson(request);
    if (!parsed.ok) return json(request, { error: "Ugyldig eller for stor JSON" }, 400);
    const v = validateSubscription(parsed.body);
    if (!v.ok) return json(request, { error: v.error }, 400);
    // created_at beholdes ved gjentatt abonnering; nøklene oppdateres.
    await env.DB.prepare(
        "INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth",
    )
        .bind(v.endpoint, v.p256dh, v.auth, Math.floor(Date.now() / 1000))
        .run();
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function unsubscribe(request: Request, env: PushEnv): Promise<Response> {
    const parsed = await readJson(request);
    if (!parsed.ok) return json(request, { error: "Ugyldig eller for stor JSON" }, 400);
    if (!isObject(parsed.body) || !validEndpoint(parsed.body.endpoint)) {
        return json(request, { error: "Ugyldig endpoint" }, 400);
    }
    await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?1")
        .bind(parsed.body.endpoint)
        .run();
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function send(
    request: Request,
    env: PushEnv,
    keys: VapidKeys,
    fetchFn: Fetch,
): Promise<Response> {
    const auth = request.headers.get("Authorization") ?? "";
    const m = /^Bearer (.+)$/.exec(auth);
    if (!m || !(await tokenMatches(m[1], env.PUSH_ADMIN_TOKEN as string))) {
        return json(request, { error: "Ikke autorisert" }, 401, {
            "WWW-Authenticate": "Bearer",
        });
    }
    const parsed = await readJson(request);
    if (!parsed.ok) return json(request, { error: "Ugyldig eller for stor JSON" }, 400);
    const v = validateSend(parsed.body);
    if (!v.ok) return json(request, { error: v.error }, 400);

    const payload = new TextEncoder().encode(
        JSON.stringify({ title: v.title, body: v.body, url: v.url }),
    );
    if (payload.length > 3993) return json(request, { error: "For stor payload" }, 400);

    const limit = Math.min(
        Math.max(Number.parseInt(env.PUSH_BATCH_LIMIT ?? "", 10) || DEFAULT_BATCH, 1),
        900,
    );
    // Hent én ekstra rad for å vite om det finnes flere.
    const { results } = await env.DB.prepare(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE id > ?1 ORDER BY id LIMIT ?2",
    )
        .bind(v.after, limit + 1)
        .all<{ id: number; endpoint: string; p256dh: string; auth: string }>();
    const hasMore = results.length > limit;
    const rows = results.slice(0, limit);

    let sent = 0;
    let failed = 0;
    const gone: string[] = [];
    const sendOne = async (r: (typeof rows)[number]) => {
        try {
            const body = await encryptPayload(r.p256dh, r.auth, payload);
            const res = await fetchFn(r.endpoint, {
                method: "POST",
                headers: {
                    Authorization: await vapidAuthorization(keys, r.endpoint),
                    "Content-Encoding": "aes128gcm",
                    "Content-Type": "application/octet-stream",
                    TTL: String(TTL_SECONDS),
                    Urgency: "normal",
                },
                body,
                signal: AbortSignal.timeout(10_000),
            });
            // Les ut kroppen så tilkoblingen frigjøres.
            await res.arrayBuffer().catch(() => undefined);
            if (res.status === 404 || res.status === 410) gone.push(r.endpoint);
            else if (res.status >= 200 && res.status < 300) sent++;
            else failed++;
        } catch {
            failed++;
        }
    };
    for (let i = 0; i < rows.length; i += CONCURRENCY) {
        await Promise.all(rows.slice(i, i + CONCURRENCY).map(sendOne));
    }

    if (gone.length > 0) {
        await env.DB.batch(
            gone.map((e) =>
                env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?1").bind(e),
            ),
        );
    }
    return json(request, {
        sent,
        removed: gone.length,
        failed,
        // Ved flere abonnement enn grensen: kall igjen med { after: next } til next er null.
        next: hasMore ? rows[rows.length - 1].id : null,
    });
}

export async function handlePush(
    request: Request,
    env: PushEnv,
    path: string,
    fetchFn: Fetch,
): Promise<Response> {
    if (path !== "/push/subscribe" && path !== "/push/unsubscribe" && path !== "/push/send") {
        return json(request, { error: "Ikke funnet" }, 404);
    }
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                ...corsHeaders(request),
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
        });
    }
    if (request.method !== "POST") {
        return json(request, { error: "Metoden er ikke tillatt" }, 405, {
            Allow: "POST, OPTIONS",
        });
    }
    const keys = config(env);
    if (!keys) return json(request, { error: "Push er ikke konfigurert" }, 503);

    if (path === "/push/subscribe") return subscribe(request, env);
    if (path === "/push/unsubscribe") return unsubscribe(request, env);
    return send(request, env, keys, fetchFn);
}
