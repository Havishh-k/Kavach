import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Only intercept caching behavior for requests inside the guard namespace roughly or default
  swSrc: "src/app/guard/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// Suppress the Serwist turbopack warning
process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = "1";

const nextConfig: any = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: true
  }
};

export default withSerwist(nextConfig);
