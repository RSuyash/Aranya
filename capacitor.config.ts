import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.terra.platform',
  appName: 'Terra',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#050814",
      showSpinner: true,
      spinnerColor: "#56ccf2",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050814",
      overlaysWebView: false,
    }
  }
};

export default config;
