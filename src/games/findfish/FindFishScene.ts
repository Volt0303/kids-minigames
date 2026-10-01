import * as Phaser from 'phaser';
import { loadAtlas } from '../../core/assets/atlas';
import { atlasKey, spriteNames, spriteSpec } from '../../core/assets/catalog';
import { minTouchSize } from '../../core/logic/layout';
import type { Rect } from '../../core/logic/rect';
import { DESIGN_HEIGHT } from '../../core/logic/viewport';
import { GameScene } from '../../core/scenes/GameScene';
import { FIND_FISH_COPY, findPrompt, TITLE_FISH } from './copy';
import { buildRoster, type Roster } from './logic/roster';
import { edgeAlpha, planRows, rowCapacity, slotPositions, wrap, type SwimPlan } from './logic/rows';
import { STAGES, type FindFishStage } from './stages';

export const FIND_FISH_SCENE_KEY = 'FindFish';

const FISH_TEXTURE = atlasKey('fish');
const ALL_FISH = spriteNames('fish');
/** Widest fish in the catalog; used to space the rows. */
const MAX_FISH_WIDTH = 360;
/** Fish height relative to its row, leaving room between rows. */
const ROW_FILL = 0.78;
/** Extra tap area around each fish (stays inside the gap between neighbours). */
const TAP_PADDING = 20;
/** Minimum tap area (requirements 6.6: about 13% of the screen height), even for small pictures. */
const MIN_TAP = minTouchSize(DESIGN_HEIGHT);
const POOL_SIZE = 16;
const FOUND_FLOAT = 140;
/** Fish fainter than this are fading out at the field's edge and cannot be tapped. */
const TAPPABLE_ALPHA = 0.5;

const containsPoint = (area: Phaser.Geom.Rectangle, x: number, y: number): boolean => area.contains(x, y);

/**
 * Tap area in the image's own (unscaled) coordinates: the picture plus padding,
 * and never smaller than MIN_TAP on screen.
 */
function tapArea(width: number, height: number, scale: number): Phaser.Geom.Rectangle {
  const halfWidth = Math.max((width * scale) / 2 + TAP_PADDING, MIN_TAP / 2) / scale;
  const halfHeight = Math.max((height * scale) / 2 + TAP_PADDING, MIN_TAP / 2) / scale;
  return new Phaser.Geom.Rectangle(width / 2 - halfWidth, height / 2 - halfHeight, halfWidth * 2, halfHeight * 2);
}

interface Swimmer {
  image: Phaser.GameObjects.Image;
  direction: 1 | -1;
  /** Swimming and tappable. */
  active: boolean;
  /** Already found this stage: stays hidden even if the field is laid out again. */
  found: boolean;
}

/**
 * ③ おさかな探し: find the fish shown on the task card among fish swimming in rows.
 * Rows never overlap, so a tap always reaches the fish the child sees.
 */
export class FindFishScene extends GameScene {
  protected readonly stages = STAGES;

  /** Created once and reused every stage (object pool). */
  private readonly swimmers: Swimmer[] = [];
  private field?: Rect;
  private plan?: SwimPlan;
  private roster?: Roster;
  private stage: FindFishStage = STAGES[0];

  constructor(title: string) {
    super(FIND_FISH_SCENE_KEY, title, {
      background: 'sea',
      bubbles: true,
      copy: FIND_FISH_COPY,
      icon: { texture: FISH_TEXTURE, frame: TITLE_FISH },
    });
  }

  protected preloadGame(): void {
    loadAtlas(this.load, 'fish');
  }

  protected buildField(): void {
    for (let i = 0; i < POOL_SIZE; i++) {
      const image = this.add.image(0, 0, FISH_TEXTURE, 'tuna').setVisible(false).setDepth(-10);
      const swimmer: Swimmer = { image, direction: 1, active: false, found: false };
      image.on('pointerdown', () => this.onTap(swimmer));
      this.swimmers.push(swimmer);
    }
  }

