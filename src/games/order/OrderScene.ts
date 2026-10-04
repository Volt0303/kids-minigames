import { loadAtlas } from '../../core/assets/atlas';
import { atlasKey } from '../../core/assets/catalog';
import type { SushiKind } from '../../core/assets/sushi';
import { edgeAlpha, wrap } from '../../core/logic/loop';
import type { Rect } from '../../core/logic/rect';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import { Belt } from './Belt';
import { ORDER_COPY, orderPrompt } from './copy';
import { dealPieces, nextOrder, orderSize, type Order } from './logic/orders';
import {
  beltCapacity,
  beltScale,
  PIECE,
  planBelt,
  planField,
  planGrid,
  type Belt as BeltPlan,
  type FieldPlan,
} from './logic/placement';
import { OrderTicket } from './OrderTicket';
import { STAGES, type OrderStage } from './stages';
import { SushiPiece } from './SushiPiece';
import { Tray } from './Tray';

export const ORDER_SCENE_KEY = 'Order';

const FIRST_STAGE = STAGES[0];
if (!FIRST_STAGE) throw new Error('order: no stages defined');

const SUSHI = atlasKey('sushi');
/** Enough pieces for the largest counter or belt. */
const POOL_SIZE = 16;
const FLY_MS = 380;
/** Pause after an order is complete, so the full tray can be seen before the next order. */
const NEXT_ORDER_MS = 900;
/** Sushi fainter than this are fading out at the field's edge and cannot be tapped. */
const TAPPABLE_ALPHA = 0.5;
/** Belt band height relative to a sushi's height (it runs under the plates). */
const BELT_SHARE = 0.55;

/**
 * ⑥ 注文のお手伝いゲーム: an order (pictures and dots in the 「お題」 card) asks for some sushi;
 * the child taps the matching ones on the counter — or, in stage 3, on the conveyor — and
 * they go onto the tray. Orders follow one another until the stage's sushi are all served.
 */
export class OrderScene extends GameScene {
  protected readonly stages = STAGES;

  /** Created once and reused for every order (object pool). */
  private readonly pieces: SushiPiece[] = [];
  private ticket!: OrderTicket;
  private tray!: Tray;
  private belt!: Belt;
  private plan?: FieldPlan;
  private beltPlan?: BeltPlan;
  private stage: OrderStage = FIRST_STAGE;
  private order: Order = [];
  /** Pieces of each order line already on the tray. */
  private served: number[] = [];
  /** Sushi still to serve in this stage. */
  private remaining = 0;
  /** The sushi put out for the current order (pieces[i] shows dealt[i]). */
  private dealt: SushiKind[] = [];
  private onTray: SushiPiece[] = [];
  /** Changes with every stage, so a delayed "next order" from an earlier stage does nothing. */
  private round = 0;

  constructor(setup: GameSetup) {
    super(ORDER_SCENE_KEY, setup, {
      background: 'sushi-counter',
      art: 'order',
      copy: ORDER_COPY,
      icon: { texture: SUSHI, frame: 'topping-tuna' },
      titleDeco: { texture: atlasKey('characters'), frame: 'turtle' },
    });
  }

  protected preloadGame(): void {
    loadAtlas(this.load, 'sushi');
  }

  protected buildField(): void {
    this.belt = new Belt(this);
    this.tray = new Tray(this);
    for (let i = 0; i < POOL_SIZE; i++) this.pieces.push(new SushiPiece(this, (piece) => this.onTap(piece)));
    this.ticket = new OrderTicket(this);
  }

  protected layoutField(field: Rect): void {
    this.plan = planField(field);
    this.tray.layout(this.plan.tray);
    const ticketArea = this.promptContentArea;
    if (ticketArea) this.ticket.layout(ticketArea);
    if (this.order.length > 0) this.placePieces(false);
  }

  protected startStage(index: number): void {
    this.stage = STAGES[index] ?? this.stage;
    this.round += 1;
    this.remaining = this.stage.goal;
    this.order = [];
    this.newOrder();
  }

  protected findHintTarget(): SushiPiece | undefined {
    const wanted = this.pieces.filter((piece) => piece.available && piece.alpha === 1 && this.lineFor(piece.kind) >= 0);
    return wanted[Math.floor(Math.random() * wanted.length)];
  }

