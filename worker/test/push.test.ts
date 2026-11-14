import { beforeEach, describe, expect, it } from "vitest";
import { generateKeyPairSync, webcrypto } from "node:crypto";
import { handle, type Env } from "../src/index.ts";
import { b64urlDecode, b64urlEncode, createVapidJwt, encryptPayload } from "../src/webpush.ts";
import { createFakeD1 } from "./fake-d1.ts";

function newKeys() {
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const priv = privateKey.export({ format: "jwk" });
    const pub = publicKey.export({ format: "jwk" });
    const raw = Buffer.concat([
        Buffer.from([4]),
        Buffer.from(pub.x!, "base64url"),
        Buffer.from(pub.y!, "base64url"),
    ]);
    return { d: priv.d!, pub: raw.toString("base64url") };
}

const vapid = newKeys();
const ORIGIN = "https://fremtind.games";
const TOKEN = "hemmelig-admin-token";
const EP = (n: number) => `https://push.example.com/send/${n}`;

/** En "nettleser": UA-nøkkelpar og auth-hemmelighet, slik at testene kan dekryptere. */
async function newDevice() {
    const kp = (await webcrypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
        "deriveBits",
    ])) as webcrypto.CryptoKeyPair;
    const pub = new Uint8Array(await webcrypto.subtle.exportKey("raw", kp.publicKey));
    const auth = webcrypto.getRandomValues(new Uint8Array(16));
    return { kp, pub, auth, keys: { p256dh: b64urlEncode(pub), auth: b64urlEncode(auth) } };
}

let env: Env;
let sqlite: ReturnType<typeof createFakeD1>["sqlite"];
let fetched: { url: string; init: RequestInit }[];
let statusFor: (url: string) => number;

beforeEach(() => {
    const d = createFakeD1();
    env = {
        DB: d.db,
        VAPID_PUBLIC_KEY: vapid.pub,
        VAPID_PRIVATE_KEY: vapid.d,
        VAPID_SUBJECT: "mailto:test@example.com",
        PUSH_ADMIN_TOKEN: TOKEN,
    };
    sqlite = d.sqlite;
    fetched = [];
    statusFor = () => 201;
});

const fakeFetch = (async (url: string, init: RequestInit) => {
    fetched.push({ url, init });
    return new Response(null, { status: statusFor(url) });
}) as unknown as typeof fetch;

const call = (path: string, body: unknown, headers: Record<string, string> = {}, e = env) =>
    handle(
        new Request("https://api.test" + path, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: typeof body === "string" ? body : JSON.stringify(body),
        }),
        e,
        undefined,
        fakeFetch,
    );
const admin = { Authorization: `Bearer ${TOKEN}` };
const count = () =>
    (sqlite.prepare("SELECT COUNT(*) AS n FROM push_subscriptions").get() as { n: number }).n;

