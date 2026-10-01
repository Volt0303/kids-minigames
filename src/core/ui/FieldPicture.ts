import type * as Phaser from 'phaser';
import { tileBackground } from '../logic/backgroundTiling';
import type { Rect } from '../logic/rect';

/** Behind the frame, the bubbles and the fish. */
const DEPTH = -1000;
/** Texture size limit that every WebGL device supports. */
const MAX_TEXTURE = 4096;

let nextId = 0;

/**
 * The play field's picture with rounded corners. The picture is drawn once per layout
 * (not per frame) into its own texture through a rounded clip, so the corners are truly
 * transparent and whatever is behind the field (a full-screen backdrop or the page colour)
 * shows through them. Tiling follows the same rules as Background (tileBackground).
 */
export class FieldPicture {
  private readonly key = `field-picture-${nextId++}`;
  private texture?: Phaser.Textures.CanvasTexture;
  private image?: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sourceKey: string,
    private readonly radius: number,
  ) {}

  layout(area: Rect): void {
    if (!this.scene.textures.exists(this.sourceKey)) return;
    const source = this.scene.textures.get(this.sourceKey).getSourceImage() as CanvasImageSource & {
      width: number;
      height: number;
    };
    // Draw at screen resolution so the picture stays sharp.
    const pixels = Math.min(this.scene.cameras.main.zoom, MAX_TEXTURE / Math.max(area.width, area.height));
    const width = Math.max(1, Math.round(area.width * pixels));
    const height = Math.max(1, Math.round(area.height * pixels));
    const texture = this.ensureTexture(width, height);
    if (!texture) return;

    const ctx = texture.getContext();
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    roundedPath(ctx, width, height, this.radius * pixels);
    ctx.clip();
    for (const tile of tileBackground(
      { x: 0, y: 0, width: area.width, height: area.height },
      source.width,
      source.height,
    )) {
      ctx.save();
      ctx.translate((tile.x - tile.width / 2) * pixels, 0);
      if (tile.flip) {
        ctx.translate(tile.width * pixels, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, tile.width * pixels, height);
      ctx.restore();
    }
    ctx.restore();
    texture.refresh();

    this.image ??= this.scene.add.image(0, 0, this.key).setOrigin(0).setDepth(DEPTH);
    this.image.setPosition(area.x, area.y).setDisplaySize(area.width, area.height);
  }

  private ensureTexture(width: number, height: number): Phaser.Textures.CanvasTexture | undefined {
    if (!this.texture) {
      this.texture = this.scene.textures.createCanvas(this.key, width, height) ?? undefined;
      this.scene.events.once('shutdown', () => this.scene.textures.remove(this.key));
    } else if (this.texture.width !== width || this.texture.height !== height) {
      this.texture.setSize(width, height);
    }
    return this.texture;
  }
}

function roundedPath(ctx: CanvasRenderingContext2D, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(width, 0, width, height, r);
  ctx.arcTo(width, height, 0, height, r);
  ctx.arcTo(0, height, 0, 0, r);
  ctx.arcTo(0, 0, width, 0, r);
  ctx.closePath();
}
