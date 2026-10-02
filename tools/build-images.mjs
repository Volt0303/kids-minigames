#!/usr/bin/env node
/**
 * Converts the large pictures that are not packed into atlases (names from src/core/assets/catalog.ts):
 *
 *   assets-src/images/backgrounds/<name>.png  → public/assets/backgrounds/<name>.jpg   (BACKGROUNDS)
 *   assets-src/images/games/<game>/<file>.png → public/assets/games/<game>/<file>.jpg (GAME_ART)
 *                                                (title logos stay PNG: they are transparent)
 *
 * A missing file is reported; the game then falls back to its plain look.
 *
 * Usage: node tools/build-images.mjs
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { BACKGROUNDS, GAME_ART, gameArtExtension } from '../src/core/assets/catalog.ts';

const SOURCE_DIR = 'assets-src/images';
const OUT_DIR = 'public/assets';
const JPEG_QUALITY = 86;
/** Title logos are shown at most about this wide (design units), so larger sources are scaled down. */
const TITLE_MAX_WIDTH = 1600;

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
        // Title logos: drop the empty transparent border so the letters fill the space they are given.
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
}

main().catch((error) => {
  console.error(`build-images: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
