# AGENTS.md

Instruksjoner for KI-agenter og andre som jobber i repoet. Mer detaljer: [CONTRIBUTING.md](CONTRIBUTING.md) og [docs/](docs/).

## Hva er dette

fremtind.games: statiske quizer (Next.js 15, `output: "export"`, React 19, Jøkul, SCSS) om Norge og Sveriges popkultur og historie. Hver quiz har egne URL-er under `/quizer/<slug>/`, med ett spørsmål per side. Svar lagres i nettleseren, og hver quiz kan bare tas én gang per nettleser. En quiz kan ha en åpningstid. Språk i UI og kode-kommentarer er norsk. Pakkebehandler: pnpm, Node 22.

## Kommandoer

| Kommando                          | Bruk                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| `corepack enable && pnpm install` | Installer                                                      |
| `pnpm dev`                        | Utviklingsserver (localhost:3000)                              |
| `pnpm verify`                     | Typesjekk + `format:check` + `check`. **Kjør før hver commit** |
| `pnpm format`                     | Formater med Prettier                                          |
| `pnpm check`                      | Valider alle quizer i `src/quizzes/`                           |
| `pnpm test`                       | Test `quizStatus` (åpningstid). Inngår i `pnpm verify`         |
| `pnpm build`                      | Statisk eksport til `out/` (CI kjører også denne)              |

## Filkart

| Sti                                | Innhold                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `src/quizzes/<slug>.ts`            | Én quiz: metadata, seksjoner, spørsmål, valgfri `opens`/`closes`                   |
| `src/quizzes/index.ts`             | `quizzes` (rekkefølgen på forsiden) og `getQuiz(slug)`. Registrer her              |
| `src/quiz/types.ts`                | `Quiz`, `Question`-typene og `defineQuiz`                                          |
| `src/quiz/answers.ts`              | `isCorrect`, `isAnswered`, `answerKeys`, `sectionOf`                               |
| `src/quiz/status.ts`               | `quizStatus` (åpningstid) og datoformatering                                       |
| `src/quiz/QuizGate.tsx`            | Sperrer lag, medlemmer og spørsmål utenfor åpningstiden                            |
| `src/quiz/QuestionPage.tsx`        | UI for ett spørsmål (klientkomponent)                                              |
| `src/quiz/storage.ts`              | Lagring per quiz-slug (svar, lagnavn, medlemmer, fullført)                         |
| `src/quiz/score.ts`                | `readScore`: poeng for en fullført quiz, brukt av forsiden                         |
| `src/analytics/`                   | Valgfri statistikk: `sendAnswer`, `fetchStats`, `QuestionStats`                    |
| `src/pwa/`                         | Service worker-registrering, oppdateringsmelding, installasjon og push-opt-in      |
| `scripts/build-sw.mjs`             | Genererer `out/sw.js` fra `sw.template.js` etter bygg (`postbuild`)                |
| `src/brand.ts`                     | Temavalg i `localStorage`                                                          |
| `app/page.tsx`                     | Forside: liste over quizer som `Card`, med heldekkende bakgrunn                    |
| `app/quizer/[slug]/`               | Layout med `generateStaticParams`, quizens forside, `lag`, `medlemmer`, `resultat` |
| `app/quizer/[slug]/(steg)/[step]/` | Server Component, genererer (slug, steg), videresender til `QuestionPage`          |
| `app/quiz/…`                       | Gamle URL-er: tynne sider som omdirigerer til `/quizer/norge-sverige-1/…`          |
| `app/globals.scss`                 | Globale stiler og overstyringer av Jøkul                                           |
| `scripts/check-questions.ts`       | Validering bak `pnpm check`                                                        |
| `scripts/copy-fonts.mjs`           | Kopierer Jøkul-fonter til `public/fonts` (kjøres av `predev`/`prebuild`)           |
| `.github/workflows/`               | `ci.yml` (verify + build) og `deploy.yml` (GitHub Pages fra `main`)                |
| `docs/`                            | Arkitektur, Jøkul-fallgruver, deploy                                               |

Import-alias: `@/*` peker til `src/*`.

## Konvensjoner

