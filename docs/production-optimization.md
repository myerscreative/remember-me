# Production optimization guide

**Stack:** Next.js 16 + Capacitor. No Expo in this repo (use `depcheck` / Next.js bundle analysis instead of `expo-doctor`).

---

## 1. Dependency analysis (depcheck)

Run:

```bash
npx depcheck --ignores="@types/*,eslint,eslint-config-next,jest,jest-environment-jsdom,@playwright/test,@testing-library/*,tailwindcss,@tailwindcss/postcss,tw-animate-css,ts-node"
```

### Unused dependencies (optional to remove)

| Package | Note |
|--------|------|
| `@capacitor/camera` | Not used in JS; photos via `<input type="file">`. Remove if you won’t add native camera. |
| `@capacitor/filesystem` | Not imported in app code. Remove if you don’t need native file read/write. |
| `@capacitor/haptics` | Not used. Remove if you don’t need haptic feedback. |
| `@capacitor/keyboard` | Not used. Remove if you don’t need keyboard plugin. |
| `@capacitor/share` | Not used. Remove if you don’t need native share. |
| `@capacitor/status-bar` | Not used. Remove if you don’t need status bar control. |

**Keep:** `@capacitor/ios` — required for iOS builds. Other Capacitor plugins (`@capacitor/app`, `@capacitor/splash-screen`, `@capacitor/core`, `@capacitor/cli`) are used.

To remove optional plugins:

```bash
npm uninstall @capacitor/camera @capacitor/filesystem @capacitor/haptics @capacitor/keyboard @capacitor/share @capacitor/status-bar
```

### Missing dependency

- **dotenv** — referenced by `scripts/check-schema.ts`. Add if you run that script:  
  `npm install -D dotenv`

---

## 2. Tree-shaking suggestions

- **Framer Motion:** Use named imports (`import { motion, AnimatePresence } from 'framer-motion'`). Already used; avoid `import * as FM from 'framer-motion'`.
- **Lucide:** Use named imports per icon (`import { Loader2, ArrowLeft } from 'lucide-react'`). Already used; avoids pulling the full set.
- **Radix:** You’re using specific primitives; no change needed.
- **Barrel files:** Prefer importing from the actual module (e.g. `@/components/ui/button`) instead of a barrel that re-exports many components, so bundler can tree-shake.
- **googleapis:** Only `lib/calendar/google-calendar.ts` uses it. Lazy-load that module (e.g. dynamic import) when implementing calendar features if you want to reduce initial bundle.

---

## 3. Lazy-loading heavy screens

Implemented in the app:

- **Relationship Tree:** `RelationshipTree`, `TreeStatsPanel`, `TreeFilters`, `ActionPanel` loaded with `next/dynamic` (SSR off, loading fallback).
- **Garden:** `NetworkGraphView` (react-force-graph-2d) already loaded with `next/dynamic`.
- **Practice / Web Recall:** `WebRecallGame` loaded with `next/dynamic`.
- **Admin dashboard:** Chart and analytics components loaded with `next/dynamic`.

Next.js already code-splits by route; the above keeps heavy *components* out of the main chunk until their route is visited.

---

## 4. Image optimization (no Expo)

There is no Expo in this project, so **expo-optimize** and **expo-doctor** do not apply. Use Next.js + Sharp instead.

### Current setup

- **next.config.ts:** `images: { unoptimized: true }` (used for static export / Capacitor).
- **sharp** is in `devDependencies` (used by Next image optimization when enabled).

### Recommendations

1. **Use `next/image`** for all images so you get automatic format/sizing when optimization is on.
2. **Re-enable image optimization** when not building a fully static export: set `images: { unoptimized: false }` (or remove the option) so Next uses Sharp for resizing and WebP/AVIF.
3. **Compress assets before commit:** For PNG/JPEG in `public/` or `app/`, run a one-off compression (e.g. [sharp-cli](https://github.com/vseventer/sharp-cli) or [imagemin](https://github.com/imagemin/imagemin)):
   ```bash
   npx sharp-cli compress public/*.png -o public/ -f webp
   ```
   Or add a script in `package.json`:
   ```json
   "scripts": {
     "optimize:images": "node scripts/optimize-images.js"
   }
   ```
   with a small script that uses `sharp` to resize/compress images in `public/` (e.g. max width 1920, quality 80, output WebP where appropriate).
4. **Current assets:** Only a few SVGs in `public/` (e.g. `file.svg`, `vercel.svg`, `window.svg`). SVGs don’t need Sharp; keep them small and avoid embedding large bitmaps.

---

## 5. Bundle analysis (optional)

To see what’s in each chunk:

```bash
npm run build -- --profile
# or
ANALYZE=true npm run build
```

Then use [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) if you add it to `next.config.ts` for a visual report.
