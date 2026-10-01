import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { COLORS } from './theme';

/** Corner radius shared with the field picture (FieldPicture). */
export const FIELD_RADIUS = 36;
const BORDER_WIDTH = 5;
/** In front of the field picture (and the bubbles), behind the fish. */
const DEPTH = -400;

/** Thin rounded border around the play field (the main area of the client's layout diagram). */
export class FieldFrame {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(DEPTH);
  }

  layout(area: Rect): void {
    this.graphics
      .clear()
      .lineStyle(BORDER_WIDTH, COLORS.fieldBorder)
      .strokeRoundedRect(area.x, area.y, area.width, area.height, FIELD_RADIUS);
  }
}
