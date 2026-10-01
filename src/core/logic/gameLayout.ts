/**
 * Screen regions shared by every game, following the client's layout diagram:
 *
 *   ┌──────────────────────────── header ─────────────────────────────┐
 *   │ [ title area ]        [ how-to area ]          [ progress area ] │
 *   └──────────────────────────────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────┐ ┌────────────────────┐
 *   │                                         │ │    prompt card     │
 *   │                 field                   │ ├────────────────────┤
 *   │                                         │ │    how-to card     │
 *   │                                         │ └────────────[guide]─┘
 *   └─────────────────────────────────────────┘           [ rises ]
 *   ┌──────────────────────────── message ────────────────────────────┐
 *   │ [mascot] [ footer text ]              [ bubble ] [ guide ]       │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * The guide character stands in the message bar but is taller than it: its upper body
 * rises into a space kept free under the cards, so it is large enough to see.
 *
 * The header's three areas are sized from their contents (see headerLayout.ts).
 */
import { inset, rect, split, type Rect } from './rect';
import type { Viewport } from './viewport';

export interface GameRegions {
  /** Top bar holding the title, how-to and progress areas. */
  header: Rect;
  field: Rect;
  /** 「お題」 card: what to do now. */
  prompt: Rect;
  /** 「あそびかた」 card: how to play. */
  howTo: Rect;
  /** Bottom bar holding the message, mascot, praise bubble and guide. */
  message: Rect;
  /** Small decoration (starfish) at the left of the message bar. */
  mascot: Rect;
  /** Encouraging message text. */
  footer: Rect;
  /** Where the 「せいかい！」 speech bubble appears, next to the guide. */
  bubble: Rect;
  /** Guide character at the right end of the message bar, rising above it under the cards. */
  guide: Rect;
}

export const HEADER_HEIGHT = 180;
export const MESSAGE_HEIGHT = 150;
export const MARGIN = 24;
/** Padding between a bar's border and the things inside it. */
export const BAR_PADDING = 12;
const BUBBLE_WIDTH = 470;
/** How far the guide rises above the message bar (space kept free under the cards). */
export const GUIDE_RISE = 130;
/** Guide character width relative to its height. */
const GUIDE_ASPECT = 0.72;

/** Field width relative to the card column (weight 1), so the cards keep a similar size on every screen. */
const FIELD_WEIGHT = { wide: 5.6, standard: 2.7 } as const;
/** Prompt card is taller than the how-to card. */
const CARD_WEIGHTS = [3, 2] as const;

function parts(area: Rect, axis: 'horizontal' | 'vertical', weights: readonly number[], gap = 0): [Rect, Rect] {
  const [first, second] = split(area, axis, weights, gap);
  if (!first || !second) throw new Error('gameRegions: split failed');
  return [first, second];
}

/** Message bar contents, left to right: mascot, text, praise bubble, guide. */
function messageRow(bar: Rect): Pick<GameRegions, 'mascot' | 'footer' | 'bubble' | 'guide'> {
  const row = inset(bar, BAR_PADDING);
  const mascot = rect(row.x, row.y, row.height, row.height);
  const guideHeight = row.height + GUIDE_RISE;
  const guideWidth = guideHeight * GUIDE_ASPECT;
  const guide = rect(row.x + row.width - guideWidth, row.y - GUIDE_RISE, guideWidth, guideHeight);
  const bubbleWidth = Math.min(BUBBLE_WIDTH, row.width / 4);
  const bubble = rect(guide.x - MARGIN / 2 - bubbleWidth, row.y, bubbleWidth, row.height);
  const footerX = mascot.x + mascot.width + MARGIN / 2;
  const footer = rect(footerX, row.y, bubble.x - MARGIN - footerX, row.height);
  return { mascot, footer, bubble, guide };
}

export function gameRegions(viewport: Viewport): GameRegions {
  const { designWidth: width, designHeight: height } = viewport;
  const header = inset(rect(0, 0, width, HEADER_HEIGHT), MARGIN / 2);
  const message = inset(rect(0, height - MESSAGE_HEIGHT, width, MESSAGE_HEIGHT), MARGIN / 2);
  const body = rect(
    MARGIN / 2,
    HEADER_HEIGHT + MARGIN / 2,
    width - MARGIN,
    height - HEADER_HEIGHT - MESSAGE_HEIGHT - MARGIN,
  );

  const [field, cards] = parts(body, 'horizontal', [FIELD_WEIGHT[viewport.mode], 1], MARGIN);
  const cardColumn = rect(cards.x, cards.y, cards.width, cards.height - GUIDE_RISE);
  const [prompt, howTo] = parts(cardColumn, 'vertical', CARD_WEIGHTS, MARGIN);

  return { header, field, prompt, howTo, message, ...messageRow(message) };
}
