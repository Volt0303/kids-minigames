/**
 * How a background picture fills an area of any shape (the play field, or the whole screen).
 *
 * Pictures are drawn for the widest screen (32:9) with everything important in the centre,
 * so on narrower screens they are simply cut evenly at the sides ("cover"). A picture that is
 * too narrow for the area (it would lose more than MAX_CROP of its height) is shown whole in
 * the centre instead, with the sides filled by a soft, blurred copy of itself.
 */

/** A part of the source picture, in its own pixels. */
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BackgroundFit {
  /** The part of the picture that covers the whole area (cut evenly on two sides). */
  cover: Crop;
  /**
   * Only for a picture too narrow for the area: where the whole picture goes (full height,
   * centred), as x / width in the area's units. The cover then fills the sides, blurred.
   */
  centre?: { x: number; width: number };
}

/** At most this share of a picture's height may be cut off; beyond it, the centre layout is used. */
export const MAX_CROP = 0.35;

export function fitBackground(
  area: { width: number; height: number },
  source: { width: number; height: number },
): BackgroundFit {
  if (!(source.width > 0 && source.height > 0)) throw new RangeError('fitBackground: source size must be positive');
  if (!(area.width > 0 && area.height > 0)) throw new RangeError('fitBackground: area size must be positive');
  const areaAspect = area.width / area.height;
  const sourceAspect = source.width / source.height;
  if (sourceAspect >= areaAspect) {
    // Wider than the area: cut the sides.
    const width = source.height * areaAspect;
    return { cover: { x: (source.width - width) / 2, y: 0, width, height: source.height } };
  }
  // Narrower: cut top and bottom — or, when that would cut too much, centre it whole.
  const height = source.width / areaAspect;
  const cover = { x: 0, y: (source.height - height) / 2, width: source.width, height };
  if (1 - height / source.height <= MAX_CROP) return { cover };
  const width = area.height * sourceAspect;
  return { cover, centre: { x: (area.width - width) / 2, width } };
}
