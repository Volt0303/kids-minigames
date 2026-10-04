/**
 * Where things go in the お寿司パズル field (open layout, as in the game's design): the
 * 「お題のおすし」 card on the left, the board with the rice in the middle, the 「できたよ!」
 * card on the right; below them the 「ネタをえらぼう」 tray of six topping slots on the left
 * and the guide character on the right (as in the client's mockup).
 */
import { NIGIRI_LAYOUT, NIGIRI_SIZE } from '../../../core/assets/sushi';
import { minTouchSize } from '../../../core/logic/layout';
import { rect, type Rect } from '../../../core/logic/rect';
import { DESIGN_HEIGHT } from '../../../core/logic/viewport';

/** The tray always has this many slots; a stage fills some of them. */
export const SLOT_COUNT = 6;
/** Share of the field's height used by the tray. */
const TRAY_SHARE = 0.4;
const GAP = 24;
const SLOT_GAP = 14;
/** Tray border and padding around the slots. */
const TRAY_PADDING = 22;
/** Room at the top of the tray for its 「ネタをえらぼう」 label. */
export const TRAY_LABEL_SPACE = 44;
/** Slots are not wider than this (on the wide screen there is room to spare). */
const MAX_SLOT_WIDTH = 250;
/** Side cards: width relative to their height, and their largest share of the field width. */
const CARD_ASPECT = 0.82;
const MAX_CARD_SHARE = 0.26;
/** The cards and the board stay together: the top row is at most this wide, relative to its height. */
const MAX_ROW_ASPECT = 3.6;
/** Guide character: height relative to the tray row (it rises a little above it), width to height. */
const GUIDE_RISE = 1.12;
const GUIDE_ASPECT = 0.72;
/** The 「やったね!」 bubble next to the guide's head. */
const BUBBLE_SIZE = { width: 330, height: 170 } as const;
/** Room above the board for the instruction bubble. */
const INSTRUCTION_HEIGHT = 74;
/** Smallest slot, so every topping stays an easy target (requirements 6.6). */
export const MIN_SLOT = minTouchSize(DESIGN_HEIGHT);

export interface PuzzlePlan {
  /** 「お題のおすし」 card. */
  order: Rect;
  /** 「できたよ!」 card. */
  done: Rect;
  /** The instruction bubble above the board. */
  instruction: Rect;
  /** Room for the board with the rice. */
  board: Rect;
  /** The tray holding the topping slots. */
  tray: Rect;
  /** The guide character, standing at the right end of the tray row. */
  guide: Rect;
  /** Where the guide's speech bubble goes (left of its head). */
  bubble: Rect;
}

export function planPuzzle(field: Rect): PuzzlePlan {
  const trayArea = rect(field.x, field.y + field.height * (1 - TRAY_SHARE), field.width, field.height * TRAY_SHARE);
  const rowHeight = trayArea.y - field.y - GAP;
  const rowWidth = Math.min(field.width, rowHeight * MAX_ROW_ASPECT);
  const top = rect(field.x + (field.width - rowWidth) / 2, field.y, rowWidth, rowHeight);
  const cardWidth = Math.min(top.height * CARD_ASPECT, top.width * MAX_CARD_SHARE);
  const order = rect(top.x, top.y, cardWidth, top.height);
  const done = rect(top.x + top.width - cardWidth, top.y, cardWidth, top.height);
  const middle = rect(order.x + cardWidth + GAP, top.y, done.x - order.x - cardWidth - GAP * 2, top.height);
  const instruction = rect(middle.x, middle.y, middle.width, INSTRUCTION_HEIGHT);
  const board = rect(middle.x, middle.y + INSTRUCTION_HEIGHT, middle.width, middle.height - INSTRUCTION_HEIGHT);
  // The bottom row lines up with the top row: tray from its left edge, guide at its right end.
  const row = rect(top.x, trayArea.y, top.width, trayArea.height);
  const guideHeight = row.height * GUIDE_RISE;
  const guideWidth = guideHeight * GUIDE_ASPECT;
  const guide = rect(row.x + row.width - guideWidth, row.y + row.height - guideHeight, guideWidth, guideHeight);
  const tray = trayPanel(rect(row.x, row.y, row.width - guideWidth - GAP, row.height));
  const bubble = rect(
    guide.x - BUBBLE_SIZE.width,
    guide.y - BUBBLE_SIZE.height * 0.3,
    BUBBLE_SIZE.width,
    BUBBLE_SIZE.height,
  );
  return { order, done, instruction, board, tray, guide, bubble };
}

