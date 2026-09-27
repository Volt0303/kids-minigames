import type * as Phaser from 'phaser';
import { atlasKey, type AtlasName } from './catalog';

/** Queues an atlas built by tools/build-atlases.mjs (public/assets/<atlas>.png/.json). */
export function loadAtlas(load: Phaser.Loader.LoaderPlugin, atlas: AtlasName): void {
  const key = atlasKey(atlas);
  if (!load.textureManager.exists(key)) load.atlas(key, `assets/${atlas}.png`, `assets/${atlas}.json`);
}
