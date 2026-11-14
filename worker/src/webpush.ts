/** Web Push uten avhengigheter: VAPID (RFC 8292) og aes128gcm-kryptering (RFC 8291) med WebCrypto. */

const enc = new TextEncoder();

export function b64urlEncode(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Strengt base64url uten padding. Returnerer null ved ugyldig input. */
export function b64urlDecode(input: string): Uint8Array | null {
    if (!/^[A-Za-z0-9_-]*$/.test(input) || input.length % 4 === 1) return null;
    const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
    const bin = atob(b64);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Uint8Array {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) {
        out.set(p, o);
        o += p.length;
    }
    return out;
}

async function hkdf(
    salt: Uint8Array,
    ikm: Uint8Array,
    info: Uint8Array,
    bytes: number,
): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt, info },
        key,
        bytes * 8,
    );
    return new Uint8Array(bits);
}

export interface VapidKeys {
    publicKey: string; // base64url, 65 byte ukomprimert
    privateKey: string; // base64url, 32 byte (d)
    subject: string;
}

async function importVapidPrivateKey(publicKey: string, privateKey: string): Promise<CryptoKey> {
    const pub = b64urlDecode(publicKey);
    if (!pub || pub.length !== 65 || pub[0] !== 4) throw new Error("Ugyldig VAPID_PUBLIC_KEY");
    return crypto.subtle.importKey(
        "jwk",
        {
            kty: "EC",
            crv: "P-256",
            x: b64urlEncode(pub.slice(1, 33)),
            y: b64urlEncode(pub.slice(33, 65)),
            d: privateKey,
        },
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"],
    );
}

/** VAPID-JWT (ES256). `aud` er opprinnelsen til push-tjenesten, `exp` maks 24 timer frem. */
export async function createVapidJwt(
    keys: VapidKeys,
    endpoint: string,
    nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
    const header = b64urlEncode(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
    const claims = b64urlEncode(
        enc.encode(
            JSON.stringify({
                aud: new URL(endpoint).origin,
                exp: nowSeconds + 12 * 3600,
                sub: keys.subject,
            }),
        ),
    );
    const input = `${header}.${claims}`;
    const key = await importVapidPrivateKey(keys.publicKey, keys.privateKey);
    // WebCrypto gir r||s (64 byte), som er formatet JWS ES256 krever.
    const sig = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        enc.encode(input),
    );
    return `${input}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function vapidAuthorization(keys: VapidKeys, endpoint: string): Promise<string> {
    return `vapid t=${await createVapidJwt(keys, endpoint)}, k=${keys.publicKey}`;
}

/** Krypterer til aes128gcm (RFC 8291) i én enkelt post. Payload må være maks 3993 byte. */
export async function encryptPayload(
    p256dh: string,
    auth: string,
    plaintext: Uint8Array,
): Promise<Uint8Array> {
    const uaPublic = b64urlDecode(p256dh);
    const authSecret = b64urlDecode(auth);
    if (!uaPublic || uaPublic.length !== 65 || !authSecret || authSecret.length !== 16) {
        throw new Error("Ugyldige abonnementsnøkler");
    }
    if (plaintext.length > 3993) throw new Error("For stor payload");

    const uaKey = await crypto.subtle.importKey(
        "raw",
        uaPublic,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        [],
    );
    const asKeys = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
        "deriveBits",
    ])) as CryptoKeyPair;
    const asPublic = new Uint8Array(
        (await crypto.subtle.exportKey("raw", asKeys.publicKey)) as ArrayBuffer,
    );
    const ecdh = new Uint8Array(
        await crypto.subtle.deriveBits(
            // Runtime heter `public`; workers-types har kun `$public`.
            { name: "ECDH", public: uaKey } as unknown as SubtleCryptoDeriveKeyAlgorithm,
            asKeys.privateKey,
            256,
        ),
    );

    const prk = await hkdf(
        authSecret,
        ecdh,
        concat(enc.encode("WebPush: info\0"), uaPublic, asPublic),
        32,
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const cek = await hkdf(salt, prk, enc.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await hkdf(salt, prk, enc.encode("Content-Encoding: nonce\0"), 12);

    // 0x02 markerer siste post.
    const padded = concat(plaintext, new Uint8Array([2]));
    const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, padded),
    );

    const header = new Uint8Array(21 + asPublic.length);
    header.set(salt, 0);
    new DataView(header.buffer).setUint32(16, 4096);
    header[20] = asPublic.length;
    header.set(asPublic, 21);
    return concat(header, ciphertext);
}
