import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.mymensinghsheba.app',
  appName: 'Mymensingh Sheba',
  webDir: 'out',
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#0c3b2e',
      style: 'DARK',
    },
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 250,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: [],
    },
  },
};

export default config;
