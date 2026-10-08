import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { rect, type Rect } from '../../core/logic/rect';
import { RichText } from '../../core/ui/RichText';
import { POP_FONT_FAMILY } from '../../core/ui/theme';

const UI = atlasKey('ui');
const FILL = 0xeef8dc;
const EDGE = 0x8cc152;
const PILL = 0x4f9a2a;
/** The green circle behind the light bulb (design). */
const BULB_CIRCLE = 0x5ba832;
const BUTTON = 0x2b7de9;
const RADIUS = 30;
const PRESSED_SCALE = 0.9;
const containsPoint = (circle: Phaser.Geom.Circle, x: number, y: number): boolean => circle.contains(x, y);

/**
 * The green 「ヒント」 panel from the design: a light bulb, the 「ヒント」 pill, the explanation
 * and the round blue eye button that shows where a piece goes.
 * Lays itself out in a row, or stacked when the panel is tall (wide screen).
 */
export class HintPanel {
  /** The eye button (also what the stuck-child hint points at). */
  readonly button: Phaser.GameObjects.Container;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly bulb: Phaser.GameObjects.Image;
  /** The pink starfish standing above the panel's right end (design decoration). */
  private readonly starfish: Phaser.GameObjects.Image;
  private readonly pillLabel: Phaser.GameObjects.Text;
  private readonly text: RichText;
  private pressed = false;

  constructor(scene: Phaser.Scene, onTap: () => void) {
    this.graphics = scene.add.graphics();
    this.bulb = scene.add.image(0, 0, UI, 'icon-bulb');
    this.starfish = scene.add.image(0, 0, atlasKey('characters'), 'starfish-pink').setDepth(46).setAngle(-8);
    this.pillLabel = scene.add
      .text(0, 0, 'ヒント', { fontFamily: POP_FONT_FAMILY, fontStyle: '800', fontSize: '40px', color: '#ffffff' })
      .setOrigin(0.5);
    this.text = new RichText(
      scene,
      { fontFamily: POP_FONT_FAMILY, fontStyle: '800', fontSize: '30px', color: '#3a2412' },
      'left',
    );
    this.text.setContent([
      [{ text: 'むずかしい ときは、ヒントボタンで' }],
      [{ text: 'ピースを おく ばしょが わかるよ!' }],
    ]);
    this.button = this.makeButton(scene, onTap);
  }

  layout(area: Rect): void {
    const g = this.graphics.clear();
    g.fillStyle(0xffffff, 0.85).fillRoundedRect(area.x - 6, area.y - 6, area.width + 12, area.height + 12, RADIUS + 6);
    g.fillStyle(FILL).fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    g.lineStyle(6, EDGE).strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    if (area.width / area.height < 1.4) this.layoutStacked(area);
    else this.layoutRow(area);
    // Standing above the panel's right end, as in the design; in the tall (wide-screen) panel at
    // its bottom-left corner, clear of the ✕ button.
    const tall = area.width / area.height < 1.4;
    const size = tall ? area.width * 0.3 : area.height * 0.72;
    const corner = tall
      ? { x: area.x + size * 0.2, y: area.y + area.height - size * 0.1 }
      : { x: area.x + area.width - size * 0.45, y: area.y - size * 0.42 };
    this.starfish.setScale(size / this.starfish.frame.height).setPosition(corner.x, corner.y);
  }

  /** Bulb | pill above text | eye button. */
  private layoutRow(area: Rect): void {
    const size = area.height * 0.62;
    this.placeBulb(area.x + 20 + size / 2, area.y + area.height / 2, size);
    const buttonSize = area.height * 0.82;
    this.button
      .setScale(buttonSize / 160)
      .setPosition(area.x + area.width - 20 - buttonSize / 2, area.y + area.height / 2);
    const textArea = rect(area.x + 40 + size, area.y + 14, area.width - size - buttonSize - 80, area.height - 28);
    this.pill(rect(textArea.x, textArea.y, textArea.width, textArea.height * 0.42));
    this.fitText(rect(textArea.x, textArea.y + textArea.height * 0.48, textArea.width, textArea.height * 0.52));
  }

  /** Bulb and pill, text, then the eye button, top to bottom. */
  private layoutStacked(area: Rect): void {
    const inner = rect(area.x + 20, area.y + 20, area.width - 40, area.height - 40);
    const size = inner.height * 0.2;
    this.placeBulb(inner.x + size / 2, inner.y + size / 2, size);
    this.pill(rect(inner.x + size + 10, inner.y + size * 0.15, inner.width - size - 10, size * 0.7));
    this.fitText(rect(inner.x, inner.y + size + 16, inner.width, inner.height * 0.32));
    const buttonSize = Math.min(inner.width * 0.6, inner.height * 0.36);
    this.button
      .setScale(buttonSize / 160)
      .setPosition(inner.x + inner.width / 2, inner.y + inner.height - buttonSize / 2);
  }

  /** The bulb on a green circle with a white ring, `size` across. */
  private placeBulb(x: number, y: number, size: number): void {
    this.graphics.fillStyle(BULB_CIRCLE).fillCircle(x, y, size / 2);
    this.graphics.lineStyle(5, 0xffffff).strokeCircle(x, y, size / 2 - 2);
    this.bulb.setScale((size * 0.72) / this.bulb.frame.height).setPosition(x, y);
  }

  private pill(area: Rect): void {
    const height = Math.min(area.height, 64);
    const width = Math.min(area.width, this.pillLabel.width + 70);
    const y = area.y + (area.height - height) / 2;
    this.graphics.fillStyle(PILL).fillRoundedRect(area.x, y, width, height, height / 2);
    this.pillLabel
      .setScale(Math.min(1, (height * 0.75) / this.pillLabel.height))
      .setPosition(area.x + width / 2, y + height / 2);
  }

  private fitText(area: Rect): void {
    const scale = Math.min(
      1,
      area.width / Math.max(1, this.text.textWidth),
      area.height / Math.max(1, this.text.textHeight),
    );
    this.text.setScale(scale).setPosition(area.x, area.y + area.height / 2);
  }

  /** A round blue button with an eye, 160 design units across at scale 1. */
  private makeButton(scene: Phaser.Scene, onTap: () => void): Phaser.GameObjects.Container {
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.18).fillCircle(0, 8, 80);
    g.fillStyle(BUTTON).fillCircle(0, 0, 80);
    g.lineStyle(8, 0xffffff).strokeCircle(0, 0, 76);
    g.fillStyle(0xffffff).fillEllipse(0, 0, 100, 60);
    g.fillStyle(BUTTON).fillCircle(0, 0, 22);
    g.fillStyle(0xffffff).fillCircle(7, -7, 7);
    const button = scene.add.container(0, 0, [g]).setSize(160, 160).setDepth(45);
    button.setInteractive(new Phaser.Geom.Circle(80, 80, 90), containsPoint);
    button.on('pointerdown', () => this.press(true));
    button.on('pointerout', () => this.press(false));
    button.on('pointerup', () => {
      if (!this.pressed) return;
      this.press(false);
      onTap();
    });
    return button;
  }

  private press(pressed: boolean): void {
    if (pressed === this.pressed) return;
    this.pressed = pressed;
    this.button.setScale(this.button.scale * (pressed ? PRESSED_SCALE : 1 / PRESSED_SCALE));
  }
}
