# Arkitektur

Hvordan quizen er satt sammen: ruter, spørsmål, seksjoner, lagring og sider. Jøkul-spesifikke fallgruver står i [jokul.md](jokul.md), og publisering i [deploy.md](deploy.md).

## Ruter

| Rute                       | Innhold                                                   | Fil                                           |
| -------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| `/`                        | Forside med bakgrunnsbilde, quizkort og temavelger        | `app/page.tsx`                                |
| `/quizer/<slug>`           | Quizens forside: beskrivelse, eget bilde, start/resultat  | `app/quizer/[slug]/page.tsx`                  |
| `/quizer/<slug>/lag`       | Lagnavn, før første spørsmål                              | `app/quizer/[slug]/(steg)/lag/page.tsx`       |
| `/quizer/<slug>/medlemmer` | Opptil fire lagmedlemmer                                  | `app/quizer/[slug]/(steg)/medlemmer/page.tsx` |
| `/quizer/<slug>/1` … `/N`  | Ett spørsmål per side (1-basert)                          | `app/quizer/[slug]/(steg)/[step]/page.tsx`    |
| `/quizer/<slug>/resultat`  | Oppsummering, regnet ut fra de lagrede svarene            | `app/quizer/[slug]/(steg)/resultat/page.tsx`  |
| `/quiz/…`                  | Gamle URL-er, omdirigerer til `/quizer/norge-sverige-1/…` | `app/quiz/**`                                 |
| `/personvern`              | Personvernerklæring                                       | `app/personvern/page.tsx`                     |

`app/quizer/[slug]/layout.tsx` er en Server Component med `generateStaticParams` over `quizzes`, og barnesidene (forsiden, `lag`, `medlemmer`, `resultat`) arver sluggen derfra. Sidene som viser spørsmål ligger i route-gruppen `(steg)`, hvis layout gir den polstrede `<main>`-rammen; quizens forside ligger utenfor gruppen, siden den er heldekkende og har sin egen `<main>`. Gruppen påvirker ikke URL-ene. `[step]` har sin egen `generateStaticParams` som lager alle kombinasjoner av (slug, steg). Klientsidene henter quizen med `useQuiz()` (`useParams` + `getQuiz`). Antall spørsmål følger `quiz.questions`, og `next.config.ts` har `trailingSlash: true`.

Gamle URL-er (`/quiz/`, `/quiz/lag/`, `/quiz/medlemmer/`, `/quiz/N/`, `/quiz/resultat/`) er tynne sider som viser `Redirect` (`src/quiz/Redirect.tsx`, `router.replace`), siden statisk eksport ikke har omdirigering på serversiden. `app/quiz/[step]` og `app/quizer/[slug]/(steg)/[step]` ligger på ulike nivåer og har hvert sitt segmentnavn; innfør ikke et annet dynamisk segmentnavn på samme nivå som et eksisterende.

Lagnavn og medlemmer lagres bare i `sessionStorage` og brukes ikke videre.

## Quizmodell

En quiz er en `Quiz` (`src/quiz/types.ts`): `slug`, `title`, `description`, `image` (kortet på forsiden), `imageAlt`, `heroImage` (heldekkende bakgrunn på quizens egen forside), `sections`, `questions` og valgfri `opens`/`closes`. Hver quiz bor i `src/quizzes/<slug>.ts` og lages med `defineQuiz`, som sorterer spørsmålene etter seksjon (`questions`) og beholder rekkefølgen i filen som `allQuestions`, så `pnpm check` også ser spørsmål med ukjent seksjon. `src/quizzes/index.ts` eksporterer `quizzes` (rekkefølgen på forsiden) og `getQuiz(slug)`. Fellesfunksjonene `isCorrect`, `isAnswered`, `answerKeys` og `sectionOf` ligger i `src/quiz/answers.ts` og tar spørsmål eller quiz som parameter.

