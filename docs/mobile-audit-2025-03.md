# Mobile Audit Summary

**Date:** 2025-03-03  
**Stack:** Next.js + Capacitor (iOS/Android). No React Native—mobile is web-in-WebView.

---

## 1. ESLint

- **Config:** `eslint-config-next` (includes `jsx-a11y` for accessibility). No `eslint-plugin-react-native-a11y`—that plugin targets React Native and isn’t compatible with ESLint 9. For Capacitor, `jsx-a11y` (included with Next.js) is the right choice.
- **Additions:**
  - `no-console`: warn (allow `console.warn`, `console.error`). Excluded: `scripts/`, `proxy.ts`, `test-server.js`, `debug-db.ts`.
  - `react/no-unescaped-entities`: warn (many instances; no auto-fix).
- **Critical fixes:**
  - `NetworkCard.tsx`: Moved `HighlightText` out of render to avoid component creation during render.
  - `face-match/page.tsx`, `fact-match/page.tsx`: Moved `useEffect` (timer) before early returns to comply with Rules of Hooks.
  - `prefer-const` fixes in `edit/page.tsx`, `toggle-interest.ts`, `toggle-tag.ts`.

---

## 2. Accessibility

- **Unescaped entities:** `react/no-unescaped-entities` set to `warn`. Fixed in:
  - `briefing/[id]/page.tsx`, `OverviewPanel.tsx`, `PostCallPulse.tsx`, `edit/page.tsx`, `ReviewChangesModal.tsx`, `ValuesTab.tsx`, and others.
- **Existing:** `aria-label`, `aria-hidden` in relevant components (e.g. `ProfileHeader`, `ContactCard`, `BridgeVelocityInfo`).

---

## 3. iOS/Android Parity (Web-Only Gestures)

- **Changes:** Replaced `onMouseEnter` / `onMouseLeave` with `onPointerEnter` / `onPointerLeave` for better touch support:
  - `SeedMapWidget.tsx`
  - `NurtureSidebar.tsx`
  - `TreeLeaf.tsx`
  - `GardenView.tsx`
  - `RelationshipGarden.tsx` (leaves, tooltip)
  - `GardenLeafWidget.tsx`
  - `Leaf.tsx`, `Seed.tsx`
- **Note:** Pointer Events fire for both mouse and touch, improving behavior on mobile.

---

## 4. Console Logs

- **Removed or guarded** in production paths:
  - `app/`: `garden/page.tsx`, `contacts/new/page.tsx`, `log-header-interaction.ts`, `story-actions.ts`, `EditFamilyMemberModal.tsx`, `StoryTab.tsx`, `relationship-tree/page.tsx`
  - `components/`: `PostCallPulse.tsx`, `RelationshipGarden.tsx`, `SeedMapWidget.tsx`, `NeedsNurtureList.tsx`, `IntroDrawer.tsx`, `calendar.tsx`
  - `lib/`: `calendar-sync.ts`, `levelingService.ts`
- **Kept:** `console.error` for real errors; `console.warn` for warnings.
- **ESLint:** `no-console` rule added to prevent new `console.log` in app code.

---

## 5. Remaining / Follow-Up

| Item | Notes |
|------|-------|
| `react-hooks/set-state-in-effect` | Several effects call `setState` synchronously (e.g. theme provider, game hooks). Acceptable for hydration / localStorage sync; refactor if performance issues appear. |
| `useGardenLayout` `Math.random()` | Impure during render; consider `useMemo` with stable seed. |
| `react/no-unescaped-entities` | Set to `warn`; ~40 instances remain. |
| `eslint-plugin-react-native-a11y` | Not added; requires ESLint 8 and targets React Native. For Capacitor, use `jsx-a11y` (already in Next.js). |
