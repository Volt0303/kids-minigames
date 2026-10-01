import * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { COLORS, TEXT } from './theme';

export interface Praise {
  /** Big word, e.g. 「せいかい！」 */
  title: string;
  /** Second line, e.g. 「よく みつけたね！」 */
  line: string;
}

const SHOW_MS = 1_300;
const RADIUS = 44;
const TAIL = 34;
const HEIGHT = 190;
const INSET = 30;

/**
 * Speech bubble that pops up after a correct answer (「せいかい！ よく みつけたね！」),
 * as in the mockups. One instance per scene, reused every time.
 */
export class PraiseBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly shape: Phaser.GameObjects.Graphics;
  private readonly width: number;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    praise: Praise,
  ) {
    this.shape = scene.add.graphics();
    const title = scene.add.text(0, -26, praise.title, TEXT.bubbleTitle).setOrigin(0.5);
    const line = scene.add.text(0, 42, praise.line, TEXT.bubbleLine).setOrigin(0.5);
    this.width = Math.max(title.width, line.width) + 90;
    this.drawShape(this.width, HEIGHT);
    this.container = scene.add.container(0, 0, [this.shape, title, line]).setDepth(95).setVisible(false);
  }

  /** Sits in the bottom-right corner of the play field, as in the mockups. */
  layout(field: Rect): void {
    this.container.setPosition(
      field.x + field.width - this.width / 2 - INSET,
      field.y + field.height - HEIGHT / 2 - INSET - TAIL,
    );
  }

  show(): void {
    this.hideTimer?.remove();
    this.scene.tweens.killTweensOf(this.container);
    this.container.setVisible(true).setScale(0.4);
    this.scene.tweens.add({ targets: this.container, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.hideTimer = this.scene.time.delayedCall(SHOW_MS, () => this.container.setVisible(false));
  }

  private drawShape(width: number, height: number): void {
    const left = -width / 2;
    const top = -height / 2;
    this.shape
      .fillStyle(0x000000, 0.15)
      .fillRoundedRect(left + 6, top + 8, width, height, RADIUS)
      .fillStyle(COLORS.panel)
      .fillRoundedRect(left, top, width, height, RADIUS)
      .fillTriangle(width / 2 - 90, height / 2 - 4, width / 2 - 30, height / 2 - 4, width / 2 - 20, height / 2 + TAIL)
      .lineStyle(6, COLORS.panelBorder)
      .strokeRoundedRect(left, top, width, height, RADIUS);
  }
}