describe("POST /push/subscribe", () => {
    it("lagrer og er idempotent (upsert beholder created_at, oppdaterer nøkler)", async () => {
        const a = await newDevice();
        const b = await newDevice();
        expect((await call("/push/subscribe", { endpoint: EP(1), keys: a.keys })).status).toBe(204);
        sqlite.prepare("UPDATE push_subscriptions SET created_at = 1").run();
        expect((await call("/push/subscribe", { endpoint: EP(1), keys: b.keys })).status).toBe(204);
        expect(count()).toBe(1);
        expect(sqlite.prepare("SELECT p256dh, created_at FROM push_subscriptions").get()).toEqual({
            p256dh: b.keys.p256dh,
            created_at: 1,
        });
    });

    it("lagrer ingenting utover endpoint, nøkler og tidspunkt", () => {
        const cols = sqlite.prepare("PRAGMA table_info(push_subscriptions)").all() as {
            name: string;
        }[];
        expect(cols.map((c) => c.name)).toEqual(["id", "endpoint", "p256dh", "auth", "created_at"]);
    });

    it("validerer strengt", async () => {
        const d = await newDevice();
        const bad: unknown[] = [
            "ikke json",
            [],
            { keys: d.keys },
            { endpoint: "http://push.example.com/x", keys: d.keys },
            { endpoint: "https://user:pw@push.example.com/x", keys: d.keys },
            { endpoint: "https://push.example.com/" + "a".repeat(2100), keys: d.keys },
            { endpoint: EP(1) },
            { endpoint: EP(1), keys: { p256dh: d.keys.p256dh } },
            { endpoint: EP(1), keys: { p256dh: "abc", auth: d.keys.auth } },
            { endpoint: EP(1), keys: { p256dh: d.keys.p256dh, auth: "kort" } },
            { endpoint: EP(1), keys: { p256dh: d.keys.p256dh + "!", auth: d.keys.auth } },
        ];
        for (const body of bad) {
            expect((await call("/push/subscribe", body)).status, JSON.stringify(body)).toBe(400);
        }
        expect(count()).toBe(0);
    });

    it("bruker samme CORS-regler", async () => {
        const d = await newDevice();
        const res = await call(
            "/push/subscribe",
            { endpoint: EP(1), keys: d.keys },
            { Origin: ORIGIN },
        );
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
        const evil = await call(
            "/push/subscribe",
            { endpoint: EP(1), keys: d.keys },
            { Origin: "https://evil.example" },
        );
        expect(evil.headers.get("Access-Control-Allow-Origin")).toBeNull();
        const pre = await handle(
            new Request("https://api.test/push/subscribe", {
                method: "OPTIONS",
                headers: { Origin: ORIGIN },
            }),
            env,
        );
        expect(pre.status).toBe(204);
        expect(pre.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    });

    it("gir 405 for GET og 404 for ukjent push-rute", async () => {
        const res = await handle(new Request("https://api.test/push/subscribe"), env);
        expect(res.status).toBe(405);
        expect((await call("/push/nei", {})).status).toBe(404);
    });
});

describe("POST /push/unsubscribe", () => {
    it("sletter og er idempotent", async () => {
        const d = await newDevice();
        await call("/push/subscribe", { endpoint: EP(1), keys: d.keys });
        expect((await call("/push/unsubscribe", { endpoint: EP(1) })).status).toBe(204);
        expect(count()).toBe(0);
        expect((await call("/push/unsubscribe", { endpoint: EP(1) })).status).toBe(204);
        expect((await call("/push/unsubscribe", { endpoint: "http://x.no" })).status).toBe(400);
    });
});

describe("uten konfigurasjon", () => {
    it("svarer 503 på push, men resten av Workeren virker", async () => {
        const bare = { DB: env.DB } as Env;
        const d = await newDevice();
        for (const p of ["/push/subscribe", "/push/unsubscribe", "/push/send"]) {
            const res = await call(p, { endpoint: EP(1), keys: d.keys, title: "x" }, admin, bare);
            expect(res.status).toBe(503);
        }
        const stats = await handle(new Request("https://api.test/statistikk"), bare);
        expect(stats.status).toBe(200);
    });
});

describe("POST /push/send", () => {
    it("krever riktig bearer-token", async () => {
        const body = { title: "Hei" };
        expect((await call("/push/send", body)).status).toBe(401);
        expect((await call("/push/send", body, { Authorization: "Bearer feil" })).status).toBe(401);
        expect((await call("/push/send", body, { Authorization: TOKEN })).status).toBe(401);
        expect(fetched).toHaveLength(0);
    });

    it("validerer body (url må være relativ sti)", async () => {
        const bad: unknown[] = [
            {},
            { title: "" },
            { title: "x".repeat(101) },
            { title: "x", body: 5 },
            { title: "x", url: "https://evil.example" },
            { title: "x", url: "//evil.example" },
            { title: "x", url: "/\\evil.example" },
            { title: "x", url: "quiz" },
        ];
        for (const b of bad) {
            expect((await call("/push/send", b, admin)).status, JSON.stringify(b)).toBe(400);
        }
        expect((await call("/push/send", { title: "x", url: "/quiz/1?a=b" }, admin)).status).toBe(
            200,
        );
    });

    it("sender kryptert payload med VAPID og kan dekrypteres av mottakeren", async () => {
        const dev = await newDevice();
        await call("/push/subscribe", { endpoint: EP(1), keys: dev.keys });
        const res = await call(
            "/push/send",
            { title: "Ny quiz", body: "Spill nå", url: "/quiz/1" },
            admin,
        );
        expect(await res.json()).toEqual({ sent: 1, removed: 0, failed: 0, next: null });

        const { url, init } = fetched[0];
        expect(url).toBe(EP(1));
        const h = init.headers as Record<string, string>;
        expect(h["Content-Encoding"]).toBe("aes128gcm");
        expect(h.TTL).toBeDefined();
        expect(h.Authorization).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
        expect(h.Authorization.endsWith(`k=${vapid.pub}`)).toBe(true);

        const plain = await decrypt(init.body as Uint8Array, dev);
        expect(JSON.parse(plain)).toEqual({ title: "Ny quiz", body: "Spill nå", url: "/quiz/1" });
    });

    it("fjerner abonnement som svarer 404/410, teller feil ellers", async () => {
        for (let i = 1; i <= 4; i++) {
            await call("/push/subscribe", { endpoint: EP(i), keys: (await newDevice()).keys });
        }
        statusFor = (u) => (u === EP(1) ? 410 : u === EP(2) ? 404 : u === EP(3) ? 500 : 201);
        const res = await call("/push/send", { title: "x" }, admin);
        expect(await res.json()).toEqual({ sent: 1, removed: 2, failed: 1, next: null });
        const left = sqlite.prepare("SELECT endpoint FROM push_subscriptions ORDER BY id").all();
        expect(left).toEqual([{ endpoint: EP(3) }, { endpoint: EP(4) }]);
    });

    it("teller nettverksfeil som failed", async () => {
        await call("/push/subscribe", { endpoint: EP(1), keys: (await newDevice()).keys });
        const throwing = (async () => {
            throw new Error("nett");
        }) as unknown as typeof fetch;
        const res = await handle(
            new Request("https://api.test/push/send", {
                method: "POST",
                headers: admin,
                body: JSON.stringify({ title: "x" }),
            }),
            env,
            undefined,
            throwing,
        );
        expect(await res.json()).toEqual({ sent: 0, removed: 0, failed: 1, next: null });
        expect(count()).toBe(1);
    });

    it("sender i bolker og gir next-markør", async () => {
        env.PUSH_BATCH_LIMIT = "2";
        for (let i = 1; i <= 5; i++) {
            await call("/push/subscribe", { endpoint: EP(i), keys: (await newDevice()).keys });
        }
        const r1 = (await (await call("/push/send", { title: "x" }, admin)).json()) as {
            sent: number;
            next: number | null;
        };
        expect(r1.sent).toBe(2);
        expect(r1.next).not.toBeNull();
        const r2 = (await (
            await call("/push/send", { title: "x", after: r1.next }, admin)
        ).json()) as { sent: number; next: number | null };
        expect(r2.sent).toBe(2);
        const r3 = (await (
            await call("/push/send", { title: "x", after: r2.next }, admin)
        ).json()) as { sent: number; next: number | null };
        expect(r3).toMatchObject({ sent: 1, next: null });
        expect(new Set(fetched.map((f) => f.url)).size).toBe(5);
    });
});

describe("VAPID JWT", () => {
    it("har riktig form og gyldig ES256-signatur", async () => {
        const keys = { publicKey: vapid.pub, privateKey: vapid.d, subject: "mailto:a@b.no" };
        const jwt = await createVapidJwt(keys, "https://push.example.com/send/abc", 1_000_000);
        const [h, c, s] = jwt.split(".");
        const dec = (x: string) => JSON.parse(new TextDecoder().decode(b64urlDecode(x)!));
        expect(dec(h)).toEqual({ typ: "JWT", alg: "ES256" });
        expect(dec(c)).toEqual({
            aud: "https://push.example.com",
            exp: 1_000_000 + 12 * 3600,
            sub: "mailto:a@b.no",
        });
        const sig = b64urlDecode(s)!;
        expect(sig).toHaveLength(64);
        const pub = b64urlDecode(vapid.pub)!;
        const key = await webcrypto.subtle.importKey(
            "raw",
            pub,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"],
        );
        const ok = await webcrypto.subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            key,
            sig,
            new TextEncoder().encode(`${h}.${c}`),
        );
        expect(ok).toBe(true);
    });
});

