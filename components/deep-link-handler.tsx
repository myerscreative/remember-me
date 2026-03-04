"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PluginListenerHandle } from "@capacitor/core";

/**
 * Handles deep links when the app is opened via a URL (Universal Links on iOS, App Links on Android).
 * Listens for appUrlOpen and navigates to the path. Only active in native Capacitor context.
 */
export function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    let listenerHandle: PluginListenerHandle | undefined;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        listenerHandle = await App.addListener(
          "appUrlOpen",
          (event: { url: string }) => {
            // Extract path from URL, e.g. https://example.com/contacts/123 -> /contacts/123
            try {
              const url = new URL(event.url);
              const path = url.pathname.replace(/\/$/, "") || "/";
              const search = url.search || "";
              router.push(path + search);
            } catch {
              // Fallback: split by domain
              const slug = event.url.split(/(?<=\.com|\.app|\.io)/).pop();
              if (slug) router.push(slug);
            }
          }
        );
      } catch {
        // @capacitor/app not available (e.g. web-only build)
      }
    }

    setup();
    return () => {
      void listenerHandle?.remove();
    };
  }, [router]);

  return null;
}
