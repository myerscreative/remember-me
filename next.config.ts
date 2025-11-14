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
  // Skip building dynamic routes for mobile - they'll be handled client-side
  ...(process.env.NEXT_PUBLIC_BUILD_MODE === 'static' && {
    exportPathMap: async function (
      defaultPathMap,
      { dev, dir, outDir, distDir, buildId }
    ) {
      // Only export static pages, skip dynamic routes
      const paths: Record<string, any> = {};
      for (const [path, route] of Object.entries(defaultPathMap)) {
        // Skip dynamic routes (those with [])
        if (!path.includes('[')) {
          paths[path] = route;
        }
      }
      return paths;
    },
  }),
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default pwaConfig(nextConfig);
