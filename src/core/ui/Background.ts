import * as Phaser from 'phaser';
import type { Viewport } from '../logic/viewport';

const DEPTH = -1000;

/**
 * Full-screen background that fits every aspect ratio without losing the top or
 * bottom of the picture: the image is scaled to the screen height and, when the
 * screen is wider than one copy (the 32:9 main device), repeated side by side with
 * alternate copies mirrored so the edges meet seamlessly.
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

  layout(viewport: Viewport): void {
    if (!this.available) return;
    const source = this.scene.textures.get(this.textureKey).getSourceImage();
    const scale = Math.max(viewport.designHeight / source.height, viewport.designWidth / (source.width * 3));
    const tileWidth = source.width * scale;
    const tileHeight = source.height * scale;

    // An odd count keeps an unmirrored copy in the middle.
    let count = Math.ceil(viewport.designWidth / tileWidth);
    if (count % 2 === 0) count += 1;
    this.ensureTiles(count);

    const middle = (count - 1) / 2;
    const left = viewport.designWidth / 2 - (count * tileWidth) / 2;
    this.tiles.forEach((tile, i) => {
      tile
        .setVisible(i < count)
        .setDisplaySize(tileWidth, tileHeight)
        .setPosition(left + tileWidth * (i + 0.5), viewport.designHeight / 2)
        .setFlipX(Math.abs(i - middle) % 2 === 1);
    });
  }

  private ensureTiles(count: number): void {
    while (this.tiles.length < count) {
      this.tiles.push(this.scene.add.image(0, 0, this.textureKey).setDepth(DEPTH));
    }
  }
}
