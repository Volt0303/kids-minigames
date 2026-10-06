#!/usr/bin/env node
/**
 * Cuts the puzzle pictures of ④ おさかなパズル (names and grids from src/core/assets/puzzles.ts):
 *
 *   assets-src/images/puzzles/<name>.png → public/assets/puzzles/<name>.jpg      the whole picture
 *                                        → public/assets/puzzles/<name>-<i>.png  piece i (left to right,
 *                                                                               top to bottom): rounded
 *                                                                               corners, white edge
 *
 * Usage: node tools/build-puzzles.mjs
 */
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { PUZZLE_SIZE, PUZZLES, pieceUrl, puzzleUrl } from '../src/core/assets/puzzles.ts';

const SOURCE_DIR = 'assets-src/images/puzzles';
/** Corner radius and white edge, relative to the piece's shorter side. */
const RADIUS = 0.1;
const EDGE = 0.025;

/** A rounded-rectangle mask with a white edge drawn just inside it. */
function pieceOverlay(width, height) {
  const r = Math.round(Math.min(width, height) * RADIUS);
  const edge = Math.max(3, Math.round(Math.min(width, height) * EDGE));
  const inset = edge / 2;
  return {
    mask: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${r}" ry="${r}"/></svg>`,
    ),
    edge: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${inset}" y="${inset}" width="${width - edge}" height="${height - edge}" rx="${r - inset}" ry="${r - inset}" fill="none" stroke="white" stroke-width="${edge}"/></svg>`,
    ),
  };
}

async function cut(name, { cols, rows }) {
  const source = `${SOURCE_DIR}/${name}.png`;
  if (!existsSync(source)) return `${name.padEnd(12)} missing (${source})`;
  const whole = await sharp(source)
    .resize(PUZZLE_SIZE.width, PUZZLE_SIZE.height, { fit: 'cover' })
    .flatten({ background: '#ffffff' })
    .toBuffer();
  await sharp(whole)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(`public/${puzzleUrl(name)}`);
  const width = PUZZLE_SIZE.width / cols;
  const height = PUZZLE_SIZE.height / rows;
  const { mask, edge } = pieceOverlay(width, height);
  for (let i = 0; i < cols * rows; i++) {
    const left = (i % cols) * width;
    const top = Math.floor(i / cols) * height;
    await sharp(whole)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .composite([
        { input: mask, blend: 'dest-in' },
        { input: edge, blend: 'over' },
      ])
      .png({ compressionLevel: 9 })
      .toFile(`public/${pieceUrl(name, i)}`);
  }
  return `${name.padEnd(12)} ${cols}×${rows} pieces`;
}

async function main() {
  mkdirSync('public/assets/puzzles', { recursive: true });
  for (const [name, grid] of Object.entries(PUZZLES)) console.log(`puzzle ${await cut(name, grid)}`);
}

main().catch((error) => {
  console.error(`build-puzzles: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
