# E2E Testing Suggestions

## Current Stack: Next.js + Capacitor (Web)

This app is a **Next.js web app** wrapped in Capacitor for iOS/Android. For E2E testing, we recommend:

### Playwright (Recommended for Web)

Playwright is the standard choice for Next.js web E2E tests and works great with Capacitor's WebView (your app runs the same web bundle).

**Install:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Sample config** (`playwright.config.ts`):
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Add script to package.json:**
```json
"test:e2e": "playwright test"
```

---

## Detox (If You Add React Native / Expo)

**Detox** is for **React Native** apps only. Your current app is Next.js (React DOM) + Capacitor, so Detox is not applicable right now.

If you add an Expo/React Native app later, use this Detox config template:

### Detox Config Template (`detox.config.js`)

```javascript
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
      timeout: 120000,
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/YourApp.app",
      build: "xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build: "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: { type: "iPhone 15", os: "iOS 17.0" },
    },
    emulator: {
      type: "android.emulator",
      device: { avdName: "Pixel_6_API_34" },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
  },
};
```

**Install (for React Native only):**
```bash
npm install -D detox jest-circus
```

**Example E2E test** (`e2e/app.test.js`):
```javascript
describe("Login flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should show login screen", async () => {
    await expect(element(by.id("login-screen"))).toBeVisible();
  });
});
```
