import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import { traySlots, type Grid } from './logic/placement';

const SUSHI = atlasKey('sushi');
/** The tray sits under the sushi placed on it. */
const DEPTH = -20;
/** The board is stretched sideways (up to this much) so a whole order fits on it. */
const MAX_STRETCH = 2.2;
/** Share of the tray area's width the board may take. */
const MAX_WIDTH_SHARE = 0.7;

/** The wooden tray (げた) at the bottom of the field, where the chosen sushi are put. */
export class Tray {
  private readonly image: Phaser.GameObjects.Image;
  /** The board as drawn. */
  private board?: Rect;

  constructor(scene: Phaser.Scene) {
    this.image = scene.add.image(0, 0, SUSHI, 'geta').setDepth(DEPTH);
  }

  layout(area: Rect): void {
    const fit = fitContain(this.image.frame.width, this.image.frame.height, area);
    const height = this.image.frame.height * fit.scale;
    const width = Math.min(this.image.frame.width * fit.scale * MAX_STRETCH, area.width * MAX_WIDTH_SHARE);
    this.board = rect(fit.x - width / 2, fit.y - height / 2, width, height);
    this.image.setPosition(fit.x, fit.y).setDisplaySize(width, height);
  }

  /** Places and size of `count` sushi on the tray (one per piece of the order). */
  slots(count: number): Grid {
    return this.board ? traySlots(this.board, Math.max(1, count)) : { positions: [], scale: 1 };
  }
}
