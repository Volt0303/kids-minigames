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
/** Height of the tail's tip, relative to the bubble's centre. */
const TAIL_TIP_Y = 34;
const HEIGHT = 190;
/** Bubble height relative to its area. */
const MAX_RISE = 1.35;

/**
 * Speech bubble that pops up after a correct answer (「せいかい！ よく みつけたね！」),
 * as in the mockups. One instance per scene, reused every time.
 */
export class PraiseBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly shape: Phaser.GameObjects.Graphics;
  private readonly width: number;
  /** Scale that fits the bubble into its region (narrow screens). */
  private fitScale = 1;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    praise: Praise,
    /** Draws a tail pointing right, at the guide character. */
    private readonly tail: boolean,
  ) {
    this.shape = scene.add.graphics();
    const title = scene.add.text(0, -26, praise.title, TEXT.bubbleTitle).setOrigin(0.5);
    const line = scene.add.text(0, 42, praise.line, TEXT.bubbleLine).setOrigin(0.5);
    this.width = Math.max(title.width, line.width) + 90;
    this.drawShape(this.width, HEIGHT);
    this.container = scene.add.container(0, 0, [this.shape, title, line]).setDepth(95).setVisible(false);
  }

  /**
   * Sits in `area` next to the guide character, as in the mockups: bottom-aligned,
   * taller than the area so it overlaps the bottom of the field a little.
   */
  layout(area: Rect): void {
    // May rise a little above its area (over the field's edge), but not over the cards.
    const tail = this.tail ? TAIL : 0;
    this.fitScale = Math.min(1, (area.width - tail) / this.width, (area.height * MAX_RISE) / HEIGHT);
    const height = HEIGHT * this.fitScale;
    this.container
      .setPosition(area.x + (area.width - tail * this.fitScale) / 2, area.y + area.height - height / 2)
      .setScale(this.fitScale);
  }

  /**
   * Moves the bubble so its tail ends at `tip` (e.g. next to the character's mouth),
   * keeping the size chosen by `layout`.
   */
  speakFrom(tip: { x: number; y: number }): void {
    const scale = this.fitScale;
    this.container.setPosition(tip.x - (this.width / 2 + TAIL) * scale, tip.y - TAIL_TIP_Y * scale);
  }

  show(): void {
    this.hideTimer?.remove();
    this.scene.tweens.killTweensOf(this.container);
    this.container.setVisible(true);
    this.container.setScale(this.fitScale * 0.4);
    this.scene.tweens.add({ targets: this.container, scale: this.fitScale, duration: 260, ease: 'Back.easeOut' });
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
      .lineStyle(6, COLORS.panelBorder)
      .strokeRoundedRect(left, top, width, height, RADIUS);
    if (!this.tail) return;
    // Tail on the right, pointing at the guide character; drawn over the border so it joins the bubble.
    const edge = width / 2;
    this.shape
      .fillStyle(COLORS.panel)
      .fillTriangle(edge - 8, -8, edge - 8, 46, edge + TAIL, TAIL_TIP_Y)
      .beginPath()
      .moveTo(edge - 2, -8)
      .lineTo(edge + TAIL, TAIL_TIP_Y)
      .lineTo(edge - 2, 46)
      .strokePath();
  }
}
