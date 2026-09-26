/**
 * Screen regions shared by every game, following the client's mockups:
 * a top bar (title, timer, progress), the play field, and a prompt panel on the right.
 */
import { inset, rect, split, type Rect } from './rect';
import type { Viewport } from './viewport';

export interface GameRegions {
  hud: Rect;
  field: Rect;
  panel: Rect;
}

export const HUD_HEIGHT = 150;
export const MARGIN = 30;

/** Play-field width relative to the prompt panel (weight 1), so the panel keeps a similar size on every screen. */
const FIELD_WEIGHT = { wide: 5, standard: 2.2 } as const;

export function gameRegions(viewport: Viewport): GameRegions {
  const screen = rect(0, 0, viewport.designWidth, viewport.designHeight);
  const [hud, body] = split(screen, 'vertical', [HUD_HEIGHT, viewport.designHeight - HUD_HEIGHT]);
  if (!hud || !body) throw new Error('gameRegions: screen split failed');

  const [field, panel] = split(inset(body, MARGIN), 'horizontal', [FIELD_WEIGHT[viewport.mode], 1], MARGIN);
  if (!field || !panel) throw new Error('gameRegions: body split failed');

  return { hud: inset(hud, MARGIN / 2), field, panel };
}
