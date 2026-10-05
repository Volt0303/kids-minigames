import { loadAtlas } from '../../core/assets/atlas';
import { atlasKey } from '../../core/assets/catalog';
import type { SushiKind } from '../../core/assets/sushi';
import { edgeAlpha, wrap } from '../../core/logic/loop';
import type { Rect } from '../../core/logic/rect';
import { DESIGN_HEIGHT } from '../../core/logic/viewport';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import { ORDER_COPY, orderPrompt } from './copy';
import { dealPieces, nextOrder, type Order } from './logic/orders';
import {
  beltCapacity,
  beltScale,
  PIECE,
  PIECE_FOOT,
  planBelt,
  type Belt as BeltPlan,
  type Grid,
} from './logic/placement';
import { counterArea, planTable, shelfY } from './logic/table';
import { OrderTicket } from './OrderTicket';
import { STAGES, type OrderStage } from './stages';
import { SushiPiece } from './SushiPiece';
import { Table } from './Table';

export const ORDER_SCENE_KEY = 'Order';

const FIRST_STAGE = STAGES[0];
if (!FIRST_STAGE) throw new Error('order: no stages defined');

const SUSHI = atlasKey('sushi');
/** Enough pieces for the largest counter or belt. */
const POOL_SIZE = 16;
/** A chosen sushi glides to the order card this slowly, and fades out over the last part of the way. */
const FLY_MS = 950;
const FADE_SHARE = 0.4;
/** How much the sushi rises above a straight line on its way (a gentle arc), in design units. */
const FLY_ARC = 90;
/**
 * A chosen sushi flies over the field and the cards, but under the sparkles (90), the praise
 * bubble (95), the clear banner (100) and the close dialog (200).
 */
const FLYING_DEPTH = 50;
/** Pause after an order is complete, before the next order's sushi are put out. */
const NEXT_ORDER_MS = 700;
/** Sushi fainter than this are fading out at the field's edge and cannot be tapped. */
const TAPPABLE_ALPHA = 0.5;

/**
 * ⑥ 注文のお手伝いゲーム: an order (pictures and dots in the 「お題」 card) asks for some sushi;
 * the child taps the matching ones on the table — or, in stage 3, as they slide along the shelf — and they
 * fly to the order card. Orders follow one another until the stage's sushi are all served.
 */
export class OrderScene extends GameScene {
  protected readonly stages = STAGES;

