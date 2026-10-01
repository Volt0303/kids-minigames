import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';

export interface PanelStyle {
  fill: number;
  border: number;
  radius?: number;
  lineWidth?: number;
}

const RADIUS = 28;
const LINE_WIDTH = 4;

/** Adds one rounded, bordered box (an area of the client's layout diagram) to `graphics`. */
export function drawPanel(graphics: Phaser.GameObjects.Graphics, area: Rect, style: PanelStyle): void {
  const radius = style.radius ?? RADIUS;
  graphics
    .fillStyle(style.fill)
    .fillRoundedRect(area.x, area.y, area.width, area.height, radius)
    .lineStyle(style.lineWidth ?? LINE_WIDTH, style.border)
    .strokeRoundedRect(area.x, area.y, area.width, area.height, radius);
}
