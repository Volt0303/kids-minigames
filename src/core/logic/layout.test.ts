import { describe, expect, it } from 'vitest';
import { getLayoutMode, minTouchSize, WIDE_RATIO } from './layout';

describe('getLayoutMode', () => {
  it.each([
    { device: 'main 1920x540', width: 1920, height: 540, mode: 'wide' },
    { device: 'sub1 1280x800', width: 1280, height: 800, mode: 'standard' },
    { device: 'sub2 1920x1080', width: 1920, height: 1080, mode: 'standard' },
  ] as const)('uses $mode layout on $device', ({ width, height, mode }) => {
    expect(getLayoutMode(width, height)).toBe(mode);
  });

  it('switches to wide exactly at the threshold ratio', () => {
    expect(getLayoutMode(WIDE_RATIO * 100, 100)).toBe('wide');
    expect(getLayoutMode(WIDE_RATIO * 100 - 1, 100)).toBe('standard');
  });
});

describe('minTouchSize', () => {
  it('scales with screen height', () => {
    expect(minTouchSize(540)).toBe(70);
    expect(minTouchSize(1080)).toBe(140);
  });
});
