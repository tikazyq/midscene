import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundle',
    sourceMap: true,
    format: 'cjs',
    outDir: './dist/lib',
    dts: {
      respectExternal: false,
    },
    autoExternal: false,
    externals: [
      'puppeteer',
      'playwright',
      '@playwright/test',
      'inquirer',
      'http-server',
      'socket.io-client',
      'socket.io'
    ]
  }
}); 