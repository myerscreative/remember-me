/**
 * Detox E2E config template for React Native / Expo.
 *
 * This app is currently Next.js + Capacitor (web). Detox is for React Native only.
 * Use this config when/if you add an Expo or bare React Native app.
 *
 * For current web E2E: use Playwright (see docs/testing-e2e-suggestion.md).
 *
 * @type {import('detox').DetoxConfig}
 */
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
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/ReMemberMe.app",
      build:
        "xcodebuild -workspace ios/ReMemberMe/App.xcworkspace -scheme ReMemberMe -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build:
        "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
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
