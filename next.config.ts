import type { NextConfig } from "next";

// Nettstedet serves fra rota av fremtind.games (se public/CNAME), så ingen basePath.
const nextConfig: NextConfig = {
    output: "export",
    images: { unoptimized: true },
    trailingSlash: true,
};

export default nextConfig;
