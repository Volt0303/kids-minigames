import type { Plugin } from 'vite';

/** Dev server only: rebuilds pictures when assets-src/images changes, then reloads the page. */
export function assetWatch(): Plugin;
