import type * as Phaser from 'phaser';
import type { Rect } from '../../core/logic/rect';

const TEXTURE = 'order-belt-slat';
/** One slat of the belt, repeated along it. */
const SLAT = { width: 120, height: 64 } as const;
const BELT_COLOR = 0x9aa7b4;
const SLAT_LINE = 0x7d8996;
const RAIL_COLOR = 0xd7dde3;
const RAIL = 14;

/**
 * The conveyor belt of stage 3: a grey band of slats under the moving sushi. The
 * slat picture is drawn once into a texture and scrolled, so moving it costs nothing.
 */
export class Belt {
  private readonly band: Phaser.GameObjects.TileSprite;
  private readonly rails: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    if (!scene.textures.exists(TEXTURE)) {
      const slat = scene.make.graphics({}, false);
      slat.fillStyle(BELT_COLOR).fillRect(0, 0, SLAT.width, SLAT.height);
      slat.fillStyle(SLAT_LINE).fillRect(SLAT.width - 6, 0, 6, SLAT.height);
      slat.generateTexture(TEXTURE, SLAT.width, SLAT.height);
      slat.destroy();
    }
    this.band = scene.add.tileSprite(0, 0, 1, 1, TEXTURE).setOrigin(0).setVisible(false);
    this.rails = scene.add.graphics().setVisible(false);
  }

  /** Shows the belt as a band centred on `y` across `area`, `height` tall; hides it when `height` is 0. */
  layout(area: Rect, y: number, height: number): void {
    const visible = height > 0;
    this.band.setVisible(visible);
    this.rails.setVisible(visible).clear();
    if (!visible) return;
    const top = y - height / 2;
    this.band.setPosition(area.x, top).setSize(area.width, height);
    this.rails.fillStyle(RAIL_COLOR).fillRect(area.x, top - RAIL, area.width, RAIL);
    this.rails.fillRect(area.x, top + height, area.width, RAIL);
  }

  /** Scrolls the slats by `dx` (the same distance the sushi move). */
  move(dx: number): void {
    if (this.band.visible) this.band.tilePositionX -= dx;
  }
}
