import { describe, expect, it } from 'vitest';
import { rect, type Rect } from '../../../core/logic/rect';
import { MIN_SLOT, planBoard, planPuzzle, SLOT_COUNT, slotRects, usedSlots } from './layout';

/** Open-layout fields: 1280×800, 1920×540 and 1920×1080 screens in design units. */
const fields = [rect(12, 212, 1704, 856), rect(12, 212, 3816, 856), rect(12, 212, 1896, 856)];

const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.001 &&
  inner.y >= outer.y - 0.001 &&
  inner.x + inner.width <= outer.x + outer.width + 0.001 &&
  inner.y + inner.height <= outer.y + outer.height + 0.001;

describe('planPuzzle', () => {
  it('puts the two cards either side of the board, all above the tray and inside the field', () => {
    for (const field of fields) {
      const plan = planPuzzle(field);
      for (const part of [plan.order, plan.done, plan.board, plan.instruction, plan.tray]) {
        expect(inside(part, field)).toBe(true);
      }
      expect(plan.order.x + plan.order.width).toBeLessThan(plan.board.x);
      expect(plan.board.x + plan.board.width).toBeLessThan(plan.done.x);
      expect(plan.order.y + plan.order.height).toBeLessThan(plan.tray.y);
    }
  });

  it('puts the tray on the left and the guide on the right of the bottom row, apart', () => {
    for (const field of fields) {
      const plan = planPuzzle(field);
      expect(plan.tray.x).toBeCloseTo(plan.order.x);
      expect(plan.tray.x + plan.tray.width).toBeLessThan(plan.guide.x);
      expect(plan.guide.x + plan.guide.width).toBeCloseTo(plan.done.x + plan.done.width);
      expect(plan.guide.y + plan.guide.height).toBeLessThanOrEqual(field.y + field.height + 0.001);
    }
  });
});

describe('slotRects', () => {
  it('fits six slots in the tray, side by side, each large enough to tap', () => {
    for (const field of fields) {
      const { tray } = planPuzzle(field);
      const slots = slotRects(tray);
      expect(slots).toHaveLength(SLOT_COUNT);
      for (const [i, slot] of slots.entries()) {
        expect(inside(slot, tray)).toBe(true);
        expect(Math.min(slot.width, slot.height)).toBeGreaterThanOrEqual(MIN_SLOT);
        const next = slots[i + 1];
        if (next) expect(next.x).toBeGreaterThan(slot.x + slot.width);
      }
    }
  });
});

describe('usedSlots', () => {
  it('uses the middle slots', () => {
    expect(usedSlots(4)).toEqual([1, 2, 3, 4]);
    expect(usedSlots(5)).toEqual([0, 1, 2, 3, 4]);
    expect(usedSlots(6)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('planBoard', () => {
  it('stands the sushi on the board, inside the board area', () => {
    for (const field of fields) {
      const area = planPuzzle(field).board;
      const { board, sushi } = planBoard(area, 472 / 220);
      expect(inside(board, area)).toBe(true);
      expect(sushi.x).toBeCloseTo(board.x + board.width / 2);
      expect(sushi.y).toBeGreaterThan(board.y - 1);
    }
  });
});
