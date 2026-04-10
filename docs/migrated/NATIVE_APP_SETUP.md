# Agent Lee Native App Setup Guide (Capacitor Option 1)

## Status: ✅ FOUNDATION COMPLETE
- [x] `capacitor.config.ts` configured
- [x] `DeviceTelemetry.ts` integrated (device monitoring)
- [x] `NativeBridge.ts` integrated (native API bridge)
- [x] App.tsx boot sequence updated
- [x] index.html updated with PWA meta tags and Capacitor script tag
- [x] `public/manifest.json` configured (PWA installable app)
- [ ] Capacitor dependencies installed
- [ ] iOS/Android platforms generated
- [ ] Icon assets created

---

## Quick Start: Enable Native iOS/Android

### Step 1: Install Capacitor Core & CLI

```bash
npm install @capacitor/core @capacitor/cli
npm install -D @capacitor/core @capacitor/cli @types/capacitor
```

### Step 2: Install Platform-Specific Plugins

```bash
# Core Capacitor platforms
npm install @capacitor/ios @capacitor/android

# Camera & gallery
npm install @capacitor/camera

# Device information
npm install @capacitor/device

# Local notifications
npm install @capacitor/local-notifications

# App Review (App Store/Play Store)
npm install @capacitor/app-review

# Community plugins
npm install @capacitor-community/contacts
npm install @capacitor-community/email-composer
npm install @capacitor-community/sms
npm install @capacitor-community/calendar
```

### Step 3: Build Web Distribution

```bash
npm run build
```

This creates the `dist/` folder that Capacitor will wrap as native apps.

### Step 4: Initialize Capacitor

```bash
npx cap init
```

Answer the prompts:
- **App ID:** `com.leeways.agentlee` (or your domain)
- **App Name:** `Agent Lee`
- **Web Directory:** `dist`

This generates `capacitor.config.ts` (already created, but this confirms it).

### Step 5: Add iOS Platform

Requires: **macOS** + **Xcode**

```bash
npx cap add ios
```

This creates the `ios/` folder with an Xcode project.

### Step 6: Add Android Platform

Requires: **Android Studio** + **JDK 11+**

```bash
npx cap add android
```

This creates the `android/` folder with an Android project.

---

## Development Workflow: Web → Native Testing

