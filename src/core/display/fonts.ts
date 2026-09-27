import { FONT_FACE } from '../ui/theme';

/** Never hold up the game longer than this; the system font is an acceptable fallback. */
const FONT_TIMEOUT_MS = 3_000;

/**
 * Waits until the bundled font (declared with @font-face in index.html) is ready.
 * Phaser renders text into textures once, so text drawn before the font loads
 * would keep the fallback font. Resolves on success, failure or timeout; never rejects.
 */
export function loadFonts(): Promise<void> {
  if (!('fonts' in document)) return Promise.resolve();

  const load = document.fonts.load(`700 64px "${FONT_FACE}"`, 'あア亜A1').then((faces) => {
    if (faces.length === 0) console.warn(`Font "${FONT_FACE}" did not load; using the system font.`);
  });
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, FONT_TIMEOUT_MS));

  return Promise.race([load, timeout]).catch((error: unknown) => {
    console.warn('Font loading failed; using the system font.', error);
  });
}