describe("RFC 8291-kryptering", () => {
    it("avviser ugyldige nøkler", async () => {
        await expect(encryptPayload("abc", "def", new Uint8Array(1))).rejects.toThrow();
    });
});

/** Mottakersiden av RFC 8291, til verifisering. */
async function decrypt(body: Uint8Array, dev: Awaited<ReturnType<typeof newDevice>>) {
    const salt = body.slice(0, 16);
    expect(new DataView(body.buffer, body.byteOffset).getUint32(16)).toBe(4096);
    const idlen = body[20];
    const asPub = body.slice(21, 21 + idlen);
    const cipher = body.slice(21 + idlen);
    const asKey = await webcrypto.subtle.importKey(
        "raw",
        asPub,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        [],
    );
    const ecdh = new Uint8Array(
        await webcrypto.subtle.deriveBits({ name: "ECDH", public: asKey }, dev.kp.privateKey, 256),
    );
    const te = new TextEncoder();
    const hkdf = async (s: Uint8Array, ikm: Uint8Array, info: Uint8Array, n: number) =>
        new Uint8Array(
            await webcrypto.subtle.deriveBits(
                { name: "HKDF", hash: "SHA-256", salt: s, info },
                await webcrypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]),
                n * 8,
            ),
        );
    const info = new Uint8Array([...te.encode("WebPush: info\0"), ...dev.pub, ...asPub]);
    const prk = await hkdf(dev.auth, ecdh, info, 32);
    const cek = await hkdf(salt, prk, te.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await hkdf(salt, prk, te.encode("Content-Encoding: nonce\0"), 12);
    const plain = new Uint8Array(
        await webcrypto.subtle.decrypt(
            { name: "AES-GCM", iv: nonce },
            await webcrypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]),
            cipher,
        ),
    );
    expect(plain[plain.length - 1]).toBe(2);
    return new TextDecoder().decode(plain.slice(0, -1));
}
