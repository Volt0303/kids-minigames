import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the built files load inside the Android app.
  base: './',
  server: { port: 5173 },
  build: {
    // The oldest target device (Android 9) may ship with a Chrome 69 WebView.
    target: ['chrome69'],
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
