import * as Phaser from 'phaser';
import { tileBackground } from '../logic/backgroundTiling';
import type { Rect } from '../logic/rect';

const DEPTH = -1000;

/**
 * Picture that fills the play field (not the whole screen): the image is scaled to
 * the field's height and tiled side by side (mirroring alternate copies) to exactly
 * cover its width, with no overflow past the field's edges on any screen size.
 */
export class Background {
  private readonly tiles: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly textureKey: string,
  ) {}

  /** False when the image failed to load; the scene's background colour shows instead. */
  get available(): boolean {
    return this.scene.textures.exists(this.textureKey);
  }

  /** Fills `area` (the play field) with the picture; never draws outside it. */
  layout(area: Rect): void {
    if (!this.available) return;
    const source = this.scene.textures.get(this.textureKey).getSourceImage();
    const placements = tileBackground(area, source.width, source.height);
    this.ensureTiles(placements.length);

    const centerY = area.y + area.height / 2;
    this.tiles.forEach((tile, i) => {
      const placement = placements[i];
      tile.setVisible(!!placement);
      if (!placement) return;
      tile.setDisplaySize(placement.width, area.height).setPosition(placement.x, centerY).setFlipX(placement.flip);
    });
  }

  private ensureTiles(count: number): void {
    while (this.tiles.length < count) {
      this.tiles.push(this.scene.add.image(0, 0, this.textureKey).setDepth(DEPTH));
    }
  }
}
