import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {"/*": ["./src/assets/fonts/*.woff"]},
  partialPrefetching: true,
};

export default nextConfig;
