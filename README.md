# fremtind.games

En quiz om Norge og Sveriges popkultur og historie, som stiller ett spørsmål om gangen. Bygget med [Jøkul](https://jokul.fremtind.no) og Next.js, og publisert som statiske filer til GitHub Pages på [fremtind.games](https://fremtind.games).

| Rute              | Innhold                                                   |
| ----------------- | --------------------------------------------------------- |
| `/`               | Forside med heldekkende bakgrunnsbilde fra Göteborg       |
| `/quiz`           | Omdirigerer til `/quiz/1`                                 |
| `/quiz/1` … `/13` | Ett spørsmål per side, én side per spørsmål               |
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
- **Fonter** kopieres fra pakken til `public/fonts` av `scripts/copy-fonts.mjs`, som kjører automatisk før `dev` og `build`. Jøkul forventer dem på `/fonts`. `public/fonts/` er gitignorert, så bygget i CI er avhengig av at `prebuild` kjører — fjernes den hooken, deployes nettstedet uten fonter og ikoner.
- **Spørsmål** ligger i `src/quiz/questions.ts`, og finnes i fire varianter:
    - `type: "choice"` — ett riktig svar blant faste alternativer, ett `RadioPanel` per alternativ.
    - `type: "multi"` — flere riktige svar, ett `CheckboxPanel` per alternativ. `answer` er en liste, og svaret må treffe akkurat de alternativene — verken flere eller færre.
    - `type: "text"` — fritekstsvar i et `TextInput`. Trenger en `label` i tillegg til spørsmålet, siden spørsmålet er sidens overskrift og feltet sin egen korte benevnelse.
    - `type: "number"` — tallsvar i et `NumberInput`, med valgfrie `min`/`max`. `answer` er et tall, og sammenlignes numerisk, ikke som tekst.

    Svaret lagres alltid som en `string[]`, også for typene som bare tar én verdi — da slipper lagring, validering og poengberegning å forholde seg til flere former. Tekstsvar sammenlignes normalisert (trimmet, uten forskjell på store/små bokstaver, med sammenslått mellomrom), så det finnes foreløpig bare én godkjent skrivemåte per spørsmål.

- **Seksjoner.** `sections` i `src/quiz/questions.ts` lister seksjonene (popkultur, historie, moderne teknologi), og hvert spørsmål har en `section`-id. Spørsmålene kan stå i vilkårlig rekkefølge i filen — `questions` sorteres seksjon for seksjon etter `sections`, og rutene `/quiz/N` følger den rekkefølgen. Hvert spørsmål kan hoppes over med «Hopp over» (`ButtonGroup`), som lagrer et tomt svar. Seksjonens navn vises over hvert spørsmål, og resultatsiden viser poeng per seksjon og grupperer fasiten etter seksjon. En ny seksjon er én linje i `sections` pluss spørsmålene.

- **Bredde på inputfelt.** Jøkul lar inputfelt krympe til innholdet sitt. Her skal de alltid fylle bredden, så `app/globals.scss` setter `width: 100%` på `.jkl-text-input-wrapper`, `.jkl-text-area-wrapper` og `.jkl-number-input__wrapper`. Regelen ligger utenfor Jøkuls cascade layers og vinner derfor uavhengig av spesifisitet. `NumberInput` trenger en egen selektor fordi `.jkl-number-input` setter `align-items: flex-start`, som ellers krymper feltet uansett bredde. Selve bredden styres av `.form` i `src/quiz/QuestionPage.module.scss`.

- **Én side per spørsmål.** Hvert spørsmål har sin egen URL, slik at en refresh ikke starter quizen på nytt. `app/quiz/[step]/page.tsx` genererer én statisk side per spørsmål med `generateStaticParams`, og svarene lagres underveis i `sessionStorage` (`src/quiz/storage.ts`). Resultatsiden regner ut poengsummen fra de lagrede svarene i stedet for å holde den i minnet.
    - `generateStaticParams` kan ikke eksporteres fra en `"use client"`-fil, så rutefilen er en Server Component som bare videresender `step` til klientkomponenten `src/quiz/QuestionPage.tsx`. Det er derfor UI-et ligger i `src/` og ikke i rutefilen.
    - Lagrede svar finnes bare i nettleseren. Feltet fylles derfor i en `useEffect` etter hydrering — den statiske HTML-en har alltid tomt felt, slik at server- og klientmarkup er like.

- **`"use client"` på sidene.** Jøkul 6.1.0-next.7 har ingen `"use client"`-direktiver, så komponentene kan ikke rendres i en Server Component — byggesteget feiler med `useRef is not a function`. Derfor er sidene klientkomponenter, med unntak av `app/quiz/[step]/page.tsx` og `app/quiz/layout.tsx`, som ikke bruker Jøkul-komponenter selv. Av samme grunn virker ikke `Flex asChild` i en Server Component (Slot kloner barnet med en `ref`); bruk `as="hgroup"` o.l. i stedet.
- **Forsiden** er satt sammen for hånd. Jøkul har ingen forside-, hero- eller bannermal i storybooken, så `/` låner mekanismer fra `Skjermbilder`-malene: `data-theme="dark"` på seksjonen (som i footeren i `Bedriftsmarked`) slik at alle `--jkl-color-*` løses til mørke verdier via `light-dark()`, et sentrert `Card` med innholdet, og `Title as="h1" size="xl"` for overskriften. Seksjonen er `100svh`. Selve bakgrunnsbildet er vanlig CSS `background-image` med en lett skrim som demper det lyse himmelpartiet — Jøkuls `Image`-komponent tar bare `src`/`srcSet`/`placeholder`/`alt`/`className` og kan ikke dekke hele viewporten.
- **`<body className="jkl">` er påkrevd.** Jøkul legger fontfamilie, sidefarge og tekstfarge på klassen `jkl`, ikke på `body` eller `:root`. Uten den arver de 16 komponentene som ikke setter egen `font-family` (`NavLink`, `Breadcrumb`, `Card`, `Expander`, `Help`, `Pagination`, `ProgressBar` …) nettleserfonten. `Title` og `Text` setter fonten selv via `text-style`-miksinen og ser derfor riktige ut uansett, noe som gjør feilen lett å overse.
- **Mangler i `6.1.0-next.7`:** `Flex` har ikke `layout`, `center`, `fill` eller responsive gaps, og det finnes ingen `Grid`-komponent. Malene i storybooken (som bygges mot monorepoet) bruker disse, så de kan ikke kopieres rett over. Bruk `display: grid` eller media queries.
- **Bygg:** `next build` tåler ikke et skittent `.next`. Får du `Invariant: no direct app page entry found`, `Cannot find module for page: /_document` eller manglende `.nft.json`, kjør `rm -rf .next out` og bygg på nytt. Samme gjelder hvis en global stilendring ikke slår inn.

## Bilder

`public/goteborg.jpg` er Gothia Towers i Göteborg, hentet fra [Unsplash](https://unsplash.com/photos/1614331358979-b83b729df836) og komprimert ned til 1500×2000.

## Deploy

`.github/workflows/deploy.yml` bygger og publiserer `out/` til GitHub Pages ved push til `main`.

Engangsoppsett i repoet:

1. Settings → Pages → Source: **GitHub Actions**
2. Settings → Pages → Custom domain: `fremtind.games`

DNS hos domeneleverandøren:

| Navn   | Type          | Verdi                                                                        |
| ------ | ------------- | ---------------------------------------------------------------------------- |
| `@`    | `A`           | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`   |
| `www`  | `CNAME`       | `lmfaole.github.io`                                                          |

- Apex (`@`) skal ha `A`-records, ikke `CNAME` — `CNAME` på sonerota er ikke gyldig per RFC 1034. Cloudflare flater likevel ut `CNAME` på rota automatisk og svarer med `A`-records, så `@ CNAME lmfaole.github.io` fungerer *der*. Andre leverandører trenger `A` (eller `ALIAS`/`ANAME` om de støtter det).
- Står det en proxy-bryter i DNS-panelet (Cloudflares oransje sky), skal den være **av** / «DNS only». GitHub må se forespørselen for å utstede og fornye Let's Encrypt-sertifikatet; proxying gir ellers redirect-loop eller «certificate not yet created».
- IP-ene over bør sjekkes mot [GitHubs dokumentasjon](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site) før bruk.

**Ingen `basePath`.** Med eget apex-domene ligger nettstedet på rota, så `next.config.ts` setter ikke `basePath`. Skal nettstedet i stedet serves på `lmfaole.github.io/<repo>/`, må `basePath` settes *og* `public/CNAME` slettes — de to utelukker hverandre, og med begge aktive blir hver URL `https://fremtind.games/<repo>/…` og gir 404 på sider, CSS, JS og bakgrunnsbildet.

`basePath` skriver dessuten **ikke** om `url()` inne i CSS. Jøkul hardkoder fontene absolutt (`url("/fonts/Jokul-Icons.woff2")`), så med `basePath` satt lastes siden og CSS-en riktig fra `/<repo>/…` mens fontene bes om fra vertsrota og gir 404 — tekst og ikoner faller tilbake til nettleserfonten. Trengs `basePath` likevel, må Jøkuls `$webfonts-dir` konfigureres til samme prefiks *før* `base.scss` lastes:

```scss
@use "@fremtind/jokul/styles/theme/fonts" with ($webfonts-dir: "/<repo>/fonts");
@use "@fremtind/jokul/styles/base.scss";
```

Merkevarefontene arver verdien. Sass leser ikke miljøvariabler, så prefikset må hardkodes begge steder.
