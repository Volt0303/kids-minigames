import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { NIGIRI_LAYOUT, NIGIRI_SIZE, pieceY, topY, type SushiKind } from '../../core/assets/sushi';
import type { Rect } from '../../core/logic/rect';
import { planBoard, type SushiPlace } from './logic/layout';

const SUSHI = atlasKey('sushi');

/**
 * The wooden board (げた) with the rice (シャリ) on it, in the upper part of the field.
 * A topping put on the rice is placed with `toppingPlace`.
 */
export class Board {
  private readonly geta: Phaser.GameObjects.Image;
  private readonly rice: Phaser.GameObjects.Image;
  private sushi: SushiPlace = { x: 0, y: 0, scale: 1 };

  constructor(scene: Phaser.Scene) {
    this.geta = scene.add.image(0, 0, SUSHI, 'geta');
    this.rice = scene.add.image(0, 0, SUSHI, 'rice');
  }

  layout(area: Rect): void {
    const { board, sushi } = planBoard(area, this.geta.frame.width / this.geta.frame.height);
    this.sushi = sushi;
    this.geta
      .setPosition(board.x + board.width / 2, board.y + board.height / 2)
      .setDisplaySize(board.width, board.height);
    this.rice.setPosition(sushi.x, sushi.y + NIGIRI_LAYOUT.riceY * sushi.scale).setScale(sushi.scale);
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

  /** The gunkan is one picture with its own rice, so the board's rice is hidden under it. */
  showRice(visible: boolean): void {
    this.rice.setVisible(visible);
  }
}
