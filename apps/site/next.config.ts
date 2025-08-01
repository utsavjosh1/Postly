import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Add these debug options temporarily
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole: false,
  },
  // experimental: {
    // reactStrictMode: false,
  // }
};

export default nextConfig;