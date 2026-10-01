import { describe, expect, it } from 'vitest';
import { tileBackground } from './backgroundTiling';
import { rect } from './rect';

describe('tileBackground', () => {
  it('never overflows the area: tiles add up to exactly its width', () => {
    const cases = [
      rect(24, 194, 1154, 711.6), // standard screen field
      rect(24, 194, 3140, 711.6), // wide screen field
      rect(0, 0, 400, 711.6), // a field much narrower than one natural tile
      rect(0, 0, 9000, 400), // a very wide, short field
    ];
    for (const area of cases) {
      const tiles = tileBackground(area, 1536, 1024);
      const totalWidth = tiles.reduce((sum, t) => sum + t.width, 0);
      expect(totalWidth).toBeCloseTo(area.width, 5);
      const left = Math.min(...tiles.map((t) => t.x - t.width / 2));
      const right = Math.max(...tiles.map((t) => t.x + t.width / 2));
      expect(left).toBeCloseTo(area.x, 5);
      expect(right).toBeCloseTo(area.x + area.width, 5);
    }
  });

  it('uses an odd number of tiles, with an unmirrored middle copy', () => {
    const tiles = tileBackground(rect(0, 0, 3140, 711.6), 1536, 1024);
    expect(tiles.length % 2).toBe(1);
    expect(tiles[(tiles.length - 1) / 2]?.flip).toBe(false);
  });

  it('alternates the flip of neighbouring tiles', () => {
    const tiles = tileBackground(rect(0, 0, 3140, 711.6), 1536, 1024);
    for (let i = 1; i < tiles.length; i++) expect(tiles[i]?.flip).toBe(!tiles[i - 1]?.flip);
  });

  it('keeps a single tile close to its natural size when the field is close to one tile wide', () => {
    // area.height=711.6, aspect 1.5 -> natural tile width ~1067; area.width is just over that.
    const tiles = tileBackground(rect(0, 0, 1154, 711.6), 1536, 1024);
    expect(tiles).toHaveLength(1);
  });

  it('rejects a non-positive source size', () => {
    expect(() => tileBackground(rect(0, 0, 100, 100), 0, 10)).toThrow(RangeError);
    expect(() => tileBackground(rect(0, 0, 100, 100), 10, 0)).toThrow(RangeError);
  });
});
