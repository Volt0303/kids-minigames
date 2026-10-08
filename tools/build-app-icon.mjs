#!/usr/bin/env node
/**
 * Android launcher icon for the game being built (VITE_GAME), from
 * assets-src/images/app-icons/<id>.png: either a square picture on a flat background colour, or a
 * finished icon (a rounded square with its own frame and transparent corners), which is drawn
 * filling the launcher's visible area on the colour of its own frame.
 *
 *   android/app/src/main/res/mipmap-<density>/ic_launcher_foreground.png  adaptive icon (Android 8+): the
 *                                                                        picture inside the safe zone, so
 *                                                                        no launcher mask cuts it off
 *   android/app/src/main/res/mipmap-<density>/ic_launcher.png             older launchers: rounded square
 *   android/app/src/main/res/mipmap-<density>/ic_launcher_round.png       older launchers: circle
 *   android/app/src/main/res/values/ic_launcher_background.xml           the picture's own background colour
 *
 * res/mipmap-anydpi-v26/ic_launcher*.xml (committed) put the adaptive icon together. These files are
 * generated and git-ignored; `npm run assets` (part of every build) writes them. Development builds
 * without a game get a plain light-blue icon.
 *
 * Usage: VITE_GAME=<id> node tools/build-app-icon.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { isGameId } from '../src/games/registry.ts';

const RES = 'android/app/src/main/res';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
/** Adaptive icon: 108 dp layers; inside the central 66 dp is never masked. The pictures reach
 * their corners (e.g. the magnifier handle), so they get a little less, to clear a circle mask. */
const ADAPTIVE_DP = 108;
const PICTURE_DP = 60;
/** A finished icon fills the 72 dp a launcher shows of the 108 dp layer (a touch more, so no gap). */
const FINISHED_DP = 76;
/** Legacy icon: 48 dp, picture inset a little like Android's own icons. */
const LEGACY_DP = 48;
const LEGACY_INSET = { square: 0.92, round: 0.84 };
const DEV_COLOR = '#dcf2ff';

const game = process.env.VITE_GAME;
const gameId = isGameId(game) ? game : undefined;

function hex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Average colour of a finished icon's frame: the opaque pixels along its outer edge. */
async function frameColor(picture) {
  const size = 64;
  const band = 3;
  const { data } = await sharp(picture).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const sum = { r: 0, g: 0, b: 0, n: 0 };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = x < band || y < band || x >= size - band || y >= size - band;
      const i = (y * size + x) * 4;
      if (!edge || data[i + 3] < 200) continue;
      sum.r += data[i];
      sum.g += data[i + 1];
      sum.b += data[i + 2];
      sum.n++;
    }
  }
  if (sum.n === 0) return '#ffffff';
  return hex({ r: sum.r / sum.n, g: sum.g / sum.n, b: sum.b / sum.n });
}

/** A finished icon has transparent corners (it is a rounded square with its own frame). */
async function isFinishedIcon(source) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return info.channels === 4 && data[3] === 0;
}

/** The picture, or a plain square for development builds. */
async function loadPicture() {
  if (!gameId) {
    const picture = await sharp({ create: { width: 512, height: 512, channels: 3, background: DEV_COLOR } })
      .png()
      .toBuffer();
    return { picture, color: DEV_COLOR, finished: false };
  }
  const source = `assets-src/images/app-icons/${gameId}.png`;
  if (!existsSync(source)) throw new Error(`${source} is missing`);
  if (await isFinishedIcon(source)) {
    // Keep its transparent corners; drop any empty border so the frame reaches the edges.
    const trimmed = await sharp(source).trim({ threshold: 1 }).png().toBuffer();
    const picture = await sharp(trimmed).resize(1024, 1024, { fit: 'fill' }).png().toBuffer();
    return { picture, color: await frameColor(picture), finished: true };
  }
  const picture = await sharp(source).flatten({ background: '#ffffff' }).png().toBuffer();
  // The background colour is the top-left pixel: the pictures have a flat background.
  const { data } = await sharp(picture).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer({
    resolveWithObject: true,
  });
  return { picture, color: hex({ r: data[0], g: data[1], b: data[2] }), finished: false };
}

function mask(size, round) {
  const radius = round ? size / 2 : size * 0.18;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`,
  );
}

/** The picture centred on a transparent square, with `share` of the square's width. */
async function centred(picture, size, share) {
  const inner = Math.round(size * share);
  const scaled = await sharp(picture).resize(inner, inner).png().toBuffer();
  const offset = Math.round((size - inner) / 2);
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: scaled, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function legacy(picture, color, size, round, finished) {
  const inset = finished ? 1 : round ? LEGACY_INSET.round : LEGACY_INSET.square;
  const art = await centred(picture, size, inset);
  return sharp({ create: { width: size, height: size, channels: 4, background: color } })
    .composite([{ input: art }, { input: mask(size, round), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function main() {
  const { picture, color, finished } = await loadPicture();
  const share = (finished ? FINISHED_DP : PICTURE_DP) / ADAPTIVE_DP;
  for (const [density, scale] of Object.entries(DENSITIES)) {
    const dir = `${RES}/mipmap-${density}`;
    mkdirSync(dir, { recursive: true });
    const adaptive = Math.round(ADAPTIVE_DP * scale);
    writeFileSync(`${dir}/ic_launcher_foreground.png`, await centred(picture, adaptive, share));
    const size = Math.round(LEGACY_DP * scale);
    writeFileSync(`${dir}/ic_launcher.png`, await legacy(picture, color, size, false, finished));
    writeFileSync(`${dir}/ic_launcher_round.png`, await legacy(picture, color, size, true, finished));
  }
  writeFileSync(
    `${RES}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated by tools/build-app-icon.mjs for "${gameId ?? 'demo'}" — do not edit. -->
<resources>
    <color name="ic_launcher_background">${color}</color>
</resources>
`,
  );
  const kind = finished ? 'finished icon' : 'picture';
  console.log(`app icon      ${(gameId ?? 'demo').padEnd(10)} ${kind}, background ${color}`);
}

main().catch((error) => {
  console.error(`build-app-icon: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
