import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";

/**
 * Minimal D1-fake oppå node:sqlite, nok til det Workeren bruker (prepare/bind/batch).
 * Bruker de ekte migrasjonene, så skjema og SQL (changes(), json_each, upsert) testes mot SQLite.
 */
export function createFakeD1() {
    const sqlite = new DatabaseSync(":memory:");
    const dir = new URL("../migrations/", import.meta.url);
    for (const f of readdirSync(dir).sort()) {
        sqlite.exec(readFileSync(new URL(f, dir), "utf8"));
    }

    function statement(sql: string, params: unknown[] = []) {
        const run = () => {
            const s = sqlite.prepare(sql);
            if (/^\s*select/i.test(sql)) {
                return { results: s.all(...(params as never[])) as Record<string, unknown>[] };
            }
            s.run(...(params as never[]));
            return { results: [] as Record<string, unknown>[] };
        };
        return {
            bind: (...p: unknown[]) => statement(sql, p),
            run,
            all: async () => run(),
            _run: run,
        };
    }

    const db = {
        prepare: (sql: string) => statement(sql),
        async batch(stmts: { _run: () => { results: unknown[] } }[]) {
            sqlite.exec("BEGIN");
            try {
                const out = stmts.map((s) => s._run());
                sqlite.exec("COMMIT");
                return out;
            } catch (e) {
                sqlite.exec("ROLLBACK");
                throw e;
            }
        },
    };
    return { db: db as unknown as D1Database, sqlite };
}

export function createFakeCache() {
    const store = new Map<string, string>();
    return {
        store,
        async match(req: Request) {
            const v = store.get(req.url);
            return v === undefined ? undefined : new Response(v);
        },
        async put(req: Request, res: Response) {
            store.set(req.url, await res.text());
        },
    };
}
