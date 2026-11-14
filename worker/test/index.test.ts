import { beforeEach, describe, expect, it } from "vitest";
import { handle, type Env } from "../src/index.ts";
import { createFakeCache, createFakeD1 } from "./fake-d1.ts";

const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const ORIGIN = "https://fremtind.games";

let env: Env;
let sqlite: ReturnType<typeof createFakeD1>["sqlite"];
let cache: ReturnType<typeof createFakeCache>;

beforeEach(() => {
    const d = createFakeD1();
    env = { DB: d.db };
    sqlite = d.sqlite;
    cache = createFakeCache();
});

const call = (req: Request) => handle(req, env, cache);
const post = (body: unknown, headers: Record<string, string> = {}) =>
    call(
        new Request("https://api.test/svar", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: typeof body === "string" ? body : JSON.stringify(body),
        }),
    );
const get = (path: string, headers: Record<string, string> = {}) =>
    call(new Request("https://api.test" + path, { headers }));

describe("POST /svar", () => {
    it("lagrer svar og teller (204)", async () => {
        const res = await post({ sessionId: S1, questionId: "q1", keys: ["a-ha"], variant: "v1" });
        expect(res.status).toBe(204);
        const stats = await (await get("/statistikk/q1")).json();
        expect(stats).toEqual({ total: 1, counts: { "a-ha": 1 } });
    });

    it("er idempotent: første svar vinner og teller økes ikke", async () => {
        await post({ sessionId: S1, questionId: "q1", keys: ["a"] });
        const again = await post({ sessionId: S1, questionId: "q1", keys: ["b"] });
        expect(again.status).toBe(204);
        cache.store.clear();
        expect(await (await get("/statistikk/q1")).json()).toEqual({ total: 1, counts: { a: 1 } });
        const rows = sqlite.prepare("SELECT answer_keys FROM answers").all();
        expect(rows).toEqual([{ answer_keys: '["a"]' }]);
    });

    it("multi: total er respondenter, ikke sum av counts", async () => {
        await post({ sessionId: S1, questionId: "m", keys: ["x", "y", "z"] });
        await post({ sessionId: S2, questionId: "m", keys: ["x", "x", "y"] });
        const s = await (await get("/statistikk/m")).json();
        expect(s).toEqual({ total: 2, counts: { x: 2, y: 2, z: 1 } });
    });

    it("lagrer variant og keys slik at de kan krysses i SQL", async () => {
        await post({ sessionId: S1, questionId: "q", keys: ["a"], variant: "A" });
        await post({ sessionId: S2, questionId: "q", keys: ["a"] });
        const rows = sqlite.prepare("SELECT variant FROM answers ORDER BY session_id").all();
        expect(rows).toEqual([{ variant: "A" }, { variant: null }]);
    });

    const valid = { sessionId: S1, questionId: "q1", keys: ["a"] };
    const invalid: [string, unknown][] = [
        ["ugyldig uuid", { ...valid, sessionId: "abc" }],
        ["questionId for lang", { ...valid, questionId: "a".repeat(65) }],
        ["questionId med store bokstaver", { ...valid, questionId: "Q1" }],
        ["tom keys", { ...valid, keys: [] }],
        ["for mange keys", { ...valid, keys: Array.from({ length: 11 }, (_, i) => `k${i}`) }],
        ["for lang nøkkel", { ...valid, keys: ["x".repeat(101)] }],
        ["nøkkel som ikke er tekst", { ...valid, keys: [1] }],
        ["for lang variant", { ...valid, variant: "v".repeat(33) }],
        ["ikke JSON", "{ikke json"],
        ["array som body", []],
    ];
    it.each(invalid)("avviser %s med 400", async (_navn, body) => {
        expect((await post(body)).status).toBe(400);
        expect(sqlite.prepare("SELECT COUNT(*) AS n FROM answers").get()).toEqual({ n: 0 });
    });

    it("avviser for stor body", async () => {
        const res = await post({ ...valid, keys: ["a"], pad: "x".repeat(3000) });
        expect(res.status).toBe(400);
    });
});

describe("GET /statistikk", () => {
    it("samler alle spørsmål", async () => {
        await post({ sessionId: S1, questionId: "a", keys: ["x"] });
        await post({ sessionId: S1, questionId: "b", keys: ["y"] });
        const res = await get("/statistikk");
        expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
        expect(await res.json()).toEqual({
            questions: {
                a: { total: 1, counts: { x: 1 } },
                b: { total: 1, counts: { y: 1 } },
            },
        });
    });

    it("gir tomt svar for ukjent spørsmål", async () => {
        const res = await get("/statistikk/finnes-ikke");
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ total: 0, counts: {} });
    });

    it("serverer fra cache og slipper D1 på andre kall", async () => {
        await post({ sessionId: S1, questionId: "q", keys: ["a"] });
        await get("/statistikk/q");
        await post({ sessionId: S2, questionId: "q", keys: ["a"] });
        expect(await (await get("/statistikk/q")).json()).toEqual({ total: 1, counts: { a: 1 } });
    });
});

describe("CORS og ruting", () => {
    it("svarer på preflight for tillatt origin", async () => {
        const res = await call(
            new Request("https://api.test/svar", {
                method: "OPTIONS",
                headers: { Origin: ORIGIN },
            }),
        );
        expect(res.status).toBe(204);
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
        expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
        expect(res.headers.get("Vary")).toBe("Origin");
    });

    it("tillater localhost og www, men ikke andre origins", async () => {
        for (const o of ["http://localhost:3000", "https://www.fremtind.games"]) {
            const res = await get("/statistikk", { Origin: o });
            expect(res.headers.get("Access-Control-Allow-Origin")).toBe(o);
        }
        const res = await get("/statistikk", { Origin: "https://evil.example" });
        expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
        expect(res.headers.get("Vary")).toBe("Origin");
    });

    it("404 for ukjent rute og 405 for feil metode", async () => {
        expect((await get("/ukjent")).status).toBe(404);
        expect((await call(new Request("https://api.test/svar"))).status).toBe(405);
        const res = await call(new Request("https://api.test/statistikk", { method: "POST" }));
        expect(res.status).toBe(405);
    });
});
