import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  // Allow console in dev scripts and test utilities
  {
    files: ["scripts/**", "proxy.ts", "test-server.js", "debug-db.ts"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // PWA generated files:
    "public/sw.js",
    "public/workbox-*.js",
    "public/worker-*.js",
    // Ignore standalone scripts:
    "scripts/**",
  ]),
]);

export default eslintConfig;
