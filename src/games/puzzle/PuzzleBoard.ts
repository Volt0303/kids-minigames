import type * as Phaser from 'phaser';
import type { PuzzleName } from '../../core/assets/puzzles';
import type { Rect } from '../../core/logic/rect';
import { strokeJigsaw } from './jigsawLines';

const SLOT_LINE = 0xe9a43a;
const FRAME_FILL = 0xfff7e2;
/** Under the pieces (and the hint's slot glow). */
const DEPTH = -20;

/**
 * The board of おさかなパズル: a plain light board with only the jigsaw outline of each slot
 * per piece (the hint shows where a piece goes: see PieceGuide).
 */
export class PuzzleBoard {
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly slots: Phaser.GameObjects.Graphics;
  private picture: PuzzleName = 'tuna';
  private area?: Rect;

  constructor(scene: Phaser.Scene) {
    this.frame = scene.add.graphics().setDepth(DEPTH - 1);
    this.slots = scene.add.graphics().setDepth(DEPTH + 1);
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
    // The jigsaw outline of every piece, so the child sees each knob and hole.
    this.slots.clear().lineStyle(4, SLOT_LINE, 0.9);
    strokeJigsaw(this.slots, this.picture, area);
  }
}
