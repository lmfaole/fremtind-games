-- Web Push-abonnement. Endepunktet er en enhets-id hos push-tjenesten, ikke en person:
-- ingen kobling til lagnavn, medlemmer, svar, sessionId eller IP.
CREATE TABLE push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- brukes som markør ved utsending i bolker
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL, -- base64url, 65 byte ukomprimert P-256-nøkkel
    auth TEXT NOT NULL, -- base64url, 16 byte
    created_at INTEGER NOT NULL -- unix-sekunder
);
