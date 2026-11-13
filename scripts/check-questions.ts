// Validerer src/quiz/questions.ts. Kjøres med `pnpm check`.
// Bruker `allQuestions` (ikke `questions`), siden sistnevnte filtrerer bort spørsmål med ukjent seksjon.
// Feilmeldingene peker på spørsmålets id, slik at feilen er lett å finne.
import { allQuestions as questions, sections } from "../src/quiz/questions.ts";

const errors: string[] = [];
const fail = (id: string, message: string) => errors.push(`Spørsmål «${id}»: ${message}`);
const isBlank = (value: unknown) => typeof value !== "string" || value.trim() === "";

const sectionIds = new Set<string>(sections.map((section) => section.id));
const seenIds = new Set<string>();

for (const section of sections) {
    if (isBlank(section.title)) errors.push(`Seksjon «${section.id}»: tittelen er tom.`);
}

for (const question of questions) {
    const { id } = question;

    if (isBlank(id)) {
        errors.push(`Et spørsmål (${JSON.stringify(question.question)}) mangler id.`);
        continue;
    }
    if (seenIds.has(id)) fail(id, "id-en er brukt av flere spørsmål.");
    seenIds.add(id);

    if (!sectionIds.has(question.section)) {
        fail(id, `seksjonen «${question.section}» finnes ikke i \`sections\`.`);
    }
    if (isBlank(question.question)) fail(id, "spørsmålsteksten er tom.");
    if (question.description !== undefined && isBlank(question.description)) {
        fail(id, "`description` er satt, men tom. Fjern feltet eller fyll det ut.");
    }

    switch (question.type) {
        case "choice":
        case "multi": {
            const { options } = question;
            if (options.length < 2) fail(id, "må ha minst to alternativer.");
            if (options.some(isBlank)) fail(id, "har et tomt alternativ.");

            const normalized = options.map((option) => option.trim().toLowerCase());
            const duplicates = options.filter((_, i) => normalized.indexOf(normalized[i]) !== i);
            if (duplicates.length > 0) {
                fail(id, `duplikate alternativer: ${duplicates.map((d) => `«${d}»`).join(", ")}.`);
            }

            const answers = question.type === "choice" ? [question.answer] : question.answer;
            if (answers.length === 0) fail(id, "mangler riktig svar.");
            if (answers.some(isBlank)) fail(id, "har et tomt svar.");
            for (const answer of answers) {
                if (!options.includes(answer)) {
                    fail(id, `svaret «${answer}» finnes ikke blant alternativene.`);
                }
            }
            if (question.type === "multi" && new Set(answers).size !== answers.length) {
                fail(id, "samme svar er oppgitt flere ganger.");
            }
            break;
        }
        case "text":
            if (isBlank(question.label)) fail(id, "tekstspørsmål må ha en `label`.");
            if (isBlank(question.answer)) fail(id, "mangler riktig svar.");
            break;
        case "number": {
            if (isBlank(question.label)) fail(id, "tallspørsmål må ha en `label`.");
            const { answer, min, max } = question;
            if (typeof answer !== "number" || !Number.isFinite(answer)) {
                fail(id, "svaret må være et gyldig tall.");
                break;
            }
            if (min !== undefined && max !== undefined && min > max) {
                fail(id, `min (${min}) er større enn max (${max}).`);
            }
            if (min !== undefined && answer < min) {
                fail(id, `svaret ${answer} er under min (${min}).`);
            }
            if (max !== undefined && answer > max) {
                fail(id, `svaret ${answer} er over max (${max}).`);
            }
            break;
        }
        default:
            fail(id, `ukjent spørsmålstype «${(question as { type: string }).type}».`);
    }
}

if (errors.length > 0) {
    console.error(`Fant ${errors.length} feil i src/quiz/questions.ts:\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
}

console.log(`OK: ${questions.length} spørsmål i ${sections.length} seksjoner.`);
