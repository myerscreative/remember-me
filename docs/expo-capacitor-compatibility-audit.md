# Expo / Capacitor compatibility audit

Audit date: 2025-03-03. This repo is **Next.js + Capacitor** (web export in `out`, native via Capacitor). There is no React Native or Expo app in this repository.

## 1. Bare React Native imports and Expo Go

- **Status:** No issues.
- **Finding:** No `react-native` imports anywhere. The app is Next.js (React DOM); mobile is served as a static web app inside Capacitor’s WebView. No native modules that would break Expo Go.

**If you add an Expo app later:** Prefer Expo APIs over bare React Native (e.g. `expo-secure-store`, `expo-camera`). Do not import from `react-native` for features that have Expo equivalents.

## 2. Native module mismatches

- **Status:** N/A.
- **Finding:** No React Native native modules in this codebase. Capacitor plugins (`@capacitor/camera`, `@capacitor/filesystem`, etc.) are used for native features in the existing mobile shell and do not affect a future Expo app unless you share code that calls Capacitor.

**If you add Expo:** Use Expo modules (e.g. `expo-camera`, `expo-file-system`) in the Expo app and keep Capacitor-specific code behind a “web vs native” check or separate entry points.

## 3. Safe area handling

- **Status:** Implemented.
- **Changes made:**
  - **Viewport:** `viewportFit: "cover"` set in `app/(main)/layout.tsx` so iOS provides `env(safe-area-inset-*)` in the WebView.
  - **CSS variables:** In `app/globals.css`, `:root` defines `--safe-area-inset-top/right/bottom/left` using `env(safe-area-inset-*, 0px)` so they work in Capacitor/PWA and fall back to 0 on desktop.
  - **Utilities:** `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.safe-insets-x`, `.safe-insets-y` added in `@layer utilities` to apply those insets.
  - **Layout:** `MobileHeader` uses `pt-safe`, `pl-safe`, `pr-safe` so the header respects notch and side insets. `BottomNav` already used `pb-safe`; it now uses the new utility. Main content uses `pb-20` on mobile so content clears the fixed bottom nav (which has `pb-safe`).

**Expo equivalent:** In an Expo app, wrap the tree with `SafeAreaProvider` and use `useSafeAreaInsets()` from `expo-safe-area-context` for the same insets. The same logical insets (top, bottom, left, right) are applied; only the implementation (CSS env vs React context) differs.

## 4. Platform.OS usage

- **Status:** None to remove or standardize.
- **Finding:** No `Platform.OS` or `Platform.select` usage. Layout and visibility use responsive Tailwind (`md:...`) and `className` only.

**Guideline:** Prefer responsive CSS and shared components over `Platform.OS`; use it only when you must branch on iOS/Android in a future Expo app.

## Summary

| Area                    | Result |
|-------------------------|--------|
| Bare RN imports        | None present; Expo Go safe. |
| Native module mismatches| N/A (no RN native modules). |
| Safe area              | Applied via CSS env + utilities; layout and nav updated. |
| Platform.OS             | Not used; no change. |

The codebase is compatible with Expo-managed workflows: no bare RN or problematic native usage, and safe areas are handled in a way that aligns with `expo-safe-area-context` semantics for a future Expo app.
