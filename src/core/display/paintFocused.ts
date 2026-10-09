/**
 * A full-screen background that is sharp across the game's area and gets softly blurrier
 * towards the screen's sides. The picture covers the focus band (the game's area); where the
 * screen is wider, the scenery continues as mirrored copies (seamless at the joins), and a wide
 * fade blends the sharp picture into a blurred copy outside the band. Drawn once per layout.
 */

type Source = CanvasImageSource & { width: number; height: number };

/** Blur of the outer sides, and how far (shares of the height) the sharp picture fades into it. */
const BLUR = 0.03;
const FADE = 0.3;

export function paintFocused(
  ctx: CanvasRenderingContext2D,
  source: Source,
  size: { width: number; height: number },
  focus: { x: number; width: number },
): void {
  const strip = scenery(source, size, focus);
  // The blurred layer, drawn a little larger so its edges do not fade to transparent.
  const blur = Math.max(1, Math.round(size.height * BLUR));
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(strip, -blur * 2, -blur * 2, size.width + blur * 4, size.height + blur * 4);
  ctx.restore();
  // The sharp layer: fully visible across the band, fading out beyond it.
  ctx.drawImage(fadedOutside(strip, size, focus), 0, 0);
}

/** The picture covering the band (centred on it), continued sideways by mirrored copies. */
function scenery(source: Source, size: { width: number; height: number }, focus: { x: number; width: number }) {
  const canvas = blank(size);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const scale = Math.max(focus.width / source.width, size.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  const y = (size.height - height) / 2;
  const centre = focus.x + focus.width / 2 - width / 2;
  const copies = Math.ceil(size.width / width) + 1;
  for (let k = -copies; k <= copies; k++) {
    const x = centre + k * width;
    if (x + width < 0 || x > size.width) continue;
    ctx.save();
    if (Math.abs(k) % 2 === 1) {
      ctx.translate(x + width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(source, 0, y, width, height);
    } else {
      ctx.drawImage(source, x, y, width, height);
    }
    ctx.restore();
  }
  return canvas;
}

/** A copy of `strip` that is opaque across the band and fades to transparent beyond it. */
function fadedOutside(
  strip: HTMLCanvasElement,
  size: { width: number; height: number },
  focus: { x: number; width: number },
): HTMLCanvasElement {
  const canvas = blank(size);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(strip, 0, 0);
  const fade = size.height * FADE;
  const stop = (x: number): number => Math.min(1, Math.max(0, x / size.width));
  const mask = ctx.createLinearGradient(0, 0, size.width, 0);
  mask.addColorStop(stop(focus.x - fade), 'rgba(0, 0, 0, 0)');
  mask.addColorStop(stop(focus.x), 'rgba(0, 0, 0, 1)');
  mask.addColorStop(stop(focus.x + focus.width), 'rgba(0, 0, 0, 1)');
  mask.addColorStop(stop(focus.x + focus.width + fade), 'rgba(0, 0, 0, 0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size.width, size.height);
  return canvas;
}

function blank(size: { width: number; height: number }): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas;
}
