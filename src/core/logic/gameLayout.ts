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
 *
 * The 16:9 layout (the 1920×1080 device) is the base for every screen: on wider screens (the
 * 32:9 main device) the header, field and cards keep exactly that width and structure,
 * centred, with the backdrop filling the rest; narrower screens (16:10) use their full width.
 * SIDE_MARGIN is always kept free at the left and right, so the header lines up with the field.
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
  /** A few bubbles at the far left of the message bar. */
  deco: Rect;
  /** Small decoration (starfish) at the left of the message bar. */
  mascot: Rect;
  /** Encouraging message text. */
  footer: Rect;
  /** Where the 「せいかい！」 speech bubble appears, next to the guide. */
  bubble: Rect;
  /** Guide character at the right end of the message bar, rising above it under the cards (absent in games without it). */
  guide?: Rect;
}

export const HEADER_HEIGHT = 200;
export const MESSAGE_HEIGHT = 150;
export const MARGIN = 24;
/** Kept free at the screen's left and right edges in every game (design units). */
export const SIDE_MARGIN = 48;
/** The base screen shape: content is never wider than a 16:9 screen (minus the side margins). */
export const BASE_ASPECT = 16 / 9;
/** Padding between a bar's border and the things inside it. */
export const BAR_PADDING = 12;
const BUBBLE_WIDTH = 470;
/** How far the guide rises above the message bar (space kept free under the cards). */
export const GUIDE_RISE = 130;
/** Guide character width relative to its height. */
const GUIDE_ASPECT = 0.72;

/** Field width relative to the card column (weight 1): the 16:9 proportions, on every screen. */
const FIELD_WEIGHT = 2.7;
/** Prompt card is taller than the how-to card. */
const CARD_WEIGHTS = [3, 2] as const;

function parts(area: Rect, axis: 'horizontal' | 'vertical', weights: readonly number[], gap = 0): [Rect, Rect] {
  const [first, second] = split(area, axis, weights, gap);
  if (!first || !second) throw new Error('gameRegions: split failed');
  return [first, second];
}

/** Width of the bubble decoration relative to the message bar's height. */
const DECO_SHARE = 0.6;

/** Message bar contents, left to right: bubbles, mascot, text, praise bubble, guide (if shown). */
function messageRow(
  bar: Rect,
  withGuide: boolean,
): Pick<GameRegions, 'deco' | 'mascot' | 'footer' | 'bubble' | 'guide'> {
  const row = inset(bar, BAR_PADDING);
  const deco = rect(row.x, row.y, row.height * DECO_SHARE, row.height);
  const mascot = rect(deco.x + deco.width, row.y, row.height, row.height);
  const guideHeight = row.height + GUIDE_RISE;
  const guideWidth = guideHeight * GUIDE_ASPECT;
  const guide = withGuide
    ? rect(row.x + row.width - guideWidth, row.y - GUIDE_RISE, guideWidth, guideHeight)
    : undefined;
  const bubbleRight = guide ? guide.x - MARGIN / 2 : row.x + row.width;
  const bubbleWidth = Math.min(BUBBLE_WIDTH, row.width / 4);
  const bubble = rect(bubbleRight - bubbleWidth, row.y, bubbleWidth, row.height);
  const footerX = mascot.x + mascot.width + MARGIN / 2;
  const footer = rect(footerX, row.y, bubble.x - MARGIN - footerX, row.height);
  return { deco, mascot, footer, bubble, guide };
}

/** The horizontal band the game's content uses: a 16:9 screen at most, minus the side margins, centred. */
export function contentBand(viewport: Viewport): { x: number; width: number } {
  const { designWidth, designHeight } = viewport;
  const width = Math.min(designWidth, designHeight * BASE_ASPECT) - SIDE_MARGIN * 2;
  return { x: (designWidth - width) / 2, width };
}

/** `withGuide`: false for games without the guide character; the cards then use the full column. */
export function gameRegions(
  viewport: Viewport,
  withGuide = true,
  cardWeights: readonly [number, number] = CARD_WEIGHTS,
): GameRegions {
  const height = viewport.designHeight;
  const { x, width } = contentBand(viewport);
  const header = rect(x, MARGIN / 2, width, HEADER_HEIGHT - MARGIN);
  const message = rect(x, height - MESSAGE_HEIGHT + MARGIN / 2, width, MESSAGE_HEIGHT - MARGIN);
  const body = rect(x, HEADER_HEIGHT + MARGIN / 2, width, height - HEADER_HEIGHT - MESSAGE_HEIGHT - MARGIN);

  const [field, cards] = parts(body, 'horizontal', [FIELD_WEIGHT, 1], MARGIN);
  const cardColumn = rect(cards.x, cards.y, cards.width, cards.height - (withGuide ? GUIDE_RISE : 0));
  const [prompt, howTo] = parts(cardColumn, 'vertical', cardWeights, MARGIN);

  return { header, field, prompt, howTo, message, ...messageRow(message, withGuide) };
}

/** The open layout: the header, and the field filling the rest of the screen. */
export function openRegions(viewport: Viewport): Pick<GameRegions, 'header' | 'field'> {
  const height = viewport.designHeight;
  const { x, width } = contentBand(viewport);
  const header = rect(x, MARGIN / 2, width, HEADER_HEIGHT - MARGIN);
  const field = rect(x, HEADER_HEIGHT + MARGIN / 2, width, height - HEADER_HEIGHT - MARGIN);
  return { header, field };
}