  protected layoutField(field: Rect): void {
    this.field = field;
    if (this.roster) this.placeFish(this.roster);
  }

  protected startStage(index: number): void {
    this.stage = STAGES[index] ?? this.stage;
    const field = this.field;
    if (!field) return;
    const capacity = rowCapacity(field.width, MAX_FISH_WIDTH) * this.stage.rows;
    this.roster = buildRoster(this.stage, capacity, ALL_FISH, Math.random);
    const name = spriteSpec('fish', this.roster.target).ja;
    this.setPrompt(findPrompt(name), { texture: FISH_TEXTURE, frame: this.roster.target });
    for (const swimmer of this.swimmers) swimmer.found = false;
    this.placeFish(this.roster);
  }

  protected findHintTarget(): Phaser.GameObjects.Image | undefined {
    const target = this.roster?.target;
    return this.swimmers.find((s) => s.active && s.image.alpha === 1 && s.image.frame.name === target)?.image;
  }

  update(_time: number, delta: number): void {
    const plan = this.plan;
    const field = this.field;
    if (!plan || !field) return;
    const step = (this.stage.speed * delta) / 1000;
    const right = field.x + field.width;
    for (const swimmer of this.swimmers) {
      if (!swimmer.active) continue;
      const image = swimmer.image;
      image.x = wrap(image.x + swimmer.direction * step, plan.loopStart, plan.loopLength);
      // Fade out near the border so no fish is ever drawn outside the field's frame.
      image.alpha = edgeAlpha(image.x, image.displayWidth / 2, field.x, right);
    }
  }

  /** Puts the roster's fish into their rows; unused pool fish are hidden. */
  private placeFish(roster: Roster): void {
    const field = this.field;
    if (!field) return;
    const plan = planRows(field, roster.fish.length, this.stage.rows, MAX_FISH_WIDTH);
    this.plan = plan;

    let next = 0;
    plan.rows.forEach((row, rowIndex) => {
      for (const x of slotPositions(plan, rowIndex)) {
        const swimmer = this.swimmers[next];
        const fish = roster.fish[next];
        next += 1;
        if (swimmer?.found) this.hideSwimmer(swimmer);
        else if (swimmer && fish)
          this.showSwimmer(swimmer, fish, { x, y: row.y, height: row.height, direction: row.direction });
      }
    });
    for (const swimmer of this.swimmers.slice(next)) this.hideSwimmer(swimmer);
  }

  private showSwimmer(
    swimmer: Swimmer,
    fish: string,
    place: { x: number; y: number; height: number; direction: 1 | -1 },
  ): void {
    const image = swimmer.image;
    this.tweens.killTweensOf(image);
    image.setFrame(fish).setAngle(0).setAlpha(1);
    const scale = Math.min(1, (place.height * ROW_FILL) / image.frame.height);
    // Fish art faces left, so it is flipped when swimming right.
    image
      .setScale(scale)
      .setPosition(place.x, place.y)
      .setFlipX(place.direction > 0)
      .setVisible(true);
    image.setInteractive(tapArea(image.frame.width, image.frame.height, scale), containsPoint);
    swimmer.direction = place.direction;
    swimmer.active = true;
  }

  private hideSwimmer(swimmer: Swimmer): void {
    this.tweens.killTweensOf(swimmer.image);
    swimmer.active = false;
    swimmer.image.setVisible(false).disableInteractive();
  }

  private onTap(swimmer: Swimmer): void {
    if (!this.isPlaying || !swimmer.active || swimmer.image.alpha < TAPPABLE_ALPHA) return;
    const image = swimmer.image;
    if (image.frame.name !== this.roster?.target) {
      this.reportWrong(image);
      return;
    }
    // Found: the fish floats up and fades away.
    swimmer.active = false;
    swimmer.found = true;
    image.disableInteractive();
    this.tweens.add({
      targets: image,
      y: image.y - FOUND_FLOAT,
      alpha: 0,
      duration: 400,
      onComplete: () => image.setVisible(false),
    });
    this.reportCorrect(image.x, image.y);
  }
}
