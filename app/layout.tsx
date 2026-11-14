import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PostHogInit } from "@/analytics/PostHogInit";
import { applyStoredBrandScript } from "@/brand";
import { PwaInit } from "@/pwa/PwaInit";
import "./globals.scss";

export const metadata: Metadata = {
    title: "fremtind.games",
    description: "En quiz om Norge og Sveriges popkultur og historie, bygget med Jøkul.",
    // app/manifest.ts gir <link rel="manifest">. Ikonene ligger i public/icons.
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "fremtind.games", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
    themeColor: "#0E0D0C",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="nb" suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{ __html: applyStoredBrandScript }} />
        </head>
        {/* Jøkul legger fontfamilie, sidefarge og tekstfarge på klassen `jkl`,
            ikke på `body`. Uten den arver komponenter som ikke setter egen
            font-family (NavLink, Breadcrumb, Card, Expander …) nettleserfonten. */}
        <body className="jkl">
            <PostHogInit />
            <PwaInit />
            {children}
        </body>
    </html>
);

export default RootLayout;
