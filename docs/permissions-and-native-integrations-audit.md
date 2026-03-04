# Permissions & Native Integrations Audit

**Audit date:** 2025-03-03  
**Stack:** Next.js + Capacitor (iOS). No Expo or React Native in this repo.

---

## 1. Permissions

### 1.1 iOS Info.plist — Missing Required Usage Strings

**Status:** Critical gaps. App Store will reject without these.

| Permission | Used By | Plist Key | Status |
|------------|---------|-----------|--------|
| Microphone | `getUserMedia({ audio: true })` in voice-recorder, audio-input-button, InteractionLogger | `NSMicrophoneUsageDescription` | ❌ **Missing** |
| Photo Library | `<input type="file" accept="image/*">` in ConnectionProfile, ProfileSidebar | `NSPhotoLibraryUsageDescription` | ❌ **Missing** |
| Camera | `@capacitor/camera` installed but **not used**; photos via file picker only | `NSCameraUsageDescription` | ⚠️ Optional now; add if you use native camera later |

**Action:** Add to `ios/App/App/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>ReMember Me uses the microphone to record voice notes and transcribe conversations.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>ReMember Me needs photo library access to add profile pictures and memories.</string>
```

### 1.2 Permission Denial Handling

| Component | API | Denial Handling | Status |
|-----------|-----|-----------------|--------|
| `InteractionLogger.tsx` | `getUserMedia` | Catches `NotAllowedError`, `PermissionDeniedError`, `NotFoundError`; shows specific toast | ✅ Good |
| `audio-input-button.tsx` | `getUserMedia` | Generic toast "Microphone access denied or not supported." | ⚠️ Minimal |
| `voice-recorder.tsx` | `getUserMedia` | `onError` callback; no explicit permission-specific handling | ⚠️ Weak |

**Recommendations:**
1. Standardize error handling across all `getUserMedia` callers.
2. Use a shared helper that maps `error.name` to user-facing messages:
   - `NotAllowedError` / `PermissionDeniedError` → “Microphone access was denied. Enable it in Settings to use voice capture.”
   - `NotFoundError` → “No microphone found.”
   - `NotSupportedError` → “Audio recording is not supported on this device.”

### 1.3 Capacitor vs Expo

This project uses **Capacitor**, not Expo. There is no `expo-permissions` or `expo-camera`.

- **Capacitor Camera** (`@capacitor/camera`): Installed but not used; photos are selected via HTML file input.
- **Capacitor** does not have a separate permissions API; plugins request permissions when first used, and web APIs (`getUserMedia`) rely on browser/WebView behavior.

---

## 2. Secure Storage

### 2.1 Current Usage

| Data | Storage | Sensitivity | Status |
|------|---------|-------------|--------|
| Calendar OAuth tokens (`calendar_provider`, `calendar_access_token`, `calendar_refresh_token`) | `localStorage` | **High** | ❌ **Insecure on native** |
| Theme preference | `localStorage` | Low | ✅ Acceptable |
| Game stats (`remember-me-stats`) | `localStorage` | Low | ✅ Acceptable |
| Garden zoom | `localStorage` | Low | ✅ Acceptable |
| `contactsViewMode` | `localStorage` | Low | ✅ Acceptable |
| `recentlyViewed` | `localStorage` | Low | ✅ Acceptable |
| `garden_view_mode` | `localStorage` | Low | ✅ Acceptable |

### 2.2 Risk: OAuth Tokens in localStorage

`lib/calendar/calendarIntegration.ts` stores OAuth tokens in `localStorage`, which:
- Is not encrypted on iOS WebView
- Can be exposed if the device is compromised or in shared-device scenarios

**Recommendation:** Use native secure storage for sensitive data when running in Capacitor.

### 2.3 Capacitor Secure Storage Options (expo-secure-store Equivalent)

Expo’s `expo-secure-store` has no direct Capacitor equivalent in core. Use a community plugin:

| Plugin | Notes |
|--------|-------|
| **@aparajita/capacitor-secure-storage** | iOS Keychain / Android Keystore; ~13k weekly downloads; MIT; Capacitor 8+ |
| **@capawesome-team/capacitor-secure-preferences** | Keychain/Keystore; requires Capawesome Insider |
| **martinkasa/capacitor-secure-storage-plugin** | Simple keychain-backed storage |

**Suggested approach:**
1. Add `@aparajita/capacitor-secure-storage` (or equivalent).
2. Create a `lib/storage/secure-storage.ts` abstraction that:
   - Uses secure storage when `Capacitor.isNativePlatform()` is true
   - Falls back to `localStorage` on web
3. Migrate OAuth tokens (and any other sensitive data) to this abstraction.

---

## 3. Offline Handling

### 3.1 Current State

- No `expo-sqlite`, `AsyncStorage`, or other offline persistence for app data.
- Data comes from Supabase; fetches require network.
- No explicit offline cache or queue for failed requests.

### 3.2 Recommendation

| Need | Solution | Priority |
|------|----------|----------|
| Lightweight key-value cache | `@capacitor/preferences` or continue using `localStorage` for non-sensitive prefs | Low |
| Offline contact/data cache | Supabase offline + `expo-sqlite` or IndexedDB (e.g. `idb`); or `@capacitor/preferences` for small datasets | Medium if users expect offline use |
| Offline queue for actions | Custom queue + retry when online; or Supabase realtime/persistence features | Medium if users log interactions offline |

**Minimal change:**  
Add `@capacitor/preferences` for preference persistence on native (theme, view mode, etc.). It persists across app restarts and is a step toward standardizing storage.

---

## 4. Summary Action Items

| # | Item | Priority |
|---|------|----------|
| 1 | Add `NSMicrophoneUsageDescription` and `NSPhotoLibraryUsageDescription` to `ios/App/App/Info.plist` | **Critical** |
| 2 | Standardize `getUserMedia` denial handling in voice-recorder and audio-input-button | High |
| 3 | Add Capacitor secure storage plugin; move OAuth tokens out of `localStorage` on native | **High** |
| 4 | Add storage abstraction (`lib/storage/secure-storage.ts`) for web vs native | High |
| 5 | Add `@capacitor/preferences` for non-sensitive preferences on native | Medium |
| 6 | Evaluate offline support (contacts, interactions) if required by product | Medium |

---

## 5. Platform Note

This repo is **Next.js + Capacitor**. Expo modules (`expo-permissions`, `expo-secure-store`, `expo-sqlite`) are for React Native/Expo projects and are not applicable here. Use Capacitor plugins or web APIs instead.
