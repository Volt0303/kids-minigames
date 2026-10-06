import type * as Phaser from 'phaser';
import {
  pieceKey,
  pieceUrl,
  PUZZLE_SIZE,
  puzzleKey,
  PUZZLES,
  puzzleUrl,
  type PuzzleName,
} from '../../core/assets/puzzles';
import { shuffle } from '../../core/logic/random';
import type { Rect } from '../../core/logic/rect';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import { PUZZLE_COPY, PUZZLE_PROMPT } from './copy';
import { HintButton } from './HintButton';
import { planPuzzle, slotCentres, snaps, trayPlaces, type Point, type PuzzleLayout } from './logic/board';
import { PuzzleBoard } from './PuzzleBoard';
import { STAGES, type PuzzleStage } from './stages';

export const PUZZLE_SCENE_KEY = 'Puzzle';

const inside = (area: Rect, x: number, y: number): boolean =>
  x > area.x && x < area.x + area.width && y > area.y && y < area.y + area.height;

const FIRST_STAGE = STAGES[0];
if (!FIRST_STAGE) throw new Error('puzzle: no stages defined');

/** Most pieces in a stage. */
const POOL_SIZE = 6;
/** Pieces in the tray / placed / being dragged. */
const PIECE_DEPTH = 1;
const DRAG_DEPTH = 50;
const SNAP_MS = 180;
const RETURN_MS = 260;
/** A tap must not start a drag; dragging starts after the finger moves this far (pixels). */
const DRAG_THRESHOLD = 10;

interface Piece {
  image: Phaser.GameObjects.Image;
  /** Its slot on the board (piece i belongs in slot i). */
  index: number;
  /** Its place in the tray. */
  home: Point;
  placed: boolean;
}

/**
 * ④ おさかなパズル: a picture is cut into pieces; the child drags each piece from the tray onto
 * the board, where it snaps into its slot when dropped near it, and otherwise slides back to
 * the tray. The hint button shows the finished picture for a moment.
 */
export class PuzzleScene extends GameScene {
  protected readonly stages = STAGES;

  private readonly pieces: Piece[] = [];
  private board!: PuzzleBoard;
  private hintButton!: HintButton;
  private stage: PuzzleStage = FIRST_STAGE;
  private field?: Rect;
  private plan?: PuzzleLayout;
  private slots: Point[] = [];
  private trayScale = 1;

  constructor(setup: GameSetup) {
    super(PUZZLE_SCENE_KEY, setup, { background: 'sea', copy: PUZZLE_COPY });
  }

  protected preloadGame(): void {
    for (const name of Object.keys(PUZZLES) as PuzzleName[]) {
      if (!this.textures.exists(puzzleKey(name))) this.load.image(puzzleKey(name), puzzleUrl(name));
      for (let i = 0; i < PUZZLES[name].cols * PUZZLES[name].rows; i++) {
        if (!this.textures.exists(pieceKey(name, i))) this.load.image(pieceKey(name, i), pieceUrl(name, i));
      }
    }
  }

  protected buildField(): void {
    this.input.dragDistanceThreshold = DRAG_THRESHOLD;
    this.board = new PuzzleBoard(this);
    this.hintButton = new HintButton(this, () => {
      if (this.isPlaying && !this.isPaused) this.board.revealPicture();
    });
    for (let i = 0; i < POOL_SIZE; i++) {
      const image = this.add.image(0, 0, pieceKey('tuna', 0)).setVisible(false).setDepth(PIECE_DEPTH);
      const piece: Piece = { image, index: 0, home: { x: 0, y: 0 }, placed: false };
      image.setInteractive({ draggable: true, useHandCursor: true });
      image.on('dragstart', () => this.onDragStart(piece));
      image.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => {
        if (!piece.placed) image.setPosition(x, y);
      });
      image.on('dragend', () => this.onDrop(piece));
      this.pieces.push(piece);
    }
  }

  protected layoutField(field: Rect): void {
    this.field = field;
    this.arrange();
  }

  protected startStage(index: number): void {
    this.stage = STAGES[index] ?? this.stage;
    const name = this.stage.picture;
    this.setPrompt(PUZZLE_PROMPT, { texture: puzzleKey(name) });
    this.board.show(name);
    const order = shuffle(
      Array.from({ length: this.stage.goal }, (_, i) => i),
      Math.random,
    );
    this.pieces.forEach((piece, i) => {
      const slot = order[i];
      piece.placed = false;
      piece.image.setVisible(slot !== undefined);
      if (slot === undefined) return;
      piece.index = slot;
      piece.image.setTexture(pieceKey(name, slot)).setAlpha(1);
    });
    this.arrange();
  }

  /** The hint button pulses to invite the child to use it. */
  protected findHintTarget(): HintButton {
    return this.hintButton;
  }

  /** Positions the board, the hint button and every piece (placed ones on their slots). */
  private arrange(): void {
    const field = this.field;
    if (!field) return;
    const plan = planPuzzle(field, PUZZLE_SIZE);
    this.plan = plan;
    this.board.layout(plan.board);
    this.hintButton.setPosition(plan.hintButton.x, plan.hintButton.y);
    const { cols, rows } = PUZZLES[this.stage.picture];
    this.slots = slotCentres(plan.board, cols, rows);
    const piece = { width: PUZZLE_SIZE.width / cols, height: PUZZLE_SIZE.height / rows };
    const tray = trayPlaces(plan.tray, this.stage.goal, piece, plan.scale);
    this.trayScale = tray.scale;
    this.pieces.forEach((p, i) => {
      if (!p.image.visible) return;
      p.home = tray.places[i] ?? p.home;
      this.tweens.killTweensOf(p.image);
      const slot = this.slots[p.index];
      if (p.placed && slot) p.image.setPosition(slot.x, slot.y).setScale(plan.scale);
      else p.image.setPosition(p.home.x, p.home.y).setScale(this.trayScale).setDepth(PIECE_DEPTH);
    });
  }

  private onDragStart(piece: Piece): void {
    if (piece.placed || !this.plan) return;
    this.tweens.killTweensOf(piece.image);
    // Full size while dragged, so the child sees how it fits.
    piece.image.setDepth(DRAG_DEPTH).setScale(this.plan.scale);
  }

  private onDrop(piece: Piece): void {
    const plan = this.plan;
    const slot = this.slots[piece.index];
    if (piece.placed || !plan || !slot) return;
    const image = piece.image;
    const size = { width: image.displayWidth, height: image.displayHeight };
    if (this.isPlaying && !this.isPaused && snaps(image, slot, size)) {
      piece.placed = true;
      this.tweens.add({ targets: image, x: slot.x, y: slot.y, duration: SNAP_MS, ease: 'Back.easeOut' });
      image.setDepth(PIECE_DEPTH);
      this.reportCorrect(slot.x, slot.y);
      return;
    }
    const onBoard = inside(plan.board, image.x, image.y);
    if (onBoard) this.reportWrong(image);
    this.tweens.add({
      targets: image,
      x: piece.home.x,
      y: piece.home.y,
      scale: this.trayScale,
      duration: RETURN_MS,
      ease: 'Sine.easeOut',
      onComplete: () => image.setDepth(PIECE_DEPTH),
    });
  }
}