/** The tray panel: just wide enough for its six slots, from the left of `area`. */
function trayPanel(area: Rect): Rect {
  const slotHeight = area.height - TRAY_LABEL_SPACE - TRAY_PADDING * 2;
  const slotWidth = Math.min(MAX_SLOT_WIDTH, slotHeight, (area.width - TRAY_PADDING * 2) / SLOT_COUNT - SLOT_GAP);
  const width = SLOT_COUNT * slotWidth + (SLOT_COUNT - 1) * SLOT_GAP + TRAY_PADDING * 2;
  return rect(area.x, area.y, width, area.height);
}

/** The six slots in the tray, left to right. */
export function slotRects(tray: Rect): Rect[] {
  const top = tray.y + TRAY_LABEL_SPACE + TRAY_PADDING / 2;
  const height = tray.y + tray.height - TRAY_PADDING - top;
  const width = (tray.width - TRAY_PADDING * 2 - SLOT_GAP * (SLOT_COUNT - 1)) / SLOT_COUNT;
  return Array.from({ length: SLOT_COUNT }, (_, i) =>
    rect(tray.x + TRAY_PADDING + i * (width + SLOT_GAP), top, width, height),
  );
}

/** Which slots a stage with `count` toppings uses: the middle ones. */
export function usedSlots(count: number): number[] {
  const first = Math.floor((SLOT_COUNT - count) / 2);
  return Array.from({ length: Math.min(count, SLOT_COUNT) }, (_, i) => first + i);
}

export interface SushiPlace {
  /** Centre of the nigiri made on the board (see core/ui/Nigiri). */
  x: number;
  y: number;
  scale: number;
}

/** Middle of the board's top surface (the legs are below it), as a share of the board picture's height. */
const SURFACE_MIDDLE = 0.38;
/** The rice is this tall compared with the board picture. */
const RICE_SHARE = 0.5;
/** Rice picture height at scale 1. */
const RICE_HEIGHT = 150;
/**
 * The rice's centre sits this far above the plate's centre (in rice heights): seen from the
 * front, the rice stands on the middle of the plate, so it rises only a little above it.
 */
const RICE_ABOVE_PLATE = 0.16;

export interface BoardPlan {
  board: Rect;
  /** Centre of the plate, in the middle of the board's top surface. */
  plate: { x: number; y: number };
  /** The sushi standing on the plate. */
  sushi: SushiPlace;
}

/** The board picture (stretched sideways), the plate centred on it, and the sushi on the plate. */
export function planBoard(area: Rect, boardAspect: number): BoardPlan {
  const height = area.height * 0.9;
  const width = Math.min(area.width * 0.9, height * boardAspect * 1.25);
  const board = rect(area.x + (area.width - width) / 2, area.y + area.height - height, width, height);
  const scale = Math.min((height * RICE_SHARE) / RICE_HEIGHT, (width * 0.45) / NIGIRI_SIZE.width);
  const plate = { x: board.x + width / 2, y: board.y + height * SURFACE_MIDDLE };
  const riceCentre = plate.y - RICE_ABOVE_PLATE * RICE_HEIGHT * scale;
  return { board, plate, sushi: { x: plate.x, y: riceCentre - NIGIRI_LAYOUT.riceY * scale, scale } };
}
