import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.69374dacb3db4d73b2ba107f3552df67',
  appName: 'bro-sahib-ai',
  webDir: 'dist',
  server: {
    url: 'https://69374dac-b3db-4d73-b2ba-107f3552df67.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
