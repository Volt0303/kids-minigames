import { describe, expect, it } from 'vitest';
import { gameRegions, HUD_HEIGHT } from './gameLayout';
import { computeViewport } from './viewport';

const main = computeViewport({ cssWidth: 1920, cssHeight: 540, pixelRatio: 1 });
const sub1 = computeViewport({ cssWidth: 1280, cssHeight: 800, pixelRatio: 1 });

describe('gameRegions', () => {
  it.each([
    ['main', main],
    ['sub1', sub1],
  ])('keeps every region on screen and below the top bar (%s)', (_name, vp) => {
    const { hud, field, panel } = gameRegions(vp);
    for (const r of [hud, field, panel]) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(vp.designWidth);
      expect(r.y + r.height).toBeLessThanOrEqual(vp.designHeight);
    }
    expect(field.y).toBeGreaterThanOrEqual(HUD_HEIGHT);
    expect(panel.x).toBeGreaterThan(field.x + field.width);
  });

  it('gives the prompt panel a similar absolute width on both screens', () => {
    const wide = gameRegions(main).panel.width;
    const standard = gameRegions(sub1).panel.width;
    expect(Math.abs(wide - standard) / standard).toBeLessThan(0.25);
  });

  it('makes the play field much wider on the wide screen', () => {
    expect(gameRegions(main).field.width).toBeGreaterThan(gameRegions(sub1).field.width * 2.5);
  });
});
