import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["*.trycloudflare.com"],
  turbopack: { root: process.cwd() },
};

export default nextConfig;
