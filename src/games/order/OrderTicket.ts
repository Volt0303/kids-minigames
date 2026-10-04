import type * as Phaser from 'phaser';
import type { Rect } from '../../core/logic/rect';
import type { Order } from './logic/orders';
import { NIGIRI } from './logic/placement';
import { Nigiri } from '../../core/ui/Nigiri';

/** Most kinds in one order (stage 3). */
const MAX_LINES = 3;
/** Share of the area's height used by the pictures; the dots go below. */
const PICTURE_SHARE = 0.68;
const DOT_FILLED = 0xf5a623;
const DOT_EMPTY = 0xffffff;
const DOT_EDGE = 0xd9822b;

/**
 * The order inside the 「お題」 card: one column per kind — a picture of the sushi and,
 * under it, one dot per piece wanted. Dots fill in as pieces reach the tray, so children who cannot
 * read or count yet can still follow the order.
 */
export class OrderTicket {
  private readonly pictures: Nigiri[] = [];
  private readonly dots: Phaser.GameObjects.Graphics;
  private order: Order = [];
  private served: readonly number[] = [];
  private area?: Rect;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < MAX_LINES; i++) this.pictures.push(new Nigiri(scene).setVisible(false));
    this.dots = scene.add.graphics();
  }

  layout(area: Rect): void {
    this.area = area;
    this.draw();
  }

  /** Shows an order; `served[i]` pieces of line i are already on the tray. */
  show(order: Order, served: readonly number[]): void {
    this.order = order;
    this.served = served;
    this.draw();
  }

  private draw(): void {
    this.dots.clear();
    const area = this.area;
    this.pictures.forEach((picture, i) => picture.setVisible(!!area && i < this.order.length));
    if (!area || this.order.length === 0) return;
    // One column per kind: the sushi on top, its dots underneath.
    const columnWidth = area.width / this.order.length;
    const pictureHeight = area.height * PICTURE_SHARE;
    const scale = Math.min((columnWidth * 0.9) / NIGIRI.width, pictureHeight / NIGIRI.height);
    this.order.forEach((line, i) => {
      const x = area.x + (i + 0.5) * columnWidth;
      this.pictures[i]
        ?.setKind(line.kind)
        .setScale(scale)
        .setPosition(x, area.y + pictureHeight / 2);
      this.drawDots(line.count, this.served[i] ?? 0, {
        left: x - columnWidth / 2,
        width: columnWidth,
        y: area.y + pictureHeight + (area.height - pictureHeight) / 2,
      });
    });
  }

  /** One dot per piece, the first `filled` coloured in, centred in a strip of the line. */
  private drawDots(count: number, filled: number, strip: { left: number; width: number; y: number }): void {
    const { left, width, y } = strip;
    const radius = Math.min(24, width / (count * 3));
    const step = radius * 2.6;
    const start = left + width / 2 - (step * (count - 1)) / 2;
    for (let d = 0; d < count; d++) {
      const x = start + d * step;
      this.dots.fillStyle(d < filled ? DOT_FILLED : DOT_EMPTY).fillCircle(x, y, radius);
      this.dots.lineStyle(5, DOT_EDGE).strokeCircle(x, y, radius);
    }
  }
}
