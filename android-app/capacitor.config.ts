import { CapacitorConfig } from '@capacitor/cli';

/**
 * Orca Labs Pharma HRMS — Capacitor Android Configuration
 *
 * webDir points to the parent project's dist/ folder.
 * Run `npm run build:web` before `cap sync` to update the bundle.
 */
const config: CapacitorConfig = {
  appId: 'com.orcalabs.pharmahrms',
  appName: 'Orca HRMS',

  // Points to parent project's Vite build output
  webDir: '../dist',

  // ─── Server ─────────────────────────────────────────────────────────────────
  // Uncomment ONLY during active development to hot-reload from Vite dev server.
  // Replace IP with your machine's LAN IP. Remove entirely for production builds.
  //
  // server: {
  //   url: 'http://192.168.1.XXX:9590',
  //   cleartext: true,
  // },

  // ─── Android-Specific ───────────────────────────────────────────────────────
  android: {
    minWebViewVersion: 60,
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true only for debug builds
  },

  // ─── Plugin Configuration ───────────────────────────────────────────────────
  plugins: {

    // Splash Screen — matches PWA dark background
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status Bar — dark theme matching the app
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
      overlaysWebView: false,
    },

    // Camera — used by CheckInModule (selfie) & CallPhotoCaptureView
    Camera: {
      presentationStyle: 'fullscreen',
    },

    // Geolocation — used by FieldDutyModule & DashboardSnapshot
    Geolocation: {
      // handled via permissions in AndroidManifest.xml
    },

    // Push Notifications — used by MessagingModule
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Keyboard — prevents layout shift when soft keyboard opens
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },

    // Local Notifications — offline alerts
    LocalNotifications: {
      smallIcon: 'ic_stat_orca_logo',
      iconColor: '#0d9488',
    },
  },
};

export default config;
