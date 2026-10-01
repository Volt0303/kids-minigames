import type * as Phaser from 'phaser';
import { COLORS } from './theme';

const RADIUS = 28;

/** Dark rounded badge with a white edge, centred on (0, 0). Used by the header badges. */
export function drawBadge(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
  graphics
    .clear()
    .fillStyle(COLORS.badge)
    .fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS)
    .lineStyle(5, 0xffffff)
    .strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS);
}
