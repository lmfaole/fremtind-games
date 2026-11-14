// Tester for tidsavgrensningen av quizer. Kjøres med `pnpm test`.
import assert from "node:assert/strict";
import { formatQuizTime, parseQuizTime, quizStatus } from "../src/quiz/status.ts";

const opens = "2026-12-01T12:00:00+01:00";
const closes = "2026-12-08T12:00:00+01:00";
const t = (value: string) => Date.parse(value);
const window = { opens, closes };

// Uten datoer er quizen alltid åpen.
assert.equal(quizStatus({}, 0), "open");
assert.equal(quizStatus({}, t(closes) + 1e12), "open");

// `opens` er inkludert, `closes` er eksklusiv.
assert.equal(quizStatus(window, t(opens) - 1), "upcoming");
assert.equal(quizStatus(window, t(opens)), "open");
assert.equal(quizStatus(window, t(closes) - 1), "open");
assert.equal(quizStatus(window, t(closes)), "closed");
assert.equal(quizStatus(window, t(closes) + 1), "closed");

// Bare én av grensene.
assert.equal(quizStatus({ opens }, t(opens) - 1), "upcoming");
assert.equal(quizStatus({ opens }, t(opens) + 1e12), "open");
assert.equal(quizStatus({ closes }, 0), "open");
assert.equal(quizStatus({ closes }, t(closes)), "closed");

// Offset teller: 12:00+01:00 og 11:00Z er samme tidspunkt.
assert.equal(quizStatus({ opens: "2026-12-01T11:00:00Z" }, t(opens)), "open");
assert.equal(quizStatus({ opens: "2026-12-01T11:00:00Z" }, t(opens) - 1), "upcoming");

// Standardverdien for `now` er klokka.
assert.equal(quizStatus({ closes: "2000-01-01T00:00:00Z" }), "closed");
assert.equal(quizStatus({ opens: "2999-01-01T00:00:00Z" }), "upcoming");

// Gyldighet: offset er påkrevd, og datoen må finnes.
assert.notEqual(parseQuizTime(opens), null);
assert.notEqual(parseQuizTime("2026-12-01T12:00Z"), null);
assert.equal(parseQuizTime("2026-12-01T12:00:00"), null);
assert.equal(parseQuizTime("2026-12-01"), null);
assert.equal(parseQuizTime("2026-13-01T12:00:00+01:00"), null);
assert.equal(parseQuizTime("ikke en dato"), null);

// Formatering er i norsk tid uansett enhetens tidssone.
assert.equal(formatQuizTime("2026-12-01T11:00:00Z"), formatQuizTime(opens));
assert.match(formatQuizTime(opens), /1\. desember 2026/);
assert.match(formatQuizTime(opens), /12:00/);

console.log("OK: quizStatus og datohjelpere.");
