import { loadAtlas, loadGameArt } from '../../core/assets/atlas';
import { atlasKey } from '../../core/assets/catalog';
import { sushiArt, type SushiKind } from '../../core/assets/sushi';
import { shuffle } from '../../core/logic/random';
import type { Rect } from '../../core/logic/rect';
import type { Viewport } from '../../core/logic/viewport';
import { Instruction } from '../../core/ui/Instruction';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import { Board } from './Board';
import { Guide } from './Guide';
import { BottomWave } from './BottomWave';
import { INSTRUCTION, SUSHI_COPY } from './copy';
import { planPuzzle } from './logic/layout';
import { nextTarget } from './logic/rounds';
import { SideCard } from './SideCard';
import { STAGES, type SushiPuzzleStage } from './stages';
import type { ToppingCard } from './ToppingCard';
import { ToppingTray } from './ToppingTray';

export const SUSHI_PUZZLE_SCENE_KEY = 'SushiPuzzle';

const FIRST_STAGE = STAGES[0];
if (!FIRST_STAGE) throw new Error('sushi: no stages defined');

const SUSHI = atlasKey('sushi');
const PLACE_MS = 320;
/** The finished sushi stays on the board this long before the next order. */
const NEXT_ORDER_MS = 1_100;
/** A wrong topping moves this far towards the rice before it slides back (a "no" nudge). */
const WRONG_NUDGE = 0.35;
/** A tap must not start a drag; dragging starts after the finger moves this far (pixels). */
const DRAG_THRESHOLD = 14;

/**
 * ② お寿司パズル (open layout, as in the game's design): the 「お題の おすし」 card on the left
 * shows a sushi; the child puts the matching topping from the tray onto the rice on the
 * board, by tapping it or dragging it there, and the finished sushi appears in the
 * 「できたよ!」 card on the right. A wrong topping slides back to its slot. Five sushi per
 * stage, from 4, 5, then 6 toppings.
 */
export class SushiPuzzleScene extends GameScene {
  protected readonly stages = STAGES;

  private board!: Board;
  private wave!: BottomWave;
  /** げんきくん (absent in builds without the guide character). */
  private guide?: Guide;
  private tray!: ToppingTray;
  private orderCard!: SideCard;
  private doneCard!: SideCard;
  private instruction!: Instruction;
  private stage: SushiPuzzleStage = FIRST_STAGE;
  private target?: SushiKind;
  /** A topping is moving: further taps wait until it has landed or gone back. */
  private busy = false;
  /** Changes with every stage, so a delayed "next order" from an earlier stage does nothing. */
  private round = 0;

  constructor(setup: GameSetup) {
    super(SUSHI_PUZZLE_SCENE_KEY, setup, {
      layout: 'open',
      art: 'sushi',
      copy: SUSHI_COPY,
      icon: { texture: SUSHI, frame: 'topping-salmon' },
    });
  }

  protected preloadGame(): void {
    loadAtlas(this.load, 'sushi');
    loadGameArt(this.load, 'sushi', 'bottom-wave');
  }

  protected buildField(): void {
    this.input.dragDistanceThreshold = DRAG_THRESHOLD;
    this.wave = new BottomWave(this);
    this.board = new Board(this);
    this.tray = new ToppingTray(this, {
      onTap: (card) => this.onTap(card),
      onDrop: (card) => this.onDrop(card),
    });
    this.orderCard = new SideCard(this, {
      label: 'お題の おすし',
      color: 0xf5a623,
      fill: 0xfffaf0,
      nameColor: '#e5383b',
    });
    this.doneCard = new SideCard(this, { label: 'できたよ!', color: 0x6cbf3c, fill: 0xf4fbea, nameColor: '#3d6b1e' });
    this.instruction = new Instruction(this, INSTRUCTION);
    this.guide = this.hasGuide ? new Guide(this) : undefined;
  }

