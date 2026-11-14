# fremtind.games

En quiz om Norge og Sveriges popkultur og historie, som stiller ett spørsmål om gangen. Bygget med [Jøkul](https://jokul.fremtind.no) og Next.js, og publisert som statiske filer til GitHub Pages på [fremtind.games](https://fremtind.games).

| Rute              | Innhold                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `/`               | Forside med heldekkende bakgrunnsbilde fra Göteborg                      |
| `/quiz`           | Omdirigerer til `/quiz/lag`                                              |
| `/quiz/lag`       | Lagnavn, før første spørsmål. Sendes med i SMS-en                        |
| `/quiz/medlemmer` | Opptil fire lagmedlemmer. Sendes med i SMS-en                            |
| `/quiz/1` … `/18` | Ett spørsmål per side, én side per spørsmål                              |
| `/quiz/resultat`  | Oppsummering, regnet ut fra de lagrede svarene. Viser valgfri statistikk |

## Kom i gang

Du trenger Node 22 og pnpm (`corepack enable` aktiverer riktig pnpm-versjon).

```sh
pnpm install
pnpm dev
```

## Statistikk (valgfritt)

Settes `NEXT_PUBLIC_API_URL` ved bygg (se `.env.example`), sendes anonyme svar til den adressen og resultatsiden viser hvor mange andre som svarte hva. Uten variabelen skjer ingen nettverkskall og ingenting vises. Se [docs/arkitektur.md](docs/arkitektur.md#statistikk).

## Kommandoer

| Kommando            | Beskrivelse                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm dev`          | Utviklingsserver på http://localhost:3000                          |
| `pnpm build`        | Statisk eksport til `out/`                                         |
| `pnpm start`        | Next.js sin produksjonsserver (`next start`)                       |
| `pnpm typecheck`    | Typesjekk uten å bygge                                             |
| `pnpm format`       | Formater alle filer med Prettier                                   |
| `pnpm format:check` | Sjekk formatering uten å endre filer                               |
| `pnpm check`        | Validerer spørsmålene i `src/quiz/questions.ts`                    |
| `pnpm verify`       | Typesjekk, formatsjekk og spørsmålssjekk. Kjør før du committer    |
| `pnpm copy-fonts`   | Kopierer Jøkul-fonter til `public/fonts` (kjøres av `dev`/`build`) |

## Dokumentasjon

- [CONTRIBUTING.md](CONTRIBUTING.md) — arbeidsflyt, hvordan du legger til spørsmål, og hva CI sjekker
- [AGENTS.md](AGENTS.md) — kortversjon for KI-agenter: kommandoer, filkart, konvensjoner og fallgruver
- [docs/arkitektur.md](docs/arkitektur.md) — ruter, spørsmålstyper, seksjoner, lagring og sider
- [docs/jokul.md](docs/jokul.md) — Jøkul-oppsett og fallgruver
- [docs/deploy.md](docs/deploy.md) — GitHub Pages, DNS og `basePath`
