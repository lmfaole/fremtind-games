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

1. Lag en branch fra `dev` (`main` er produksjon). Push til `dev` og pull requests får forhåndsvisning, se [docs/deploy.md](docs/deploy.md#forhåndsvisning-dev).
2. Gjør endringen i små, logiske commits med norske meldinger.
3. Kjør `pnpm verify` (typesjekk, formatsjekk og spørsmålssjekk). Har du endret noe i `app/`, `src/` eller konfigurasjon, kjør også `pnpm build`.
4. Endrer du oppførsel, ruter eller kommandoer, oppdater [README.md](README.md) og relevant fil i [docs/](docs/).
5. Åpne en pull request. Malen i `.github/pull_request_template.md` fylles ut automatisk. Legg ved skjermbilde hvis UI er endret.

`pnpm format` retter formateringsfeil (Prettier, 4 mellomrom).

## Legge til et spørsmål

Alle spørsmål ligger i `allQuestions` i `src/quiz/questions.ts`.

1. Velg en `section` (`popkultur`, `historie`, `teknologi` eller `naboer`) og en unik, kort `id` (f.eks. `take-on-me`).
2. Legg objektet hvor som helst i `allQuestions`. Rekkefølgen i filen spiller ingen rolle: spørsmålene vises seksjon for seksjon, og `/quiz/N` følger den rekkefølgen. Antall sider økes automatisk.
3. Kjør `pnpm check`. Den peker på spørsmålets `id` hvis noe er galt (tomme felt, duplikate `id`-er eller alternativer, svar som ikke finnes blant alternativene, `min` over `max`).
4. Kjør `pnpm dev` og klikk deg gjennom spørsmålet.
5. Skal antallet endres, oppdater rutetabellen i [README.md](README.md) (`/quiz/1` … `/N`).

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

Legg til én linje i `sections` øverst i `src/quiz/questions.ts`, og bruk id-en i minst ett spørsmål:

```ts
export const sections = [
    { id: "popkultur", title: "Popkultur" },
    // ...
    { id: "mat", title: "Mat og drikke" },
] as const;
```

`SectionId` utledes fra listen, så TypeScript godtar den nye id-en med en gang. Seksjonen vises over spørsmålene og får egen poengsum på resultatsiden. Seksjonsvalget i `.github/ISSUE_TEMPLATE/sporsmalsforslag.yml` bør også oppdateres.

## Hva CI sjekker

`.github/workflows/ci.yml` kjører på pull requests og på alle branches unntatt `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm verify`: `pnpm typecheck`, `pnpm format:check` og `pnpm check`
3. `pnpm build`

Det samme kjøres før deploy til GitHub Pages ved push til `main` (`.github/workflows/deploy.yml`, se [docs/deploy.md](docs/deploy.md)). Går CI rødt lokalt først, er `pnpm verify` og `pnpm build` nok til å gjenskape feilen. Rare byggefeil løses ofte med `rm -rf .next out`, se [docs/jokul.md](docs/jokul.md).

## Foreslå et spørsmål uten å kode

Åpne en issue med malen **Spørsmålsforslag**. Oppgi seksjon, type, spørsmål, alternativer (ett per linje), riktig svar og en kilde som bekrefter svaret. Spørsmålet legges inn etter at svaret er sjekket mot kilden. Feil i quizen meldes med malen **Feil**.

## For KI-agenter

Se [AGENTS.md](AGENTS.md).
