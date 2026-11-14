# Worker: anonym svarstatistikk og Web Push

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

## Web Push

Valgfri push-backend uten tredjepartsavhengigheter (WebCrypto): VAPID (RFC 8292) og aes128gcm (RFC 8291). Abonnementet er en enhets-id, ikke koblet til lagnavn, medlemmer, svar eller IP (tabell `push_subscriptions`, migrasjon `0002_push.sql`).

| Metode | Rute                | Beskrivelse                                                                                 |
| ------ | ------------------- | ------------------------------------------------------------------------------------------- |
| POST   | `/push/subscribe`   | `{ endpoint, keys: { p256dh, auth } }`. Idempotent upsert. Svarer 204.                      |
| POST   | `/push/unsubscribe` | `{ endpoint }`. Sletter. Svarer 204 (også om det ikke fantes).                              |
| POST   | `/push/send`        | `Authorization: Bearer <PUSH_ADMIN_TOKEN>`, `{ title, body?, url?, after? }`. Svarer under. |

- Validering gir 400: `endpoint` må være `https` (maks 2048 tegn, uten brukernavn/passord), `p256dh` base64url av 65 byte (ukomprimert P-256), `auth` base64url av 16 byte, body maks 4 KB. `title` 1-100 tegn, `body` maks 500, `url` må være en relativ sti (`/...`, ikke `//` eller `\`).
- `/push/send` gir 401 uten riktig token. Payload til service worker er JSON `{ title, body, url }` (`body` er `""` og `url` er `/` om utelatt).
- Svar fra `/push/send`: `{ sent, removed, failed, next }`. Abonnement som svarer 404/410 slettes (`removed`); andre feil telles i `failed`. For å holde seg under grensen for subrequests sendes det til maks `PUSH_BATCH_LIMIT` abonnement per kall (standard 40, maks 900, parallelt 10 om gangen). Er `next` ikke `null`, kall igjen med `{ ..., "after": <next> }` til den er `null`.
- Uten `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` og `PUSH_ADMIN_TOKEN` svarer alle `/push/*` med 503. Resten av Workeren påvirkes ikke.
- CORS som ellers. Ingen rate limiting (det finnes ikke ellers i Workeren); bruk Cloudflare WAF/rate limiting-regler på `/push/subscribe` om det trengs.

### Nøkler og secrets

```sh
node scripts/generate-vapid-keys.mjs      # skriver VAPID_PUBLIC_KEY og VAPID_PRIVATE_KEY (base64url)
pnpm wrangler secret put VAPID_PUBLIC_KEY
pnpm wrangler secret put VAPID_PRIVATE_KEY
pnpm wrangler secret put VAPID_SUBJECT    # mailto:... eller https://...
pnpm wrangler secret put PUSH_ADMIN_TOKEN # langt tilfeldig token, f.eks. openssl rand -base64url 32
```

Den offentlige nøkkelen (`VAPID_PUBLIC_KEY`) er den klienten trenger som `applicationServerKey`. For lokal kjøring legges verdiene i `worker/.dev.vars` (gitignorert). Ikke commit nøkler, og bytt ikke VAPID-nøkkelpar etter at folk har abonnert (eksisterende abonnement slutter å virke).

```sh
curl -X POST localhost:8787/push/send -H "Authorization: Bearer $PUSH_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"title":"Ny quiz","body":"Spill nå","url":"/"}'
```

## Skjema

Se `migrations/0001_init.sql` (svar) og `0002_push.sql` (push-abonnement): `answers` (ett svar per økt og spørsmål, med `variant` og `answer_keys` som JSON), forhåndsaggregerte `counts` og `totals`. Innsetting og tellerøkning skjer i én D1 `batch`, og tellerne økes bare når svarraden faktisk ble satt inn.

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
3. `pnpm migrate:remote` (kjør også etter nye migrasjoner)
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
