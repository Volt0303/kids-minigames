import type * as Phaser from 'phaser';
import type { Rect } from '../../core/logic/rect';

const TRACK = 0xd9dde8;
const FILL = 0xf0548a;
const SHINE = 0xff8db4;
const RIM = 0xffffff;
const EDGE = 0xf6a5c0;
/** Most stars (the largest number of differences). */
const MAX_STARS = 5;

/**
 * The pink progress bar under the pictures, as in the design: one star per difference; the
 * bar fills in pink up to the stars found.
 */
export class StarBar {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private area?: Rect;
  private done = 0;
  private goal = 3;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(5);
  }

  layout(area: Rect): void {
    this.area = area;
    this.draw();
  }

  setProgress(done: number, goal: number): void {
    this.done = done;
    this.goal = Math.min(goal, MAX_STARS);
    this.draw();
  }

  private draw(): void {
    const a = this.area;
    if (!a) return;
    const g = this.graphics.clear();
    const r = a.height / 2;
    g.fillStyle(RIM).fillRoundedRect(a.x, a.y, a.width, a.height, r);
    g.lineStyle(6, EDGE).strokeRoundedRect(a.x, a.y, a.width, a.height, r);
    const pad = a.height * 0.18;
    const track = { x: a.x + pad, y: a.y + pad, width: a.width - pad * 2, height: a.height - pad * 2 };
    const tr = track.height / 2;
    g.fillStyle(TRACK).fillRoundedRect(track.x, track.y, track.width, track.height, tr);
    const cell = track.width / this.goal;
    if (this.done > 0) {
      const width = Math.max(track.height, cell * this.done);
      g.fillStyle(FILL).fillRoundedRect(track.x, track.y, width, track.height, tr);
      g.fillStyle(SHINE).fillRoundedRect(
        track.x + tr * 0.5,
        track.y + track.height * 0.14,
        width - tr,
        track.height * 0.26,
        track.height * 0.13,
      );
    }
    for (let i = 0; i < this.goal; i++) {
      const filled = i < this.done;
      this.star(track.x + (i + 0.5) * cell, track.y + track.height / 2, track.height * 0.42, filled);
    }
  }

  /** A five-pointed star: pink with a white edge when found, pale otherwise. */
  private star(x: number, y: number, radius: number, found: boolean): void {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? radius : radius * 0.48;
      points.push({ x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r });
    }
    const g = this.graphics;
    g.fillStyle(found ? 0xffb3cf : 0xf2f4f8);
    g.lineStyle(radius * 0.18, found ? RIM : 0xc3c8d6);
    g.beginPath();
    points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
    g.closePath().fillPath().strokePath();
  }
}
