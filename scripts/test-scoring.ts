// Tester for poengberegningen. Kjøres med `pnpm test`.
import assert from "node:assert/strict";
import { formatPoints, isCorrect, parseNumber, pointsFor } from "../src/quiz/answers.ts";
import type { Question } from "../src/quiz/types.ts";

const base = { id: "x", section: "s", question: "?" };
const choice: Question = { ...base, type: "choice", options: ["a", "b"], answer: "a" };
const multi: Question = {
    ...base,
    type: "multi",
    options: ["a", "b", "c", "d"],
    answer: ["a", "b"],
};
const num: Question = { ...base, type: "number", label: "År", answer: 1905 };
const near: Question = { ...base, type: "number", label: "År", answer: 1000, tolerance: 100 };

// choice og text
assert.equal(pointsFor(choice, ["a"]), 1);
assert.equal(pointsFor(choice, ["b"]), 0);
assert.equal(pointsFor(choice, []), 0);

// multi: delpoeng per riktig valg, trekk per feil valg, aldri under 0.
assert.equal(pointsFor(multi, ["a", "b"]), 1);
assert.equal(pointsFor(multi, ["a"]), 0.5);
assert.equal(pointsFor(multi, ["a", "b", "c"]), 0.5);
assert.equal(pointsFor(multi, ["a", "c"]), 0);
assert.equal(pointsFor(multi, ["c", "d"]), 0);
assert.equal(pointsFor(multi, []), 0);
assert.equal(pointsFor(multi, ["A ", "b"]), 1);

// number uten toleranse: bare eksakt treff. Komma og tusenskille godtas.
assert.equal(pointsFor(num, ["1905"]), 1);
assert.equal(pointsFor(num, ["1904"]), 0);
assert.equal(pointsFor(num, [""]), 0);
assert.equal(pointsFor(num, ["abc"]), 0);
assert.equal(pointsFor({ ...num, answer: 1905 }, ["1 905"]), 1);
assert.equal(pointsFor({ ...num, answer: 1.5 }, ["1,5"]), 1);

// number med toleranse: lineær nedgang, 0 på og utenfor toleransen.
assert.equal(pointsFor(near, ["1000"]), 1);
assert.equal(pointsFor(near, ["1050"]), 0.5);
assert.equal(pointsFor(near, ["950"]), 0.5);
assert.equal(pointsFor(near, ["1100"]), 0);
assert.equal(pointsFor(near, ["1500"]), 0);

// Delpoeng er ikke «riktig».
assert.equal(isCorrect(near, ["1050"]), false);
assert.equal(isCorrect(multi, ["a"]), false);
assert.equal(isCorrect(multi, ["a", "b"]), true);

assert.equal(parseNumber(" 1 905 "), 1905);
assert.equal(parseNumber(undefined), null);

assert.equal(formatPoints(3), "3");
assert.equal(formatPoints(3.5), "3,5");
assert.equal(formatPoints(1 / 3), "0,3");

console.log("Poengtester OK");
