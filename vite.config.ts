import { defineConfig } from 'vite';
import { assetWatch } from './tools/vite-asset-watch.mjs';

export default defineConfig({
  // Relative paths so the built files load inside the Android app.
  base: './',
  // The Android build writes copies of the page under android/; they must not reload the browser.
  server: { port: 5173, watch: { ignored: ['**/android/**', '**/release/**'] } },
  // Dev only: a saved picture in assets-src/images is rebuilt and the page reloads.
  plugins: [assetWatch()],
  build: {
    // The oldest target device (Android 9) may ship with a Chrome 69 WebView.
    target: ['chrome69'],
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
