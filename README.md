# fremtind.games

En quiz om Norge og Sveriges popkultur og historie, som stiller ett spørsmål om gangen. Bygget med [Jøkul](https://jokul.fremtind.no) og Next.js, og publisert som statiske filer til GitHub Pages på [fremtind.games](https://fremtind.games).

| Rute              | Innhold                                                   |
| ----------------- | --------------------------------------------------------- |
| `/`               | Forside med heldekkende bakgrunnsbilde fra Göteborg       |
| `/quiz`           | Omdirigerer til `/quiz/1`                                 |
| `/quiz/1` … `/8`  | Ett spørsmål per side, én side per spørsmål               |
| `/quiz/resultat`  | Oppsummering, regnet ut fra de lagrede svarene            |

## Kom i gang

```sh
pnpm install
pnpm dev
```

## Kommandoer

| Kommando         | Beskrivelse                                  |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Utviklingsserver på http://localhost:3000    |
| `pnpm build`     | Statisk eksport til `out/`                   |
| `pnpm typecheck` | Typesjekk uten å bygge                       |

## Oppsett

- **Jøkul** er låst til dist-tag `next` (`@fremtind/jokul@next`). Komponenter importeres per mappe, f.eks. `@fremtind/jokul/button` — det finnes ingen rot-index.
- **Fonter** kopieres fra pakken til `public/fonts` av `scripts/copy-fonts.mjs`, som kjører automatisk før `dev` og `build`. Jøkul forventer dem på `/fonts`.
- **Spørsmål** ligger i `src/quiz/questions.ts`, og finnes i to varianter:
    - `type: "choice"` — faste alternativer, ett `RadioPanel` per alternativ.
    - `type: "text"` — fritekstsvar i et `TextInput`. Trenger en `label` i tillegg til spørsmålet, siden spørsmålet er sidens overskrift og feltet sin egen korte benevnelse.
  Fritekstsvar sammenlignes normalisert (trimmet, uten forskjell på store/små bokstaver, med sammenslått mellomrom), så det finnes foreløpig bare én godkjent skrivemåte per spørsmål.

- **Bredde på inputfelt.** Jøkul lar inputfelt krympe til innholdet sitt. Her skal de alltid fylle bredden, så `app/globals.scss` setter `width: 100%` på `.jkl-text-input-wrapper` og `.jkl-text-area-wrapper`. Regelen ligger utenfor Jøkuls cascade layers og vinner derfor uavhengig av spesifisitet. Selve bredden styres av `.form` i `src/quiz/QuestionPage.module.scss`.

- **Én side per spørsmål.** Hvert spørsmål har sin egen URL, slik at en refresh ikke starter quizen på nytt. `app/quiz/[step]/page.tsx` genererer én statisk side per spørsmål med `generateStaticParams`, og svarene lagres underveis i `sessionStorage` (`src/quiz/storage.ts`). Resultatsiden regner ut poengsummen fra de lagrede svarene i stedet for å holde den i minnet.
    - `generateStaticParams` kan ikke eksporteres fra en `"use client"`-fil, så rutefilen er en Server Component som bare videresender `step` til klientkomponenten `src/quiz/QuestionPage.tsx`. Det er derfor UI-et ligger i `src/` og ikke i rutefilen.
    - Lagrede svar finnes bare i nettleseren. Feltet fylles derfor i en `useEffect` etter hydrering — den statiske HTML-en har alltid tomt felt, slik at server- og klientmarkup er like.

- **`"use client"` på sidene.** Jøkul 6.1.0-next.7 har ingen `"use client"`-direktiver, så komponentene kan ikke rendres i en Server Component — byggesteget feiler med `useRef is not a function`. Derfor er sidene klientkomponenter, med unntak av `app/quiz/[step]/page.tsx` og `app/quiz/layout.tsx`, som ikke bruker Jøkul-komponenter selv. Av samme grunn virker ikke `Flex asChild` i en Server Component (Slot kloner barnet med en `ref`); bruk `as="hgroup"` o.l. i stedet.
- **Forsiden** er satt sammen for hånd. Jøkul har ingen forside-, hero- eller bannermal i storybooken, så `/` låner mekanismer fra `Skjermbilder`-malene: `data-theme="dark"` på seksjonen (som i footeren i `Bedriftsmarked`) slik at alle `--jkl-color-*` løses til mørke verdier via `light-dark()`, et sentrert `Card` med innholdet, og `Title as="h1" size="xl"` for overskriften. Seksjonen er `100svh`. Selve bakgrunnsbildet er vanlig CSS `background-image` med en lett skrim som demper det lyse himmelpartiet — Jøkuls `Image`-komponent tar bare `src`/`srcSet`/`placeholder`/`alt`/`className` og kan ikke dekke hele viewporten.
- **Mangler i `6.1.0-next.7`:** `Flex` har ikke `layout`, `center`, `fill` eller responsive gaps, og det finnes ingen `Grid`-komponent. Malene i storybooken (som bygges mot monorepoet) bruker disse, så de kan ikke kopieres rett over. Bruk `display: grid` eller media queries.
- **Bygg:** `next build` tåler ikke et skittent `.next`. Får du `Invariant: no direct app page entry found`, `Cannot find module for page: /_document` eller manglende `.nft.json`, kjør `rm -rf .next out` og bygg på nytt. Samme gjelder hvis en global stilendring ikke slår inn.

## Bilder

`public/goteborg.jpg` er Gothia Towers i Göteborg, hentet fra [Unsplash](https://unsplash.com/photos/1614331358979-b83b729df836) og komprimert ned til 1500×2000.

## Deploy

`.github/workflows/deploy.yml` bygger og publiserer `out/` til GitHub Pages ved push til `main`.

Engangsoppsett i repoet:

1. Settings → Pages → Source: **GitHub Actions**
2. Settings → Pages → Custom domain: `fremtind.games`
3. Hos domeneleverandøren: `ALIAS`/`A`-peker for apex til GitHub Pages, og `CNAME` for `www` til `<bruker>.github.io`
