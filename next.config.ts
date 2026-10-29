import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Endereço usado para acessar o servidor de desenvolvimento pela rede.
  // Lista exata: não liberar origens arbitrárias com curingas.
  allowedDevOrigins: ["26.24.177.139"],
  cacheComponents: true,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {"/*": ["./src/assets/fonts/*.woff"]},
  partialPrefetching: true,
};

export default nextConfig;
