import { describe, expect, it } from 'vitest';
import { fitBackground, MAX_CROP } from './backgroundFit';

const WIDE = { width: 3840, height: 1080 }; // 32:9 picture
const CLASSIC = { width: 1536, height: 1024 }; // 3:2 picture

describe('fitBackground', () => {
  it('cuts a 32:9 picture evenly at the sides on 16:9 and 16:10 screens', () => {
    for (const area of [
      { width: 1920, height: 1080 },
      { width: 1728, height: 1080 },
    ]) {
      const { cover, centre } = fitBackground(area, WIDE);
      expect(centre).toBeUndefined();
      expect(cover.height).toBe(1080);
      expect(cover.width / cover.height).toBeCloseTo(area.width / area.height);
      expect(cover.x).toBeCloseTo((WIDE.width - cover.width) / 2);
    }
  });

  it('uses the whole 32:9 picture on the 32:9 screen', () => {
    const { cover, centre } = fitBackground({ width: 3840, height: 1080 }, WIDE);
    expect(cover).toEqual({ x: 0, y: 0, width: 3840, height: 1080 });
    expect(centre).toBeUndefined();
  });

  it('cuts a little off the top and bottom of a slightly narrow picture', () => {
    const { cover, centre } = fitBackground({ width: 1920, height: 1080 }, CLASSIC);
    expect(centre).toBeUndefined();
    expect(cover.width).toBe(CLASSIC.width);
    expect(1 - cover.height / CLASSIC.height).toBeLessThanOrEqual(MAX_CROP);
    expect(cover.y).toBeCloseTo((CLASSIC.height - cover.height) / 2);
  });

  it('centres a picture that is far too narrow, whole and full height', () => {
    const area = { width: 3840, height: 1080 };
    const { centre } = fitBackground(area, CLASSIC);
    expect(centre?.width).toBeCloseTo(1080 * 1.5);
    expect(centre?.x).toBeCloseTo((3840 - 1620) / 2);
  });

  it('rejects empty sizes', () => {
    expect(() => fitBackground({ width: 100, height: 100 }, { width: 0, height: 10 })).toThrow(RangeError);
    expect(() => fitBackground({ width: 0, height: 100 }, CLASSIC)).toThrow(RangeError);
  });
});
