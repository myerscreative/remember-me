import type { NextConfig } from "next";
import withPWA from "next-pwa";

// Mobile build configuration - static export without API routes
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Skip API routes during static export
  typescript: {
    ignoreBuildErrors: false,
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
