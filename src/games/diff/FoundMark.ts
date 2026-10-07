import * as Phaser from 'phaser';
import { PEN_CIRCLE, PEN_CIRCLE_LENGTH, starPoints } from './logic/penCircle';

/** A rich red pen stroke on a soft white halo, so it shows on any picture. */
const PEN = { color: 0xe8264f, width: 10, alpha: 1 };
const HALO = { color: 0xffffff, width: 20, alpha: 0.9 };
/** The thin gold ring just outside the circle (the frames' gold). */
const GOLD = { color: 0xf5b301, width: 4, distance: 1.16 };
/** Gold four-point sparkles with a white edge: angle (degrees), distance and size (× radius). */
const SPARKLE = { color: 0xffc83d, edge: 0xffffff };
const SPARKLES = [
  { angle: -45, distance: 1.2, size: 0.4 },
  { angle: 140, distance: 1.18, size: 0.26 },
] as const;
const SPARKLE_SHAPE = starPoints(4, 0.28);
const DRAW_MS = 420;
/** Coordinate `i` of the pen circle (radius 1). */
const coord = (i: number): number => PEN_CIRCLE[i] ?? 0;
const RING_MS = 320;

/**
 * A found difference: a red circle drawn in one smooth pen stroke; when it closes, a thin gold
 * ring settles around it and two gold sparkles twinkle gently.
 */
export class FoundMark {
  private readonly pen: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly sparkles: Phaser.GameObjects.Graphics[] = [];
  private radius = 1;

  constructor(private readonly scene: Phaser.Scene) {
    this.ring = scene.add.graphics().setDepth(20).setVisible(false);
    this.pen = scene.add.graphics().setDepth(20).setVisible(false);
    for (let i = 0; i < SPARKLES.length; i++) {
      this.sparkles.push(scene.add.graphics().setDepth(21).setVisible(false));
    }
  }

  /** Shows the mark at (x, y); `animate` draws it with the pen, else it appears at once. */
  show(x: number, y: number, radius: number, animate: boolean): void {
    this.hide();
    this.radius = radius;
    this.pen.setPosition(x, y).setVisible(true);
    this.drawRing(x, y);
    this.drawSparkles(x, y);
    if (!animate) {
      this.drawPen(1);
      this.finish(false);
      return;
    }
    this.drawPen(0);
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: DRAW_MS,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => this.drawPen(tween.getValue() ?? 1),
      onComplete: () => this.finish(true),
    });
  }

  /** Moves a shown mark (screen resized), without animating. */
  move(x: number, y: number, radius: number): void {
    if (this.pen.visible) this.show(x, y, radius, false);
  }

  hide(): void {
    this.scene.tweens.killTweensOf([this.pen, this.ring, ...this.sparkles]);
    this.pen.clear().setVisible(false);
    this.ring.setVisible(false);
    for (const sparkle of this.sparkles) sparkle.setVisible(false);
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

  private drawRing(x: number, y: number): void {
    this.ring.clear().setPosition(x, y).setScale(1).setAlpha(1).setVisible(false);
    this.ring.lineStyle(GOLD.width, GOLD.color).strokeCircle(0, 0, this.radius * GOLD.distance);
  }

  private drawSparkles(x: number, y: number): void {
    SPARKLES.forEach((spec, i) => {
      const sparkle = this.sparkles[i];
      if (!sparkle) return;
      const size = this.radius * spec.size;
      const angle = Phaser.Math.DegToRad(spec.angle);
      const r = this.radius * spec.distance;
      sparkle.clear().setPosition(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      sparkle.fillStyle(SPARKLE.edge).fillPoints(scaled(size * 1.35), true);
      sparkle.fillStyle(SPARKLE.color).fillPoints(scaled(size), true);
      sparkle.setScale(0).setAngle(0).setVisible(false);
    });
  }

  /** The gold ring settles in from slightly larger, then the sparkles pop in and twinkle. */
  private finish(animate: boolean): void {
    this.ring.setVisible(true);
    if (animate) {
      this.ring.setScale(1.25).setAlpha(0);
      this.scene.tweens.add({ targets: this.ring, scale: 1, alpha: 1, duration: RING_MS, ease: 'Cubic.easeOut' });
    }
    this.sparkles.forEach((sparkle, i) => {
      sparkle.setVisible(true);
      this.scene.tweens.add({
        targets: sparkle,
        scale: 1,
        duration: animate ? 260 : 1,
        delay: animate ? RING_MS * 0.5 + i * 120 : 0,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: sparkle,
            scale: 0.6,
            angle: 45,
            duration: 900 + i * 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        },
      });
    });
  }
}

function scaled(size: number): Phaser.Math.Vector2[] {
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < SPARKLE_SHAPE.length; i += 2) {
    points.push(new Phaser.Math.Vector2((SPARKLE_SHAPE[i] ?? 0) * size, (SPARKLE_SHAPE[i + 1] ?? 0) * size));
  }
  return points;
}
