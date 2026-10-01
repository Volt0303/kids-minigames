/**
 * Screen regions shared by every game, following the client's mockups:
 *
 *   ┌──────────────────────────── header ────────────────────────────┐
 *   │                                                │  prompt card  │
 *   │                     field                      ├───────────────┤
 *   │                                                │  how-to card  │
 *   ├────────┬──────────────────────────┬────────────┤               │
 *   │ mascot │      footer message      │   bubble   │     guide     │
 *   └────────┴──────────────────────────┴────────────┴───────────────┘
 */
import { inset, rect, split, type Rect } from './rect';
import type { Viewport } from './viewport';

export interface GameRegions {
  header: Rect;
  field: Rect;
  /** 「お題」 card: what to do now. */
  prompt: Rect;
  /** 「あそびかた」 card: how to play. */
  howTo: Rect;
  /** Guide character in the bottom-right corner. */
  guide: Rect;
  /** Small decoration (starfish) at the bottom-left. */
  mascot: Rect;
  /** Encouraging message under the field. */
  footer: Rect;
  /** Where the 「せいかい！」 speech bubble appears, next to the guide. */
  bubble: Rect;
}

export const HEADER_HEIGHT = 170;
export const FOOTER_HEIGHT = 130;
export const GUIDE_HEIGHT = 300;
export const MARGIN = 24;
const BUBBLE_WIDTH = 470;

/** Field width relative to the card column (weight 1), so the cards keep a similar size on every screen. */
const FIELD_WEIGHT = { wide: 5, standard: 2.3 } as const;
/** Prompt card is taller than the how-to card. */
const CARD_WEIGHTS = [3, 2] as const;

function parts(area: Rect, axis: 'horizontal' | 'vertical', weights: readonly number[], gap = 0): [Rect, Rect] {
  const [first, second] = split(area, axis, weights, gap);
  if (!first || !second) throw new Error('gameRegions: split failed');
  return [first, second];
}

/** Bottom row under the field: mascot square, footer message, praise bubble. */
function bottomRow(row: Rect): Pick<GameRegions, 'mascot' | 'footer' | 'bubble'> {
  const mascot = rect(row.x, row.y, row.height, row.height);
  const bubbleWidth = Math.min(BUBBLE_WIDTH, row.width / 3);
  const bubble = rect(row.x + row.width - bubbleWidth, row.y, bubbleWidth, row.height);
  const footerX = mascot.x + mascot.width + MARGIN;
  const footer = rect(footerX, row.y, bubble.x - MARGIN - footerX, row.height);
  return { mascot, footer, bubble };
}

export function gameRegions(viewport: Viewport): GameRegions {
  const screen = rect(0, 0, viewport.designWidth, viewport.designHeight);
  const [header, body] = parts(screen, 'vertical', [HEADER_HEIGHT, viewport.designHeight - HEADER_HEIGHT]);

  const [left, right] = parts(inset(body, MARGIN), 'horizontal', [FIELD_WEIGHT[viewport.mode], 1], MARGIN);
  const [field, row] = parts(left, 'vertical', [left.height - FOOTER_HEIGHT, FOOTER_HEIGHT], MARGIN);
  const [cards, guide] = parts(right, 'vertical', [right.height - GUIDE_HEIGHT, GUIDE_HEIGHT], MARGIN);
  const [prompt, howTo] = parts(cards, 'vertical', CARD_WEIGHTS, MARGIN);

  return { header: inset(header, MARGIN / 2), field, prompt, howTo, guide, ...bottomRow(row) };
}
