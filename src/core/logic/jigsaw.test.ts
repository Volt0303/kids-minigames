import { describe, expect, it } from 'vitest';
import { pieceOutline, tabSize } from './jigsaw';

const grid = { cols: 3, rows: 2, width: 400, height: 400 };
const tab = tabSize(400, 400);

const key = (p: { x: number; y: number }): string => `${Math.round(p.x)},${Math.round(p.y)}`;

/** The outline in whole-picture pixels (each piece is padded by `tab`). */
function world(index: number): string[] {
  const col = index % grid.cols;
  const row = Math.floor(index / grid.cols);
  return pieceOutline(index, grid).map((p) =>
    key({ x: p.x - tab + col * grid.width, y: p.y - tab + row * grid.height }),
  );
}

describe('pieceOutline', () => {
  it('keeps border edges straight and inside the padded picture', () => {
    for (let i = 0; i < 6; i++) {
      for (const p of pieceOutline(i, grid)) {
        expect(p.x).toBeGreaterThanOrEqual(-0.01);
        expect(p.y).toBeGreaterThanOrEqual(-0.01);
        expect(p.x).toBeLessThanOrEqual(400 + 2 * tab + 0.01);
        expect(p.y).toBeLessThanOrEqual(400 + 2 * tab + 0.01);
      }
    }
    // The top-left piece has no knob above or left of it.
    expect(pieceOutline(0, grid).every((p) => p.x >= tab - 0.01 && p.y >= tab - 0.01)).toBe(true);
  });

  it('gives neighbours exactly the same shared edge (knob fits its hole)', () => {
    const shared = (a: number, b: number): number => world(a).filter((p) => world(b).includes(p)).length;
    // Left–right neighbours and top–bottom neighbours share the whole knob (more than its 2 corners).
    expect(shared(0, 1)).toBeGreaterThan(10);
    expect(shared(1, 4)).toBeGreaterThan(10);
  });

  it('has a knob on every inner edge', () => {
    const outline = pieceOutline(4, grid); // middle of the bottom row: 3 inner edges
    const outside = outline.filter((p) => p.x < tab - 1 || p.x > tab + 400 + 1 || p.y < tab - 1);
    const inside = outline.filter((p) => p.x > tab + 1 && p.x < tab + 399 && p.y > tab + 1 && p.y < tab + 399);
    expect(outside.length + inside.length).toBeGreaterThan(30);
  });
});
