import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { RichText, type RichLines } from './RichText';
import { COLORS, TEXT } from './theme';

const RADIUS = 34;
const PADDING = 24;

/** Encouraging message under the play field (e.g. 「おさかなはかせを めざそう！」). */
export class FooterMessage {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly text: RichText;

  constructor(scene: Phaser.Scene, lines: RichLines) {
    this.panel = scene.add.graphics();
    this.text = new RichText(scene, TEXT.footer).setContent(lines);
  }

  layout(area: Rect): void {
    const scale = Math.min(
      1,
      (area.height - PADDING) / Math.max(1, this.text.textHeight),
      (area.width - PADDING * 2) / Math.max(1, this.text.textWidth),
    );
    const width = Math.min(area.width, this.text.textWidth * scale + PADDING * 4);
    const left = area.x + (area.width - width) / 2;
    this.panel
      .clear()
      .fillStyle(COLORS.panel, 0.92)
      .fillRoundedRect(left, area.y, width, area.height, RADIUS)
      .lineStyle(6, COLORS.panelBorder)
      .strokeRoundedRect(left, area.y, width, area.height, RADIUS);
    this.text.setScale(scale).setPosition(area.x + area.width / 2, area.y + area.height / 2);
  }
}
