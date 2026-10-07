#!/usr/bin/env node
/**
 * Cuts the puzzle pictures of ④ おさかなパズル (names and grids from src/core/assets/puzzles.ts):
 *
 *   assets-src/images/puzzles/<name>.png → public/assets/puzzles/<name>.jpg      the whole picture
 *                                        → public/assets/puzzles/<name>-<i>.png  piece i (left to right,
 *                                                                               top to bottom): jigsaw
 *                                                                               shape (src/core/logic/jigsaw.ts),
 *                                                                               white edge; padded by the
 *                                                                               knob height on every side
 *
 * Usage: node tools/build-puzzles.mjs
 */
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { PUZZLE_SIZE, PUZZLES, pieceUrl, puzzleUrl } from '../src/core/assets/puzzles.ts';
import { pieceOutline, tabSize } from '../src/core/logic/jigsaw.ts';

const SOURCE_DIR = 'assets-src/images/puzzles';
/** White edge, relative to the piece's shorter side. */
const EDGE = 0.025;

/** A jigsaw-shaped mask and its white edge, for a piece picture padded by the knob height. */
function pieceOverlay(index, grid, size) {
  const points = pieceOutline(index, grid);
  const path = `M ${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;
  const edge = Math.max(3, Math.round(Math.min(grid.width, grid.height) * EDGE));
  const svg = (body) =>
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}">${body}</svg>`);
  return {
    mask: svg(`<path d="${path}" fill="black"/>`),
    edge: svg(`<path d="${path}" fill="none" stroke="white" stroke-width="${edge * 2}" stroke-linejoin="round"/>`),
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
  const tab = tabSize(width, height);
  // The picture with a transparent margin, so border pieces can be cut with the same padding.
  const padded = await sharp(whole)
    .ensureAlpha()
    .extend({ top: tab, bottom: tab, left: tab, right: tab, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const size = { width: width + tab * 2, height: height + tab * 2 };
  for (let i = 0; i < cols * rows; i++) {
    const { mask, edge } = pieceOverlay(i, { cols, rows, width, height }, size);
    await sharp(padded)
      .extract({ left: (i % cols) * width, top: Math.floor(i / cols) * height, ...size })
      .composite([
        { input: mask, blend: 'dest-in' },
        { input: edge, blend: 'atop' },
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
