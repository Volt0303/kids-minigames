import { describe, expect, it } from 'vitest';
import { gameRegions } from './gameLayout';
import type { Rect } from './rect';
import { computeViewport, type Viewport } from './viewport';

const main = computeViewport({ cssWidth: 1920, cssHeight: 540, pixelRatio: 1 });
const sub1 = computeViewport({ cssWidth: 1280, cssHeight: 800, pixelRatio: 1 });
const sub2 = computeViewport({ cssWidth: 1920, cssHeight: 1080, pixelRatio: 1 });

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const contains = (outer: Rect, inner: Rect): boolean =>
  inner.x >= outer.x - 0.001 &&
  inner.y >= outer.y - 0.001 &&
  inner.x + inner.width <= outer.x + outer.width + 0.001 &&
  inner.y + inner.height <= outer.y + outer.height + 0.001;

const noOverlaps = (list: Rect[]): void => {
  for (const [i, a] of list.entries()) {
    for (const b of list.slice(i + 1)) expect(overlaps(a, b)).toBe(false);
  }
};

describe.each<[string, Viewport]>([
  ['main 1920x540', main],
  ['sub1 1280x800', sub1],
  ['sub2 1920x1080', sub2],
])('gameRegions on %s', (_name, vp) => {
  const regions = gameRegions(vp);
  const { header, field, prompt, howTo, message, mascot, footer, bubble, guide } = regions;
  const screen: Rect = { x: 0, y: 0, width: vp.designWidth, height: vp.designHeight };

  it('keeps the five main areas on screen and apart', () => {
    const areas = [header, field, prompt, howTo, message];
    for (const r of areas) expect(contains(screen, r)).toBe(true);
    noOverlaps(areas);
  });

  it('stacks header, then field and cards, then the full-width message bar', () => {
    expect(field.y).toBeGreaterThan(header.y + header.height);
    expect(prompt.y).toBeGreaterThan(header.y + header.height);
    expect(message.y).toBeGreaterThan(field.y + field.height);
    expect(message.y).toBeGreaterThan(howTo.y + howTo.height);
    expect(message.width).toBeCloseTo(header.width);
  });

  it('puts the cards to the right of the field, prompt above how-to', () => {
    expect(prompt.x).toBeGreaterThan(field.x + field.width);
    expect(howTo.y).toBeGreaterThan(prompt.y + prompt.height);
  });

  it('fits mascot, text, bubble and guide in the message bar, in that order', () => {
    const inner = [mascot, footer, bubble, guide];
    for (const r of [mascot, footer, bubble]) expect(contains(message, r)).toBe(true);
    noOverlaps(inner);
    expect(footer.x).toBeGreaterThan(mascot.x + mascot.width);
    expect(bubble.x).toBeGreaterThan(footer.x + footer.width);
    expect(guide.x).toBeGreaterThan(bubble.x + bubble.width);
    expect(footer.width).toBeGreaterThan(400);
  });

  it('lets the guide rise above the message bar without covering the cards or the field', () => {
    expect(guide.y + guide.height).toBeLessThanOrEqual(message.y + message.height);
    expect(guide.y).toBeLessThan(message.y);
    expect(overlaps(guide, howTo)).toBe(false);
    expect(overlaps(guide, field)).toBe(false);
    expect(guide.height).toBeGreaterThan(200);
  });

  it('leaves a play field tall enough for the games', () => {
    expect(field.height).toBeGreaterThan(650);
  });
});

it('keeps the card column a similar width on every screen', () => {
  const widths = [main, sub1, sub2].map((vp) => gameRegions(vp).prompt.width);
  expect(Math.max(...widths) / Math.min(...widths)).toBeLessThan(1.4);
});
