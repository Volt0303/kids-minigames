import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { drawPanel } from './panelShape';
import { RichText, type RichLines } from './RichText';
import { COLORS, TEXT } from './theme';

const PADDING_X = 40;
const PADDING_Y = 10;
/** Space on the right of the text for the little star decoration. */
const STAR_SPACE = 70;

/**
 * Encouraging message (e.g. 「おさかなはかせを めざそう!」) in its own rounded box next to
 * the starfish, with a small star at the end, as in the client's mockup.
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
    const scale = Math.min(
      1,
      (area.height - PADDING_Y * 2) / Math.max(1, this.text.textHeight),
      (area.width - PADDING_X * 2 - STAR_SPACE) / Math.max(1, this.text.textWidth),
    );
    const width = Math.min(area.width, this.text.textWidth * scale + PADDING_X * 2 + STAR_SPACE);
    const box = { x: area.x, y: area.y, width, height: area.height };
    this.panel.clear();
    drawPanel(this.panel, box, { fill: COLORS.bar, border: COLORS.barBorder, radius: 32 });

    const y = area.y + area.height / 2;
    this.text.setScale(scale).setPosition(area.x + PADDING_X, y);
    this.star.setPosition(area.x + width - PADDING_X / 2 - STAR_SPACE / 2, y + area.height * 0.12);
  }
}
