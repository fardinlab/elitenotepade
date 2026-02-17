import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6730b41f2c7943df9728c1a9aca1ce75',
  appName: 'elitenotepade',
  webDir: 'dist',
  server: {
    url: 'https://6730b41f-2c79-43df-9728-c1a9aca1ce75.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    Camera: {
      // Permissions will be requested when camera is used
    },
  },
  android: {
    // Request permissions at install time
    useLegacyBridge: false,
  },
};

export default config;
