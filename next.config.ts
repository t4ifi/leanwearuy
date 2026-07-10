import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos de productos viven en Cloudflare R2.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
