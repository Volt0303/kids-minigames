#!/usr/bin/env node
/**
 * Converts full-screen images (backgrounds) that are not packed into atlases:
 * assets-src/images/backgrounds/<name>.png → public/assets/backgrounds/<name>.jpg
 *
 * Backgrounds have no transparency, so JPEG keeps the APK small. Names come from
 * BACKGROUNDS in src/core/assets/catalog.ts; a missing file is reported and the
 * game falls back to its plain background colour.
 *
 * Usage: node tools/build-images.mjs
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { BACKGROUNDS } from '../src/core/assets/catalog.ts';

const SOURCE_DIR = 'assets-src/images/backgrounds';
const OUT_DIR = 'public/assets/backgrounds';
const JPEG_QUALITY = 86;

async function convert(name) {
  const source = `${SOURCE_DIR}/${name}.png`;
  if (!existsSync(source)) return `${name.padEnd(14)} missing (${source})`;
  const target = `${OUT_DIR}/${name}.jpg`;
  const info = await sharp(source)
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(target);
  const kb = Math.round(statSync(target).size / 1024);
  return `${name.padEnd(14)} ${info.width}x${info.height}  ${kb} KB`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const name of BACKGROUNDS) console.log(`background ${await convert(name)}`);
}

main().catch((error) => {
  console.error(`build-images: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
