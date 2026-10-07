import type * as Phaser from 'phaser';
import { puzzleKey, type PuzzleName } from '../../core/assets/puzzles';
import type { Rect } from '../../core/logic/rect';
import { strokeJigsaw } from './jigsawLines';

/** The full picture, shown only by the hint. */
const SLOT_LINE = 0xe9a43a;
const FRAME_FILL = 0xfff7e2;
/** Under the pieces; the hint picture goes over them. */
const DEPTH = -20;
const REVEAL_DEPTH = 40;
const REVEAL_MS = 2_000;
const FADE_MS = 300;

/**
 * The board of おさかなパズル: a plain light board with only the jigsaw outline of each slot
 * per piece, plus the hint that shows the finished picture for a moment.
 */
export class PuzzleBoard {
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly slots: Phaser.GameObjects.Graphics;
  private readonly reveal: Phaser.GameObjects.Image;
  private picture: PuzzleName = 'tuna';
  private area?: Rect;
  private revealTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.frame = scene.add.graphics().setDepth(DEPTH - 1);
    this.slots = scene.add.graphics().setDepth(DEPTH + 1);
    this.reveal = scene.add.image(0, 0, puzzleKey('tuna')).setOrigin(0).setDepth(REVEAL_DEPTH).setVisible(false);
  }

  show(picture: PuzzleName): void {
    this.picture = picture;
    this.reveal.setTexture(puzzleKey(picture)).setVisible(false);
    this.draw();
  }

  layout(board: Rect): void {
    this.area = board;
    this.draw();
  }

  /** Shows the finished picture over the board for a moment (the hint button). */
  revealPicture(): void {
    this.revealTimer?.remove();
    this.scene.tweens.killTweensOf(this.reveal);
    this.reveal.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.reveal, alpha: 1, duration: FADE_MS });
    this.revealTimer = this.scene.time.delayedCall(REVEAL_MS, () =>
      this.scene.tweens.add({
        targets: this.reveal,
        alpha: 0,
        duration: FADE_MS,
        onComplete: () => this.reveal.setVisible(false),
      }),
    );
  }

  private draw(): void {
    const area = this.area;
    if (!area) return;
    // The panel draws the mat; this plain fill shows only the pattern of slots, not the picture.
    this.frame.clear().fillStyle(FRAME_FILL).fillRect(area.x, area.y, area.width, area.height);
    this.reveal.setPosition(area.x, area.y).setDisplaySize(area.width, area.height);
    // The jigsaw outline of every piece, so the child sees each knob and hole.
    this.slots.clear().lineStyle(4, SLOT_LINE, 0.9);
    strokeJigsaw(this.slots, this.picture, area);
  }
}
