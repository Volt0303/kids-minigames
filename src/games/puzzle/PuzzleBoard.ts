import type * as Phaser from 'phaser';
import { puzzleKey, PUZZLES, type PuzzleName } from '../../core/assets/puzzles';
import type { Rect } from '../../core/logic/rect';

/** The faint picture showing where the pieces go, and the full picture shown by the hint. */
const FAINT_ALPHA = 0.22;
const SLOT_LINE = 0xffffff;
const FRAME = 0x5cb8ef;
const FRAME_FILL = 0xeaf7ff;
/** Under the pieces; the hint picture goes over them. */
const DEPTH = -20;
const REVEAL_DEPTH = 40;
const REVEAL_MS = 2_000;
const FADE_MS = 300;

/**
 * The board of おさかなパズル: a light frame with the picture shown faintly and one outlined slot
 * per piece, plus the hint that shows the finished picture for a moment.
 */
export class PuzzleBoard {
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly faint: Phaser.GameObjects.Image;
  private readonly slots: Phaser.GameObjects.Graphics;
  private readonly reveal: Phaser.GameObjects.Image;
  private picture: PuzzleName = 'tuna';
  private area?: Rect;
  private revealTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.frame = scene.add.graphics().setDepth(DEPTH - 1);
    this.faint = scene.add.image(0, 0, puzzleKey('tuna')).setOrigin(0).setAlpha(FAINT_ALPHA).setDepth(DEPTH);
    this.slots = scene.add.graphics().setDepth(DEPTH + 1);
    this.reveal = scene.add.image(0, 0, puzzleKey('tuna')).setOrigin(0).setDepth(REVEAL_DEPTH).setVisible(false);
  }

  show(picture: PuzzleName): void {
    this.picture = picture;
    this.faint.setTexture(puzzleKey(picture));
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
    const pad = 14;
    this.frame
      .clear()
      .fillStyle(FRAME_FILL)
      .fillRoundedRect(area.x - pad, area.y - pad, area.width + pad * 2, area.height + pad * 2, 24)
      .lineStyle(6, FRAME)
      .strokeRoundedRect(area.x - pad, area.y - pad, area.width + pad * 2, area.height + pad * 2, 24);
    this.faint.setPosition(area.x, area.y).setDisplaySize(area.width, area.height);
    this.reveal.setPosition(area.x, area.y).setDisplaySize(area.width, area.height);
    const { cols, rows } = PUZZLES[this.picture];
    const width = area.width / cols;
    const height = area.height / rows;
    const radius = Math.min(width, height) * 0.1;
    this.slots.clear().lineStyle(4, SLOT_LINE, 0.9);
    for (let i = 0; i < cols * rows; i++) {
      const x = area.x + (i % cols) * width;
      const y = area.y + Math.floor(i / cols) * height;
      this.slots.strokeRoundedRect(x + 4, y + 4, width - 8, height - 8, radius);
    }
  }
}
