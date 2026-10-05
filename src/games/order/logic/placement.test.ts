import { describe, expect, it } from 'vitest';
import { rect, type Rect } from '../../../core/logic/rect';
import { beltCapacity, beltScale, PIECE, PIECE_GAP, planBelt } from './placement';
import { counterArea, LEDGE, planTable } from './table';

const standardField = rect(24, 224, 1150, 700);
const wideField = rect(24, 224, 3000, 700);
const GETA_ASPECT = 636 / 220;

const inside = (area: Rect, x: number, y: number): boolean =>
  x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;

describe('planTable', () => {
  it('lays the platter on the counter, just behind its front edge, inside the field', () => {
    for (const field of [standardField, wideField]) {
      const { table } = planTable(field, 6, GETA_ASPECT);
      expect(table.y + table.height).toBeLessThan(field.y + field.height * LEDGE);
      expect(table.y + table.height).toBeGreaterThan(field.y + field.height * (LEDGE - 0.05));
      expect(table.x).toBeGreaterThanOrEqual(field.x);
      expect(table.x + table.width).toBeLessThanOrEqual(field.x + field.width);
      expect(table.y).toBeGreaterThan(field.y);
    }
  });

  it('puts every sushi on the table, side by side without overlapping in a row', () => {
    for (const field of [standardField, wideField]) {
      for (const count of [3, 4, 6]) {
        const { table, sushi } = planTable(field, count, GETA_ASPECT);
        expect(sushi.positions).toHaveLength(count);
        const ps = sushi.positions;
        expect(ps.every((p) => inside(table, p.x, p.y + 100 * sushi.scale))).toBe(true);
        const sameRowGaps = ps.slice(1).flatMap((q, i) => (ps[i]?.y === q.y ? [q.x - (ps[i]?.x ?? 0)] : []));
        expect(sameRowGaps.every((gap) => gap >= PIECE.width * sushi.scale)).toBe(true);
      }
    }
  });

  it('keeps the sushi of a row apart, each large enough to see clearly', () => {
    const { sushi } = planTable(standardField, 6, GETA_ASPECT);
    const [a, b] = sushi.positions;
    expect((b?.x ?? 0) - (a?.x ?? 0)).toBeGreaterThanOrEqual(PIECE.width * sushi.scale);
    expect(PIECE.width * sushi.scale).toBeGreaterThanOrEqual(110);
  });
});

describe('belt length', () => {
  it('with what fits on screen plus one, the loop is at most two sushi longer than the field', () => {
    for (const field of [standardField, wideField]) {
      const counter = counterArea(field);
      const belt = planBelt(counter, beltCapacity(counter, beltScale(counter)) + 1);
      expect(belt.loopLength).toBeLessThanOrEqual(counter.width + 2 * belt.spacing);
      expect(belt.spacing).toBeGreaterThanOrEqual((PIECE.width + PIECE_GAP) * belt.scale - 0.001);
    }
  });
});
