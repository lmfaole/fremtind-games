# Arkitektur

Hvordan quizen er satt sammen: ruter, spørsmål, seksjoner, lagring og sider. Jøkul-spesifikke fallgruver står i [jokul.md](jokul.md), og publisering i [deploy.md](deploy.md).

## Ruter

| Rute              | Innhold                                               | Fil                           |
| ----------------- | ----------------------------------------------------- | ----------------------------- |
| `/`               | Forside med bakgrunnsbilde fra Göteborg og temavelger | `app/page.tsx`                |
| `/quiz`           | Omdirigerer til `/quiz/lag/` i nettleseren            | `app/quiz/page.tsx`           |
| `/quiz/lag`       | Lagnavn, før første spørsmål                          | `app/quiz/lag/page.tsx`       |
| `/quiz/medlemmer` | Opptil fire lagmedlemmer                              | `app/quiz/medlemmer/page.tsx` |
| `/quiz/1` … `/18` | Ett spørsmål per side                                 | `app/quiz/[step]/page.tsx`    |
| `/quiz/resultat`  | Oppsummering, regnet ut fra de lagrede svarene        | `app/quiz/resultat/page.tsx`  |

Lagnavn og medlemmer lagres bare i `sessionStorage` og brukes ikke videre. Antall spørsmål følger `questions` i `src/quiz/questions.ts`, og `next.config.ts` har `trailingSlash: true`.

## Spørsmål

Spørsmål ligger i `src/quiz/questions.ts` (`allQuestions`), og finnes i fire varianter:

- `type: "choice"` — ett riktig svar blant faste alternativer, ett `RadioPanel` per alternativ.
- `type: "multi"` — flere riktige svar, ett `CheckboxPanel` per alternativ. `answer` er en liste, og svaret må treffe akkurat de alternativene — verken flere eller færre.
- `type: "text"` — fritekstsvar i et `TextInput`. Trenger en `label` i tillegg til spørsmålet, siden spørsmålet er sidens overskrift og feltet sin egen korte benevnelse.
- `type: "number"` — tallsvar i et `NumberInput`, med valgfrie `min`/`max`. `answer` er et tall, og sammenlignes numerisk, ikke som tekst.

Svaret lagres alltid som en `string[]`, også for typene som bare tar én verdi — da slipper lagring, validering og poengberegning å forholde seg til flere former. Tekstsvar sammenlignes normalisert (trimmet, uten forskjell på store/små bokstaver, med sammenslått mellomrom), så det finnes foreløpig bare én godkjent skrivemåte per spørsmål.

`pnpm check` (`scripts/check-questions.ts`) validerer spørsmålene. Se [CONTRIBUTING.md](../CONTRIBUTING.md) for hvordan du legger til nye.

## Seksjoner

`sections` i `src/quiz/questions.ts` lister seksjonene (popkultur, historie, moderne teknologi, Norge og Sverige), og hvert spørsmål har en `section`-id. Spørsmålene kan stå i vilkårlig rekkefølge i filen — `questions` sorteres seksjon for seksjon etter `sections`, og rutene `/quiz/N` følger den rekkefølgen. Hvert spørsmål kan hoppes over med «Hopp over» (`ButtonGroup`), som lagrer et tomt svar. Seksjonens navn vises over hvert spørsmål, og resultatsiden viser poeng per seksjon og grupperer fasiten etter seksjon. En ny seksjon er én linje i `sections` pluss spørsmålene.

## Én side per spørsmål

Hvert spørsmål har sin egen URL, slik at en refresh ikke starter quizen på nytt. `app/quiz/[step]/page.tsx` genererer én statisk side per spørsmål med `generateStaticParams`, og svarene lagres underveis i `sessionStorage` (`src/quiz/storage.ts`). Resultatsiden regner ut poengsummen fra de lagrede svarene i stedet for å holde den i minnet.

