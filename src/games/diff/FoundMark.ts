import type * as Phaser from 'phaser';
import { PEN_CIRCLE, PEN_CIRCLE_LENGTH } from './logic/penCircle';

/** A rich red pen stroke on a soft white halo, so it shows on any picture. */
const PEN = { color: 0xe8264f, width: 10, alpha: 1 };
const HALO = { color: 0xffffff, width: 20, alpha: 0.9 };
const DRAW_MS = 420;
/** A small pop when the circle closes. */
const POP = { scale: 1.08, ms: 120 };
/** Coordinate `i` of the pen circle (radius 1). */
const coord = (i: number): number => PEN_CIRCLE[i] ?? 0;

/** A found difference: a red circle drawn in one smooth pen stroke, which pops when it closes. */
export class FoundMark {
  private readonly pen: Phaser.GameObjects.Graphics;
  private radius = 1;

  constructor(private readonly scene: Phaser.Scene) {
    this.pen = scene.add.graphics().setDepth(20).setVisible(false);
  }

  /** Shows the mark at (x, y); `animate` draws it with the pen, else it appears at once. */
  show(x: number, y: number, radius: number, animate: boolean): void {
    this.hide();
    this.radius = radius;
    this.pen.setPosition(x, y).setScale(1).setVisible(true);
    if (!animate) {
      this.drawPen(1);
      return;
    }
    this.drawPen(0);
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: DRAW_MS,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => this.drawPen(tween.getValue() ?? 1),
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.pen,
          scale: POP.scale,
          duration: POP.ms,
          yoyo: true,
          ease: 'Sine.easeOut',
        });
      },
    });
  }

  /** Moves a shown mark (screen resized), without animating. */
  move(x: number, y: number, radius: number): void {
    if (this.pen.visible) this.show(x, y, radius, false);
  }

  hide(): void {
    this.scene.tweens.killTweensOf(this.pen);
    this.pen.clear().setVisible(false);
  }

  /** Draws the first `share` of the pen stroke: the white halo, then the red pen. */
  private drawPen(share: number): void {
    const count = Math.max(2, Math.round(PEN_CIRCLE_LENGTH * share));
    const r = this.radius;
    const g = this.pen.clear();
    for (const style of [HALO, PEN]) {
      g.lineStyle(style.width, style.color, style.alpha).beginPath();
      g.moveTo(coord(0) * r, coord(1) * r);
      for (let i = 1; i < count; i++) g.lineTo(coord(i * 2) * r, coord(i * 2 + 1) * r);
      g.strokePath();
    }
    // Round pen tips at both ends of the stroke.
    const end = count - 1;
    g.fillStyle(PEN.color);
    g.fillCircle(coord(0) * r, coord(1) * r, PEN.width / 2);
    g.fillCircle(coord(end * 2) * r, coord(end * 2 + 1) * r, PEN.width / 2);
  }
}
