import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos de productos viven en Cloudflare R2.
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
  experimental: {
    serverActions: {
      // Por defecto son 1 MB: muy poco para subir una foto. Vercel igual
      // limita el cuerpo a ~4,5 MB, así que las fotos van hasta ~4 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
