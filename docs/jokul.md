# Jøkul

Oppsett og fallgruver med Jøkul `6.1.0-next.7`.

## Oppsett

- **Jøkul** er låst til dist-tag `next` (`@fremtind/jokul@next`). Komponenter importeres per mappe, f.eks. `@fremtind/jokul/button` — det finnes ingen rot-index. Dependabot er satt opp til å ikke oppdatere Jøkul (se `.github/dependabot.yml`).
- **Fonter** kopieres fra pakken til `public/fonts` av `scripts/copy-fonts.mjs`, som kjører automatisk før `dev` og `build`. Jøkul forventer dem på `/fonts`. `public/fonts/` er gitignorert, så bygget i CI er avhengig av at `prebuild` kjører — fjernes den hooken, deployes nettstedet uten fonter og ikoner.

## Fallgruver

- **`"use client"` på sidene.** Jøkul 6.1.0-next.7 har ingen `"use client"`-direktiver, så komponentene kan ikke rendres i en Server Component — byggesteget feiler med `useRef is not a function`. Derfor er sidene klientkomponenter, med unntak av `app/quiz/[step]/page.tsx` og `app/quiz/layout.tsx`, som ikke bruker Jøkul-komponenter selv. Av samme grunn virker ikke `Flex asChild` i en Server Component (Slot kloner barnet med en `ref`); bruk `as="hgroup"` o.l. i stedet.
- **`<body className="jkl">` er påkrevd.** Jøkul legger fontfamilie, sidefarge og tekstfarge på klassen `jkl`, ikke på `body` eller `:root`. Uten den arver de 16 komponentene som ikke setter egen `font-family` (`NavLink`, `Breadcrumb`, `Card`, `Expander`, `Help`, `Pagination`, `ProgressBar` …) nettleserfonten. `Title` og `Text` setter fonten selv via `text-style`-miksinen og ser derfor riktige ut uansett, noe som gjør feilen lett å overse.
- **Mangler i `6.1.0-next.7`:** `Flex` har ikke `layout`, `center`, `fill` eller responsive gaps, og det finnes ingen `Grid`-komponent. Malene i storybooken (som bygges mot monorepoet) bruker disse, så de kan ikke kopieres rett over. Bruk `display: grid` eller media queries.
- **Bygg:** `next build` tåler ikke et skittent `.next`. Får du `Invariant: no direct app page entry found`, `Cannot find module for page: /_document` eller manglende `.nft.json`, kjør `rm -rf .next out` og bygg på nytt. Samme gjelder hvis en global stilendring ikke slår inn.

Se også [arkitektur.md](arkitektur.md) for bredde på inputfelt og hvordan forsiden er satt sammen.
