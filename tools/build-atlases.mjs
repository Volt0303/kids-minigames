#!/usr/bin/env node
/**
 * Packs the sprites listed in src/core/assets/catalog.ts into texture atlases:
 * public/assets/<atlas>.png + <atlas>.json (Phaser JSON-hash format).
 *
 * For each sprite it uses assets-src/images/atlases/<atlas>/<name>.png when present
 * (plain background removed, trimmed and scaled to fit the catalog size), otherwise a labelled
 * placeholder, so games can be built before the final art exists.
 *
 * Usage: node tools/build-atlases.mjs
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { MaxRectsPacker } from 'maxrects-packer';
import sharp from 'sharp';
import { ATLASES } from '../src/core/assets/catalog.ts';
import { removeBackground } from './lib/remove-background.mjs';

const SOURCE_DIR = 'assets-src/images/atlases';
const OUT_DIR = 'public/assets';
const MAX_SIZE = 2048;
const PADDING = 4;

/** A stable colour per sprite name, so placeholders are easy to tell apart. */
function placeholderColor(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360}, 70%, 68%)`;
}

function placeholderSvg(name, { width, height }) {
  const fill = placeholderColor(name);
  const font = Math.max(14, Math.min(34, Math.floor(width / (name.length * 0.62))));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="${Math.min(width, height) / 4}"
      fill="${fill}" stroke="#1d3557" stroke-width="6" stroke-dasharray="18 10"/>
    <text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="${font}" fill="#1d3557"
      text-anchor="middle" dominant-baseline="central">${name}</text>
  </svg>`;
}

/** Final art scaled to fit the catalog box, or a placeholder of exactly that size. */
async function renderSprite(atlas, name, spec) {
  const source = `${SOURCE_DIR}/${atlas}/${name}.png`;
  if (existsSync(source)) {
    const { data, info } = await sharp(await removeBackground(source))
      .trim()
      .resize({ width: spec.width, height: spec.height, fit: 'inside' })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { name, buffer: data, width: info.width, height: info.height, placeholder: false };
  }
  const buffer = await sharp(Buffer.from(placeholderSvg(name, spec)))
    .png()
    .toBuffer();
  return { name, buffer, width: spec.width, height: spec.height, placeholder: true };
}

function warnAboutUnknownFiles(atlas, specs) {
  const dir = `${SOURCE_DIR}/${atlas}`;
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (extname(file) === '.png' && !(basename(file, '.png') in specs)) {
      console.warn(`  warn  ${dir}/${file} is not in the catalog and was skipped`);
    }
  }
}

async function buildAtlas(atlas, specs) {
  const sprites = await Promise.all(Object.entries(specs).map(([name, spec]) => renderSprite(atlas, name, spec)));
  const packer = new MaxRectsPacker(MAX_SIZE, MAX_SIZE, PADDING, { smart: true, pot: false, square: false });
  packer.addArray(sprites.map((s) => ({ width: s.width, height: s.height, data: s })));
  if (packer.bins.length !== 1) throw new Error(`atlas "${atlas}" does not fit in ${MAX_SIZE}px — split the group`);

  const bin = packer.bins[0];
  const frames = {};
  const layers = bin.rects.map(({ x, y, width, height, data }) => {
    frames[data.name] = {
      frame: { x, y, w: width, h: height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: width, h: height },
      sourceSize: { w: width, h: height },
    };
    return { input: data.buffer, left: x, top: y };
  });

  await sharp({
    create: { width: bin.width, height: bin.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toFile(`${OUT_DIR}/${atlas}.png`);
  const meta = { image: `${atlas}.png`, format: 'RGBA8888', size: { w: bin.width, h: bin.height }, scale: '1' };
  writeFileSync(`${OUT_DIR}/${atlas}.json`, JSON.stringify({ frames, meta }));

  warnAboutUnknownFiles(atlas, specs);
  const placeholders = sprites.filter((s) => s.placeholder).map((s) => s.name);
  return { atlas, size: `${bin.width}x${bin.height}`, total: sprites.length, placeholders };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const [atlas, specs] of Object.entries(ATLASES)) results.push(await buildAtlas(atlas, specs));

  for (const { atlas, size, total, placeholders } of results) {
    const art = total - placeholders.length;
    console.log(
      `${atlas.padEnd(8)} ${size.padEnd(10)} art ${art}/${total}` + (art < total ? '  (rest placeholders)' : ''),
    );
  }
}

main().catch((error) => {
  console.error(`build-atlases: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
