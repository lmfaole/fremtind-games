# fremtind.games

En quiz om Norge og Sveriges popkultur og historie, som stiller ett spørsmål om gangen. Bygget med [Jøkul](https://jokul.fremtind.no) og Next.js, og publisert som statiske filer til GitHub Pages på [fremtind.games](https://fremtind.games).

| Rute              | Innhold                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `/`               | Forside med heldekkende bakgrunnsbilde fra Göteborg                      |
| `/quiz`           | Omdirigerer til `/quiz/lag`                                              |
| `/quiz/lag`       | Lagnavn, før første spørsmål                                             |
| `/quiz/medlemmer` | Opptil fire lagmedlemmer                                                 |
| `/quiz/1` … `/18` | Ett spørsmål per side, én side per spørsmål                              |
| `/quiz/resultat`  | Oppsummering, regnet ut fra de lagrede svarene. Viser valgfri statistikk |
| `/personvern`     | Personvernerklæring (hva som samles inn)                                 |

## Kom i gang

Du trenger Node 22 og pnpm (`corepack enable` aktiverer riktig pnpm-versjon).

```sh
pnpm install
pnpm dev
```

## PWA og offline

Nettstedet kan installeres som app og fungerer uten nett (alle sider forhåndslastes). Service workeren `sw.js` genereres av `postbuild` (`scripts/build-sw.mjs`, fra `scripts/sw.template.js`) og registreres bare i produksjonsbygg. `pnpm dev` har ingen service worker. For å teste offline: `pnpm build`, server `out/` (f.eks. `npx serve out`) og slå av nettet i DevTools. Manifest: `app/manifest.ts`, ikoner: `public/icons` (generert med `scripts/generate-icons.py`). Varsler (Web Push) slås på med knappen på forsiden og krever `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ved bygg samt Workeren med VAPID-secrets (se [worker/README.md](worker/README.md)). Se [docs/arkitektur.md](docs/arkitektur.md#pwa-og-offline).

## Statistikk (valgfritt)

Settes `NEXT_PUBLIC_API_URL` ved bygg (se `.env.example`), sendes anonyme svar til den adressen og resultatsiden viser hvor mange andre som svarte hva. Uten variabelen skjer ingen nettverkskall og ingenting vises. Se [docs/arkitektur.md](docs/arkitektur.md#statistikk).

## Kommandoer

| Kommando            | Beskrivelse                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`          | Utviklingsserver på http://localhost:3000                                      |
| `pnpm build`        | Statisk eksport til `out/`                                                     |
| `pnpm start`        | Next.js sin produksjonsserver (`next start`)                                   |
| `pnpm typecheck`    | Typesjekk uten å bygge                                                         |
| `pnpm format`       | Formater alle filer med Prettier                                               |
| `pnpm format:check` | Sjekk formatering uten å endre filer                                           |
| `pnpm check`        | Validerer spørsmålene i `src/quiz/questions.ts`                                |
| `pnpm verify`       | Typesjekk, formatsjekk, spørsmålssjekk og Worker-tester. Kjør før du committer |
| `pnpm copy-fonts`   | Kopierer Jøkul-fonter til `public/fonts` (kjøres av `dev`/`build`)             |

## Dokumentasjon

- [CONTRIBUTING.md](CONTRIBUTING.md) — arbeidsflyt, hvordan du legger til spørsmål, og hva CI sjekker
- [AGENTS.md](AGENTS.md) — kortversjon for KI-agenter: kommandoer, filkart, konvensjoner og fallgruver
- [docs/arkitektur.md](docs/arkitektur.md) — ruter, spørsmålstyper, seksjoner, lagring og sider
- [docs/jokul.md](docs/jokul.md) — Jøkul-oppsett og fallgruver
- [docs/deploy.md](docs/deploy.md) — GitHub Pages, DNS og `basePath`
- [worker/README.md](worker/README.md) — Cloudflare Worker + D1 for anonym svarstatistikk (`api.fremtind.games`)
