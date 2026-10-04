/**
 * Where things go in the お寿司パズル field: the board with the rice at the top, and the
 * 「ネタをえらぼう」 tray of topping cards along the bottom.
 */
import { NIGIRI_LAYOUT, NIGIRI_SIZE } from '../../../core/assets/sushi';
import { minTouchSize } from '../../../core/logic/layout';
import { rect, type Rect } from '../../../core/logic/rect';
import { DESIGN_HEIGHT } from '../../../core/logic/viewport';

/** Share of the field's height used by the topping tray. */
const TRAY_SHARE = 0.4;
const MARGIN = 24;
const CARD_GAP = 8;
/** Cards are not wider than this (on the wide screen there is room to spare). */
const MAX_CARD_WIDTH = 230;
/** Room at the top of the tray for its 「ネタをえらぼう」 label. */
export const TRAY_LABEL_SPACE = 46;
/** Smallest card, so every card stays an easy target (requirements 6.6). */
export const MIN_CARD = minTouchSize(DESIGN_HEIGHT);

export interface PuzzlePlan {
  /** The board with the rice. */
  board: Rect;
  /** The tray holding the topping cards. */
  tray: Rect;
}

export function planPuzzle(field: Rect): PuzzlePlan {
  const trayHeight = field.height * TRAY_SHARE;
  const tray = rect(
    field.x + MARGIN,
    field.y + field.height - trayHeight,
    field.width - MARGIN * 2,
    trayHeight - MARGIN,
  );
  const board = rect(field.x + MARGIN, field.y + MARGIN, field.width - MARGIN * 2, tray.y - field.y - MARGIN * 2);
  return { board, tray };
}

/** `count` cards side by side in the tray, centred, below its label. */
export function cardRects(tray: Rect, count: number): Rect[] {
  const top = tray.y + TRAY_LABEL_SPACE;
  const height = tray.y + tray.height - top - CARD_GAP;
  const width = Math.min(MAX_CARD_WIDTH, (tray.width - CARD_GAP * (count + 1)) / count);
  const left = tray.x + (tray.width - (count * width + (count - 1) * CARD_GAP)) / 2;
  return Array.from({ length: count }, (_, i) => rect(left + i * (width + CARD_GAP), top, width, height));
}

export interface SushiPlace {
  /** Centre of the nigiri made on the board (see core/ui/Nigiri). */
  x: number;
  y: number;
  scale: number;
}

/** Where the rice stands on the board's top surface, as a share of the board picture's height. */
const BOARD_SURFACE = 0.5;
/** The rice is this tall compared with the board picture. */
const RICE_SHARE = 0.48;
/** Rice picture height at scale 1. */
const RICE_HEIGHT = 150;
/** The rice's bottom edge below the nigiri's centre, at scale 1. */
const RICE_BOTTOM = NIGIRI_LAYOUT.riceY + RICE_HEIGHT / 2;

/** The board picture (stretched sideways) and the place of the sushi standing on it. */
export function planBoard(area: Rect, boardAspect: number): { board: Rect; sushi: SushiPlace } {
  const height = area.height * 0.8;
  const width = Math.min(area.width * 0.7, height * boardAspect * 1.5);
  const board = rect(area.x + (area.width - width) / 2, area.y + area.height - height, width, height);
  const scale = Math.min((height * RICE_SHARE) / RICE_HEIGHT, (width * 0.45) / NIGIRI_SIZE.width);
  const surface = board.y + height * BOARD_SURFACE;
  return { board, sushi: { x: board.x + width / 2, y: surface - RICE_BOTTOM * scale, scale } };
}