- Norsk (bokmål) i UI-tekster, kommentarer, dokumentasjon og commit-meldinger.
- 4 mellomrom, Prettier (`.prettierrc`, `.editorconfig`). Kjør `pnpm format`.
- Kommentarer forklarer hvorfor, ikke hva.
- Nye spørsmål og seksjoner: følg [CONTRIBUTING.md](CONTRIBUTING.md#legge-til-et-spørsmål).

## Gotchas

Detaljer og begrunnelser: [docs/jokul.md](docs/jokul.md) og [docs/arkitektur.md](docs/arkitektur.md).

- Jøkul `6.1.0-next.7` har ingen `"use client"`. Sider som bruker Jøkul-komponenter må selv ha `"use client"`, ellers feiler bygget med `useRef is not a function`. Unntak: `app/quizer/[slug]/(steg)/[step]/page.tsx`, `app/quizer/[slug]/layout.tsx`, `app/quiz/layout.tsx` og `app/quiz/[step]/page.tsx`, som bare bruker egne klientkomponenter.
- `Flex asChild` virker ikke i Server Components. Bruk `as="hgroup"` o.l.
- `<body className="jkl">` i `app/layout.tsx` er påkrevd for font og farger. Ikke fjern.
- `Flex` mangler `layout`, `center`, `fill` og responsive gaps, og det finnes ingen `Grid`-komponent. Storybook-maler kan ikke kopieres rett. Bruk `display: grid` eller media queries.
- Rare byggefeil (`Invariant: no direct app page entry found`, manglende `.nft.json`, stilendring som ikke slår inn): `rm -rf .next out`, bygg på nytt.
- Ingen `basePath`. Nettstedet ligger på rota av `fremtind.games` (`public/CNAME`). Se [docs/deploy.md](docs/deploy.md) før du endrer det.
- `public/fonts/` er gitignorert og genereres av `prebuild`. Ikke commit den, og ikke fjern hooken.
- Spørsmåls-id-er må være globalt unike på tvers av quizer og må aldri endres: backend-statistikken bruker dem som nøkler. `pnpm check` håndhever det.
- `opens`/`closes` håndheves bare i nettleseren (`QuizGate`, forsiden) og kan omgås med enhetens klokke. Datoene må ha tidssone-offset.
- `/quiz/…` er gamle URL-er som må fortsette å omdirigere. `app/quiz/[step]` og `app/quizer/[slug]/(steg)/[step]` har hvert sitt segmentnavn på sitt nivå; ikke innfør et annet dynamisk segmentnavn på samme nivå.
- Svar lagres som `string[]` i `sessionStorage`, også for `choice`, `text` og `number`. `number`-svar sammenlignes numerisk i `isCorrect`.
- Statistikk styres av `NEXT_PUBLIC_API_URL` ved bygg. Uten den skal alt i `src/analytics/` være no-op. Send aldri lagnavn, medlemmer eller fritekst-label.
- Jøkul er låst til dist-tag `next`. Ikke bump den ved vanlige oppdateringer.

- PostHog: bare eksplisitte hendelser via `track()` i `src/analytics`. Aldri send lagnavn, medlemsnavn eller fritekst, og aldri lagre noe i cookie/`sessionStorage`/`localStorage` til analyse (ingen samtykkebanner, se docs). Se [docs/arkitektur.md](docs/arkitektur.md#posthog-atferdsanalyse-og-ab-testing).

## Regler

- Jobb mot `dev`, ikke `main`. `main` er produksjon (deployes til GitHub Pages) og oppdateres bare ved at `dev` slås sammen i den. Push til `dev` gir forhåndsvisning på Cloudflare Pages, se [docs/deploy.md](docs/deploy.md#forhåndsvisning-dev).
- Ikke lag pull request uten at brukeren ber om det. Når du lager en, skal den **alltid** ha `dev` som base, aldri `main`. Unntaket er utrulling til produksjon: `dev` → `main`, og bare når brukeren ber om det. Hver PR mot `dev` får egen forhåndsvisning (`https://<gren>.fremtind-games-preview.pages.dev`, lenken legges som kommentar i PR-en). Ikke push direkte til `main`. `guard.yml` feiler PR-er mot `main` som ikke kommer fra `dev`.
- Små, logiske commits, én endring per commit.
- Endres oppførsel, ruter eller kommandoer: oppdater [README.md](README.md) (og relevant fil i `docs/`) i samme commit.
- Kjør `pnpm verify` før commit, og `pnpm build` ved endringer i `app/`, `src/` eller konfigurasjon.
