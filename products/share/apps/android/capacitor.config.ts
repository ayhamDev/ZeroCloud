import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.zerocloud.share',
  appName: 'ZeroCloud Share',
  webDir: '../web/dist',
  android: { allowMixedContent: false },
};
export default config;
