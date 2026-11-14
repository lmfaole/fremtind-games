// Jøkul 6.1.0-next.7 har ingen "use client"-direktiver, så komponentene kan ikke
// rendres i en Server Component.
"use client";
import { Flex } from "@fremtind/jokul/flex";
import { Text, Title } from "@fremtind/jokul/typography";
import styles from "./page.module.scss";

const Personvern = () => (
    <main className={styles.page}>
        <Flex direction="column" gap="m">
            <Title as="h1" size="l">
                Personvern
            </Title>
            <Text>
                Quizen samler inn anonym statistikk for å vise hvor mange som har svart hva, og for
                å forbedre selve quizen. Vi lagrer ingenting i nettleseren din til dette formålet,
                og vi bruker ikke cookies.
            </Text>
            <Title as="h2" size="m">
                Det vi samler inn
            </Title>
            <Text>
                Hvilke sider som vises, hvilke spørsmål som besvares eller hoppes over, om svaret
                var riktig, og poengsummen. Svarene sendes uten lagnavn, medlemsnavn og annen tekst
                du skriver. Hver gjennomspilling får en tilfeldig id som bare finnes mens siden er
                åpen, og som ikke kan knyttes til deg. IP-adressen din lagres ikke.
            </Text>
            <Title as="h2" size="m">
                Det som blir værende i nettleseren din
            </Title>
            <Text>
                Svarene dine, lagnavn og medlemmer lagres i nettleseren (sessionStorage) mens du
                spiller, slik at en refresh ikke starter quizen på nytt. Når du er ferdig, lagres
                svarene dine også varig i nettleseren (localStorage), slik at quizen bare kan tas én
                gang og du kan se resultatet ditt igjen. Valgt tema lagres også. Dette forlater
                aldri enheten din.
            </Text>
            <Title as="h2" size="m">
                Bruk uten nett og installasjon
            </Title>
            <Text>
                Quizen kan installeres som app og brukes uten nett. For å få det til lagrer
                nettleseren en kopi av nettstedet (sider, skrifter og bilder) i en lokal cache. Den
                inneholder ingenting om deg. Hvis du installerer appen eller åpner den fra
                hjemskjermen, sender vi hendelsene «installert», «åpnet som app» og «oppdatert»,
                uten noe som kan knyttes til deg. Svar gitt uten nett blir ikke med i statistikken.
            </Text>
            <Title as="h2" size="m">
                Verktøy
            </Title>
            <Text>
                Statistikken om svar lagres i en database hos Cloudflare. Atferdsanalysen går til
                PostHog (EU-region). Lagnavn og medlemmer forlater aldri enheten din.
            </Text>
            <a href="/" className={styles.back}>
                Tilbake til forsiden
            </a>
        </Flex>
    </main>
);

export default Personvern;
