import { describe, expect, it } from 'vitest';
import { PUZZLE_SIZE } from '../../../core/assets/puzzles';
import { rect, type Rect } from '../../../core/logic/rect';
import { STAGES } from '../stages';
import { planPuzzle, slotCentres, snaps, trayPlaces } from './board';

/** Play fields of the standard layout on the three screens (design units). */
const fields = [rect(12, 212, 1260, 700), rect(12, 212, 3200, 700), rect(12, 212, 1450, 700)];

const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.01 &&
  inner.y >= outer.y - 0.01 &&
  inner.x + inner.width <= outer.x + outer.width + 0.01 &&
  inner.y + inner.height <= outer.y + outer.height + 0.01;

describe('planPuzzle', () => {
  it('keeps the board and the tray inside the field, apart', () => {
    for (const field of fields) {
      const { board, tray } = planPuzzle(field, PUZZLE_SIZE);
      expect(inside(board, field)).toBe(true);
      expect(inside(tray, field)).toBe(true);
      const apart = board.x + board.width <= tray.x || board.y + board.height <= tray.y;
      expect(apart).toBe(true);
    }
  });

  it('puts the tray beside a landscape board, below a tall one', () => {
    const wide = planPuzzle(fields[1] ?? rect(0, 0, 1, 1), PUZZLE_SIZE);
    expect(wide.tray.x).toBeGreaterThan(wide.board.x + wide.board.width);
    const tall = planPuzzle(rect(0, 0, 700, 1000), PUZZLE_SIZE);
    expect(tall.tray.y).toBeGreaterThan(tall.board.y + tall.board.height);
  });
});

describe('slotCentres', () => {
  it('has one slot per piece, left to right, top to bottom', () => {
    const slots = slotCentres(rect(0, 0, 300, 200), 3, 2);
    expect(slots).toEqual([
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 250, y: 50 },
      { x: 50, y: 150 },
      { x: 150, y: 150 },
      { x: 250, y: 150 },
    ]);
  });
});

describe('trayPlaces', () => {
  it('fits every piece of every stage in the tray, no larger than on the board', () => {
    for (const field of fields) {
      const layout = planPuzzle(field, PUZZLE_SIZE);
      for (const stage of STAGES) {
        const piece = { width: PUZZLE_SIZE.width / 3, height: PUZZLE_SIZE.height / 2 };
        const { places, scale } = trayPlaces(layout.tray, stage.goal, piece, layout.scale);
        expect(places).toHaveLength(stage.goal);
        expect(scale).toBeLessThanOrEqual(layout.scale);
        for (const p of places) {
          const box = rect(
            p.x - (piece.width * scale) / 2,
            p.y - (piece.height * scale) / 2,
            piece.width * scale,
            piece.height * scale,
          );
          expect(inside(box, layout.tray)).toBe(true);
        }
      }
    }
  });
});

describe('snaps', () => {
  const piece = { width: 200, height: 100 };
  it('snaps near the slot, not far from it', () => {
    expect(snaps({ x: 70, y: 30 }, { x: 0, y: 0 }, piece)).toBe(true);
    expect(snaps({ x: 90, y: 0 }, { x: 0, y: 0 }, piece)).toBe(false);
    expect(snaps({ x: 0, y: 50 }, { x: 0, y: 0 }, piece)).toBe(false);
  });
});
