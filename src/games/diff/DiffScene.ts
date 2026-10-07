import type * as Phaser from 'phaser';
import { loadAtlas, loadGameArt } from '../../core/assets/atlas';
import { atlasKey } from '../../core/assets/catalog';
import { rect, type Rect } from '../../core/logic/rect';
import { GameScene, type GameSetup } from '../../core/scenes/GameScene';
import type { HintTarget } from '../../core/ui/HintMarker';
import { Instruction } from '../../core/ui/Instruction';
import { DIFF_COPY, INSTRUCTION } from './copy';
import { DiffPicture } from './DiffPicture';
import { hitSpot, spots, type Spot } from './logic/spots';
import { MissMark } from './MissMark';
import { makeRound } from './logic/round';
import { STAGES, type Round } from './stages';
import { StarBar } from './StarBar';

export const DIFF_SCENE_KEY = 'Diff';

const FIRST_STAGE = STAGES[0];
if (!FIRST_STAGE) throw new Error('diff: no stages defined');

const GAP = 56;
const MARGIN = 30;
/** Pictures are at most this wide per unit of height (wide screens leave space around them). */
const PICTURE_ASPECT = 1.5;
const STARFISH_ANGLE = -10;
/** A play area wider than this per unit of height shows the instruction beside the star bar. */
const WIDE_FIELD = 3;

/**
 * ⑤ 間違い探し: two pictures side by side — the right one has a few differences. Tapping a
 * difference on either picture circles it on both; a tap elsewhere shows a little ？ cloud (no
 * penalty). The pink starfish by the star bar jumps for joy or tilts its head.
 * The guide character is not shown in this game (client rule).
 */
export class DiffScene extends GameScene {
  protected readonly stages = STAGES;

  private left!: DiffPicture;
  private right!: DiffPicture;
  private miss!: MissMark;
  private bar!: StarBar;
  private instruction!: Instruction;
  private starfish!: Phaser.GameObjects.Image;
  private starfishY = 0;
  private round: Round = makeRound(FIRST_STAGE.scenes, FIRST_STAGE.goal, Math.random);
  private spots: Spot[] = [];
  private readonly found = new Set<number>();

  constructor(setup: GameSetup) {
    super(DIFF_SCENE_KEY, setup, {
      layout: 'open',
      art: 'diff',
      copy: DIFF_COPY,
      icon: { texture: atlasKey('ui'), frame: 'icon-magnifier' },
    });
  }

  protected preloadGame(): void {
    for (const atlas of ['fish', 'scenery', 'sushi', 'props', 'characters'] as const) loadAtlas(this.load, atlas);
    loadGameArt(this.load, 'diff', 'picture-sea');
  }