### Option A: Test on Web First (Fastest)

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. All native features will:
- **On Web:** Use fallbacks (camera → file input, email → mailto://, etc.)
- **Show in Console:** Messages when fallback is used vs. native API available

### Option B: Sync Changes to Native

After modifying web code:

```bash
npm run build             # Build web distribution
npx cap sync             # Copy to iOS/Android projects
```

Then open platforms in their IDEs:

**iOS:**
```bash
npx cap open ios
```
Opens Xcode. Select simulator or physical iPhone, then build/run.

**Android:**
```bash
npx cap open android
```
Opens Android Studio. Select emulator or physical Android device, then build/run.

---

## What Each Module Does

### DeviceTelemetry (`core/DeviceTelemetry.ts`)
Monitors device capabilities in real-time:
- **Battery:** Level (0-100%), charging status, time estimate
- **Network:** Connection type (WiFi/4G/5G/none), speed estimates
- **Storage:** Total quota, used space, percentage
- **Memory:** JavaScript heap usage
- **Screen:** Resolution, DPI, orientation
- **Platform:** OS (iOS/Android/web), hardware concurrency
- **Permissions:** microphone, camera, location, calendar, contacts, photos

**Usage in Components:**
```tsx
import { DeviceTelemetry } from '@/core/DeviceTelemetry';

const deviceTelemetry = DeviceTelemetry.getInstance();

// Subscribe to battery changes
const unsub = deviceTelemetry.subscribe('battery', (status) => {
  console.log(`Battery: ${status.battery.level}% (charging: ${status.battery.isCharging})`);
});

// Check permissions
deviceTelemetry.checkPermissions().then(perms => {
  console.log('Available permissions:', perms);
});

// Cleanup on unmount
unsub();
```

### NativeBridge (`core/NativeBridge.ts`)
Wraps Capacitor plugins with web fallbacks:
- **Camera:** Take photo (native) or file input (web)
- **Contacts:** List device contacts (iOS/Android) or read CSV (web)
- **Email:** Launch mail app (native) or mailto:// (web)
- **SMS:** Launch message app (native) or sms:// (web)
- **Calendar:** Create event (native) or open system calendar (web)
- **Notifications:** Push notification (native) or Notification API (web)
- **Device ID:** Unique per install (native) or random UUID (web)
- **App Review:** Trigger store review dialog

**Usage in Components:**
```tsx
import { NativeBridge } from '@/core/NativeBridge';

const nativeBridge = NativeBridge.getInstance();

// Check if running as native app
if (nativeBridge.isNative()) {
  console.log(`Running on ${nativeBridge.getPlatform()}`);
}

// Take a photo
const photo = await nativeBridge.takePhoto();
console.log('Photo saved at:', photo.webPath);

// Send email (delegates to native mail app)
await nativeBridge.sendEmail({
  to: 'user@example.com',
  subject: 'From Agent Lee',
  body: 'Hello from the app!',
});

// Get contacts (iOS/Android only)
const contacts = await nativeBridge.getContacts();
contacts.forEach(c => console.log(c.name, c.email));

// Listen for errors
eventBus.on('native:camera-error', ({ error }) => {
  console.error('Camera failed:', error);
});
```

---

## PWA Installation (Web)

### User Steps:
1. Open Agent Lee in Chrome/Safari/Edge
2. Click the **Install** button in address bar (or **Share** → **Add to Home Screen**)
3. App appears on home screen
4. Tap icon to launch full-screen app without browser UI

### What PWA Provides:
- ✅ Installable from web
- ✅ Full-screen mode (hide address bar)
- ✅ Custom app icon on home screen
- ✅ Shortcut links (Voice Command, Memory Lake)
- ✅ Share target (receive files from system share)
- ✅ Works offline with service worker
- ❌ No native APIs (camera, contacts, etc.) — use web fallbacks

### Required Assets for App Store Listings:
- `public/192x192.png` - Home screen icon
- `public/512x512.png` - App store icon
- `public/maskable-192x192.png` - Maskable icon (adaptive Android)
- `public/screenshots/540x720.jpg` - Mobile screenshot
- `public/screenshots/1280x720.jpg` - Tablet screenshot

---

## Next Steps

**Immediate (This Week):**
1. Run `npm install` for Capacitor
2. Test on web: `npm run dev`
3. Test PWA installation in Chrome

**Short-term (This Month):**
1. Create icon assets
2. Generate iOS/Android with `npx cap add ios/android`
3. Test on physical device or simulator
4. Verify each native feature works

**Medium-term (Pre-Launch):**
1. Set up code signing (iOS AppleID, Android keystore)
2. Test app store submission process
3. Configure push notifications (APNs + FCM)
4. Performance optimization for lower-end devices

**Long-term (Post-Launch):**
1. Submit to Apple App Store
2. Submit to leeway Play
3. Gather telemetry (DeviceTelemetry logs)
4. Monitor app reviews/crashes
5. Plan updates and new features

---

## Troubleshooting

### Plugins Not Found on Native
**Problem:** Camera/Contacts/Email show "not available" on iOS/Android

**Solution:**
```bash
npm run build
npx cap sync         # Copies updated code to native projects
npx cap open ios     # Rebuild in Xcode
npx cap open android # Rebuild in Android Studio
```

### Permission Denied
**Problem:** Camera/Contacts/Location request rejected

**iOS:** Settings → Agent Lee → Toggle permissions
**Android:** Settings → Apps → Agent Lee → Permissions

### Build Fails in Xcode
**Problem:** CocoaPods dependencies not resolved

**Solution:**
```bash
cd ios/App
pod repo update
pod install
```

### Build Fails in Android Studio
**Problem:** Gradle sync fails

**Solution:**
```bash
cd android
./gradlew clean
./gradlew build
```

### App Crashes on Device
**Check logs:**
```bash
# iOS
npx cap doctor  # Diagnose issues
open ios/App/App.xcworkspace  # View XCode logs

# Android
npx cap doctor
# Open Android Studio Logcat after connecting device
```

---

## Config Reference

### capacitor.config.ts
- **appId:** `com.leeways.agentlee` (reverse domain format)
- **webDir:** `dist` (Vite output folder)
- **bundledWebRuntime:** `false` (Capacitor provides web view)
- **Plugins:**
  - `SplashScreen`: Auto-hide splash after load
  - `PushNotifications`: Alert + sound + badge
  - `LocalNotifications`: Custom icon + sound

### manifest.json (PWA)
- **name:** Agent Lee
- **display:** `standalone` (hides browser UI)
- **theme_color:** `#00FFFF` (cyan neon)
- **start_url:** `/Mr-Android-Agent-Lee_OS/`
- **icons:** 192x192, 512x512, maskable variants
- **shortcuts:** Voice Command, Memory Lake
- **share_target:** Receive shared files

---

## Architecture Overview

```
Agent Lee OS
├── Web (PWA)
│   ├── Browser (Chrome/Safari/Edge)
│   ├── Progressive Web App (installable)
│   └── Fallback APIs (file input, mailto, sms://)
│
├── iOS (via Capacitor)
│   ├── React Native Web View
│   ├── Capacitor Bridge → Native APIs
│   │   ├── Camera
│   │   ├── Contacts
│   │   ├── Email Composer
│   │   ├── SMS
│   │   ├── Calendar
│   │   ├── Local Notifications
│   │   └── Device ID
│   └── Xcode Project (ios/)
│
└── Android (via Capacitor)
    ├── React Native Web View
    ├── Capacitor Bridge → Native APIs
    │   └── (same plugins as iOS)
    └── Android Studio Project (android/)
```

All three versions share the same React/TypeScript codebase.  
Platform detection happens at runtime via `nativeBridge.getPlatform()`.

---

## Resources

- **Capacitor Docs:** https://capacitorjs.com
- **Plugin Directory:** https://capacitorjs.com/docs/plugins
- **iOS Setup:** https://capacitorjs.com/docs/ios/configuration
- **Android Setup:** https://capacitorjs.com/docs/android/configuration
- **App Signing:** https://capacitorjs.com/docs/ios/app-signing
- **Play Store Submission:** https://play.leeway.com/console
- **App Store Submission:** https://developer.apple.com/app-store/

---

**Last Updated:** April 6, 2026
**Status:** Foundation Complete, Ready for Plugin Installation

