import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  trailingSlash: false,
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
