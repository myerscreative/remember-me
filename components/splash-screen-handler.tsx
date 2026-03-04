"use client";

import { useEffect } from "react";

/**
 * Hides the Capacitor splash screen once the app is ready.
 * No-op on web. Prevents layout shift when content loads.
 */
export function SplashScreenHandler() {
  useEffect(() => {
    let mounted = true;
    async function hideSplash() {
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform() && mounted) {
          await SplashScreen.hide();
        }
      } catch {
        // @capacitor/splash-screen not available
      }
    }
    hideSplash();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
