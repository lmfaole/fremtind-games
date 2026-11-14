# Deploy

`.github/workflows/deploy.yml` bygger og publiserer `out/` til GitHub Pages ved push til `main` (etter `pnpm verify`). Pull requests og andre branches kjører `.github/workflows/ci.yml`, se [CONTRIBUTING.md](../CONTRIBUTING.md#hva-ci-sjekker).

Engangsoppsett i repoet:

1. Settings → Pages → Source: **GitHub Actions**
2. Settings → Pages → Custom domain: `fremtind.games`

DNS hos domeneleverandøren:

| Navn  | Type    | Verdi                                                                      |
| ----- | ------- | -------------------------------------------------------------------------- |
| `@`   | `A`     | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `www` | `CNAME` | `lmfaole.github.io`                                                        |

- Apex (`@`) skal ha `A`-records, ikke `CNAME` — `CNAME` på sonerota er ikke gyldig per RFC 1034. Cloudflare flater likevel ut `CNAME` på rota automatisk og svarer med `A`-records, så `@ CNAME lmfaole.github.io` fungerer _der_. Andre leverandører trenger `A` (eller `ALIAS`/`ANAME` om de støtter det).
- Står det en proxy-bryter i DNS-panelet (Cloudflares oransje sky), skal den være **av** / «DNS only». GitHub må se forespørselen for å utstede og fornye Let's Encrypt-sertifikatet; proxying gir ellers redirect-loop eller «certificate not yet created».
- IP-ene over bør sjekkes mot [GitHubs dokumentasjon](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site) før bruk.

**Ingen `basePath`.** Med eget apex-domene ligger nettstedet på rota, så `next.config.ts` setter ikke `basePath`. Skal nettstedet i stedet serves på `lmfaole.github.io/<repo>/`, må `basePath` settes _og_ `public/CNAME` slettes — de to utelukker hverandre, og med begge aktive blir hver URL `https://fremtind.games/<repo>/…` og gir 404 på sider, CSS, JS og bakgrunnsbildet.

`basePath` skriver dessuten **ikke** om `url()` inne i CSS. Jøkul hardkoder fontene absolutt (`url("/fonts/Jokul-Icons.woff2")`), så med `basePath` satt lastes siden og CSS-en riktig fra `/<repo>/…` mens fontene bes om fra vertsrota og gir 404 — tekst og ikoner faller tilbake til nettleserfonten. Trengs `basePath` likevel, må Jøkuls `$webfonts-dir` konfigureres til samme prefiks _før_ `base.scss` lastes:

```scss
@use "@fremtind/jokul/styles/theme/fonts" with (
    $webfonts-dir: "/<repo>/fonts"
);
@use "@fremtind/jokul/styles/base.scss";
```

Merkevarefontene arver verdien. Sass leser ikke miljøvariabler, så prefikset må hardkodes begge steder.

Se også [jokul.md](jokul.md) om fonter, som `prebuild` kopierer inn før bygget.

## Statistikk-API

`deploy.yml` bygger med `NEXT_PUBLIC_API_URL=https://api.fremtind.games`, som er Cloudflare Workeren i `worker/` (se [worker/README.md](../worker/README.md)). Fjernes variabelen, skjules statistikken og klienten sender ingenting. Workeren deployes manuelt med `pnpm deploy` i `worker/`, ikke av GitHub Actions.

## Forhåndsvisning (dev)

Arbeidsgrenen er `dev`. `main` er produksjon og oppdateres ved å slå `dev` sammen i `main`.

`.github/workflows/preview.yml` bygger og publiserer til Cloudflare Pages (prosjektet `fremtind-games-preview`) ved push til `dev` og på pull requests:

| Hva               | Adresse                                                           |
| ----------------- | ----------------------------------------------------------------- |
| `dev`             | `https://dev.fremtind-games-preview.pages.dev`                    |
| Pull request/gren | `https://<gren>.fremtind-games-preview.pages.dev` (lenke i PR-en) |

Alle pull requests skal ha `dev` som base. `.github/workflows/guard.yml` feiler en PR mot `main` som ikke kommer fra `dev`, og `preview.yml` kjører bare for PR-er mot `dev`. Hver PR får en kommentar med sin egen forhåndsvisningsadresse, og adressen oppdateres ved nye pushes.

For å tvinge regelen på GitHub: Settings → Branches → legg en regel på `main` med _Require a pull request_ og _Require status checks_ (`Base-gren`), og sett `dev` som standardgren, slik at nye PR-er får riktig base automatisk.

Engangsoppsett:

1. Cloudflare → My Profile → API Tokens: lag et token med _Account · Cloudflare Pages · Edit_.
2. GitHub → Settings → Secrets and variables → Actions: legg inn `CLOUDFLARE_API_TOKEN` og `CLOUDFLARE_ACCOUNT_ID`. Uten dem hopper workflowen over deploy (ingen feil).
3. Valgfritt: koble `dev.fremtind.games` til prosjektet under Pages → Custom domains. Domenet ligger i Cloudflare, så DNS opprettes automatisk.

Forhåndsvisningen bygges **uten** `NEXT_PUBLIC_API_URL` og `NEXT_PUBLIC_POSTHOG_TOKEN`, slik at testing ikke havner i produksjonsstatistikk, og sendes med `X-Robots-Tag: noindex`. Vil du teste statistikk eller push mot en egen Worker, lag en dev-Worker/D1-database og sett variablene i bygg-steget. Push-abonnement som tas i preview, må aldri peke på produksjons-Workeren.
