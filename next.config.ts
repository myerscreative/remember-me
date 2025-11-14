import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Use default mode - deploy to Vercel with full functionality
  // Mobile app will call the deployed API
  images: {
    unoptimized: true,
  },
  // Trailing slashes for better compatibility
  trailingSlash: true,
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
