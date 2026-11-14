# AGENTS.md

Instruksjoner for KI-agenter og andre som jobber i repoet. Mer detaljer: [CONTRIBUTING.md](CONTRIBUTING.md) og [docs/](docs/).

## Hva er dette

fremtind.games: en statisk quiz (Next.js 15, `output: "export"`, React 19, Jøkul, SCSS) om Norge og Sveriges popkultur og historie. Ett spørsmål per side, svar lagres i nettleseren, quizen kan bare tas én gang per nettleser. Språk i UI og kode-kommentarer er norsk. Pakkebehandler: pnpm, Node 22.

## Kommandoer

| Kommando                          | Bruk                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| `corepack enable && pnpm install` | Installer                                                      |
| `pnpm dev`                        | Utviklingsserver (localhost:3000)                              |
| `pnpm verify`                     | Typesjekk + `format:check` + `check`. **Kjør før hver commit** |
| `pnpm format`                     | Formater med Prettier                                          |
| `pnpm check`                      | Valider spørsmålene i `src/quiz/questions.ts`                  |
| `pnpm build`                      | Statisk eksport til `out/` (CI kjører også denne)              |

## Filkart

| Sti                          | Innhold                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `src/quiz/questions.ts`      | `sections`, `allQuestions`, `questions`, `isCorrect`. Alt innhold bor her |
| `src/quiz/QuestionPage.tsx`  | UI for ett spørsmål (klientkomponent)                                     |
| `src/quiz/storage.ts`        | Lesing/skriving av `sessionStorage` (svar, lagnavn, medlemmer)            |
| `src/analytics/`             | Valgfri statistikk: `sendAnswer`, `fetchStats`, `QuestionStats`           |
| `src/pwa/`                   | Service worker-registrering, oppdateringsmelding, installasjonsknapp      |
| `scripts/build-sw.mjs`       | Genererer `out/sw.js` fra `sw.template.js` etter bygg (`postbuild`)       |
| `src/brand.ts`               | Temavalg i `localStorage`                                                 |
| `app/page.tsx`               | Forside                                                                   |
| `app/quiz/lag`, `medlemmer`  | Lagnavn og medlemmer                                                      |
| `app/quiz/[step]/page.tsx`   | Server Component, `generateStaticParams`, videresender til `QuestionPage` |
| `app/quiz/resultat/page.tsx` | Poeng, fasit og statistikk. Låser quizen når alt er besvart               |
| `app/globals.scss`           | Globale stiler og overstyringer av Jøkul                                  |
| `scripts/check-questions.ts` | Validering bak `pnpm check`                                               |
| `scripts/copy-fonts.mjs`     | Kopierer Jøkul-fonter til `public/fonts` (kjøres av `predev`/`prebuild`)  |
| `.github/workflows/`         | `ci.yml` (verify + build) og `deploy.yml` (GitHub Pages fra `main`)       |
| `docs/`                      | Arkitektur, Jøkul-fallgruver, deploy                                      |

Import-alias: `@/*` peker til `src/*`.

## Konvensjoner

- Norsk (bokmål) i UI-tekster, kommentarer, dokumentasjon og commit-meldinger.
- 4 mellomrom, Prettier (`.prettierrc`, `.editorconfig`). Kjør `pnpm format`.
- Kommentarer forklarer hvorfor, ikke hva.
- Nye spørsmål og seksjoner: følg [CONTRIBUTING.md](CONTRIBUTING.md#legge-til-et-spørsmål).

## Gotchas

Detaljer og begrunnelser: [docs/jokul.md](docs/jokul.md) og [docs/arkitektur.md](docs/arkitektur.md).

- Jøkul `6.1.0-next.7` har ingen `"use client"`. Sider som bruker Jøkul-komponenter må selv ha `"use client"`, ellers feiler bygget med `useRef is not a function`. Unntak: `app/quiz/[step]/page.tsx` og `app/quiz/layout.tsx`.
- `Flex asChild` virker ikke i Server Components. Bruk `as="hgroup"` o.l.
- `<body className="jkl">` i `app/layout.tsx` er påkrevd for font og farger. Ikke fjern.
- `Flex` mangler `layout`, `center`, `fill` og responsive gaps, og det finnes ingen `Grid`-komponent. Storybook-maler kan ikke kopieres rett. Bruk `display: grid` eller media queries.
- Rare byggefeil (`Invariant: no direct app page entry found`, manglende `.nft.json`, stilendring som ikke slår inn): `rm -rf .next out`, bygg på nytt.
- Ingen `basePath`. Nettstedet ligger på rota av `fremtind.games` (`public/CNAME`). Se [docs/deploy.md](docs/deploy.md) før du endrer det.
- `public/fonts/` er gitignorert og genereres av `prebuild`. Ikke commit den, og ikke fjern hooken.
- Svar lagres som `string[]` i `sessionStorage`, også for `choice`, `text` og `number`. `number`-svar sammenlignes numerisk i `isCorrect`.
- Statistikk styres av `NEXT_PUBLIC_API_URL` ved bygg. Uten den skal alt i `src/analytics/` være no-op. Send aldri lagnavn, medlemmer eller fritekst-label.
- Jøkul er låst til dist-tag `next`. Ikke bump den ved vanlige oppdateringer.

- PostHog: bare eksplisitte hendelser via `track()` i `src/analytics`. Aldri send lagnavn, medlemsnavn eller fritekst, og aldri lagre noe i cookie/`sessionStorage`/`localStorage` til analyse (ingen samtykkebanner, se docs). Se [docs/arkitektur.md](docs/arkitektur.md#posthog-atferdsanalyse-og-ab-testing).

## Regler

- Jobb mot `dev`, ikke `main`. `main` er produksjon (deployes til GitHub Pages) og oppdateres bare ved at `dev` slås sammen i den. Push til `dev` gir forhåndsvisning på Cloudflare Pages, se [docs/deploy.md](docs/deploy.md#forhåndsvisning-dev).
- Ikke lag pull request uten at brukeren ber om det.
- Små, logiske commits, én endring per commit.
- Endres oppførsel, ruter eller kommandoer: oppdater [README.md](README.md) (og relevant fil i `docs/`) i samme commit.
- Kjør `pnpm verify` før commit, og `pnpm build` ved endringer i `app/`, `src/` eller konfigurasjon.