- `generateStaticParams` kan ikke eksporteres fra en `"use client"`-fil, så rutefilen er en Server Component som bare videresender `step` til klientkomponenten `src/quiz/QuestionPage.tsx`. Det er derfor UI-et ligger i `src/` og ikke i rutefilen.
- Lagrede svar finnes bare i nettleseren. Feltet fylles derfor i en `useEffect` etter hydrering — den statiske HTML-en har alltid tomt felt, slik at server- og klientmarkup er like.

## Lagring

Alt ligger i nettleseren, og alle lese- og skrivefunksjoner tåler at lagring er blokkert.

| Nøkkel                     | Lager            | Innhold                                | Fil                   |
| -------------------------- | ---------------- | -------------------------------------- | --------------------- |
| `fremtind-games:svar`      | `sessionStorage` | `Record<spørsmåls-id, string[]>`       | `src/quiz/storage.ts` |
| `fremtind-games:lag`       | `sessionStorage` | Lagnavn (`string`)                     | `src/quiz/storage.ts` |
| `fremtind-games:medlemmer` | `sessionStorage` | Medlemmer (`string[]`)                 | `src/quiz/storage.ts` |
| `fremtind-games:fullfort`  | `localStorage`   | Fullført resultat (svar), låser quizen | `src/quiz/storage.ts` |
| `fremtind-games:brand`     | `localStorage`   | Valgt tema (`data-brand` på `<html>`)  | `src/brand.ts`        |

## Statistikk

`src/analytics/` sender anonyme svar til en backend og henter aggregert statistikk til resultatsiden. Alt styres av `NEXT_PUBLIC_API_URL` (inlines ved bygg, se `.env.example`). Er den tom, er `analyticsEnabled` false og alt er no-op: ingen nettverkskall, ingen feil, `QuestionStats` rendrer ingenting.

- `sendAnswer(question, value)` kalles ved «Fortsett» i `QuestionPage`, og bare når svaret er nytt eller endret siden sist (så tilbake/frem ikke dobbeltsender). «Hopp over» og tomme svar sendes ikke. Kallet er fire-and-forget (`fetch` med `keepalive`, feil svelges) og blokkerer aldri navigasjon.
- `POST {API}/svar` med `{ sessionId, questionId, keys }`. `keys` kommer fra `answerKeys` i `src/quiz/questions.ts`: valgt alternativ (choice), ett element per valgt alternativ (multi), normalisert tekst (text, samme `normalize` som `isCorrect`) eller tallet som streng (number).
- `sessionId` er en tilfeldig UUID som bare ligger i minnet (`src/analytics/session.ts`), ikke i nettleserens lagring. Den kobles aldri til lagnavn eller medlemmer, og de sendes aldri. Det samme gjelder fritekst-`label`en.
- `fetchStats()` henter `GET {API}/statistikk` med 4 sekunders timeout og gir `null` ved feil. Resultatsiden viser prosenter per spørsmål (`QuestionStats`) bare når `total >= MIN_SVAR_FOR_STATISTIKK` (20). Statistikken påvirker ikke poengberegningen.
- `pnpm check` verifiserer at fasitsvaret gir en svarnøkkel som finnes blant alternativene (choice/multi).

## Forsiden

Forsiden er satt sammen for hånd. Jøkul har ingen forside-, hero- eller bannermal i storybooken, så `/` låner mekanismer fra `Skjermbilder`-malene: `data-theme="dark"` på seksjonen (som i footeren i `Bedriftsmarked`) slik at alle `--jkl-color-*` løses til mørke verdier via `light-dark()`, et sentrert `Card` med innholdet, og `Title as="h1" size="xl"` for overskriften. Seksjonen er `100svh`. Selve bakgrunnsbildet er vanlig CSS `background-image` med en lett skrim som demper det lyse himmelpartiet — Jøkuls `Image`-komponent tar bare `src`/`srcSet`/`placeholder`/`alt`/`className` og kan ikke dekke hele viewporten.