  update(_time: number, delta: number): void {
    const belt = this.beltPlan;
    const counter = this.plan?.counter;
    if (!this.stage.conveyor || !belt || !counter || this.isPaused) return;
    const dx = (this.stage.speed * delta) / 1000;
    this.belt.move(dx);
    const halfWidth = (PIECE.width * belt.scale) / 2;
    for (const piece of this.pieces) {
      if (!piece.available) continue;
      piece.x = wrap(piece.x + dx, belt.loopStart, belt.loopLength);
      piece.alpha = edgeAlpha(piece.x, halfWidth, counter.x, counter.x + counter.width);
    }
  }

  /** Clears the tray and puts out the sushi for the next order. */
  private newOrder(): void {
    for (const piece of this.pieces) piece.clear();
    this.onTray = [];
    this.order = nextOrder(this.stage, this.remaining, this.order, Math.random);
    this.served = this.order.map(() => 0);
    this.setPrompt(orderPrompt(this.order));
    this.ticket.show(this.order, this.served);
    this.dealt = dealPieces(this.order, this.stage, this.capacity(), Math.random);
    this.placePieces(true);
  }

  /**
   * How many sushi to put out. On the conveyor: those that fit on screen plus one coming in,
   * so the belt is not much longer than the field and no sushi is long out of sight.
   */
  private capacity(): number {
    const counter = this.plan?.counter;
    if (!this.stage.conveyor || !counter) return POOL_SIZE;
    return Math.min(POOL_SIZE, beltCapacity(counter, beltScale(counter)) + 1);
  }

  /**
   * Positions the sushi on the counter (grid) or the belt, and those already chosen on the
   * tray. `fresh` puts every dealt sushi out again; otherwise only positions are updated.
   */
  private placePieces(fresh: boolean): void {
    const counter = this.plan?.counter;
    if (!counter) return;
    const places = this.stage.conveyor ? this.beltPlaces(counter) : this.gridPlaces(counter);
    this.dealt.forEach((kind, i) => {
      const piece = this.pieces[i];
      const place = places.positions[i];
      if (!piece || !place) return;
      if (fresh) piece.serve(kind, place.x, place.y, places.scale);
      else if (piece.available) piece.setPosition(place.x, place.y).setScale(places.scale);
    });
    this.placeTray(false);
  }

  private gridPlaces(counter: Rect): { positions: { x: number; y: number }[]; scale: number } {
    this.beltPlan = undefined;
    this.belt.layout(counter, 0, 0);
    return planGrid(counter, this.dealt.length);
  }

  private beltPlaces(counter: Rect): { positions: { x: number; y: number }[]; scale: number } {
    const belt = planBelt(counter, this.dealt.length);
    this.beltPlan = belt;
    const plateY = belt.y + PIECE.height * belt.scale * 0.22;
    this.belt.layout(counter, plateY, PIECE.height * belt.scale * BELT_SHARE);
    return { positions: belt.positions.map((x) => ({ x, y: belt.y })), scale: belt.scale };
  }

  /** Puts the chosen sushi in their tray places (flying there when `animate`). */
  private placeTray(animate: boolean): void {
    const slots = this.tray.slots(orderSize(this.order));
    this.onTray.forEach((piece, i) => {
      const slot = slots.positions[i];
      if (!slot) return;
      if (!animate || i < this.onTray.length - 1) {
        piece.setPosition(slot.x, slot.y).setScale(slots.scale).setAlpha(1);
        return;
      }
      this.tweens.add({
        targets: piece,
        x: slot.x,
        y: slot.y,
        scale: slots.scale,
        alpha: 1,
        duration: FLY_MS,
        ease: 'Sine.easeOut',
      });
    });
  }

  /** The order line still waiting for this kind, or -1. */
  private lineFor(kind: SushiKind): number {
    return this.order.findIndex((line, i) => line.kind === kind && (this.served[i] ?? 0) < line.count);
  }

  private onTap(piece: SushiPiece): void {
    if (!this.isPlaying || this.isPaused || !piece.available || piece.alpha < TAPPABLE_ALPHA) return;
    const line = this.lineFor(piece.kind);
    if (line < 0) {
      this.reportWrong(piece);
      return;
    }
    this.served[line] = (this.served[line] ?? 0) + 1;
    this.remaining -= 1;
    piece.take();
    this.tweens.killTweensOf(piece);
    this.onTray.push(piece);
    this.ticket.show(this.order, this.served);
    const { x, y } = piece;
    this.placeTray(true);
    if (this.onTray.length === orderSize(this.order) && this.remaining > 0) this.queueNextOrder();
    this.reportCorrect(x, y);
  }

  private queueNextOrder(): void {
    const round = this.round;
    this.time.delayedCall(FLY_MS + NEXT_ORDER_MS, () => {
      if (round === this.round && this.isPlaying && this.remaining > 0) this.newOrder();
    });
  }
}
