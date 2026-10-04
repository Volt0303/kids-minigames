import type * as Phaser from 'phaser';
import type { Rect } from '../../core/logic/rect';
import { RichText, type RichLines } from '../../core/ui/RichText';
import { FONT_FAMILY } from '../../core/ui/theme';

const FILL = 0xffffff;
const BORDER = 0x5cb8ef;
const PADDING_X = 34;

/** The instruction bubble above the board (「えらんだ ネタを シャリの うえに のせてね!」). */
export class Instruction {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly text: RichText;

  constructor(scene: Phaser.Scene, lines: RichLines) {
    this.panel = scene.add.graphics();
    this.text = new RichText(scene, { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '40px', color: '#1d3557' });
    this.text.setContent(lines);
  }

  layout(area: Rect): void {
    const height = area.height - 10;
    const scale = Math.min(1, (area.width - PADDING_X * 2) / Math.max(1, this.text.textWidth));
    const width = this.text.textWidth * scale + PADDING_X * 2;
    const x = area.x + (area.width - width) / 2;
    this.panel
      .clear()
      .fillStyle(FILL)
      .fillRoundedRect(x, area.y, width, height, height / 2)
      .lineStyle(5, BORDER)
      .strokeRoundedRect(x, area.y, width, height, height / 2);
    this.text.setScale(scale).setPosition(area.x + area.width / 2, area.y + height / 2);
  }
}
