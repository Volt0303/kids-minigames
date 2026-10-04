#!/usr/bin/env node
/**
 * Converts the large pictures that are not packed into atlases (names from src/core/assets/catalog.ts):
 *
 *   assets-src/images/backgrounds/<name>.png             → public/assets/backgrounds/<name>.jpg   (BACKGROUNDS)
 *   assets-src/images/games/<game>/<file>.png            → public/assets/games/<game>/<file>.jpg (GAME_ART)
 *                                                           (title logos stay PNG: they are transparent)
 *   assets-src/images/atlases/characters/guide-happy.png → public/assets/loading-guide.png (LOADING_GUIDE_URL)
 *   assets-src/images/atlases/characters/starfish.png    → public/assets/loading-mascot.png (LOADING_MASCOT_URL)
 *
 * A missing file is reported; the game then falls back to its plain look.
 *
 * Usage: node tools/build-images.mjs
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';
import {
  BACKGROUNDS,
  GAME_ART,
  gameArtExtension,
  LOADING_GUIDE_URL,
  LOADING_MASCOT_URL,
} from '../src/core/assets/catalog.ts';
import { removeBackground } from './lib/remove-background.mjs';

const SOURCE_DIR = 'assets-src/images';
const OUT_DIR = 'public/assets';
const JPEG_QUALITY = 86;
/** Transparent pictures are shown at most about this wide (design units), so larger sources are scaled down. */
const TITLE_MAX_WIDTH = 1600;
/** Loading-screen mascot: shown 170 px tall, so 512 px is sharp on any tablet. */
const MASCOT_SIZE = 512;

function report(label, target, info) {
  const kb = Math.round(statSync(target).size / 1024);
  return `${label.padEnd(30)} ${info.width}x${info.height}  ${kb} KB`;
}

async function convert(label, source, target) {
  if (!existsSync(source)) return `${label.padEnd(30)} missing (${source})`;
  mkdirSync(target.slice(0, target.lastIndexOf('/')), { recursive: true });
  const image = sharp(source);
  const info = target.endsWith('.png')
    ? await image
        // Transparent pictures (title logos, wave band): drop the empty border so the picture fills its space.
        .trim({ threshold: 1 })
        .resize({ width: TITLE_MAX_WIDTH, withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true })
        .toFile(target)
    : await image.flatten({ background: '#ffffff' }).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(target);
  return report(label, target, info);
}

async function main() {
  for (const name of BACKGROUNDS) {
    console.log(
      await convert(
        `background ${name}`,
        `${SOURCE_DIR}/backgrounds/${name}.png`,
        `${OUT_DIR}/backgrounds/${name}.jpg`,
      ),
    );
  }
  for (const [game, files] of Object.entries(GAME_ART)) {
    for (const file of files) {
      const target = `${OUT_DIR}/games/${game}/${file}.${gameArtExtension(file)}`;
      console.log(await convert(`game ${game}/${file}`, `${SOURCE_DIR}/games/${game}/${file}.png`, target));
    }
  }
  // Built on its own (not packed into the characters atlas), so the pre-game loading
  // screen can show it before Phaser has loaded anything.
  const loadingGuideTarget = `public/${LOADING_GUIDE_URL}`;
  console.log(await convert('loading guide', `${SOURCE_DIR}/atlases/characters/guide-happy.png`, loadingGuideTarget));
  console.log(await buildMascot(`${SOURCE_DIR}/atlases/characters/starfish.png`, `public/${LOADING_MASCOT_URL}`));
}

/** The starfish cut out of its plain background (like the atlas sprites), for games without the guide. */
async function buildMascot(source, target) {
  if (!existsSync(source)) return `${'loading mascot'.padEnd(30)} missing (${source})`;
  const info = await sharp(await removeBackground(source))
    .trim()
    .resize({ width: MASCOT_SIZE, height: MASCOT_SIZE, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(target);
  return report('loading mascot', target, info);
}

main().catch((error) => {
  console.error(`build-images: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
