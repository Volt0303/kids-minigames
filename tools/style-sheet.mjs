#!/usr/bin/env node
/**
 * Builds a one-page comparison of art-style samples for the client:
 * one row per style, each subject shown on white and on the game background.
 *
 * Input:  <dir>/<style>/<subject>.png   (default dir: assets-src/style-samples)
 *         subjects: tuna, nigiri, can — plain backgrounds are removed automatically
 * Output: <dir>/sheet.png
 *
 * Usage: node tools/style-sheet.mjs [dir]
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { removeBackground } from './lib/remove-background.mjs';

const SUBJECTS = ['tuna', 'nigiri', 'can'];
const CELL = 340;
const LABEL_WIDTH = 140;
const PANEL_WIDTH = CELL * SUBJECTS.length;
const GAME_BACKGROUND = '#0b3d6b';

function styleDirs(dir) {
  return readdirSync(dir)
    .filter((name) => statSync(`${dir}/${name}`).isDirectory())
    .filter((name) => SUBJECTS.some((subject) => existsSync(`${dir}/${name}/${subject}.png`)))
    .sort();
}

function textSvg(text, width, height, { size = 44, color = '#1d3557' } = {}) {
  const safe = text.replace(/[<>&]/g, '');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="${size}" fill="${color}"
      text-anchor="middle" dominant-baseline="central">${safe}</text></svg>`);
}

async function subjectImage(file) {
  if (!existsSync(file)) return { input: textSvg('(missing)', CELL, CELL, { size: 28, color: '#8d99ae' }) };
  const trimmed = await sharp(await removeBackground(file))
    .trim()
    .toBuffer();
  const input = await sharp(trimmed)
    .resize({ width: CELL - 40, height: CELL - 40, fit: 'inside' })
    .png()
    .toBuffer();
  return { input };
}

async function rowLayers(dir, style, top) {
  const layers = [
    { input: textSvg(style, LABEL_WIDTH, CELL), left: 0, top },
    {
      input: { create: { width: PANEL_WIDTH, height: CELL, channels: 4, background: GAME_BACKGROUND } },
      left: LABEL_WIDTH + PANEL_WIDTH,
      top,
    },
  ];
  for (const [i, subject] of SUBJECTS.entries()) {
    const { input } = await subjectImage(`${dir}/${style}/${subject}.png`);
    const { width, height } = await sharp(input).metadata();
    for (const panel of [0, 1]) {
      const left = LABEL_WIDTH + panel * PANEL_WIDTH + i * CELL + Math.round((CELL - width) / 2);
      layers.push({ input, left, top: top + Math.round((CELL - height) / 2) });
    }
  }
  return layers;
}

async function main() {
  const dir = process.argv[2] ?? 'assets-src/style-samples';
  const styles = styleDirs(dir);
  if (styles.length === 0) throw new Error(`no samples found in ${dir}/<style>/{${SUBJECTS.join(',')}}.png`);

  const layers = [];
  for (const [row, style] of styles.entries()) layers.push(...(await rowLayers(dir, style, row * CELL)));
  const width = LABEL_WIDTH + PANEL_WIDTH * 2;
  await sharp({ create: { width, height: CELL * styles.length, channels: 4, background: '#ffffff' } })
    .composite(layers)
    .png()
    .toFile(`${dir}/sheet.png`);
  console.log(`style-sheet: ${styles.join(', ')} → ${dir}/sheet.png`);
}

main().catch((error) => {
  console.error(`style-sheet: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
