import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { COLORS } from './theme';

const RADIUS = 36;
const BORDER_WIDTH = 5;
/** In front of the field picture (and the bubbles), behind the fish. */
const DEPTH = -400;

/** The four corners: which side each is on (0 = left/top, 1 = right/bottom) and where its quarter arc starts. */
const CORNERS = [
  { cx: 0, cy: 0, start: Math.PI },
  { cx: 1, cy: 0, start: -Math.PI / 2 },
  { cx: 1, cy: 1, start: 0 },
  { cx: 0, cy: 1, start: Math.PI / 2 },
] as const;

/**
 * Rounded border around the play field (the main area of the client's layout diagram).
 * The field picture is rectangular, so the four corner slivers outside the rounded
 * border are painted in the page colour to keep the picture inside the frame.
 */
export class FieldFrame {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(DEPTH);
  }

  layout(area: Rect): void {
    const g = this.graphics.clear().fillStyle(COLORS.background);
    for (const corner of CORNERS) {
      const x = area.x + corner.cx * area.width;
      const y = area.y + corner.cy * area.height;
      const centerX = x + (corner.cx === 0 ? RADIUS : -RADIUS);
      const centerY = y + (corner.cy === 0 ? RADIUS : -RADIUS);
      // Square corner minus the quarter circle: from the corner, along the arc, back to the corner.
      g.beginPath()
        .moveTo(x, y)
        .arc(centerX, centerY, RADIUS, corner.start, corner.start + Math.PI / 2)
        .closePath()
        .fillPath();
    }
    g.lineStyle(BORDER_WIDTH, COLORS.fieldBorder).strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
  }
}
