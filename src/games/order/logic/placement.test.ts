import { describe, expect, it } from 'vitest';
import { rect, type Rect } from '../../../core/logic/rect';
import {
  beltCapacity,
  beltScale,
  PIECE,
  PIECE_GAP,
  planBelt,
  planField,
  planGrid,
  traySlots,
  type Point,
} from './placement';

const standardField = rect(24, 224, 1150, 660);
const wideField = rect(24, 224, 3000, 660);

/** Two sushi of the same scale do not overlap. */
function apart(p: Point, q: Point, scale: number): boolean {
  return Math.abs(p.x - q.x) >= PIECE.width * scale || Math.abs(p.y - q.y) >= PIECE.height * scale;
}

function inside(area: Rect, x: number, y: number): boolean {
  return x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;
}

describe('planField', () => {
  it('puts the tray below the counter, both inside the field', () => {
    const { counter, tray } = planField(standardField);
    expect(counter.y + counter.height).toBeLessThan(tray.y);
    expect(tray.y + tray.height).toBeLessThanOrEqual(standardField.y + standardField.height);
  });
});

describe('planGrid', () => {
  it('keeps every sushi inside the counter without overlapping', () => {
    for (const field of [standardField, wideField]) {
      const { counter } = planField(field);
      for (const count of [5, 6, 8]) {
        const { positions, scale } = planGrid(counter, count);
        expect(positions).toHaveLength(count);
        for (const [i, p] of positions.entries()) {
          expect(inside(counter, p.x, p.y)).toBe(true);
          expect(positions.slice(i + 1).every((q) => apart(p, q, scale))).toBe(true);
        }
      }
    }
  });

  it('uses one row on the wide screen and two on the standard one', () => {
    const wide = planGrid(planField(wideField).counter, 6);
    expect(new Set(wide.positions.map((p) => p.y)).size).toBe(1);
    const standard = planGrid(planField(standardField).counter, 6);
    expect(new Set(standard.positions.map((p) => p.y)).size).toBe(2);
  });
});

describe('planBelt', () => {
  it('spaces the sushi evenly with room between them, around a loop longer than the field', () => {
    const { counter } = planField(standardField);
    const belt = planBelt(counter, 6);
    expect(belt.loopLength).toBeGreaterThan(counter.width);
    expect(belt.spacing).toBeGreaterThanOrEqual((PIECE.width + PIECE_GAP) * belt.scale - 0.001);
    expect(belt.positions).toHaveLength(6);
  });
});

describe('belt length', () => {
  it('with what fits on screen plus one, the loop is at most two sushi longer than the field', () => {
    for (const field of [standardField, wideField]) {
      const { counter } = planField(field);
      const belt = planBelt(counter, beltCapacity(counter, beltScale(counter)) + 1);
      expect(belt.loopLength).toBeLessThanOrEqual(counter.width + 2 * belt.spacing);
    }
  });
});

describe('traySlots', () => {
  it('fits up to six sushi on the tray', () => {
    const { tray } = planField(standardField);
    const { positions, scale } = traySlots(tray, 6);
    for (const p of positions) expect(inside(tray, p.x, p.y)).toBe(true);
    const first = positions[0];
    const last = positions[5];
    if (!first || !last) throw new Error('missing slots');
    expect(last.x - first.x + PIECE.width * scale * 0.9).toBeLessThanOrEqual(tray.width);
  });
});
