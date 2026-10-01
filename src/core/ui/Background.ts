import * as Phaser from 'phaser';
import { tileBackground } from '../logic/backgroundTiling';
import type { Rect } from '../logic/rect';

/** Field pictures sit here; a full-screen backdrop goes further back (BACKDROP_DEPTH). */
const DEPTH = -1000;
export const BACKDROP_DEPTH = -2000;

/**
 * Picture that fills a rectangle exactly — the play field, or the whole screen as a
 * backdrop: the image is scaled to the rectangle's height and tiled side by side
 * (mirroring alternate copies) to cover its width, with no overflow on any screen size.
 */
export class Background {
  private readonly tiles: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly textureKey: string,
    private readonly depth = DEPTH,
  ) {}

  /** False when the image failed to load; the scene's background colour shows instead. */
  get available(): boolean {
    return this.scene.textures.exists(this.textureKey);
  }

  /** Fills `area` with the picture; never draws outside it. */
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
      this.tiles.push(this.scene.add.image(0, 0, this.textureKey).setDepth(this.depth));
    }
  }
}
