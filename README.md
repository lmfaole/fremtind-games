# fremtind.games

En quiz om Norge og Sveriges popkultur og historie, som stiller ett spørsmål om gangen. Bygget med [Jøkul](https://jokul.fremtind.no) og Next.js, og publisert som statiske filer til GitHub Pages på [fremtind.games](https://fremtind.games).

| Rute                       | Innhold                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/`                        | Forside med liste over alle quizer (kort med bilde, tittel, antall spørsmål, og eventuelt poeng eller åpningstid) |
| `/quizer/<slug>`           | Quizens egen forside: beskrivelse, eget heldekkende bilde og start/resultat                                       |
| `/quizer/<slug>/lag`       | Lagnavn, før første spørsmål                                                                                      |
| `/quizer/<slug>/medlemmer` | Opptil fire lagmedlemmer                                                                                          |
| `/quizer/<slug>/1` … `/N`  | Ett spørsmål per side, én side per spørsmål                                                                       |
| `/quizer/<slug>/resultat`  | Oppsummering, regnet ut fra de lagrede svarene. Viser valgfri statistikk                                          |
| `/quiz/…`                  | Gamle URL-er. Omdirigerer til tilsvarende `/quizer/norge-sverige-1/…`                                             |
| `/personvern`              | Personvernerklæring (hva som samles inn)                                                                          |

## Kom i gang

Du trenger Node 22 og pnpm (`corepack enable` aktiverer riktig pnpm-versjon).

```sh
pnpm install
pnpm dev
```

## Flere quizer og åpningstid

Hver quiz er en fil i `src/quizzes/` og har egen URL under `/quizer/<slug>/`. En quiz kan ha `opens` og `closes`, og kan da bare startes i det tidsrommet. Dette håndheves i nettleseren og kan omgås ved å endre enhetens klokke. Se [CONTRIBUTING.md](CONTRIBUTING.md#legge-til-en-ny-quiz) og [docs/arkitektur.md](docs/arkitektur.md#åpningstid).

## Statistikk (valgfritt)

Settes `NEXT_PUBLIC_API_URL` ved bygg (se `.env.example`), sendes anonyme svar til den adressen og resultatsiden viser hvor mange andre som svarte hva. Uten variabelen skjer ingen nettverkskall og ingenting vises. Se [docs/arkitektur.md](docs/arkitektur.md#statistikk).

## Kommandoer

| Kommando            | Beskrivelse                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Utviklingsserver på http://localhost:3000                                                   |
| `pnpm build`        | Statisk eksport til `out/`                                                                  |
| `pnpm start`        | Next.js sin produksjonsserver (`next start`)                                                |
| `pnpm typecheck`    | Typesjekk uten å bygge                                                                      |
| `pnpm format`       | Formater alle filer med Prettier                                                            |
| `pnpm format:check` | Sjekk formatering uten å endre filer                                                        |
| `pnpm check`        | Validerer alle quizer i `src/quizzes/`                                                      |
| `pnpm test`         | Tester `quizStatus` (åpningstid) i `src/quiz/status.ts`                                     |
| `pnpm verify`       | Typesjekk, formatsjekk, spørsmålssjekk, `pnpm test` og Worker-tester. Kjør før du committer |
| `pnpm copy-fonts`   | Kopierer Jøkul-fonter til `public/fonts` (kjøres av `dev`/`build`)                          |

## Dokumentasjon

- [CONTRIBUTING.md](CONTRIBUTING.md) — arbeidsflyt, hvordan du legger til spørsmål, og hva CI sjekker
- [AGENTS.md](AGENTS.md) — kortversjon for KI-agenter: kommandoer, filkart, konvensjoner og fallgruver
- [docs/arkitektur.md](docs/arkitektur.md) — ruter, spørsmålstyper, seksjoner, lagring og sider
- [docs/jokul.md](docs/jokul.md) — Jøkul-oppsett og fallgruver
- [docs/deploy.md](docs/deploy.md) — GitHub Pages, DNS og `basePath`
- [worker/README.md](worker/README.md) — Cloudflare Worker + D1 for anonym svarstatistikk (`api.fremtind.games`)
