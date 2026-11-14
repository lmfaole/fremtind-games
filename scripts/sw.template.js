/* eslint-disable no-undef */
// Service worker for fremtind.games. Malen kopieres til out/sw.js av scripts/build-sw.mjs,
// som fyller inn __VERSION__ og __PRECACHE__ fra den ferdige eksporten.

const VERSION = "__VERSION__";
const PRECACHE = "__PRECACHE__";
const PRECACHE_NAME = `fg-precache-${VERSION}`;
// Overlever versjonsbytter. Bare uforanderlige filer (fonter) havner her.
const RUNTIME_NAME = "fg-runtime";
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
    // Venter ikke på aktivering: ny versjon aktiveres først når brukeren velger «last på nytt»
    // (melding SKIP_WAITING), slik at en quiz i gang ikke bytter kode midt i.
    event.waitUntil(caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const names = await caches.keys();
            await Promise.all(
                names
                    .filter((name) => name.startsWith("fg-precache-") && name !== PRECACHE_NAME)
                    .map((name) => caches.delete(name)),
            );
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// ignoreSearch: Next henter RSC-data som /sti/index.txt?_rsc=… .
const matchCached = (request) => caches.match(request, { ignoreSearch: true });

const networkWithTimeout = (request) =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS);
        fetch(request).then(
            (response) => {
                clearTimeout(timer);
                resolve(response);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            },
        );
    });

// Nettverk først, så nye spørsmål ikke blir stale. Responsen lagres bevisst ikke: ny HTML
// peker på nye JS-filer som ikke finnes i den forhåndslastede versjonen.
const networkFirst = async (request) => {
    try {
        const response = await networkWithTimeout(request);
        if (response.ok || response.status === 404) {
            return response;
        }
        throw new Error(`status ${response.status}`);
    } catch {
        const cached = await matchCached(request);
        if (cached) {
            return cached;
        }
        if (request.mode === "navigate") {
            return (
                (await caches.match("/404.html")) ??
                (await caches.match("/")) ??
                new Response("Du er frakoblet.", {
                    status: 503,
                    headers: { "Content-Type": "text/plain; charset=utf-8" },
                })
            );
        }
        return Response.error();
    }
};

const cacheFirst = async (request, cacheName) => {
    const cached = await matchCached(request);
    if (cached) {
        return cached;
    }
    const response = await fetch(request);
    if (response.ok && cacheName) {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
    }
    return response;
};

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") {
        return;
    }
    const url = new URL(request.url);
    // Kall til andre opphav (statistikk-API, PostHog) rører vi aldri.
    // Nettleseren håndterer dem direkte, uten cache.
    if (url.origin !== self.location.origin || url.pathname === "/sw.js") {
        return;
    }

    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
        event.respondWith(cacheFirst(request));
    } else if (url.pathname.startsWith("/fonts/")) {
        event.respondWith(cacheFirst(request, RUNTIME_NAME));
    } else if (request.mode === "navigate" || url.pathname.endsWith(".txt")) {
        event.respondWith(networkFirst(request));
    } else {
        event.respondWith(cacheFirst(request).catch(() => Response.error()));
    }
});

self.addEventListener("push", (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        // Ugyldig JSON: vis en nøytral melding i stedet for å miste varselet.
    }
    const title = typeof payload.title === "string" ? payload.title : "fremtind.games";
    const options = {
        body: typeof payload.body === "string" ? payload.body : "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: typeof payload.url === "string" ? payload.url : "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const target = new URL(
        (event.notification.data && event.notification.data.url) || "/",
        self.location.origin,
    );
    // Bare lenker innenfor eget nettsted.
    if (target.origin !== self.location.origin) {
        return;
    }

    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });
            for (const client of windows) {
                if (new URL(client.url).origin === target.origin && "focus" in client) {
                    await client.focus();
                    if ("navigate" in client && client.url !== target.href) {
                        await client.navigate(target.href);
                    }
                    return;
                }
            }
            await self.clients.openWindow(target.href);
        })(),
    );
});
