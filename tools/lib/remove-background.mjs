/**
 * Makes a plain background transparent (AI tools usually deliver art on white).
 *
 * Flood-fills from the image border through pixels close to the corner colour,
 * so light areas *inside* the object (eyes, rice) are kept. Pixels on the cut
 * edge get partial transparency to avoid a hard white fringe. Images whose
 * corners are already transparent are returned unchanged.
 */
import sharp from 'sharp';

const CHANNELS = 4;
/** Max per-channel difference from the background colour that still counts as background. */
const DEFAULT_TOLERANCE = 36;

function cornerIndexes(width, height) {
  return [0, width - 1, (height - 1) * width, height * width - 1];
}

function averageColor(data, pixels) {
  const sum = [0, 0, 0];
  for (const p of pixels) for (let c = 0; c < 3; c++) sum[c] += data[p * CHANNELS + c];
  return sum.map((v) => v / pixels.length);
}

function distance(data, pixel, color) {
  const i = pixel * CHANNELS;
  return Math.max(Math.abs(data[i] - color[0]), Math.abs(data[i + 1] - color[1]), Math.abs(data[i + 2] - color[2]));
}

/** Marks every background pixel reachable from the border. O(pixels). */
function floodBackground(data, width, height, color, tolerance) {
  const removed = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const visit = (p) => {
    if (removed[p] || distance(data, p, color) > tolerance) return;
    removed[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < width; x++) (visit(x), visit((height - 1) * width + x));
  for (let y = 0; y < height; y++) (visit(y * width), visit(y * width + width - 1));
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < width * (height - 1)) visit(p + width);
  }
  return removed;
}

/** Edge pixels next to removed background become partly transparent by how close they are to it. */
function softenEdge(data, removed, width, color, tolerance) {
  const soft = tolerance * 3;
  for (let p = 0; p < removed.length; p++) {
    if (removed[p]) {
      data[p * CHANNELS + 3] = 0;
      continue;
    }
    const x = p % width;
    const touchesBackground =
      (x > 0 && removed[p - 1]) || (x < width - 1 && removed[p + 1]) || removed[p - width] || removed[p + width];
    if (!touchesBackground) continue;
    const d = distance(data, p, color);
    if (d < soft) data[p * CHANNELS + 3] = Math.round((255 * (d - tolerance)) / (soft - tolerance));
  }
}

/** Returns a PNG buffer with the background removed. */
export async function removeBackground(input, tolerance = DEFAULT_TOLERANCE) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const corners = cornerIndexes(width, height);
  const alreadyTransparent = corners.every((p) => data[p * CHANNELS + 3] < 128);
  if (!alreadyTransparent) {
    const color = averageColor(data, corners);
    softenEdge(data, floodBackground(data, width, height, color, tolerance), width, color, tolerance);
  }
  return sharp(data, { raw: { width, height, channels: CHANNELS } })
    .png()
    .toBuffer();
}
