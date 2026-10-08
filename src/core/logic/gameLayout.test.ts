import { describe, expect, it } from 'vitest';
import { contentBand, gameRegions, BASE_ASPECT, openRegions, SIDE_MARGIN } from './gameLayout';
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

function required(r: Rect | undefined): Rect {
  if (!r) throw new Error('expected a region');
  return r;
}

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
  const { header, field, prompt, howTo, message, mascot, footer, bubble } = regions;
  const guide = required(regions.guide);
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
    const inner = [regions.deco, mascot, footer, bubble, guide];
    for (const r of [regions.deco, mascot, footer, bubble]) expect(contains(message, r)).toBe(true);
    expect(mascot.x).toBeGreaterThanOrEqual(regions.deco.x + regions.deco.width);
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

describe.each<[string, Viewport]>([
  ['main 1920x540', main],
  ['sub1 1280x800', sub1],
  ['sub2 1920x1080', sub2],
])('gameRegions without the guide character on %s', (_name, vp) => {
  const withGuide = gameRegions(vp);
  const without = gameRegions(vp, false);

  it('has no guide region and gives the cards the full column', () => {
    expect(without.guide).toBeUndefined();
    expect(without.howTo.y + without.howTo.height).toBeGreaterThan(withGuide.howTo.y + withGuide.howTo.height);
    expect(overlaps(without.howTo, without.message)).toBe(false);
  });

  it('moves the praise bubble to the right end of the message bar', () => {
    expect(contains(without.message, without.bubble)).toBe(true);
    expect(without.bubble.x).toBeGreaterThan(withGuide.bubble.x);
    expect(without.bubble.x).toBeGreaterThan(without.footer.x + without.footer.width);
  });
});

it('keeps the card column a similar width on every screen', () => {
  const widths = [main, sub1, sub2].map((vp) => gameRegions(vp).prompt.width);
  expect(Math.max(...widths) / Math.min(...widths)).toBeLessThan(1.4);
});

describe('content band (side margins, balanced width on the 32:9 screen)', () => {
  it('keeps the same margin at both sides on the standard screens', () => {
    for (const viewport of [sub1, sub2]) {
      const band = contentBand(viewport);
      expect(band.x).toBeCloseTo(SIDE_MARGIN);
      expect(band.x + band.width).toBeCloseTo(viewport.designWidth - SIDE_MARGIN);
    }
  });

  it('uses the 16:9 width on the wide screen, centred, so it matches the 1920×1080 layout', () => {
    const band = contentBand(main);
    const base = contentBand(sub2);
    expect(band.width).toBeCloseTo(base.width);
    expect(band.x * 2 + band.width).toBeCloseTo(main.designWidth);
    expect(band.width).toBeCloseTo(main.designHeight * BASE_ASPECT - SIDE_MARGIN * 2);
  });

  it('gives the wide screen the same header, field and cards as the 1920×1080 screen', () => {
    const shift = contentBand(main).x - contentBand(sub2).x;
    const a = gameRegions(main);
    const b = gameRegions(sub2);
    for (const key of ['header', 'field', 'prompt', 'howTo', 'message'] as const) {
      expect(a[key].x - shift).toBeCloseTo(b[key].x);
      expect(a[key].width).toBeCloseTo(b[key].width);
      expect(a[key].height).toBeCloseTo(b[key].height);
    }
  });

  it('holds every region of both layouts inside the band', () => {
    for (const viewport of [main, sub1, sub2]) {
      const band = contentBand(viewport);
      const g = gameRegions(viewport);
      const open = openRegions(viewport);
      const regions = [
        g.header,
        g.field,
        g.prompt,
        g.howTo,
        g.message,
        g.footer,
        g.bubble,
        g.guide,
        open.header,
        open.field,
      ];
      for (const r of regions) {
        if (!r) continue;
        expect(r.x).toBeGreaterThanOrEqual(band.x - 0.01);
        expect(r.x + r.width).toBeLessThanOrEqual(band.x + band.width + 0.01);
      }
    }
  });
});
