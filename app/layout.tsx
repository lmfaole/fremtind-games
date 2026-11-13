import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";

export const metadata: Metadata = {
    title: "fremtind.games",
    description: "En quiz om Norge og Sveriges popkultur og historie, bygget med Jøkul.",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="nb">
        {/* Jøkul legger fontfamilie, sidefarge og tekstfarge på klassen `jkl`,
            ikke på `body`. Uten den arver komponenter som ikke setter egen
            font-family (NavLink, Breadcrumb, Card, Expander …) nettleserfonten. */}
        <body className="jkl">{children}</body>
    </html>
);

export default RootLayout;
