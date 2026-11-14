# Bidra til fremtind.games

Takk for at du vil bidra! Quizen er en liten statisk Next.js-app, og de fleste bidrag er nye eller bedre spørsmål. Skriv UI-tekst, kommentarer og commit-meldinger på norsk.

## Kom i gang

Du trenger Node 22 og pnpm.

```sh
corepack enable
pnpm install
pnpm dev
```

Åpne http://localhost:3000. Oversikt over kommandoer står i [README.md](README.md#kommandoer), og over koden i [docs/arkitektur.md](docs/arkitektur.md).

## Arbeidsflyt

1. Lag en branch fra `main`.
2. Gjør endringen i små, logiske commits med norske meldinger.
3. Kjør `pnpm verify` (typesjekk, formatsjekk, quizsjekk og tester). Har du endret noe i `app/`, `src/` eller konfigurasjon, kjør også `pnpm build`.
4. Endrer du oppførsel, ruter eller kommandoer, oppdater [README.md](README.md) og relevant fil i [docs/](docs/).
5. Åpne en pull request. Malen i `.github/pull_request_template.md` fylles ut automatisk. Legg ved skjermbilde hvis UI er endret.

`pnpm format` retter formateringsfeil (Prettier, 4 mellomrom).

## Legge til en ny quiz

1. Lag `src/quizzes/<slug>.ts`. Sluggen (små bokstaver, tall og bindestrek) blir URL-en `/quizer/<slug>/` og er en del av nøklene i nettleserens lagring, så den bør ikke endres etterpå. Bruk `norge-sverige-1.ts` som mal:

    ```ts
    import { defineQuiz } from "../quiz/types.ts";

    export default defineQuiz({
        slug: "min-quiz",
        title: "Min quiz",
        description: "Kort tekst til kortet på forsiden.",
        image: "/min-quiz.jpg",
        imageAlt: "Beskrivelse av bildet",
        opens: "2026-12-01T12:00:00+01:00", // valgfri
        closes: "2026-12-08T12:00:00+01:00", // valgfri
        sections: [{ id: "popkultur", title: "Popkultur" }],
        questions: [/* se «Legge til et spørsmål» under */],
    });
    ```

    Importer med relative stier og `.ts`-endelse, siden `pnpm check` kjører filen direkte i Node.

2. Registrer quizen i `src/quizzes/index.ts` (importer den og legg den i `quizzes`). Rekkefølgen der er rekkefølgen på forsiden.
3. Legg bildet i `public/` og pek `image` på det (f.eks. `/min-quiz.jpg`, ca. 1500×2000 eller tilsvarende).
4. Spørsmåls-`id`-er må være unike på tvers av **alle** quizer, ikke bare innenfor én. Backend-statistikken bruker dem som nøkler, så ikke gjenbruk en id fra en annen quiz.
5. Vil du avgrense når quizen kan startes, sett `opens` og/eller `closes`. Se under.
6. Kjør `pnpm check`, så `pnpm dev` og klikk deg gjennom quizen, og `pnpm build`.
7. Rutetabellen i [README.md](README.md) bruker `<slug>` og trenger normalt ingen endring.

### Åpningstid (`opens` og `closes`)

Begge er valgfrie ISO 8601-strenger **med tidssone-offset**, f.eks. `"2026-12-01T12:00:00+01:00"` (vinter) eller `"2026-07-01T12:00:00+02:00"` (sommer). `opens` er inkludert og `closes` eksklusiv. `pnpm check` avviser manglende offset, ugyldige datoer og `opens` som ikke ligger før `closes`.

Utenfor tidsrommet viser forsiden «Åpner <tid>» eller «Stengt», kortet kan ikke trykkes, og direkte URL viser «Quizen er ikke åpen». Den som allerede har begynt får fullføre, og den som har fullført ser alltid resultatet. Dette sjekkes i nettleseren mot enhetens klokke og kan omgås, så bruk det ikke til å holde svar hemmelige: fasiten ligger i JavaScript-filene som sendes til alle.

## Legge til et spørsmål

Spørsmålene ligger i `questions` i quizens fil, f.eks. `src/quizzes/norge-sverige-1.ts`.

