import type * as Phaser from 'phaser';
import { atlasKey, gameArtExtension, gameArtKey, type AtlasName, type GameArtFile, type GameArtGame } from './catalog';

/** Queues an atlas built by tools/build-atlases.mjs (public/assets/<atlas>.png/.json). */
export function loadAtlas(load: Phaser.Loader.LoaderPlugin, atlas: AtlasName): void {
  const key = atlasKey(atlas);
  if (!load.textureManager.exists(key)) load.atlas(key, `assets/${atlas}.png`, `assets/${atlas}.json`);
}

/** Queues one of a game's own pictures (public/assets/games/<game>/<file>.jpg|png). */
export function loadGameArt(load: Phaser.Loader.LoaderPlugin, game: GameArtGame, file: GameArtFile): void {
  const key = gameArtKey(game, file);
  if (!load.textureManager.exists(key)) load.image(key, `assets/games/${game}/${file}.${gameArtExtension(file)}`);
}
