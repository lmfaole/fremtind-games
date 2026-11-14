// Validerer alle quizer i src/quizzes/. Kjøres med `pnpm check`.
// Bruker `allQuestions` (ikke `questions`), siden sistnevnte filtrerer bort spørsmål med ukjent seksjon.
// Feilmeldingene peker på quizens slug og spørsmålets id, slik at feilen er lett å finne.
import { existsSync } from "node:fs";
import { answerKeys, correctValue } from "../src/quiz/answers.ts";
import { parseQuizTime, quizStatus } from "../src/quiz/status.ts";
import type { Quiz } from "../src/quiz/types.ts";
import { quizzes } from "../src/quizzes/index.ts";

const errors: string[] = [];
const isBlank = (value: unknown) => typeof value !== "string" || value.trim() === "";

const checkWindow = ({ slug, opens, closes }: Quiz) => {
    const fail = (message: string) => errors.push(`Quiz «${slug}»: ${message}`);
    const times: Record<string, number | null> = {};
    for (const [field, value] of [
        ["opens", opens],
        ["closes", closes],
    ] as const) {
        if (value === undefined) continue;
        times[field] = typeof value === "string" ? parseQuizTime(value) : null;
        if (times[field] === null) {
            fail(
                `\`${field}\` («${value}») er ikke en gyldig ISO 8601-dato med tidssone, f.eks. «2026-12-01T12:00:00+01:00».`,
            );
        }
    }
    const { opens: from, closes: to } = times;
    if (from != null && to != null && from >= to) {
        fail(`\`opens\` (${opens}) må ligge før \`closes\` (${closes}).`);
    }
};

const seenSlugs = new Set<string>();
// Id-ene er nøkler i statistikk-backenden, så de må være unike på tvers av quizer.
const seenIds = new Map<string, string>();
let questionCount = 0;

for (const quiz of quizzes) {
    const { slug } = quiz;
    const questions = quiz.allQuestions;
    const sections = quiz.sections;
    const fail = (id: string, message: string) =>
        errors.push(`Quiz «${slug}», spørsmål «${id}»: ${message}`);
    const failQuiz = (message: string) => errors.push(`Quiz «${slug}»: ${message}`);

    if (isBlank(slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        failQuiz("sluggen må bestå av små bokstaver, tall og bindestrek (brukes i URL-en).");
    }
    if (seenSlugs.has(slug)) failQuiz("sluggen er brukt av flere quizer.");
    seenSlugs.add(slug);
    for (const field of ["title", "description", "image", "imageAlt", "heroImage"] as const) {
        if (isBlank(quiz[field])) failQuiz(`\`${field}\` er tom.`);
    }
    for (const field of ["image", "heroImage"] as const) {
        const path = quiz[field];
        if (!isBlank(path) && !existsSync(new URL(`../public${path}`, import.meta.url))) {
            failQuiz(`\`${field}\` peker på ${path}, som ikke finnes i public/.`);
        }
    }
    if (questions.length === 0) failQuiz("har ingen spørsmål.");
    checkWindow(quiz);

    const sectionIds = new Set<string>(sections.map((section) => section.id));
    const seenSectionIds = new Set<string>();

    for (const section of sections) {
        if (isBlank(section.title)) failQuiz(`seksjon «${section.id}»: tittelen er tom.`);
        if (seenSectionIds.has(section.id)) failQuiz(`seksjonen «${section.id}» er duplisert.`);
        seenSectionIds.add(section.id);
    }

    questionCount += questions.length;

    for (const question of questions) {
        const { id } = question;

        if (isBlank(id)) {
            errors.push(`Et spørsmål (${JSON.stringify(question.question)}) mangler id.`);
            continue;
        }
        const owner = seenIds.get(id);
        if (owner !== undefined) {
            fail(
                id,
                owner === slug
                    ? "id-en er brukt av flere spørsmål."
                    : `id-en er allerede brukt i quizen «${owner}».`,
            );
        }
        seenIds.set(id, slug);

        if (!sectionIds.has(question.section)) {
            fail(id, `seksjonen «${question.section}» finnes ikke i \`sections\`.`);
        }
        if (isBlank(question.question)) fail(id, "spørsmålsteksten er tom.");
        if (question.description !== undefined && isBlank(question.description)) {
            fail(id, "`description` er satt, men tom. Fjern feltet eller fyll det ut.");
        }

        // Fasitsvaret må gi svarnøkler som statistikken kan slå opp.
        const keys = answerKeys(question, correctValue(question));
        if (keys.length === 0) fail(id, "riktig svar gir ingen svarnøkler (`answerKeys`).");
        if (question.type === "choice" || question.type === "multi") {
            for (const key of keys) {
                if (!question.options.includes(key)) {
                    fail(id, `svarnøkkelen «${key}» finnes ikke blant alternativene.`);
                }
            }
        }

        switch (question.type) {
            case "choice":
            case "multi": {
                const { options } = question;
                if (options.length < 2) fail(id, "må ha minst to alternativer.");
                if (options.some(isBlank)) fail(id, "har et tomt alternativ.");

                const normalized = options.map((option) => option.trim().toLowerCase());
                const duplicates = options.filter(
                    (_, i) => normalized.indexOf(normalized[i]) !== i,
                );
                if (duplicates.length > 0) {
                    fail(
                        id,
                        `duplikate alternativer: ${duplicates.map((d) => `«${d}»`).join(", ")}.`,
                    );
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
                const { answer, min, max, tolerance } = question;
                if (typeof answer !== "number" || !Number.isFinite(answer)) {
                    fail(id, "svaret må være et gyldig tall.");
                    break;
                }
                if (min !== undefined && max !== undefined && min > max) {
                    fail(id, `min (${min}) er større enn max (${max}).`);
                }
                if (tolerance !== undefined && !(Number.isFinite(tolerance) && tolerance > 0)) {
                    fail(id, "`tolerance` må være et tall større enn 0.");
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
}

if (errors.length > 0) {
    console.error(`Fant ${errors.length} feil i quizene:\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
}

console.log(`OK: ${quizzes.length} quizer med ${questionCount} spørsmål.`);
