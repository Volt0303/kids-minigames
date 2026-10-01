import { describe, expect, it } from 'vitest';
import { gameRegions, HEADER_HEIGHT } from './gameLayout';
import type { Rect } from './rect';
import { computeViewport, type Viewport } from './viewport';

const main = computeViewport({ cssWidth: 1920, cssHeight: 540, pixelRatio: 1 });
const sub1 = computeViewport({ cssWidth: 1280, cssHeight: 800, pixelRatio: 1 });
const sub2 = computeViewport({ cssWidth: 1920, cssHeight: 1080, pixelRatio: 1 });

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe.each<[string, Viewport]>([
  ['main 1920x540', main],
  ['sub1 1280x800', sub1],
  ['sub2 1920x1080', sub2],
])('gameRegions on %s', (_name, vp) => {
  const regions = gameRegions(vp);
  const { header, field, prompt, howTo, footer, bubble } = regions;
  const all: Rect[] = [header, field, prompt, howTo, footer, bubble];

  it('keeps every region on screen', () => {
    for (const r of all) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(vp.designWidth + 0.001);
      expect(r.y + r.height).toBeLessThanOrEqual(vp.designHeight + 0.001);
    }
  });

  it('never lets two regions overlap', () => {
    for (const [i, a] of all.entries()) {
      for (const b of all.slice(i + 1)) expect(overlaps(a, b)).toBe(false);
    }
  });

  it('puts the cards to the right of the field, prompt above how-to', () => {
    const { field, prompt, howTo } = regions;
    expect(prompt.x).toBeGreaterThan(field.x + field.width);
    expect(howTo.y).toBeGreaterThan(prompt.y + prompt.height);
    expect(field.y).toBeGreaterThanOrEqual(HEADER_HEIGHT);
  });

  it('leaves a play field tall enough for the games', () => {
    expect(regions.field.height).toBeGreaterThan(650);
  });
});

it('keeps the card column a similar width on every screen', () => {
  const widths = [main, sub1, sub2].map((vp) => gameRegions(vp).prompt.width);
  expect(Math.max(...widths) / Math.min(...widths)).toBeLessThan(1.4);
});
