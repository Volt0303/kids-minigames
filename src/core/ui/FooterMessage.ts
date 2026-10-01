import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { RichText, type RichLines } from './RichText';
import { TEXT } from './theme';

/** Space on the right of the text for the little star decoration. */
const STAR_SPACE = 70;
const PADDING = 12;

/**
 * Encouraging message in the message bar (e.g. 「おさかなはかせを めざそう!」):
 * left-aligned next to the starfish, with a small star at the end, as in the mockups.
 */
export class FooterMessage {
  private readonly text: RichText;
  private readonly star: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, lines: RichLines) {
    this.text = new RichText(scene, TEXT.footer, 'left').setContent(lines);
    this.star = scene.add.text(0, 0, '★', TEXT.footerStar).setOrigin(0.5);
  }

  layout(area: Rect): void {
    const scale = Math.min(
      1,
      (area.height - PADDING) / Math.max(1, this.text.textHeight),
      (area.width - STAR_SPACE) / Math.max(1, this.text.textWidth),
    );
    const y = area.y + area.height / 2;
    this.text.setScale(scale).setPosition(area.x, y);
    this.star.setPosition(area.x + this.text.textWidth * scale + STAR_SPACE / 2, y + area.height * 0.12);
  }
}
