import type * as Phaser from 'phaser';
import { NIGIRI_SIZE, sushiName, type SushiKind } from '../../core/assets/sushi';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import { Nigiri } from '../../core/ui/Nigiri';
import { FONT_FAMILY } from '../../core/ui/theme';

export interface SideCardStyle {
  label: string;
  /** Header bar and border. */
  color: number;
  /** Inside of the card. */
  fill: number;
  /** Text under the sushi (its name), and the optional result line. */
  nameColor: string;
}

const RADIUS = 30;
const BORDER = 7;
/** Header bar height, and the white rim around the card (as in the design). */
const BAR_HEIGHT = 70;
const RIM = 10;
const PICTURE_SHARE = 0.62;
const font = (size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontStyle: 'bold',
  fontSize: `${size}px`,
  color,
});

/**
 * One of the two cards beside the board (from the design): a coloured header bar with its
 * label (「お題の おすし」 / 「できたよ!」), and a sushi with its name — plus an optional
 * result line (「せいかい!」). Empty until `show` is called.
 */
export class SideCard {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly sushi: Nigiri;
  private readonly name: Phaser.GameObjects.Text;
  private readonly result: Phaser.GameObjects.Text;
  private area?: Rect;

  constructor(
    scene: Phaser.Scene,
    private readonly style: SideCardStyle,
  ) {
    this.panel = scene.add.graphics();
    this.label = scene.add.text(0, 0, style.label, font(38, '#ffffff')).setOrigin(0.5);
    this.sushi = new Nigiri(scene).setVisible(false);
    this.name = scene.add.text(0, 0, '', font(46, style.nameColor)).setOrigin(0.5).setVisible(false);
    this.result = scene.add.text(0, 0, '', font(54, '#e5383b')).setOrigin(0.5).setVisible(false);
  }

  layout(area: Rect): void {
    this.area = area;
    const { x, y, width, height } = area;
    const inner = rect(x + RIM, y + RIM, width - RIM * 2, height - RIM * 2);
    this.panel
      .clear()
      .fillStyle(0xffffff, 0.85)
      .fillRoundedRect(x, y, width, height, RADIUS + RIM)
      .fillStyle(this.style.fill)
      .fillRoundedRect(inner.x, inner.y, inner.width, inner.height, RADIUS)
      .lineStyle(BORDER, this.style.color)
      .strokeRoundedRect(inner.x, inner.y, inner.width, inner.height, RADIUS)
      .fillStyle(this.style.color)
      .fillRoundedRect(inner.x, inner.y, inner.width, BAR_HEIGHT, { tl: RADIUS, tr: RADIUS, bl: 0, br: 0 });
    this.label.setPosition(inner.x + inner.width / 2, inner.y + BAR_HEIGHT / 2);
    this.label.setScale(Math.min(1, (inner.width - 24) / this.label.width));
    this.arrange();
  }

  /** Shows a sushi and its name; `result` adds a line under it (e.g. 「せいかい!」). */
  show(kind: SushiKind, result = ''): void {
    this.sushi.setKind(kind).setVisible(true);
    this.name.setText(sushiName(kind)).setVisible(true);
    this.result.setText(result).setVisible(result !== '');
    this.arrange();
  }

  clear(): void {
    this.sushi.setVisible(false);
    this.name.setVisible(false);
    this.result.setVisible(false);
  }

  private arrange(): void {
    if (!this.area) return;
    const { x, y, width, height } = this.area;
    const body = rect(x + RIM * 2, y + RIM + BAR_HEIGHT, width - RIM * 4, height - RIM * 2 - BAR_HEIGHT);
    const pictureArea = rect(body.x, body.y + 8, body.width, body.height * PICTURE_SHARE);
    const fit = fitContain(NIGIRI_SIZE.width, NIGIRI_SIZE.height, pictureArea);
    this.sushi.setPosition(fit.x, fit.y).setScale(fit.scale * 0.9);
    const textTop = pictureArea.y + pictureArea.height;
    const rest = body.y + body.height - textTop;
    const withResult = this.result.visible;
    this.name.setPosition(body.x + body.width / 2, textTop + rest * (withResult ? 0.28 : 0.45));
    this.name.setScale(Math.min(1, body.width / Math.max(1, this.name.width)));
    this.result.setPosition(body.x + body.width / 2, textTop + rest * 0.72);
  }
}
