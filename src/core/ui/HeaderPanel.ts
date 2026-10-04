import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';

const FILL = 0xeaf7ff;
const SHINE = 0xffffff;
const BORDER = 0x5cb8ef;
const BORDER_WIDTH = 8;
const RADIUS = 34;
/** Behind the header's logo and badges, in front of the backdrop. */
const DEPTH = -300;

/** The light-blue banner behind the header in the open layout (② お寿司パズル's design). */
export class HeaderPanel {
  private readonly graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(DEPTH);
  }

  layout(area: Rect): void {
    const { x, y, width, height } = area;
    this.graphics
      .clear()
      .fillStyle(FILL)
      .fillRoundedRect(x, y, width, height, RADIUS)
      // A soft white shine along the top half, like the design.
      .fillStyle(SHINE, 0.55)
      .fillRoundedRect(x + 16, y + 10, width - 32, height * 0.42, RADIUS * 0.7)
      .lineStyle(BORDER_WIDTH, BORDER)
      .strokeRoundedRect(x, y, width, height, RADIUS);
  }
}
