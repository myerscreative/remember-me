import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Use static export for mobile builds, standalone for web
  output: process.env.NEXT_PUBLIC_BUILD_MODE === 'static' ? 'export' : 'standalone',
  images: {
    unoptimized: true,
  },
  // Trailing slashes for Capacitor compatibility
  trailingSlash: true,
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