1. Velg en `section` (`popkultur`, `historie`, `teknologi` eller `naboer`) og en kort `id` som er unik på tvers av alle quizer (f.eks. `take-on-me`).
2. Legg objektet hvor som helst i `questions`. Rekkefølgen i filen spiller ingen rolle: spørsmålene vises seksjon for seksjon, og `/quizer/<slug>/N` følger den rekkefølgen. Antall sider økes automatisk.
3. Kjør `pnpm check`. Den peker på spørsmålets `id` hvis noe er galt (tomme felt, duplikate `id`-er eller alternativer, svar som ikke finnes blant alternativene, `min` over `max`).
4. Kjør `pnpm dev` og klikk deg gjennom spørsmålet.
5. Antall sider følger spørsmålene, så rutetabellen i [README.md](README.md) trenger ingen endring.

Felter alle typer har: `type`, `id`, `section`, `question` og valgfri `description` (en hjelpetekst under spørsmålet).

### `choice`: ett riktig svar

```ts
{
    type: "choice",
    id: "take-on-me",
    section: "popkultur",
    question: "Hvilket norsk band står bak «Take On Me»?",
    options: ["Madrugada", "Röyksopp", "a-ha", "Turbonegro"],
    answer: "a-ha", // må stå ordrett i options
},
```

### `multi`: flere riktige svar

```ts
{
    type: "multi",
    id: "svenske-band",
    section: "popkultur",
    question: "Hvilke av disse banda er svenske?",
    description: "Flere svar er riktige.",
    options: ["ABBA", "a-ha", "Roxette", "Kent", "Madrugada"],
    answer: ["ABBA", "Roxette", "Kent"], // svaret må treffe akkurat disse
},
```

### `text`: fritekst

```ts
{
    type: "text",
    id: "pippi",
    section: "popkultur",
    question: "Hvilken svensk forfatter skrev bøkene om Pippi Langstrømpe?",
    description: "Både fornavn og etternavn.",
    label: "Forfatter", // kort benevnelse på selve feltet, påkrevd
    answer: "Astrid Lindgren",
},
```

Svaret sammenlignes uten forskjell på store/små bokstaver og ekstra mellomrom, men det finnes bare én godkjent skrivemåte. Velg spørsmål der svaret er entydig.

### `number`: tall

```ts
{
    type: "number",
    id: "grunnlov",
    section: "historie",
    question: "Hvilket år ble Norges grunnlov vedtatt på Eidsvoll?",
    label: "Årstall", // påkrevd
    answer: 1814,
    min: 1700, // valgfri
    max: 1900, // valgfri, svaret må ligge mellom min og max
},
```

### Ny seksjon

Legg til én linje i `sections` i quizens fil, og bruk id-en i minst ett spørsmål:

```ts
sections: [
    { id: "popkultur", title: "Popkultur" },
    // ...
    { id: "mat", title: "Mat og drikke" },
],
```

`pnpm check` feiler hvis et spørsmål peker på en seksjon som ikke finnes. Seksjonen vises over spørsmålene og får egen poengsum på resultatsiden. Seksjonsvalget i `.github/ISSUE_TEMPLATE/sporsmalsforslag.yml` bør også oppdateres.

## Hva CI sjekker

`.github/workflows/ci.yml` kjører på pull requests og på alle branches unntatt `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm verify`: `pnpm typecheck`, `pnpm format:check`, `pnpm check`, `pnpm test` og Worker-sjekkene
3. `pnpm build`

Det samme kjøres før deploy til GitHub Pages ved push til `main` (`.github/workflows/deploy.yml`, se [docs/deploy.md](docs/deploy.md)). Går CI rødt lokalt først, er `pnpm verify` og `pnpm build` nok til å gjenskape feilen. Rare byggefeil løses ofte med `rm -rf .next out`, se [docs/jokul.md](docs/jokul.md).

## Foreslå et spørsmål uten å kode

Åpne en issue med malen **Spørsmålsforslag**. Oppgi seksjon, type, spørsmål, alternativer (ett per linje), riktig svar og en kilde som bekrefter svaret. Spørsmålet legges inn etter at svaret er sjekket mot kilden. Feil i quizen meldes med malen **Feil**.

## For KI-agenter

Se [AGENTS.md](AGENTS.md).
