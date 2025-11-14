# ReMember Me - Complete Deployment Guide

## 🎉 Current Status: iOS Platform Ready!

The iOS platform has been successfully set up with Capacitor. The Xcode project is ready for configuration and building.

---

## 📱 Deployment Architecture

### Recommended Multi-Platform Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Single Next.js Codebase               │
└─────────────────┬───────────────────────┬────────────────┘
                  │                       │
        ┌─────────▼────────┐    ┌────────▼─────────┐
        │   Web Deployment │    │  Mobile Deployment│
        │   (Vercel/Netlify│    │   (Capacitor)    │
        └──────────────────┘    └──────────────────┘
                  │                       │
        ┌─────────▼────────┐    ┌────────▼─────────┐
        │  • Full Next.js  │    │  • iOS App Store │
        │  • API Routes    │    │  • Android Play  │
        │  • SSR/ISR       │    │  • Calls Web API │
        │  • PWA Install   │    │  • Native Features│
        └──────────────────┘    └──────────────────┘
```

---

## 🌐 Web Deployment (Primary)

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- OPENAI_API_KEY (for AI features)
- NEXT_PUBLIC_GOOGLE_CLIENT_ID (for calendar)
- GOOGLE_CLIENT_SECRET
- NEXT_PUBLIC_MICROSOFT_CLIENT_ID (for calendar)
- MICROSOFT_CLIENT_SECRET
```

### Step 2: Configure Domain

1. Add your custom domain in Vercel dashboard
2. Update DNS records
3. Your app will be available at: `https://your-domain.com`

### Features Enabled:
- ✅ Full Next.js functionality
- ✅ All API routes working
- ✅ Server-side rendering
- ✅ PWA installation on desktop
- ✅ Mobile web access
- ✅ Supabase authentication
- ✅ Calendar integrations
- ✅ AI features

---

## 📱 iOS Deployment

### Current Setup:
- ✅ Capacitor installed and configured
- ✅ iOS platform created (`ios/` directory)
- ✅ Xcode project ready
- ✅ 8 native plugins installed
- ✅ Basic app structure in place

### Next Steps to Complete iOS App:

#### 1. Install Xcode (if not already installed)
Download from Mac App Store (requires macOS)

#### 2. Open Project in Xcode
```bash
npx cap open ios
```

This will open the project in Xcode.

#### 3. Configure App in Xcode

**A. General Settings (in Xcode)**
- **Display Name**: ReMember Me
- **Bundle Identifier**: com.rememberme.app
- **Version**: 1.0.0
- **Build**: 1
- **Minimum iOS Version**: 15.0 (recommended)

**B. Signing & Capabilities**
1. Select your development team
2. Enable automatic signing
3. Required capabilities:
   - Camera (for profile photos)
   - Photo Library
   - Push Notifications (optional, for reminders)

**C. App Icons**
1. Prepare icons in all required sizes:
   - 1024x1024 (App Store)
   - 180x180 (iPhone)
   - 167x167 (iPad Pro)
   - 152x152 (iPad)
   - 120x120, 87x87, 80x80, 76x76, 60x60, 58x58, 40x40, 29x29, 20x20

2. Tool to generate all sizes: https://appicon.co
3. Drag into Assets.xcassets/AppIcon.appiconset/

**D. Splash Screen**
- Capacitor provides default splash
- Customize in `ios/App/App/Assets.xcassets/Splash.imageset/`
- Recommended size: 2732x2732px

**E. Info.plist Permissions**
Already configured, but verify these entries exist:
```xml
<key>NSCameraUsageDescription</key>
<string>Take photos for contact profiles</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Choose photos for contact profiles</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save photos to your library</string>
```

#### 4. Configure API URL

**Option A: Use Deployed Web App (Recommended)**

Update `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.rememberme.app',
  appName: 'ReMember Me',
  webDir: 'out',
  server: {
    url: 'https://your-vercel-app.vercel.app',
    cleartext: false
  }
};
```

**Option B: Bundle Static Files**
```bash
# Build static pages (limitations apply)
npm run build
npx cap sync ios
```

#### 5. Build & Test

**Test in Simulator:**
1. In Xcode, select a simulator (e.g., iPhone 15 Pro)
2. Click the Play button or Cmd+R
3. App launches in iOS Simulator

**Test on Physical Device:**
1. Connect iPhone via USB
2. Select your device in Xcode
3. Click Play button
4. May need to trust developer certificate on device

#### 6. App Store Submission

**Prerequisites:**
- Apple Developer Account ($99/year)
- App Store Connect account set up
- Privacy Policy URL
- Support URL

**Steps:**
1. **Archive the app**
   - In Xcode: Product → Archive
   - Wait for build to complete

2. **Validate the build**
   - Click "Validate App"
   - Fix any issues

3. **Upload to App Store Connect**
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Upload

4. **Create App Store Listing**
   - Go to appstoreconnect.apple.com
   - Create new app
   - Fill in metadata:
     - App name
     - Subtitle
     - Description
     - Keywords
     - Screenshots (required sizes)
     - Privacy policy
     - Support URL

5. **Submit for Review**
   - Answer App Store questions
   - Set pricing (Free)
   - Submit

6. **Wait for Review**
   - Usually 1-3 days
   - Address any rejection issues

---

## 🤖 Android Deployment (Future)

When ready for Android:

```bash
# Add Android platform
npx cap add android

# Open in Android Studio
npx cap open android
```

Similar process to iOS but with Android Studio and Google Play Console.

---

## 🔧 Development Workflow

### For Web Development
```bash
npm run dev
# Visit http://localhost:3000
```

### For iOS Development
```bash
# 1. Start Next.js dev server
npm run dev

# 2. Update Capacitor config to point to local server
# capacitor.config.ts:
server: {
  url: 'http://localhost:3000',
  cleartext: true
}

# 3. Sync and open
npx cap sync ios
npx cap open ios

# 4. Run in Xcode (hot reload works!)
```

### For Production Builds
```bash
# Build Next.js
npm run build

# Sync to Capacitor
npx cap sync ios

# Open and archive in Xcode
npx cap open ios
```

---

## 📦 What's Included

### Capacitor Plugins
All installed and ready to use:

1. **@capacitor/app** - App lifecycle events
2. **@capacitor/camera** - Take/choose photos
3. **@capacitor/filesystem** - File operations
4. **@capacitor/haptics** - Haptic feedback
5. **@capacitor/keyboard** - Keyboard control
6. **@capacitor/share** - Native sharing
7. **@capacitor/splash-screen** - Splash screen control
8. **@capacitor/status-bar** - Status bar styling

### Usage Example
```typescript
import { Camera } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Take a photo
const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  resultType: CameraResultType.Uri
});

// Haptic feedback
await Haptics.impact({ style: ImpactStyle.Light });
```

---

## 🚨 Important Notes

### API Routes
- **Web deployment**: API routes work perfectly (server-side)
- **Mobile deployment**: App should call deployed web API
- Set `NEXT_PUBLIC_API_URL` to your Vercel URL in mobile builds

### Authentication
- Supabase auth works seamlessly in both web and mobile
- OAuth redirects need special configuration for mobile:
  - Update redirect URLs in Supabase dashboard
  - Add custom URL scheme in Xcode

### Environment Variables
Mobile app needs:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app
```

### Offline Support
- PWA works offline on web
- Mobile app can cache data with Capacitor Storage plugin
- Consider implementing offline-first architecture

---

## 📊 Deployment Checklist

### Web Deployment
- [ ] Deploy to Vercel
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Test all features
- [ ] Enable PWA installation
- [ ] Set up analytics (optional)

### iOS Deployment
- [ ] Open project in Xcode
- [ ] Configure bundle ID and signing
- [ ] Add app icons (all sizes)
- [ ] Customize splash screen
- [ ] Test in simulator
- [ ] Test on physical device
- [ ] Create App Store listing
- [ ] Prepare screenshots
- [ ] Write privacy policy
- [ ] Submit for review

### Android Deployment (Future)
- [ ] Add Android platform
- [ ] Configure in Android Studio
- [ ] Add app icons & splash
- [ ] Test on emulator
- [ ] Test on physical device
- [ ] Create Play Store listing
- [ ] Submit for review

---

## 🎯 Quick Commands Reference

```bash
# Web Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm start                      # Start production server

# Capacitor
npx cap add ios               # Add iOS platform
npx cap add android           # Add Android platform
npx cap sync                  # Sync web assets to native
npx cap sync ios              # Sync to iOS only
npx cap open ios              # Open in Xcode
npx cap open android          # Open in Android Studio

# Deployment
vercel                        # Deploy to Vercel
vercel --prod                 # Deploy to production
```

---

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🆘 Troubleshooting

### iOS Build Fails
- Ensure Xcode is up to date
- Run `pod install` in `ios/App/`
- Clean build folder: Product → Clean Build Folder

### Hot Reload Not Working
- Ensure `server.url` is set to `http://localhost:3000`
- Check firewall settings
- Try `npx cap sync ios` again

### App Crashes on Launch
- Check Xcode console for errors
- Verify all required permissions in Info.plist
- Ensure Capacitor plugins are properly installed

### Can't Deploy to Vercel
- Verify environment variables are set
- Check build logs for errors
- Ensure `.env.local` is not in `.gitignore`

---

## ✅ Success! Your App is Ready

You now have:
- ✅ Full-featured Next.js web app
- ✅ iOS app ready for App Store
- ✅ Android-ready architecture
- ✅ Single codebase for all platforms
- ✅ Native mobile features via Capacitor
- ✅ PWA support for desktop

**Next immediate step**: Open in Xcode and configure app icons!

```bash
npx cap open ios
```

Good luck with your App Store launch! 🚀
