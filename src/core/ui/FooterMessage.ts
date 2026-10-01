import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { RichText, type RichLines } from './RichText';
import { COLORS, TEXT } from './theme';

const RADIUS = 34;
const PADDING = 40;
/** Space on the right of the text for the little star decoration. */
const STAR_SPACE = 70;

/**
 * Encouraging message under the play field (e.g. 「おさかなはかせを めざそう！」):
 * left-aligned next to the starfish, with a small star at the end, as in the mockups.
 */
export class FooterMessage {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly text: RichText;
  private readonly star: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, lines: RichLines) {
    this.panel = scene.add.graphics();
    this.text = new RichText(scene, TEXT.footer, 'left').setContent(lines);
    this.star = scene.add.text(0, 0, '★', TEXT.footerStar).setOrigin(0.5);
  }

  layout(area: Rect): void {
    const textSpace = area.width - PADDING * 2 - STAR_SPACE;
    const scale = Math.min(
      1,
      (area.height - PADDING / 2) / Math.max(1, this.text.textHeight),
      textSpace / Math.max(1, this.text.textWidth),
    );
    const width = Math.min(area.width, this.text.textWidth * scale + PADDING * 2 + STAR_SPACE);
    this.panel
      .clear()
      .fillStyle(COLORS.panel, 0.95)
      .fillRoundedRect(area.x, area.y, width, area.height, RADIUS)
      .lineStyle(6, COLORS.panelBorder)
      .strokeRoundedRect(area.x, area.y, width, area.height, RADIUS);
    this.text.setScale(scale).setPosition(area.x + PADDING, area.y + area.height / 2);
    this.star.setPosition(area.x + width - STAR_SPACE / 2 - PADDING / 3, area.y + area.height * 0.62);
  }
}
