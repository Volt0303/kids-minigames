/**
 * Rectangle helpers for laying out screens in design space: split the screen
 * into regions (board / tray, left / right picture) and fit content inside them.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  /** Centre position of the placed content. */
  x: number;
  y: number;
  /** Uniform scale applied to the content. */
  scale: number;
}

export type SplitAxis = 'horizontal' | 'vertical';

export function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

export function center(area: Rect): { x: number; y: number } {
  return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
}

/** Shrinks a rectangle by the same margin on every side (never below zero size). */
export function inset(area: Rect, margin: number): Rect {
  const dx = Math.min(margin, area.width / 2);
  const dy = Math.min(margin, area.height / 2);
  return rect(area.x + dx, area.y + dy, area.width - dx * 2, area.height - dy * 2);
}

/**
 * Splits a rectangle into consecutive parts sized by weight.
 * `horizontal` places parts side by side; `vertical` stacks them.
 */
export function split(area: Rect, axis: SplitAxis, weights: readonly number[], gap = 0): Rect[] {
  if (weights.length === 0) return [];
  if (weights.some((w) => !(w > 0))) throw new RangeError('split: every weight must be a positive number');

  const total = weights.reduce((sum, w) => sum + w, 0);
  const length = axis === 'horizontal' ? area.width : area.height;
  const usable = Math.max(0, length - gap * (weights.length - 1));

  let offset = 0;
  return weights.map((weight) => {
    const size = (usable * weight) / total;
    const part =
      axis === 'horizontal'
        ? rect(area.x + offset, area.y, size, area.height)
        : rect(area.x, area.y + offset, area.width, size);
    offset += size + gap;
    return part;
  });
}

/** Largest uniform scale that fits content of the given size inside the area, centred. */
export function fitContain(contentWidth: number, contentHeight: number, area: Rect): Placement {
  if (!(contentWidth > 0 && contentHeight > 0)) throw new RangeError('fitContain: content size must be positive');
  const scale = Math.min(area.width / contentWidth, area.height / contentHeight);
  return { ...center(area), scale };
}
