/**
 * Screen regions shared by every game, following the client's mockups:
 *
 *   ┌──────────────────────── header ─────────────────────────┐
 *   │                                         │  prompt card  │
 *   │                 field                   ├───────────────┤
 *   │                                         │  how-to card  │
 *   ├──────────── footer message ─────────────┼─── bubble ────┤
 */
import { inset, rect, split, type Rect } from './rect';
import type { Viewport } from './viewport';

export interface GameRegions {
  header: Rect;
  field: Rect;
  /** 「おだい」 card: what to do now. */
  prompt: Rect;
  /** 「あそびかた」 card: how to play. */
  howTo: Rect;
  /** Encouraging message under the field. */
  footer: Rect;
  /** Free space under the cards (the praise bubble appears over the field's corner instead). */
  bubble: Rect;
}

export const HEADER_HEIGHT = 180;
export const FOOTER_HEIGHT = 140;
export const MARGIN = 24;

/** Field width relative to the card column (weight 1), so the cards keep a similar size on every screen. */
const FIELD_WEIGHT = { wide: 5, standard: 2.3 } as const;
/** Prompt card is taller than the how-to card. */
const CARD_WEIGHTS = [3, 2] as const;

function parts(area: Rect, axis: 'horizontal' | 'vertical', weights: readonly number[], gap = 0): [Rect, Rect] {
  const [first, second] = split(area, axis, weights, gap);
  if (!first || !second) throw new Error('gameRegions: split failed');
  return [first, second];
}

export function gameRegions(viewport: Viewport): GameRegions {
  const screen = rect(0, 0, viewport.designWidth, viewport.designHeight);
  const bodyHeight = viewport.designHeight - HEADER_HEIGHT - FOOTER_HEIGHT;
  const [header, rest] = parts(screen, 'vertical', [HEADER_HEIGHT, bodyHeight + FOOTER_HEIGHT]);
  const [body, bottom] = parts(rest, 'vertical', [bodyHeight, FOOTER_HEIGHT]);

  const columns = [FIELD_WEIGHT[viewport.mode], 1];
  const [field, cards] = parts(inset(body, MARGIN), 'horizontal', columns, MARGIN);
  const [prompt, howTo] = parts(cards, 'vertical', CARD_WEIGHTS, MARGIN);
  const [footer, bubble] = parts(inset(bottom, MARGIN / 2), 'horizontal', columns, MARGIN);

  return { header: inset(header, MARGIN / 2), field, prompt, howTo, footer, bubble };
}
