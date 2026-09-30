import type * as Phaser from 'phaser';
import { atlasKey, backgroundKey, type AtlasName, type BackgroundName } from './catalog';

/** Queues an atlas built by tools/build-atlases.mjs (public/assets/<atlas>.png/.json). */
export function loadAtlas(load: Phaser.Loader.LoaderPlugin, atlas: AtlasName): void {
  const key = atlasKey(atlas);
  if (!load.textureManager.exists(key)) load.atlas(key, `assets/${atlas}.png`, `assets/${atlas}.json`);
}

/** Queues a background built by tools/build-images.mjs (public/assets/backgrounds/<name>.jpg). */
export function loadBackground(load: Phaser.Loader.LoaderPlugin, name: BackgroundName): void {
  const key = backgroundKey(name);
  if (!load.textureManager.exists(key)) load.image(key, `assets/backgrounds/${name}.jpg`);
}
