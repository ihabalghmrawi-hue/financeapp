import type { CapacitorConfig } from '@capacitor/cli'

const BUILD_ENV = process.env.NEXT_PUBLIC_BUILD_ENVIRONMENT ?? 'production'

const IS_DEV = BUILD_ENV === 'development' || BUILD_ENV === 'staging'

const DEV_URL = process.env.CAP_SERVER_URL ?? 'http://172.27.16.1:3000'
const PROD_URL = process.env.CAP_SERVER_URL ?? 'https://financeapp-ten-liart.vercel.app'

const config: CapacitorConfig = {
  appId: 'com.ezy.erp',
  appName: 'Ezy',

  webDir: 'out',

  server: {
    url: IS_DEV ? DEV_URL : PROD_URL,
    cleartext: IS_DEV,
    hostname: IS_DEV ? 'localhost' : new URL(PROD_URL).hostname,
    androidScheme: 'https',
    allowNavigation: ['*.supabase.co'],
  },

  android: {
    allowMixedContent: IS_DEV,
    captureInput: true,
    useLegacyBridge: false,
    initialFocus: true,
  },

  ios: {
    preferredContentMode: 'mobile',
    scrollEnabled: false,
    contentInset: 'always',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },

    Keyboard: {
      resize: 'ionic' as any,
      style: 'DARK' as any,
      resizeOnFullScreen: true,
    },
  },
}

export default config
