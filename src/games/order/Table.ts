import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import type { Rect } from '../../core/logic/rect';

const SUSHI = atlasKey('sushi');
/** Behind the sushi standing on it. */
const DEPTH = -20;

/** The fish-shaped serving dish the sushi to choose from stand on (stages 1–2). */
export class Table {
  private readonly image: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.image = scene.add.image(0, 0, SUSHI, 'platter-fish').setOrigin(0).setDepth(DEPTH);
  }

  /** Width relative to height of the table picture. */
  get aspect(): number {
    return this.image.frame.width / this.image.frame.height;
  }

  /** Draws the table filling `area`; hides it when `area` is undefined (the conveyor stage). */
  show(area: Rect | undefined): void {
    this.image.setVisible(area !== undefined);
    if (area) this.image.setPosition(area.x, area.y).setDisplaySize(area.width, area.height);
  }
}
