import type { BackgroundFit } from '../logic/backgroundFit';

/** Blur of the side fill, as a share of the area's height. */
const SIDE_BLUR = 0.02;
/** A light wash over the blurred sides, so the sharp picture in the centre stands out. */
const SIDE_WASH = 'rgba(255, 255, 255, 0.22)';
/** The centred picture's left and right edges fade into the sides over this share of its width. */
const EDGE_FADE = 0.06;

type Source = CanvasImageSource & { width: number; height: number };

/**
 * Draws a background picture into a canvas `width` × `height` pixels, as planned by
 * fitBackground. Done once per layout, never per frame.
 */
export function paintBackground(
  ctx: CanvasRenderingContext2D,
  source: Source,
  fit: BackgroundFit,
  size: { width: number; height: number },
): void {
  const { cover, centre } = fit;
  if (!centre) {
    ctx.drawImage(source, cover.x, cover.y, cover.width, cover.height, 0, 0, size.width, size.height);
    return;
  }
  // Sides: the cover crop, softly blurred and washed (the blur is drawn a little larger so
  // its edges do not fade to transparent).
  const blur = Math.round(size.height * SIDE_BLUR);
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(
    source,
    cover.x,
    cover.y,
    cover.width,
    cover.height,
    -blur * 2,
    -blur * 2,
    size.width + blur * 4,
    size.height + blur * 4,
  );
  ctx.restore();
  ctx.fillStyle = SIDE_WASH;
  ctx.fillRect(0, 0, size.width, size.height);
  // The whole picture in the centre, its left and right edges fading into the sides.
  const scale = size.width / Math.max(1, centre.x * 2 + centre.width);
  const x = centre.x * scale;
  const width = centre.width * scale;
  ctx.drawImage(fadedEdges(source), x, 0, width, size.height);
}

/** A copy of the picture whose left and right edges fade to transparent. */
function fadedEdges(source: Source): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(source, 0, 0);
  const fade = ctx.createLinearGradient(0, 0, source.width, 0);
  fade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  fade.addColorStop(EDGE_FADE, 'rgba(0, 0, 0, 1)');
  fade.addColorStop(1 - EDGE_FADE, 'rgba(0, 0, 0, 1)');
  fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, source.width, source.height);
  return canvas;
}
