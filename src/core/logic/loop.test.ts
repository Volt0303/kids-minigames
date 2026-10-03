import { describe, expect, it } from 'vitest';
import { EDGE_FADE, edgeAlpha, wrap } from './loop';

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

  it('is invisible once the edge reaches the border, on either side', () => {
    expect(edgeAlpha(100, 100, 0, 1000)).toBe(0);
    expect(edgeAlpha(900, 100, 0, 1000)).toBe(0);
    expect(edgeAlpha(-50, 100, 0, 1000)).toBe(0);
  });

  it('fades in between', () => {
    const alpha = edgeAlpha(100 + EDGE_FADE / 2, 100, 0, 1000);
    expect(alpha).toBeCloseTo(0.5);
  });
});
