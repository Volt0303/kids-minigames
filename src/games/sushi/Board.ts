import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { NIGIRI_LAYOUT, NIGIRI_SIZE, pieceY, topY, type SushiKind } from '../../core/assets/sushi';
import type { Rect } from '../../core/logic/rect';
import { planBoard, type SushiPlace } from './logic/layout';

const SUSHI = atlasKey('sushi');
/** The plain rice's bottom edge below the plate's centre, at the sushi's scale (design units at scale 1). */
const PLAIN_RICE_BOTTOM = 66;
/** The plain rice is raised by this share of its own height above that edge's resting spot. */
const PLAIN_RICE_LIFT = 0.16;
/** The plate is this much wider than the rice. */
const PLATE_WIDTH = 1.45;

/**
 * The wooden board (げた) with the rice (シャリ) on a plate, in the upper part of the field.
 * A topping put on the rice is placed with `toppingPlace`.
 */
export class Board {
  private readonly geta: Phaser.GameObjects.Image;
  private readonly plate: Phaser.GameObjects.Image;
  /** The rice under a topping (same picture as every nigiri). */
  private readonly rice: Phaser.GameObjects.Image;
  /** The rice on its own, waiting for a topping. */
  private readonly plainRice: Phaser.GameObjects.Image;
  private readonly sparkles: Phaser.GameObjects.Graphics;
  private sushi: SushiPlace = { x: 0, y: 0, scale: 1 };

  constructor(scene: Phaser.Scene) {
    this.geta = scene.add.image(0, 0, SUSHI, 'geta');
    this.plate = scene.add.image(0, 0, SUSHI, 'plate');
    this.rice = scene.add.image(0, 0, SUSHI, 'rice');
    this.plainRice = scene.add.image(0, 0, SUSHI, 'rice-plain');
    this.sparkles = scene.add.graphics();
  }

  layout(area: Rect): void {
    const { board, plate, sushi } = planBoard(area, this.geta.frame.width / this.geta.frame.height);
    this.sushi = sushi;
    this.geta
      .setPosition(board.x + board.width / 2, board.y + board.height / 2)
      .setDisplaySize(board.width, board.height);
    this.rice.setPosition(sushi.x, sushi.y + NIGIRI_LAYOUT.riceY * sushi.scale).setScale(sushi.scale);
    // The plate, a little wider than the rice, centred on the board; the rice stands on its middle.
    this.plate.setScale((this.rice.displayWidth * PLATE_WIDTH) / this.plate.frame.width).setPosition(plate.x, plate.y);
    // The plain rice: as wide as the rice under a topping, centred on the plate.
    const plainScale = this.rice.displayWidth / this.plainRice.frame.width;
    const riceBottom = plate.y + PLAIN_RICE_BOTTOM * sushi.scale;
    this.plainRice
      .setScale(plainScale)
      .setPosition(sushi.x, riceBottom - this.plainRice.frame.height * plainScale * (0.5 + PLAIN_RICE_LIFT));
    this.drawSparkles(board);
  }

  /** Two yellow sparkles beside each upper corner of the board, as in the design. */
  private drawSparkles(board: Rect): void {
    const size = board.height * 0.1;
    const spots = [
      { x: board.x - size * 0.9, y: board.y + size * 0.2, s: size },
      { x: board.x - size * 1.5, y: board.y + size * 1.9, s: size * 0.8 },
      { x: board.x + board.width + size * 0.9, y: board.y + size * 0.2, s: size },
      { x: board.x + board.width + size * 1.5, y: board.y + size * 1.9, s: size * 0.8 },
    ];
    this.sparkles.clear();
    for (const { x, y, s } of spots) {
      const w = s * 0.32;
      this.sparkles.fillStyle(0xffd23f).lineStyle(4, 0xe0a100);
      const points = [x, y - s, x + w, y - w, x + s, y, x + w, y + w, x, y + s, x - w, y + w, x - s, y, x - w, y - w];
      this.sparkles.beginPath().moveTo(points[0] ?? x, points[1] ?? y);
      for (let i = 2; i < points.length; i += 2) this.sparkles.lineTo(points[i] ?? x, points[i + 1] ?? y);
      this.sparkles.closePath().fillPath().strokePath();
    }
  }

  /** Where the finished top picture (topping, or the whole gunkan) sits, and its scale. */
  toppingPlace(kind: SushiKind): SushiPlace {
    const { x, y, scale } = this.sushi;
    return { x, y: y + topY(kind) * scale, scale };
  }

  /** Where the topping on its own lands on the rice (for a gunkan: the loose roe). */
  landingPlace(kind: SushiKind): SushiPlace {
    const { x, y, scale } = this.sushi;
    return { x, y: y + pieceY(kind) * scale, scale };
  }

  /** Whether a point (a dropped topping) is on the rice, generously, for small hands. */
  isOnRice(x: number, y: number): boolean {
    const { scale } = this.sushi;
    const halfWidth = NIGIRI_SIZE.width * scale * 0.75;
    const halfHeight = NIGIRI_SIZE.height * scale * 0.75;
    return Math.abs(x - this.sushi.x) <= halfWidth && Math.abs(y - this.sushi.y) <= halfHeight;
  }

  /**
   * What stands on the plate: 'plain' rice waiting for a topping, the rice under a 'topped'
   * nigiri, or nothing for a 'gunkan' (its picture has its own rice).
   */
  setRice(state: 'plain' | 'topped' | 'gunkan'): void {
    this.plainRice.setVisible(state === 'plain');
    this.rice.setVisible(state === 'topped');
  }
}
