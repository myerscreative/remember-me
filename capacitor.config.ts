import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rememberme.app',
  appName: 'ReMember Me',
  webDir: 'out',
  // Server config for deep links when using live reload / custom host
  // server: { url: 'http://localhost:3000', cleartext: true },
  // iOS: add Associated Domains in Xcode (Signing & Capabilities)
  // e.g. applinks:yourdomain.com
  // Android: add intent-filter in AndroidManifest.xml for https scheme
  // Add .well-known/apple-app-site-association and assetlinks.json to your site
};

export default config;
