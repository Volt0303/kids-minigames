import type * as Phaser from 'phaser';
import { loadAtlas } from '../../core/assets/atlas';
import { atlasKey } from '../../core/assets/catalog';
import { pick } from '../../core/logic/random';
import type { Rect } from '../../core/logic/rect';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import { OCEAN_COPY, TRASH_PROMPT } from './copy';
import { BagBar } from './BagBar';
import { RulesCard } from './RulesCard';
import { School } from './School';
import { STAGES, TRASH_KINDS, type FishKind, type OceanStage, type TrashKind } from './stages';
import { TrashLayer, type Trash } from './TrashLayer';
import { TrashTicket } from './TrashTicket';

export const OCEAN_SCENE_KEY = 'Ocean';

const FIRST_STAGE = STAGES[0];
if (!FIRST_STAGE) throw new Error('ocean: no stages defined');

const TRASH = atlasKey('trash');
/** Pictures in the 「あそびかた」 card, as in the client's mockup. */
const RULE_TRASH: readonly TrashKind[] = ['can', 'plastic-bag', 'pet-bottle', 'paper-cup'];
const RULE_FISH: readonly FishKind[] = ['striped-orange', 'blue-tropical', 'sea-bream'];
/** A collected piece floats to the 「お題」 card and fades; a new one appears a moment later. */
const COLLECT_MS = 700;
const RESPAWN_MS = 600;
/** Delay between the pieces put out at the start of a stage. */
const START_STAGGER_MS = 350;

/**
 * ① 海のおそうじゲーム: trash sinks through the sea while fish swim by; the child taps the
 * trash (it floats away to the 「お題」 card) and leaves the fish alone (a tapped fish wiggles
 * and darts away, no penalty). Where trash and a fish overlap, the tap goes to the trash.
 */
export class OceanScene extends GameScene {
  protected readonly stages = STAGES;

  private trash!: TrashLayer;
  private school!: School;
  private ticket!: TrashTicket;
  private rules!: RulesCard;
  private bags!: BagBar;
  private field?: Rect;
  private stage: OceanStage = FIRST_STAGE;
  private lastKind?: TrashKind;
  /** Changes with every stage, so delayed spawns from an earlier stage do nothing. */
  private round = 0;

  constructor(setup: GameSetup) {
    super(OCEAN_SCENE_KEY, setup, {
      background: 'sea',
      art: 'ocean',
      bubbles: true,
      own: { howTo: true, footer: true },
      cardWeights: [2.2, 3.2],
      promptTextShare: 0.33,
      copy: OCEAN_COPY,
      icon: { texture: TRASH, frame: 'can' },
    });
  }

  protected preloadGame(): void {
    loadAtlas(this.load, 'trash');
    loadAtlas(this.load, 'fish');
  }

  protected buildField(): void {
    this.school = new School(this);
    this.trash = new TrashLayer(this);
    this.ticket = new TrashTicket(this);
    this.rules = new RulesCard(this, { trash: RULE_TRASH, fish: RULE_FISH });
    this.bags = new BagBar(this);
    // Every object under the finger is reported, so trash can win over a fish in front of it.
    this.input.topOnly = false;
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]) =>
      this.onTap(objects),
    );
  }

  protected layoutField(field: Rect): void {
    this.field = field;
    this.trash.layout(field);
    this.school.layout(field);
    const card = this.promptContentArea;
    if (card) this.ticket.layout(card);
    const { howTo, footer } = this.ownAreas;
    if (howTo) this.rules.layout(howTo);
    if (footer) this.bags.layout(footer);
  }

  protected startStage(index: number): void {
    this.stage = STAGES[index] ?? this.stage;
    this.round += 1;
    const field = this.field;
    if (!field) return;
    this.setPrompt(TRASH_PROMPT);
    this.trash.clear();
    this.refreshTicket();
    this.school.start(this.stage, field, Math.random);
    for (let i = 0; i < this.stage.trashOnScreen; i++) this.spawnLater(i * START_STAGGER_MS);
  }

  protected onProgress(done: number, goal: number): void {
    this.bags.setProgress(done, goal);
  }

  protected findHintTarget(): Phaser.GameObjects.Image | undefined {
    const pieces = this.trash.pieces.filter((piece) => piece.active && piece.image.alpha === 1);
    return pieces.length > 0 ? pick(pieces, Math.random).image : undefined;
  }

  update(_time: number, delta: number): void {
    const field = this.field;
    if (!field || this.isPaused) return;
    const seconds = delta / 1000;
    this.trash.update(seconds, field, this.stage.sinkSpeed);
    this.school.update(seconds, field, this.stage.fishSpeed);
  }

  /** Trash first, even behind a fish; otherwise a fish, which wiggles and darts away. */
  private onTap(objects: readonly Phaser.GameObjects.GameObject[]): void {
    if (!this.isPlaying || this.isPaused) return;
    for (const object of objects) {
      const piece = this.trash.pieceOf(object);
      if (piece) {
        this.collect(piece);
        return;
      }
    }
    const fish = objects.find((object) => this.school.has(object));
    if (fish && 'x' in fish) {
      this.school.scare(fish);
      this.reportWrong(fish as Phaser.GameObjects.Image);
    }
  }

  private collect(piece: Trash): void {
    this.trash.take(piece);
    const image = piece.image;
    // To its own picture in the 「お題」 card.
    const target = this.ticket.pointOf(piece.kind) ?? { x: image.x, y: image.y - 200 };
    image.setDepth(50);
    this.tweens.add({
      targets: image,
      x: target.x,
      y: target.y,
      scale: image.scale * 0.5,
      alpha: 0,
      angle: 0,
      duration: COLLECT_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.trash.release(piece);
        this.refreshTicket();
      },
    });
    this.reportCorrect(image.x, image.y);
    this.spawnLater(RESPAWN_MS);
  }

  /** Puts a new piece of trash in the sea after `delayMs`, if the stage is still being played. */
  private spawnLater(delayMs: number): void {
    const round = this.round;
    this.time.delayedCall(delayMs, () => {
      const field = this.field;
      if (round !== this.round || !field || this.trash.activeCount() >= this.stage.trashOnScreen) return;
      const kinds = TRASH_KINDS.filter((kind) => kind !== this.lastKind);
      const kind = pick(kinds.length > 0 ? kinds : TRASH_KINDS, Math.random);
      this.lastKind = kind;
      this.trash.spawn(kind, field, this.stage.trashBehindFish, Math.random);
      this.refreshTicket();
    });
  }

  /** The 「お題」 card shows the kinds of trash in the sea right now. */
  private refreshTicket(): void {
    this.ticket.show(this.trash.kindsInSea());
  }
}
