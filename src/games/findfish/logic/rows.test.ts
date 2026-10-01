import { describe, expect, it } from 'vitest';
import { rect } from '../../../core/logic/rect';
import { EDGE_FADE, edgeAlpha, FISH_GAP, planRows, rowCapacity, slotPositions, wrap } from './rows';

const standardField = rect(30, 180, 1126, 870);
const wideField = rect(30, 180, 3100, 870);
const FISH = 360;

describe('rowCapacity', () => {
  it('counts how many fish fit side by side, including one partly off screen', () => {
    expect(rowCapacity(1126, FISH)).toBe(3);
    expect(rowCapacity(3100, FISH)).toBe(8);
  });

  it('always allows at least one fish', () => {
    expect(rowCapacity(10, FISH)).toBe(1);
  });
});

describe('planRows', () => {
  it('spreads fish evenly over rows with alternating directions', () => {
    const plan = planRows(standardField, 8, 3, FISH);
    expect(plan.rows.map((r) => r.count)).toEqual([3, 3, 2]);
    expect(plan.rows.map((r) => r.direction)).toEqual([1, -1, 1]);
    expect(plan.placed).toBe(8);
  });

  it('never puts more fish in a row than fit (standard screen, stage 3)', () => {
    const plan = planRows(standardField, 15, 4, FISH);
    expect(plan.placed).toBe(12);
    expect(Math.max(...plan.rows.map((r) => r.count))).toBeLessThanOrEqual(rowCapacity(1126, FISH));
  });

  it('places all 15 fish on the wide screen', () => {
    expect(planRows(wideField, 15, 4, FISH).placed).toBe(15);
  });

  it('keeps rows inside the field', () => {
    const plan = planRows(standardField, 12, 4, FISH);
    for (const row of plan.rows) {
      expect(row.y - row.height / 2).toBeGreaterThanOrEqual(standardField.y);
      expect(row.y + row.height / 2).toBeLessThanOrEqual(standardField.y + standardField.height + 0.001);
    }
  });
});

describe('slotPositions', () => {
  it('spaces fish so neighbours never overlap', () => {
    const plan = planRows(wideField, 15, 4, FISH);
    plan.rows.forEach((_, i) => {
      const xs = slotPositions(plan, i);
      for (let j = 1; j < xs.length; j++) {
        const current = xs[j] ?? 0;
        const previous = xs[j - 1] ?? 0;
        expect(current - previous).toBeGreaterThanOrEqual(FISH + FISH_GAP - 0.001);
      }
    });
  });
});

describe('wrap', () => {
  it('wraps positions past either end back into the loop', () => {
    expect(wrap(110, 0, 100)).toBe(10);
    expect(wrap(-10, 0, 100)).toBe(90);
    expect(wrap(50, 0, 100)).toBe(50);
  });
});

describe('edgeAlpha', () => {
  it('is fully visible in the middle of the field', () => {
    expect(edgeAlpha(500, 100, 0, 1000)).toBe(1);
  });

  it('is invisible once the fish edge reaches the border, on either side', () => {
    expect(edgeAlpha(100, 100, 0, 1000)).toBe(0);
    expect(edgeAlpha(900, 100, 0, 1000)).toBe(0);
    expect(edgeAlpha(-50, 100, 0, 1000)).toBe(0);
  });

  it('fades in between', () => {
    const alpha = edgeAlpha(100 + EDGE_FADE / 2, 100, 0, 1000);
    expect(alpha).toBeCloseTo(0.5);
  });
});
