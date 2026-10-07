import * as Phaser from 'phaser';
import {
  pieceKey,
  pieceUrl,
  PUZZLE_SIZE,
  puzzleKey,
  PUZZLES,
  puzzleUrl,
  type PuzzleName,
} from '../../core/assets/puzzles';
import { tabSize } from '../../core/logic/jigsaw';
import { shuffle } from '../../core/logic/random';
import type { Rect } from '../../core/logic/rect';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import { atlasKey } from '../../core/assets/catalog';
import { Character } from '../../core/ui/Character';
import { GUIDE_LINES, PRAISE_LINES, PUZZLE_COPY } from './copy';
import { HintPanel } from './HintPanel';
import { PuzzlePanels } from './PuzzlePanels';
import { SpeechBubble } from './SpeechBubble';
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
const CHEER_MS = 1_300;
/** Drop shadow of a piece: lifted higher while dragged, flat once it is in its place. */
const SHADOW_COLOR = 0x6b3d00;
const SHADOW_ALPHA = 0.35;
const SHADOW_OFFSET = { tray: 8, drag: 22 };
/** A tap must not start a drag; dragging starts after the finger moves this far (pixels). */
const DRAG_THRESHOLD = 10;

interface Piece {
  image: Phaser.GameObjects.Image;
  /** A dark copy just below and right of the piece: its drop shadow. */
  shadow: Phaser.GameObjects.Image;
  /** Its slot on the board (piece i belongs in slot i). */
  index: number;
  /** Its place in the tray. */
  home: Point;
  placed: boolean;
}

/**
 * ④ おさかなパズル: a picture is cut into pieces; the child drags each piece from the tray onto
 * the board, where it snaps into its slot when dropped near it, and otherwise slides back to
 * the tray. The finished picture is always shown beside the board; the eye button shows it
 * on the board itself for a moment.
 */
export class PuzzleScene extends GameScene {
  protected readonly stages = STAGES;

  private readonly pieces: Piece[] = [];
  private board!: PuzzleBoard;
  private hintPanel!: HintPanel;
  private panels!: PuzzlePanels;
  private bubble!: SpeechBubble;
  /** げんきくん (absent in builds without the guide character). */
  private guide?: Character;
  private stage: PuzzleStage = FIRST_STAGE;
  private field?: Rect;
  private plan?: PuzzleLayout;
  private slots: Point[] = [];
  private trayScale = 1;

  constructor(setup: GameSetup) {
    super(PUZZLE_SCENE_KEY, setup, { layout: 'open', art: 'puzzle', copy: PUZZLE_COPY });
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
    this.panels = new PuzzlePanels(this);
    this.board = new PuzzleBoard(this);
    this.hintPanel = new HintPanel(this, () => {
      if (this.isPlaying && !this.isPaused) this.board.revealPicture();
    });
    this.bubble = new SpeechBubble(this, GUIDE_LINES);
    this.guide = this.hasGuide
      ? new Character(this, { texture: atlasKey('characters'), frame: 'guide' }, 8)
      : undefined;
    for (let i = 0; i < POOL_SIZE; i++) {
      const image = this.add.image(0, 0, pieceKey('tuna', 0)).setVisible(false).setDepth(PIECE_DEPTH);
      const shadow = this.add
        .image(0, 0, pieceKey('tuna', 0))
        .setTintMode(Phaser.TintModes.FILL)
        .setTint(SHADOW_COLOR)
        .setAlpha(SHADOW_ALPHA)
        .setVisible(false);
      const piece: Piece = { image, shadow, index: 0, home: { x: 0, y: 0 }, placed: false };
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
    this.board.show(name);
    this.panels.show(name);
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
      piece.shadow.setTexture(pieceKey(name, slot));
    });
    this.arrange();
  }

  /**
   * Keeps every piece's shadow under it (pieces move by drag and tweens). A piece in its place
   * lies flat on the board, so its shadow is hidden. No allocation: called every frame.
   */
  update(): void {
    for (const piece of this.pieces) {
      const image = piece.image;
      const visible = image.visible && !piece.placed;
      piece.shadow.setVisible(visible);
      if (!visible) continue;
      const lifted = image.depth === DRAG_DEPTH;
      const offset = (lifted ? SHADOW_OFFSET.drag : SHADOW_OFFSET.tray) * (image.scale / (this.plan?.scale ?? 1));
      piece.shadow
        .setPosition(image.x + offset, image.y + offset)
        .setScale(image.scale)
        .setDepth(image.depth - 0.5)
        .setAlpha(SHADOW_ALPHA * image.alpha);
    }
  }

  /** The eye button pulses to invite the child to use it. */
  protected findHintTarget(): Phaser.GameObjects.Container {
    return this.hintPanel.button;
  }

  /** Positions the board, the hint button and every piece (placed ones on their slots). */
  private arrange(): void {
    const field = this.field;
    if (!field) return;
    const plan = planPuzzle(field, PUZZLE_SIZE);
    this.plan = plan;
    this.panels.layout(plan);
    this.board.layout(plan.board);
    this.hintPanel.layout(plan.hintPanel);
    this.bubble.layout(plan.bubble);
    this.guide?.layout(plan.guide);
    const { cols, rows } = PUZZLES[this.stage.picture];
    this.slots = slotCentres(plan.board, cols, rows);
    const cell = { width: PUZZLE_SIZE.width / cols, height: PUZZLE_SIZE.height / rows };
    // Piece pictures are padded by the knob height on every side (see core/logic/jigsaw).
    const tab = tabSize(cell.width, cell.height);
    const piece = { width: cell.width + tab * 2, height: cell.height + tab * 2 };
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
      this.cheer();
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

  /** げんきくん's 「やったね」 pose and 「ぴったり!」 in his bubble. */
  private cheer(): void {
    this.bubble.say(PRAISE_LINES, CHEER_MS);
    this.guide?.showPose('guide-happy', CHEER_MS);
    this.guide?.hop();
  }
}
