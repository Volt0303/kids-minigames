import type * as Phaser from 'phaser';
import { COLORS } from './theme';

const RADIUS = 30;
const EDGE = 6;
const INSET_RADIUS = 16;

/** Blue rounded badge with a pale edge, centred on (0, 0). Used by the header badges. */
export function drawBadge(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
  graphics
    .fillStyle(COLORS.badgeBorder)
    .fillRoundedRect(-width / 2 - EDGE, -height / 2 - EDGE, width + EDGE * 2, height + EDGE * 2, RADIUS + EDGE)
    .fillStyle(COLORS.badge)
    .fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS);
}

/** Darker pill behind a badge's value; `area` is centred on (area.x, area.y). */
export function drawInset(
  graphics: Phaser.GameObjects.Graphics,
  area: { x: number; y: number; width: number; height: number },
): void {
  const { x, y, width, height } = area;
  graphics.fillStyle(COLORS.badgeInset).fillRoundedRect(x - width / 2, y - height / 2, width, height, INSET_RADIUS);
}
