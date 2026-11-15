import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf runs on the server only, as a normal Node package.
  serverExternalPackages: ["@react-pdf/renderer"],
  // PDF fonts and the content library are read from disk at runtime.
  outputFileTracingIncludes: {
    "/r/[token]": ["./assets/fonts/**", "./public/brand/**", "./public/content/**"],
    "/api/cron/dispatch": ["./assets/fonts/**", "./public/brand/**", "./public/content/**"],
    "/account": ["./assets/fonts/**", "./public/brand/**", "./public/content/**"],
  },
};

export default nextConfig;