Filene under `src/quiz/types.ts`, `answers.ts`, `status.ts` og `src/quizzes/` importerer hverandre med relative stier og `.ts`, uten `@/`-aliaset, fordi `pnpm check` og `pnpm test` kjører dem direkte i Node.

Spørsmåls-id-er må være unike på tvers av alle quizer og må ikke endres: backend-statistikken bruker `questionId` som nøkkel. Slik legger du til en quiz: [CONTRIBUTING.md](../CONTRIBUTING.md#legge-til-en-ny-quiz).

## Spørsmål

Spørsmål ligger i `questions` i quizens fil (`src/quizzes/<slug>.ts`), og finnes i fire varianter:

- `type: "choice"` — ett riktig svar blant faste alternativer, ett `RadioPanel` per alternativ.
- `type: "multi"` — flere riktige svar, ett `CheckboxPanel` per alternativ. `answer` er en liste, og svaret må treffe akkurat de alternativene — verken flere eller færre.
- `type: "text"` — fritekstsvar i et `TextInput`. Trenger en `label` i tillegg til spørsmålet, siden spørsmålet er sidens overskrift og feltet sin egen korte benevnelse.
- `type: "number"` — tallsvar i et `NumberInput`, med valgfrie `min`/`max`. `answer` er et tall, og sammenlignes numerisk, ikke som tekst.

Svaret lagres alltid som en `string[]`, også for typene som bare tar én verdi — da slipper lagring, validering og poengberegning å forholde seg til flere former. Tekstsvar sammenlignes normalisert (trimmet, uten forskjell på store/små bokstaver, med sammenslått mellomrom), så det finnes foreløpig bare én godkjent skrivemåte per spørsmål.

`pnpm check` (`scripts/check-questions.ts`) validerer alle quizer: unike slugger, unike spørsmåls-id-er på tvers av quizer, gyldige datoer og som før hvert spørsmål. Se [CONTRIBUTING.md](../CONTRIBUTING.md) for hvordan du legger til nye.

## Seksjoner

Hver quiz har sin egen `sections`-liste (for `norge-sverige-1`: popkultur, historie, moderne teknologi, Norge og Sverige), og hvert spørsmål har en `section`-id. Spørsmålene kan stå i vilkårlig rekkefølge i filen — `questions` sorteres seksjon for seksjon etter `sections`, og rutene `/quizer/<slug>/N` følger den rekkefølgen. Hvert spørsmål kan hoppes over med «Hopp over» (`ButtonGroup`), som lagrer et tomt svar. Seksjonens navn vises over hvert spørsmål, og resultatsiden viser poeng per seksjon og grupperer fasiten etter seksjon. En ny seksjon er én linje i `sections` pluss spørsmålene.

## Én side per spørsmål

Hvert spørsmål har sin egen URL, slik at en refresh ikke starter quizen på nytt. `app/quizer/[slug]/(steg)/[step]/page.tsx` genererer én statisk side per spørsmål per quiz med `generateStaticParams`, og svarene lagres underveis i `sessionStorage` (`src/quiz/storage.ts`). Resultatsiden regner ut poengsummen fra de lagrede svarene i stedet for å holde den i minnet.

- `generateStaticParams` kan ikke eksporteres fra en `"use client"`-fil, så rutefilen er en Server Component som bare videresender `slug` og `step` til klientkomponenten `src/quiz/QuestionPage.tsx`. Det er derfor UI-et ligger i `src/` og ikke i rutefilen.
- Lagrede svar finnes bare i nettleseren. Feltet fylles derfor i en `useEffect` etter hydrering — den statiske HTML-en har alltid tomt felt, slik at server- og klientmarkup er like.

## Lagring

Alt ligger i nettleseren, og alle lese- og skrivefunksjoner tåler at lagring er blokkert.

| Nøkkel                            | Lager            | Innhold                                | Fil                   |
| --------------------------------- | ---------------- | -------------------------------------- | --------------------- |
| `fremtind-games:<slug>:svar`      | `sessionStorage` | `Record<spørsmåls-id, string[]>`       | `src/quiz/storage.ts` |
| `fremtind-games:<slug>:lag`       | `sessionStorage` | Lagnavn (`string`)                     | `src/quiz/storage.ts` |
| `fremtind-games:<slug>:medlemmer` | `sessionStorage` | Medlemmer (`string[]`)                 | `src/quiz/storage.ts` |
| `fremtind-games:<slug>:fullfort`  | `localStorage`   | Fullført resultat (svar), låser quizen | `src/quiz/storage.ts` |
| `fremtind-games:brand`            | `localStorage`   | Valgt tema (`data-brand` på `<html>`)  | `src/brand.ts`        |

Alle lagringsfunksjonene tar quizens slug, slik at quizene ikke deler svar eller lås. Før quizene fikk hver sin nøkkel lå det fullførte resultatet i `fremtind-games:fullfort`. `readCompleted("norge-sverige-1")` flytter den gamle nøkkelen til den nye ved lesing (idempotent: uten gammel nøkkel skjer ingenting, og en eksisterende ny verdi overskrives ikke), så de som allerede har fullført fortsatt er låst. `sessionStorage` er ikke migrert.

## Statistikk

`src/analytics/` sender anonyme svar til en backend og henter aggregert statistikk til resultatsiden. Alt styres av `NEXT_PUBLIC_API_URL` (inlines ved bygg, se `.env.example`). Er den tom, er `analyticsEnabled` false og alt er no-op: ingen nettverkskall, ingen feil, `QuestionStats` rendrer ingenting.

- `sendAnswer(question, value)` kalles ved «Fortsett» i `QuestionPage`, og bare når svaret er nytt eller endret siden sist (så tilbake/frem ikke dobbeltsender). «Hopp over» og tomme svar sendes ikke. Kallet er fire-and-forget (`fetch` med `keepalive`, feil svelges) og blokkerer aldri navigasjon.
- `POST {API}/svar` med `{ sessionId, questionId, keys }`. `keys` kommer fra `answerKeys` i `src/quiz/answers.ts`: valgt alternativ (choice), ett element per valgt alternativ (multi), normalisert tekst (text, samme `normalize` som `isCorrect`) eller tallet som streng (number).
- `sessionId` er en tilfeldig UUID som bare ligger i minnet (`src/analytics/session.ts`), ikke i nettleserens lagring. Den kobles aldri til lagnavn eller medlemmer, og de sendes aldri. Det samme gjelder fritekst-`label`en.
- `fetchStats()` henter `GET {API}/statistikk` med 4 sekunders timeout og gir `null` ved feil. Resultatsiden viser prosenter per spørsmål (`QuestionStats`) bare når `total >= MIN_SVAR_FOR_STATISTIKK` (20). Statistikken påvirker ikke poengberegningen.
- `pnpm check` verifiserer at fasitsvaret gir en svarnøkkel som finnes blant alternativene (choice/multi).

## Forsiden

Forsiden er en liste over alle quizer i `quizzes` (`src/quizzes/index.ts`), i den rekkefølgen de står der. Hver quiz vises som et Jøkul-`Card` (med `CardImage`, tittel og antall spørsmål) som lenker til `/quizer/<slug>/lag/`. Er quizen fullført i denne nettleseren (se «Bare én gjennomspilling»), vises «X av N riktige» og kortet lenker til `/quizer/<slug>/resultat/` i stedet. Poengene leses fra `localStorage` etter hydrering (`readScore` i `src/quiz/score.ts`), så den statiske HTML-en aldri viser dem. Kort for quizer utenfor åpningstiden er beskrevet under «Åpningstid».

Siden er satt sammen for hånd. Jøkul har ingen forside-, hero- eller bannermal i storybooken, så `/` låner `data-theme="dark"` på seksjonen (som i footeren i `Bedriftsmarked`) slik at `--jkl-color-*` løses til mørke verdier via `light-dark()`. Tittelen ligger utenfor et kort og får derfor eksplisitt hvit farge. Bakgrunnen er `public/fjell.jpg` som vanlig CSS `background-image` (`fixed`, med skrim) — Jøkuls `Image` kan ikke dekke hele viewporten. `CardImage` får ikke egen `width`, siden den setter negativ margin etter kortets padding.

`public/fjell.jpg` er et fjellsilhuett i solnedgang fra [Unsplash](https://unsplash.com/photos/gray-mountain-ridge-Pn-r8vL2nuM), skalert ned til 2400×1600. `public/goteborg.jpg` (Gothia Towers, Göteborg) er bildet på quizkortet, hentet fra [Unsplash](https://unsplash.com/photos/1614331358979-b83b729df836) og komprimert til 1500×2000.

## Bredde på inputfelt

Jøkul lar inputfelt krympe til innholdet sitt. Her skal de alltid fylle bredden, så `app/globals.scss` setter `width: 100%` på `.jkl-text-input-wrapper`, `.jkl-text-area-wrapper` og `.jkl-number-input__wrapper`. Regelen ligger utenfor Jøkuls cascade layers og vinner derfor uavhengig av spesifisitet. `NumberInput` trenger en egen selektor fordi `.jkl-number-input` setter `align-items: flex-start`, som ellers krymper feltet uansett bredde. Selve bredden styres av `.form` i `src/quiz/QuestionPage.module.scss`.

## PostHog (atferdsanalyse og A/B-testing)

`src/analytics/posthog.ts` laster `posthog-js` dynamisk, og bare når `NEXT_PUBLIC_POSTHOG_TOKEN` er satt (tokenet er offentlig og skrivebeskyttet, og ligger i `deploy.yml`). Prosjektet ligger i EU-regionen (`https://eu.i.posthog.com`). Oppsettet er bevisst personvernvennlig:

- `autocapture: false`: bare eksplisitte hendelser, så tekst fra lagnavn- og medlemsfeltene aldri fanges.
- Ingen session recording, ingenting i nettleserens lagring (`persistence: "memory"`), ingen personprofiler (`person_profiles: "identified_only"`) og `ip: false`.
- Hendelsene er `$pageview` (automatisk ved sidebytte), `question_answered` (`quiz`, `question_id`, `section`, `step`, `correct`), `question_skipped` (`quiz`, `question_id`, `step`) og `quiz_finished` (`quiz`, `score`, `total`). `quiz` er quizens slug. `POST /svar` til statistikk-backenden er uendret. Aldri navn eller fritekst.
- Feilsporing: `capture_exceptions: true` sender uhåndterte feil og avviste promises som `$exception`. Det krever også at `autocapture_exceptions_opt_in` er slått på i PostHog-prosjektet (er gjort), ellers ignorerer klienten det. Se feilene under Error tracking i PostHog.
- Bevisst av: `capture_heatmaps: false` og `disable_surveys: true`, siden prosjektet har dem på som standard og klienten ellers følger det. Surveys husker i nettleseren hva som er vist, og det utløser samtykkekravet.
- Headless-nettlesere filtreres bort av PostHog som boter. I e2e-tester må `navigator.webdriver` og `navigator.userAgentData` overstyres for at hendelser skal sendes.

### A/B-testing

Lag en feature flag eller et eksperiment i PostHog, og legg flagget i `EXPERIMENT_FLAGS` i `src/analytics/config.ts`. Bruk `getVariant("flagg")` i komponenter for å velge variant. Aktiv variant sendes automatisk som `variant` (f.eks. `layout=b`) med hvert svar til statistikk-API-et, så svar kan krysses mot variant i D1 (se `worker/README.md`). Flaggene lastes asynkront, så `getVariant` gir `undefined` til de er hentet — design varianten med en standardverdi.

### Samtykke: ingen banner

Analyse er ikke «nødvendig funksjonalitet» etter ekomloven § 3-15, så lagring eller lesing på enheten (cookie, `sessionStorage`, `localStorage`) til statistikk krever samtykke. Løsningen unngår det ved å **ikke lagre noe på enheten til analyse eller statistikk**: PostHog bruker `persistence: "memory"`, og `sessionId` ligger i en modulvariabel. Det som ligger i `sessionStorage`/`localStorage` (svar, lagnavn, medlemmer, tema) er nødvendig funksjonalitet.

Følger for utviklere:

- Innfør ikke noe som skriver til cookie, `sessionStorage` eller `localStorage` for analyse, A/B-variant eller statistikk uten å ta samtykke inn i planen. En A/B-variant må derfor leve i minnet (PostHog-flagg gjør det) og kan ikke ligge i `localStorage`.
- Konsekvensen er at en refresh gir ny anonym bruker. Dobbelttelling av svar hindres av at `QuestionPage` bare sender svar som er nye eller endret siden det lagrede svaret.
- Personvernerklæringen ligger på `/personvern/` (`app/personvern/page.tsx`) og må oppdateres hvis innsamlingen endres.

### Bare én gjennomspilling

Når resultatsiden åpnes med et svar (også tomt, fra «Hopp over») på alle spørsmål, lagres svarene i `localStorage` (`fremtind-games:<slug>:fullfort`) og `quiz_finished` sendes. Deretter sender `useCompletedRedirect` (`src/quiz/useCompletedRedirect.ts`) og `QuizGate` alle quizsider (`lag`, `medlemmer`, `N`) til `/quizer/<slug>/resultat/`, resultatsiden leser det lagrede resultatet, og forsiden viser poengene og lenker til resultatet. Det finnes ingen «Prøv igjen». Låsen gjelder per quiz.

Begrensninger: dette er ren klientside-håndheving uten innlogging, så det kan omgås med en annen nettleser, privat modus eller tømt lagring. Det er heller ikke nødvendig funksjonalitet i samtykke-forstand (§ 3-15), selv om det ikke brukes til analyse; få dette vurdert hvis dere er usikre.

## Åpningstid

En quiz kan ha `opens` og/eller `closes`: ISO 8601-strenger med tidssone-offset, f.eks. `2026-12-01T12:00:00+01:00`. `quizStatus(quiz, now = Date.now())` (`src/quiz/status.ts`) gir `"upcoming"`, `"open"` eller `"closed"`; `opens` er inkludert og `closes` eksklusiv. Uten datoer er quizen alltid åpen (`norge-sverige-1` har ingen). `pnpm check` avviser manglende offset, ugyldige datoer og `opens >= closes`, og `pnpm test` (`scripts/test-quiz-status.ts`) dekker kantene.

- **Forsiden:** kort for en quiz som ikke kan startes viser «Åpner <dato og klokkeslett>» eller «Stengt» (nb-NO, Europe/Oslo), er dempet, har `aria-disabled` og er ikke en lenke. Er quizen fullført, vises i stedet poeng og lenke til resultatet, uansett vindu.
- **Quizsider:** `QuizGate` (`src/quiz/QuizGate.tsx`) pakker `lag`, `medlemmer` og `N`. Utenfor vinduet og uten påbegynt quiz (ingen lagrede svar, lagnavn eller medlemmer for sluggen) vises «Quizen er ikke åpen» med åpnings- eller stengetid og lenke til forsiden. Den som har begynt får fullføre selv om vinduet stenger underveis. Den som har fullført sendes til resultatet.
- **Hydrering:** klokka finnes bare i nettleseren. Den statiske HTML-en for quizsidene viser derfor bare «Laster …» til `QuizGate` har lest klokka og lagringen, så spørsmålsinnhold aldri blinker frem for en sperret quiz. Forsidekort for quizer med tidsrom er nøytrale (dempet, uten lenke eller tekst) til klokka er lest.

**Begrensning:** dette er ren klientside-håndheving mot enhetens klokke. Det kan omgås ved å endre klokka, og spørsmål og fasit ligger i JavaScript-filene som sendes til alle, så det egner seg ikke til å holde innhold hemmelig før åpningstiden.