  /** Created once and reused for every order (object pool). */
  private readonly pieces: SushiPiece[] = [];
  private ticket!: OrderTicket;
  private table!: Table;
  private field?: Rect;
  private beltPlan?: BeltPlan;
  private stage: OrderStage = FIRST_STAGE;
  private order: Order = [];
  /** Pieces of each order line already served. */
  private served: number[] = [];
  /** Sushi still to serve in this stage. */
  private remaining = 0;
  /** The sushi put out for the current order (pieces[i] shows dealt[i]). */
  private dealt: SushiKind[] = [];
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
    this.table = new Table(this);
    for (let i = 0; i < POOL_SIZE; i++) this.pieces.push(new SushiPiece(this, (piece) => this.onTap(piece)));
    this.ticket = new OrderTicket(this);
  }

  protected layoutField(field: Rect): void {
    this.field = field;
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
    const counter = this.field && counterArea(this.field);
    if (!this.stage.conveyor || !belt || !counter || this.isPaused) return;
    const dx = (this.stage.speed * delta) / 1000;
    const halfWidth = (PIECE.width * belt.scale) / 2;
    for (const piece of this.pieces) {
      if (!piece.available) continue;
      piece.x = wrap(piece.x + dx, belt.loopStart, belt.loopLength);
      piece.alpha = edgeAlpha(piece.x, halfWidth, counter.x, counter.x + counter.width);
    }
  }

  /** Puts out the sushi for the next order. */
  private newOrder(): void {
    for (const piece of this.pieces) piece.clear();
    this.order = nextOrder(this.stage, this.remaining, this.order, Math.random);
    this.served = this.order.map(() => 0);
    this.setPrompt(orderPrompt(this.order));
    this.ticket.show(this.order, this.served);
    this.dealt = dealPieces(this.order, this.stage, this.capacity(), Math.random);
    this.placePieces(true);
  }

  /**
   * How many sushi to put out. Sliding along the shelf: those that fit on screen plus one coming in,
   * so the loop is not much longer than the field and no sushi is long out of sight.
   */
  private capacity(): number {
    const counter = this.field && counterArea(this.field);
    if (!this.stage.conveyor || !counter) return POOL_SIZE;
    return Math.min(POOL_SIZE, beltCapacity(counter, beltScale(counter)) + 1);
  }

  /**
   * Positions the sushi on the table or the belt. `fresh` puts every dealt sushi out again;
   * otherwise only positions are updated (screen size changed).
   */
  private placePieces(fresh: boolean): void {
    const field = this.field;
    if (!field) return;
    const places = this.stage.conveyor ? this.beltPlaces(field) : this.tablePlaces(field);
    this.dealt.forEach((kind, i) => {
      const piece = this.pieces[i];
      const place = places.positions[i];
      if (!piece || !place) return;
      if (fresh) piece.serve(kind, place.x, place.y, places.scale);
      else if (piece.available) piece.setPosition(place.x, place.y).setScale(places.scale);
      // The front row stands in front of the back row (depth 0–1: below every overlay).
      piece.setDepth(place.y / DESIGN_HEIGHT);
    });
  }

  private tablePlaces(field: Rect): Grid {
    this.beltPlan = undefined;
    const plan = planTable(field, this.dealt.length, this.table.aspect);
    this.table.show(plan.table);
    return plan.sushi;
  }

  /** Stage 3: the sushi slide along the counter's shelf, their plates standing on it. */
  private beltPlaces(field: Rect): Grid {
    this.table.show(undefined);
    const belt = planBelt(counterArea(field), this.dealt.length);
    this.beltPlan = belt;
    const y = shelfY(field) - PIECE_FOOT * belt.scale;
    return { positions: belt.positions.map((x) => ({ x, y })), scale: belt.scale };
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
    this.ticket.show(this.order, this.served);
    const { x, y } = piece;
    this.flyToCard(piece);
    if (this.served.every((done, i) => done >= (this.order[i]?.count ?? 0)) && this.remaining > 0) {
      this.queueNextOrder();
    }
    this.reportCorrect(x, y);
  }

  /** A chosen sushi glides to the order card, fading out as it arrives, then goes back to the pool. */
  private flyToCard(piece: SushiPiece): void {
    const card = this.promptContentArea;
    const target = card
      ? { x: card.x + card.width / 2, y: card.y + card.height / 2 }
      : { x: piece.x, y: piece.y - 200 };
    piece.setDepth(FLYING_DEPTH);
    const start = { x: piece.x, y: piece.y, scale: piece.scale };
    const fadeFrom = 1 - FADE_SHARE;
    // One tween drives the whole flight: an eased glide along a gentle arc, shrinking a little,
    // fully visible at first and fading out only towards the end.
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: FLY_MS,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        // Put out again for a new order meanwhile: this flight no longer owns it.
        if (piece.available) return;
        const t = tween.getValue() ?? 1;
        piece.setPosition(
          start.x + (target.x - start.x) * t,
          start.y + (target.y - start.y) * t - Math.sin(Math.PI * t) * FLY_ARC,
        );
        piece.setScale(start.scale * (1 - 0.55 * t));
        piece.setAlpha(t < fadeFrom ? 1 : 1 - (t - fadeFrom) / FADE_SHARE);
      },
      onComplete: () => {
        if (!piece.available) piece.clear();
      },
    });
  }

  private queueNextOrder(): void {
    const round = this.round;
    this.time.delayedCall(FLY_MS + NEXT_ORDER_MS, () => {
      if (round === this.round && this.isPlaying && this.remaining > 0) this.newOrder();
    });
  }
}
