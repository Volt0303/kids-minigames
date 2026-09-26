import { describe, expect, it } from 'vitest';
import { computeViewport, DESIGN_HEIGHT, MAX_PIXEL_RATIO, sameViewport } from './viewport';

describe('computeViewport on the target devices', () => {
  it('main 1920x540: wide design space 3840 units', () => {
    const vp = computeViewport({ cssWidth: 1920, cssHeight: 540, pixelRatio: 1 });
    expect(vp).toMatchObject({ physicalWidth: 1920, physicalHeight: 540, designWidth: 3840, mode: 'wide' });
    expect(vp.scale).toBe(0.5);
  });

  it('sub1 1280x800: standard design space 1728 units', () => {
    const vp = computeViewport({ cssWidth: 1280, cssHeight: 800, pixelRatio: 1 });
    expect(vp).toMatchObject({ designWidth: 1728, designHeight: DESIGN_HEIGHT, mode: 'standard' });
  });

  it('sub2 at 213 dpi renders at physical pixels, not CSS pixels', () => {
    // Measured on the Android 9 emulator: 1443x788 CSS pixels at ratio 1.33125.
    const vp = computeViewport({ cssWidth: 1443, cssHeight: 788, pixelRatio: 1.33125 });
    expect(vp.physicalWidth).toBe(1921);
    expect(vp.physicalHeight).toBe(1049);
    expect(vp.canvasZoom).toBeCloseTo(1 / 1.33125);
    expect(vp.mode).toBe('standard');
  });
});

describe('computeViewport guards', () => {
  it('caps the pixel ratio', () => {
    const vp = computeViewport({ cssWidth: 1000, cssHeight: 500, pixelRatio: 4 });
    expect(vp.physicalHeight).toBe(500 * MAX_PIXEL_RATIO);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('treats pixel ratio %s as 1', (pixelRatio) => {
    expect(computeViewport({ cssWidth: 800, cssHeight: 600, pixelRatio }).physicalWidth).toBe(800);
  });

  it('survives a zero-size window during start-up', () => {
    const vp = computeViewport({ cssWidth: 0, cssHeight: 0, pixelRatio: 1 });
    expect(vp.physicalWidth).toBe(1);
    expect(Number.isFinite(vp.designWidth)).toBe(true);
  });
});

describe('sameViewport', () => {
  it('detects when nothing visible changed', () => {
    const a = computeViewport({ cssWidth: 1280, cssHeight: 800, pixelRatio: 1 });
    const b = computeViewport({ cssWidth: 1280, cssHeight: 800, pixelRatio: 1 });
    const c = computeViewport({ cssWidth: 1280, cssHeight: 780, pixelRatio: 1 });
    expect(sameViewport(a, b)).toBe(true);
    expect(sameViewport(a, c)).toBe(false);
  });
});
