// Genererer et VAPID-nøkkelpar (P-256, base64url) til lokal bruk.
// Kjør: node scripts/generate-vapid-keys.mjs
// Skriv aldri nøklene til en fil i repoet. Bruk `wrangler secret put` (se README) eller .dev.vars (gitignorert).
import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const priv = privateKey.export({ format: "jwk" });
const pub = publicKey.export({ format: "jwk" });
const rawPublic = Buffer.concat([
    Buffer.from([4]),
    Buffer.from(pub.x, "base64url"),
    Buffer.from(pub.y, "base64url"),
]);

console.log(`VAPID_PUBLIC_KEY=${rawPublic.toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
console.log(
    "VAPID_SUBJECT=mailto:post@fremtind.games   # bytt til din egen adresse eller en https-URL",
);
console.log(
    "# PUSH_ADMIN_TOKEN: lag et langt tilfeldig token, f.eks. `openssl rand -base64url 32`",
);
