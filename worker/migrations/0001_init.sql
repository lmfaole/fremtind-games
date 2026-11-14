-- Én rad per besvarelse. Ingen persondata: session_id er en tilfeldig uuid fra klienten.
CREATE TABLE answers (
    session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    variant TEXT,
    answer_keys TEXT NOT NULL, -- JSON-array av normaliserte svarnøkler
    created_at INTEGER NOT NULL, -- unix-sekunder
    PRIMARY KEY (session_id, question_id)
);

CREATE INDEX answers_question_variant ON answers (question_id, variant);

-- Forhåndsaggregert, slik at statistikk ikke må skanne answers.
CREATE TABLE counts (
    question_id TEXT NOT NULL,
    answer_key TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (question_id, answer_key)
);

CREATE TABLE totals (
    question_id TEXT NOT NULL PRIMARY KEY,
    total INTEGER NOT NULL DEFAULT 0
);
