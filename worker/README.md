# Worker: anonym svarstatistikk

Cloudflare Worker + D1 som samler anonyme quizsvar og leverer aggregert statistikk til klienten. Det lagres ingen persondata: ingen IP, ingen User-Agent. `sessionId` er en tilfeldig uuid som klienten lager selv.

## Endepunkter

| Metode  | Rute                      | Beskrivelse                                                               |
| ------- | ------------------------- | ------------------------------------------------------------------------- |
| POST    | `/svar`                   | `{ sessionId, questionId, keys: string[], variant? }`. Svarer 204.        |
| GET     | `/statistikk`             | `{ questions: { [id]: { total, counts: { [key]: antall } } } }`           |
| GET     | `/statistikk/:questionId` | `{ total, counts }`. Tomt `{ total: 0, counts: {} }` for ukjent spørsmål. |
| OPTIONS | alle                      | CORS preflight                                                            |

- Første svar per (`sessionId`, `questionId`) vinner. Gjentatte kall er idempotente (204) og endrer ingenting.
- `total` er antall respondenter, ikke sum av `counts` (ved multi velger én respondent flere nøkler). Prosent = `counts[key] / total`.
- Validering gir 400 (også body over 2 KB): ugyldig uuid, `questionId` utenfor `[a-z0-9_-]{1,64}`, `keys` tom eller over 10, nøkkel over 100 tegn, `variant` over 32 tegn. Ukjent rute gir 404, feil metode 405.
- GET-svar har `Cache-Control: public, max-age=60` og caches i Workerens Cache API, så D1 leses sjelden.
- CORS: `https://fremtind.games`, `https://www.fremtind.games` og `http://localhost:3000`. Svarene har `Vary: Origin`.

## Skjema

Se `migrations/0001_init.sql`: `answers` (ett svar per økt og spørsmål, med `variant` og `answer_keys` som JSON), forhåndsaggregerte `counts` og `totals`. Innsetting og tellerøkning skjer i én D1 `batch`, og tellerne økes bare når svarraden faktisk ble satt inn.

## Lokal kjøring

```sh
pnpm install                          # fra repo-roten
cd worker
pnpm migrate:local                    # lager lokal D1 og kjører migrasjoner
pnpm dev                              # wrangler dev, http://localhost:8787
```

```sh
curl -i -X POST localhost:8787/svar -H 'Content-Type: application/json' \
  -d '{"sessionId":"11111111-1111-4111-8111-111111111111","questionId":"take-on-me","keys":["a-ha"]}'
curl localhost:8787/statistikk
```

Tester og typesjekk (kjøres også av `pnpm verify` i roten): `pnpm --filter fremtind-games-worker test`. Testene bruker en fake D1 oppå `node:sqlite` (Node 22.5+) med den ekte migrasjonen.

## Deploy

1. `cd worker && pnpm wrangler d1 create fremtind-games`
2. Lim `database_id` fra utdataen inn i `wrangler.jsonc` (erstatter placeholderen).
3. `pnpm migrate:remote`
4. `pnpm deploy`
5. Domene: `routes` i `wrangler.jsonc` kobler Workeren til `api.fremtind.games` (custom domain). Sonen `fremtind.games` må ligge i samme Cloudflare-konto; DNS-posten opprettes av deploy.

## Eksempel-SQL

Kjør med `pnpm wrangler d1 execute DB --remote --command "<sql>"`.

Svarfordeling per variant for ett spørsmål (enkeltvalg):

```sql
SELECT variant, json_extract(answer_keys, '$[0]') AS svar, COUNT(*) AS antall
FROM answers
WHERE question_id = 'take-on-me'
GROUP BY variant, svar
ORDER BY variant, antall DESC;
```

Samme for multi, én rad per valgt nøkkel:

```sql
SELECT a.variant, k.value AS svar, COUNT(*) AS antall
FROM answers a, json_each(a.answer_keys) k
WHERE a.question_id = 'svenske-band'
GROUP BY a.variant, k.value
ORDER BY a.variant, antall DESC;
```
