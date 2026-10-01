/**
 * Splits the header bar into its three areas (title / how-to / progress) as in the
 * client's layout diagram. Each area first gets the width its contents need; when the
 * screen is too narrow, every area (and its contents) shrinks by the same factor, and
 * when there is room to spare it is shared out in the diagram's proportions.
 */
import { inset, rect, type Rect } from './rect';

export interface HeaderColumns {
  title: Rect;
  howTo: Rect;
  progress: Rect;
  /** Scale for the contents (≤ 1): how much they had to shrink to fit. */
  scale: number;
}

/** Natural (unscaled) content widths of the three areas, including their own padding. */
export interface HeaderContentWidths {
  title: number;
  howTo: number;
  progress: number;
}

/** Share of spare width per area, from the diagram (title widest, progress narrowest). */
const SPARE_SHARE = { title: 0.45, howTo: 0.31, progress: 0.24 } as const;

export function headerColumns(bar: Rect, padding: number, gap: number, content: HeaderContentWidths): HeaderColumns {
  const row = inset(bar, padding);
  const available = Math.max(0, row.width - gap * 2);
  const natural = content.title + content.howTo + content.progress;
  if (!(natural > 0)) throw new RangeError('headerColumns: content widths must be positive');

  const scale = Math.min(1, available / natural);
  const spare = Math.max(0, available - natural * scale);
  const widths = {
    title: content.title * scale + spare * SPARE_SHARE.title,
    howTo: content.howTo * scale + spare * SPARE_SHARE.howTo,
    progress: content.progress * scale + spare * SPARE_SHARE.progress,
  };

  const title = rect(row.x, row.y, widths.title, row.height);
  const howTo = rect(title.x + title.width + gap, row.y, widths.howTo, row.height);
  const progress = rect(howTo.x + howTo.width + gap, row.y, widths.progress, row.height);
  return { title, howTo, progress, scale };
}
