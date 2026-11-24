import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client trae binarios nativos: no lo bundlees.
  serverExternalPackages: ["@libsql/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ddragon.leagueoflegends.com" },
    ],
  },
};

export default nextConfig;
