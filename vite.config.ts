import { resolve } from 'path';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { desktopBudgetPlugin } from './build/desktopBudget';

// `--mode lan` serves the dev server over self-signed HTTPS so phones on the
// local network get a secure context (required for deviceorientation).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [...(mode === 'lan' ? [basicSsl()] : []), desktopBudgetPlugin()],
  build: {
    // The Gateway chunk carries Three.js (~550 kB); the Desktop never imports it. The Desktop budget plugin is the real size gate.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dev: resolve(__dirname, 'dev.html'),
      },
    },
  },
}));
