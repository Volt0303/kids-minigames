/**
 * Lays a background picture across a rectangle with no overflow: the previous,
 * simpler approach (whole image-sized tiles, rounded up to an odd count) could
 * cover an area far larger than the field, bleeding the picture outside its
 * frame on narrower screens. Here every tile is stretched by the same small
 * factor so the tiles always add up to exactly the area's width.
 */
import type { Rect } from './rect';

export interface TilePlacement {
  /** Centre x of this tile. */
  x: number;
  width: number;
  /** Every other tile is mirrored so repeated copies don't look identical side by side. */
  flip: boolean;
}

/**
 * How many tiles to use for a given natural-width ratio (area width / one tile's natural
 * width): the odd count (an unmirrored middle copy) whose tiles end up closest to their
 * natural size. More tiles are not always better — e.g. a ratio of 1.3 is far better served
 * by one slightly stretched tile than by three heavily squashed ones.
 */
function tileCountFor(ratio: number): number {
  const upper = Math.max(9, 2 * Math.ceil(ratio) + 3);
  let best = 1;
  let bestDistortion = Infinity;
  for (let count = 1; count <= upper; count += 2) {
    const distortion = Math.abs(ratio / count - 1);
    if (distortion < bestDistortion) {
      bestDistortion = distortion;
      best = count;
    }
  }
  return best;
}

/**
 * Tile placements that exactly fill `area` width-wise (never more, never less), reusing the
 * picture's own aspect ratio for height (so `area.height` is always the tile height too).
 */
export function tileBackground(area: Rect, sourceWidth: number, sourceHeight: number): TilePlacement[] {
  if (!(sourceWidth > 0 && sourceHeight > 0)) throw new RangeError('tileBackground: source size must be positive');
  const naturalWidth = area.height * (sourceWidth / sourceHeight);
  const count = tileCountFor(area.width / naturalWidth);
  const tileWidth = area.width / count;
  const middle = (count - 1) / 2;

  return Array.from({ length: count }, (_, i) => ({
    x: area.x + tileWidth * (i + 0.5),
    width: tileWidth,
    flip: Math.abs(i - middle) % 2 === 1,
  }));
}
