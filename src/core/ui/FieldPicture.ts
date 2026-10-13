import type * as Phaser from 'phaser';
import { paintBackground } from '../display/paintBackground';
import { fitBackground } from '../logic/backgroundFit';
import type { Rect } from '../logic/rect';

/** Behind the frame, the bubbles and the fish. */
const DEPTH = -1000;
/** Texture size limit that every WebGL device supports. */
const MAX_TEXTURE = 4096;

let nextId = 0;

/**
 * A background picture filling a rectangle (the play field with rounded corners, or the whole
 * screen with none). It is drawn once per layout (not per frame) into its own texture through
 * a rounded clip, so the corners are truly transparent. How the picture fits any screen shape:
 * logic/backgroundFit (cut evenly at the sides; a too-narrow picture is centred whole).
 */
export class FieldPicture {
  private readonly key = `field-picture-${nextId++}`;
  private texture?: Phaser.Textures.CanvasTexture;
  private image?: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sourceKey: string,
    private readonly radius: number,
    private readonly depth = DEPTH,
  ) {}

  /** False when the picture failed to load; whatever is behind shows instead. */
  get available(): boolean {
    return this.scene.textures.exists(this.sourceKey);
  }

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
    paintBackground(ctx, source, fitBackground(area, source), { width, height });
    ctx.restore();
    texture.refresh();

    this.image ??= this.scene.add.image(0, 0, this.key).setOrigin(0).setDepth(this.depth);
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