`public/goteborg.jpg` er Gothia Towers i Göteborg, hentet fra [Unsplash](https://unsplash.com/photos/1614331358979-b83b729df836) og komprimert ned til 1500×2000.

## Bredde på inputfelt

Jøkul lar inputfelt krympe til innholdet sitt. Her skal de alltid fylle bredden, så `app/globals.scss` setter `width: 100%` på `.jkl-text-input-wrapper`, `.jkl-text-area-wrapper` og `.jkl-number-input__wrapper`. Regelen ligger utenfor Jøkuls cascade layers og vinner derfor uavhengig av spesifisitet. `NumberInput` trenger en egen selektor fordi `.jkl-number-input` setter `align-items: flex-start`, som ellers krymper feltet uansett bredde. Selve bredden styres av `.form` i `src/quiz/QuestionPage.module.scss`.

## PWA og offline

Nettstedet er en installerbar PWA som fungerer uten nett. Alt er håndskrevet, uten ekstra avhengigheter.

- **Manifest:** `app/manifest.ts` (`force-static`, blir `/manifest.webmanifest`). Standalone, norsk, `theme_color`/`background_color` = Jøkuls mørke sidefarge `#0E0D0C`. Ikoner (192, 512, maskable, apple-touch) ligger i `public/icons` og lages med `python3 scripts/generate-icons.py` (Pillow, kjøres manuelt, PNG-ene er sjekket inn).
- **Service worker:** `scripts/sw.template.js` er malen. `postbuild` (`scripts/build-sw.mjs`) skriver `out/sw.js` med liste over alt i `out/` (sider som `/quiz/1/`, `index.txt` med RSC-data, `_next/static`, bilder, ikoner og de fontene stilarkene bruker) og en versjon som er en hash av innholdet. Den ligger på rota, scope `/`. Andre merkevarers fonter caches første gang de brukes (`fg-runtime`).
- **Strategi:** forhåndslastet cache `fg-precache-<versjon>` (gamle slettes ved aktivering). Hasha filer og ikoner: cache først. Sider og `.txt`: nettverk først (3 s timeout) med cache som reserve, slik at nye spørsmål ikke blir stale, og responsen lagres bevisst ikke (ny HTML peker på nye JS-filer). Andre opphav enn nettstedet selv (statistikk-API, PostHog) rører service workeren aldri: ingen `respondWith`, ingen cache.
- **Oppdatering:** ny worker venter (ingen `skipWaiting` ved install). `src/pwa/PwaInit.tsx` viser «Ny versjon tilgjengelig» med «Last på nytt», som sender `SKIP_WAITING`; ved `controllerchange` lastes siden på nytt. Oppdateringssjekk ved lasting og hver time.
- **Registrering:** bare når `NODE_ENV === "production"`. `pnpm dev` har ingen service worker.
- **Push-handlere:** `push` viser et varsel fra JSON `{title, body, url}`, og `notificationclick` fokuserer eller åpner `url` (bare samme opphav). Det finnes ingen abonnementskode i klienten ennå.
- **Installasjon:** `src/pwa/InstallPrompt.tsx` på forsiden bruker `beforeinstallprompt`, og viser en iOS-instruks («Legg til på Hjem-skjerm») i Safari.
- **Hendelser** (via `track()`, ingenting lagres på enheten): `pwa_installed` (`appinstalled`), `pwa_launched` (én gang per sidelasting når `display-mode: standalone`), `sw_update_applied`.
- **Push (klient):** `src/pwa/push.ts` og `PushPrompt.tsx` (forsiden) ber om tillatelse etter et brukertrykk, abonnerer med `NEXT_PUBLIC_VAPID_PUBLIC_KEY` og sender abonnementet til `/push/subscribe` (se [Push-backend](#push-backend-web-push)). Knappen skjules uten VAPID-nøkkel eller `NEXT_PUBLIC_API_URL`. På iOS vises først en «legg til på Hjem-skjermen»-instruks, siden push der bare virker for installert app. Abonnementstilstand leses fra `pushManager`, ikke fra egen lagring. Hendelser: `push_prompt_shown`, `push_granted`, `push_denied`, `push_subscribe_failed`, `push_unsubscribed`. Mottak håndteres av `push`/`notificationclick` i service workeren.
- **Offline-oppførsel:** quiz, resultat og svar (`sessionStorage`/`localStorage`) virker uten nett. `sendAnswer` og `fetchStats` gjør ingenting når `navigator.onLine` er false og svelger feil ellers. Svar gitt offline sendes ikke senere (køing ville krevd lagring til analyse), og statistikk vises ikke på resultatsiden uten nett.
- **Fallgruve:** nettleseren ber om `%5Bstep%5D`, ikke `[step]`, så `build-sw.mjs` URL-koder stiene. Cachen matcher på eksakt URL.

## PostHog (atferdsanalyse og A/B-testing)

`src/analytics/posthog.ts` laster `posthog-js` dynamisk, og bare når `NEXT_PUBLIC_POSTHOG_TOKEN` er satt (tokenet er offentlig og skrivebeskyttet, og ligger i `deploy.yml`). Prosjektet ligger i EU-regionen (`https://eu.i.posthog.com`). Oppsettet er bevisst personvernvennlig:

- `autocapture: false`: bare eksplisitte hendelser, så tekst fra lagnavn- og medlemsfeltene aldri fanges.
- Ingen session recording, ingenting i nettleserens lagring (`persistence: "memory"`), ingen personprofiler (`person_profiles: "identified_only"`) og `ip: false`.
- Hendelsene er `$pageview` (automatisk ved sidebytte), `question_answered` (`question_id`, `section`, `step`, `correct`), `question_skipped` og `quiz_finished` (`score`, `total`). Aldri navn eller fritekst.
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

Når resultatsiden åpnes med et svar (også tomt, fra «Hopp over») på alle spørsmål, lagres svarene i `localStorage` (`fremtind-games:fullfort`) og `quiz_finished` sendes. Deretter sender `useCompletedRedirect` (`src/quiz/useCompletedRedirect.ts`) alle quizsider (`/quiz/lag`, `/quiz/medlemmer`, `/quiz/N`) til `/quiz/resultat/`, resultatsiden leser det lagrede resultatet, og forsiden viser «Se resultatet ditt» i stedet for «Start quizen». Det finnes ingen «Prøv igjen».

Begrensninger: dette er ren klientside-håndheving uten innlogging, så det kan omgås med en annen nettleser, privat modus eller tømt lagring. Det er heller ikke nødvendig funksjonalitet i samtykke-forstand (§ 3-15), selv om det ikke brukes til analyse; få dette vurdert hvis dere er usikre.

## Push-backend (Web Push)

Workeren (`worker/src/push.ts`, `webpush.ts`) har et lite Web Push-API: `POST /push/subscribe`, `/push/unsubscribe` og `/push/send`. VAPID (RFC 8292) og aes128gcm-kryptering (RFC 8291) er gjort med WebCrypto, uten avhengigheter. `/push/send` krever `Authorization: Bearer <PUSH_ADMIN_TOKEN>` og sender i bolker (standard 40 per kall) for å holde seg under grensen for subrequests. Abonnement som svarer 404/410 slettes. Uten `VAPID_*`-secrets og `PUSH_ADMIN_TOKEN` svarer `/push/*` med 503, og resten av Workeren virker som før. Detaljer: [worker/README.md](../worker/README.md).

Personvern: tabellen `push_subscriptions` har bare `endpoint`, nøklene og opprettet-tidspunkt. Abonnementet er en enhets-id hos push-tjenesten (nettleserleverandøren), ikke koblet til lagnavn, medlemmer, svar, `sessionId` eller IP, og Workeren logger ingen av dem. Brukeren kan melde seg av når som helst (`/push/unsubscribe`).
