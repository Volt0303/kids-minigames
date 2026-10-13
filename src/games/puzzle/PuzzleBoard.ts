import type * as Phaser from 'phaser';
import type { PuzzleName } from '../../core/assets/puzzles';
import type { Rect } from '../../core/logic/rect';
import { strokeJigsaw } from './jigsawLines';

const SLOT_LINE = '#e9a43a';
const SLOT_ALPHA = 0.9;
const LINE_WIDTH = 4;
const FRAME_FILL = 0xfff7e2;
/** Under the pieces (and the hint's slot glow). */
const DEPTH = -20;
/** Texture size limit that every WebGL device supports. */
const MAX_TEXTURE = 4096;

let nextId = 0;

/**
 * The board of おさかなパズル: a plain light board with only the jigsaw outline of each slot
 * per piece (the hint shows where a piece goes: see PieceGuide). The outlines are drawn once
 * per layout into their own picture (see jigsawLines).
 */
export class PuzzleBoard {
  private readonly key = `puzzle-slots-${nextId++}`;
  private readonly frame: Phaser.GameObjects.Graphics;
  private texture?: Phaser.Textures.CanvasTexture;
  private slots?: Phaser.GameObjects.Image;
  private picture: PuzzleName = 'tuna';
  private area?: Rect;

  constructor(private readonly scene: Phaser.Scene) {
    this.frame = scene.add.graphics().setDepth(DEPTH - 1);
  }

  show(picture: PuzzleName): void {
    this.picture = picture;
    this.draw();
  }

  layout(board: Rect): void {
    this.area = board;
    this.draw();
  }

  private draw(): void {
    const area = this.area;
    if (!area) return;
    // The panel draws the mat; this plain fill shows only the pattern of slots, not the picture.
    this.frame.clear().fillStyle(FRAME_FILL).fillRect(area.x, area.y, area.width, area.height);
    this.drawSlots(area);
  }

  /** The jigsaw outline of every piece, so the child sees each knob and hole. */
  private drawSlots(area: Rect): void {
    const pixels = Math.min(this.scene.cameras.main.zoom, MAX_TEXTURE / Math.max(area.width, area.height));
    const width = Math.max(1, Math.round(area.width * pixels));
    const height = Math.max(1, Math.round(area.height * pixels));
    const texture = this.ensureTexture(width, height);
    if (!texture) return;
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = SLOT_ALPHA;
    ctx.strokeStyle = SLOT_LINE;
    ctx.lineWidth = LINE_WIDTH * pixels;
    ctx.lineJoin = 'round';
    strokeJigsaw(ctx, this.picture, { width, height });
    ctx.restore();
    texture.refresh();
    this.slots ??= this.scene.add
      .image(0, 0, this.key)
      .setOrigin(0)
      .setDepth(DEPTH + 1);
    this.slots.setPosition(area.x, area.y).setDisplaySize(area.width, area.height);
  }

  private ensureTexture(width: number, height: number): Phaser.Textures.CanvasTexture | undefined {
    if (!this.texture) {
      this.texture = this.scene.textures.createCanvas(this.key, width, height) ?? undefined;
      this.scene.events.once('shutdown', () => {
        this.scene.textures.remove(this.key);
        this.texture = undefined;
        this.slots = undefined;
      });
    } else if (this.texture.width !== width || this.texture.height !== height) {
      this.texture.setSize(width, height);
    }
    return this.texture;
  }
}