  protected layoutField(field: Rect, viewport: Viewport): void {
    this.wave.layout(viewport);
    const plan = planPuzzle(field);
    this.board.layout(plan.board);
    this.tray.layout(plan.tray);
    this.orderCard.layout(plan.order);
    this.doneCard.layout(plan.done);
    this.instruction.layout(plan.instruction);
    this.guide?.layout(plan.guide, plan.bubble);
    // A finished sushi on the board moves with the board.
    if (this.busy && this.target) this.placeOnRice(this.target, false);
  }

  protected startStage(index: number): void {
    this.stage = STAGES[index] ?? this.stage;
    this.round += 1;
    this.busy = false;
    this.target = undefined;
    this.tray.setKinds(shuffle(this.stage.choices, Math.random));
    this.newOrder();
  }

  protected findHintTarget(): Phaser.GameObjects.Image | undefined {
    return this.target && !this.busy ? this.tray.cardFor(this.target)?.picture : undefined;
  }

  private newOrder(): void {
    this.busy = false;
    this.board.setRice('plain');
    this.tray.resetPictures();
    this.target = nextTarget(this.stage.choices, this.target, Math.random);
    this.orderCard.show(this.target);
    this.doneCard.clear();
  }

  private onTap(card: ToppingCard): void {
    if (!this.canPick()) return;
    if (card.kind === this.target) this.complete(card);
    else this.reject(card, true);
  }

  private onDrop(card: ToppingCard): void {
    if (!this.canPick()) {
      card.goHome(true);
      return;
    }
    const { x, y } = card.picture;
    if (!this.board.isOnRice(x, y)) card.goHome(true);
    else if (card.kind === this.target) this.complete(card);
    else this.reject(card, false);
  }

  private canPick(): boolean {
    return this.isPlaying && !this.isPaused && !this.busy && this.target !== undefined;
  }

  /** The right topping: onto the rice, then the next order. */
  private complete(card: ToppingCard): void {
    this.busy = true;
    this.placeOnRice(card.kind, true, () => {
      this.doneCard.show(card.kind, 'せいかい!');
      this.guide?.cheer();
      this.reportCorrect(card.picture.x, card.picture.y);
      const round = this.round;
      this.time.delayedCall(NEXT_ORDER_MS, () => {
        if (round === this.round && this.isPlaying) this.newOrder();
      });
    });
  }

  /**
   * Puts the target topping on the rice. The いくら roe lands on the rice and then becomes the
   * gunkan picture (which has its own rice, so the board's rice is hidden).
   */
  private placeOnRice(kind: SushiKind, animate: boolean, onDone?: () => void): void {
    const picture = this.tray.cardFor(kind)?.picture;
    if (!picture) return;
    const finish = (): void => {
      const art = sushiArt(kind);
      const place = this.board.toppingPlace(kind);
      picture.setFrame(art.top).setPosition(place.x, place.y).setScale(place.scale);
      this.board.setRice(art.onRice ? 'topped' : 'gunkan');
    };
    if (!animate) {
      finish();
      return;
    }
    const landing = this.board.landingPlace(kind);
    this.tweens.add({
      targets: picture,
      x: landing.x,
      y: landing.y,
      scale: landing.scale,
      duration: PLACE_MS,
      ease: 'Back.easeOut',
      onComplete: () => {
        finish();
        onDone?.();
      },
    });
  }

  /** A wrong topping: a small nudge towards the rice (when tapped), back to its card, and a wobble. */
  private reject(card: ToppingCard, nudge: boolean): void {
    this.busy = true;
    const done = (): void => {
      this.busy = false;
      this.reportWrong(card.picture);
    };
    if (!nudge) {
      card.goHome(true, done);
      return;
    }
    const place = this.board.toppingPlace(card.kind);
    const picture = card.picture;
    this.tweens.add({
      targets: picture,
      x: picture.x + (place.x - picture.x) * WRONG_NUDGE,
      y: picture.y + (place.y - picture.y) * WRONG_NUDGE,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => card.goHome(true, done),
    });
  }
}
