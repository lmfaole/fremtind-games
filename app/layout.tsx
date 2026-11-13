import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.scss";

export const metadata: Metadata = {
    title: "fremtind.games",
    description: "En quiz om Norge og Sveriges popkultur og historie, bygget med Jøkul.",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
    <html lang="nb">
        <body>{children}</body>
    </html>
);

export default RootLayout;
