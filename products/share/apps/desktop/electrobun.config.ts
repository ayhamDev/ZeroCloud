import type { ElectrobunConfig } from './.hutch/devkit/api/config/ElectrobunConfig';

export default {
  app: { name: 'ZeroCloudShare', identifier: 'app.zerocloud.share', version: '0.1.0' },
  build: {
    mainProcess: 'bun',
    bun: { entrypoint: 'src/main.ts' },
    copy: { '.prepared/ui': 'views/mainview' },
    mac: { bundleCEF: false },
    win: { bundleCEF: false },
    linux: { bundleCEF: false },
  },
} satisfies ElectrobunConfig;
