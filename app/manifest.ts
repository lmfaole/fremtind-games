import type { MetadataRoute } from "next";

// Må være statisk for `output: "export"`.
export const dynamic = "force-static";

// Jøkuls mørke sidefarge. Forsiden er mørk, så splash og adressefelt matcher den.
const DARK = "#0E0D0C";

const manifest = (): MetadataRoute.Manifest => ({
    id: "/",
    name: "fremtind.games – Norge og Sverige",
    short_name: "fremtind.games",
    description: "En quiz om Norge og Sveriges popkultur og historie.",
    lang: "nb",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["games", "entertainment"],
    theme_color: DARK,
    background_color: DARK,
    icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
        },
    ],
});

export default manifest;