  protected buildField(): void {
    this.left = new DiffPicture(this);
    this.right = new DiffPicture(this);
    this.bar = new StarBar(this);
    this.instruction = new Instruction(this, INSTRUCTION);
    this.starfish = this.add.image(0, 0, atlasKey('characters'), 'starfish-pink').setDepth(30).setAngle(STARFISH_ANGLE);
    this.miss = new MissMark(this);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer.worldX, pointer.worldY));
  }

  /** The difference spots, where their items are actually drawn (they may be moved inwards). */
  private placeSpots(): void {
    // spots() checks every difference points at an item; the drawn place replaces its position.
    this.spots = spots(this.round).map((spot, i) => {
      const item = this.round.differences[i]?.item;
      return (item === undefined ? undefined : this.left.spotOf(item)) ?? spot;
    });
  }

  protected layoutField(field: Rect): void {
    // The instruction on top (wide screens: beside the star bar, the height goes to the pictures),
    // two pictures side by side, the star bar centred under them.
    const wide = field.width > field.height * WIDE_FIELD;
    const instructionHeight = wide ? 0 : Math.min(84, field.height * 0.11);
    const barHeight = Math.min(110, field.height * 0.14);
    const top = field.y + (wide ? MARGIN : instructionHeight + MARGIN);
    const pictures = rect(
      field.x + MARGIN,
      top,
      field.width - MARGIN * 2,
      field.y + field.height - barHeight - MARGIN * 2.4 - top,
    );
    // Each picture at most PICTURE_ASPECT wide per unit of height, the pair centred.
    const width = Math.min((pictures.width - GAP) / 2, pictures.height * PICTURE_ASPECT);
    const left = pictures.x + (pictures.width - width * 2 - GAP) / 2;
    this.left.layout(rect(left, pictures.y, width, pictures.height));
    this.right.layout(rect(left + width + GAP, pictures.y, width, pictures.height));
    const barWidth = Math.min(field.width * 0.6, barHeight * 7);
    const barX = field.x + (field.width - barWidth) / 2;
    const barY = pictures.y + pictures.height + MARGIN * 1.4;
    this.bar.layout(rect(barX, barY, barWidth, barHeight));
    if (wide) {
      const x = barX + barWidth + MARGIN * 2;
      this.instruction.layout(rect(x, barY, Math.min(field.x + field.width - MARGIN - x, barWidth * 1.1), barHeight));
    } else {
      this.instruction.layout(rect(field.x + MARGIN, field.y, field.width - MARGIN * 2, instructionHeight));
    }
    // The pink starfish waves from just left of the star bar.
    const size = barHeight * 1.35;
    this.starfishY = barY + barHeight / 2;
    this.resetStarfish()
      .setScale(size / this.starfish.frame.height)
      .setX(barX - size * 0.7);
    this.placeSpots();
  }

  protected startStage(index: number): void {
    // A new scene and new differences every play.
    const stage = STAGES[index] ?? FIRST_STAGE;
    this.round = makeRound(stage.scenes, stage.goal, Math.random);
    this.found.clear();
    this.left.show(this.round.setting, this.round.items, []);
    this.right.show(this.round.setting, this.round.items, this.round.differences);
    this.placeSpots();
  }

  protected onProgress(done: number, goal: number): void {
    this.bar.setProgress(done, goal);
  }

  /** An item of a difference not found yet (on the right picture, or the left one if hidden there). */
  protected findHintTarget(): HintTarget | undefined {
    const index = this.round.differences.findIndex((_, i) => !this.found.has(i));
    const item = this.round.differences[index]?.item;
    if (item === undefined) return undefined;
    return this.right.imageOf(item) ?? this.left.imageOf(item);
  }

  private onTap(x: number, y: number): void {
    if (!this.isPlaying || this.isPaused) return;
    const picture = [this.left, this.right].find((p) => p.toPicture(x, y));
    const at = picture?.toPicture(x, y);
    const bounds = picture?.bounds;
    if (!at || !bounds) return;
    const hit = hitSpot(at, this.spots, this.found, bounds.width / bounds.height);
    const spot = this.spots[hit];
    if (!spot) {
      this.showMiss(x, y);
      return;
    }
    this.found.add(hit);
    this.left.mark(spot);
    this.right.mark(spot);
    this.reportCorrect(x, y);
    this.cheer();
  }

  private showMiss(x: number, y: number): void {
    this.miss.show(x, y);
    this.reportWrong(this.miss.container);
    // The starfish tilts its head: "hmm, not there".
    this.resetStarfish();
    this.tweens.add({
      targets: this.starfish,
      angle: 14,
      duration: 180,
      yoyo: true,
      hold: 220,
      ease: 'Sine.easeInOut',
    });
  }

  /** Stops the starfish's reaction and puts it back in place. */
  private resetStarfish(): Phaser.GameObjects.Image {
    this.tweens.killTweensOf(this.starfish);
    return this.starfish.setAngle(STARFISH_ANGLE).setY(this.starfishY);
  }

  /** The starfish jumps and spins for joy. */
  private cheer(): void {
    const s = this.resetStarfish();
    this.tweens.add({
      targets: s,
      y: this.starfishY - s.displayHeight * 0.35,
      duration: 200,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({ targets: s, angle: STARFISH_ANGLE + 360, duration: 400, ease: 'Sine.easeInOut' });
  }
}
