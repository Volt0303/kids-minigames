import * as Phaser from 'phaser';
import { loadAtlas } from '../core/assets/atlas';
import { atlasKey, spriteNames, spriteSpec, type SpriteName } from '../core/assets/catalog';
import type { Rect } from '../core/logic/rect';
import type { StageConfig } from '../core/logic/stageFlow';
import { GameScene } from '../core/scenes/GameScene';

export const DEMO_GAME_SCENE_KEY = 'DemoGame';

type Fish = SpriteName<'fish'>;

const FISH_COUNT = 10;
const FISH_TEXTURE = atlasKey('fish');
/** Fish asked for in stages 1, 2 and 3. */
const TARGETS: readonly Fish[] = ['tuna', 'salmon', 'sea-bream'];
/** Targets on screen at once, per stage: fewer as the game gets harder. */
const TARGETS_ON_SCREEN = [4, 3, 2] as const;

interface Lane {
  left: number;
  right: number;
  speed: number;
}

/**
 * Framework demo: find the named fish among others. Uses the sprite catalog
 * and texture atlases (placeholders until the art exists). Not one of the six games.
 */
export class DemoGameScene extends GameScene {
  protected readonly stages: readonly StageConfig[] = [
    { goal: 3, durationMs: 60_000 },
    { goal: 4, durationMs: 60_000 },
    { goal: 5, durationMs: 60_000 },
  ];

  /** Created once and reused across stages (object pool). */
  private readonly fish: Phaser.GameObjects.Image[] = [];
  private field?: Rect;
  private target: Fish = 'tuna';

  constructor(title: string) {
    super(DEMO_GAME_SCENE_KEY, title, { background: 'sea' });
  }

  protected preloadGame(): void {
    loadAtlas(this.load, 'fish');
  }

  protected buildField(): void {
    for (let i = 0; i < FISH_COUNT; i++) {
      const fish = this.add.image(0, 0, FISH_TEXTURE, 'tuna');
      fish.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onFishTap(fish));
      this.fish.push(fish);
    }
  }

  protected layoutField(field: Rect): void {
    this.field = field;
    for (const fish of this.fish) this.place(fish);
  }

  protected startStage(index: number): void {
    this.target = TARGETS[index] ?? 'tuna';
    this.setPrompt(`${spriteSpec('fish', this.target).ja}を\nタッチ！`, { texture: FISH_TEXTURE, frame: this.target });
    const decoys = spriteNames('fish').filter((name) => name !== this.target);
    const targetCount = TARGETS_ON_SCREEN[index] ?? 2;
    this.fish.forEach((fish, i) => fish.setFrame(i < targetCount ? this.target : Phaser.Utils.Array.GetRandom(decoys)));
    for (const fish of this.fish) this.place(fish);
  }

  protected findHintTarget(): Phaser.GameObjects.Image | undefined {
    return this.fish.find((fish) => fish.frame.name === this.target);
  }

  private onFishTap(fish: Phaser.GameObjects.Image): void {
    if (!this.isPlaying) return;
    if (fish.frame.name === this.target) {
      this.reportCorrect(fish.x, fish.y);
      this.place(fish);
    } else {
      this.reportWrong(fish);
    }
  }

  /** Moves a fish to a random spot in the field and sets it swimming. */
  private place(fish: Phaser.GameObjects.Image): void {
    const field = this.field;
    if (!field) return;
    const halfWidth = fish.width / 2;
    const halfHeight = fish.height / 2;
    const lane = {
      left: field.x + halfWidth,
      right: field.x + field.width - halfWidth,
      speed: Phaser.Math.FloatBetween(0.15, 0.3), // design units per ms
    };
    const y = Phaser.Math.FloatBetween(field.y + halfHeight, field.y + field.height - halfHeight);

    this.tweens.killTweensOf(fish);
    fish.setPosition(Phaser.Math.FloatBetween(lane.left, lane.right), y).setAngle(0);
    this.swim(fish, lane, Math.random() < 0.5);
  }

  /** Swims to one edge, then turns around. Fish art faces left, so it is flipped when moving right. */
  private swim(fish: Phaser.GameObjects.Image, lane: Lane, toRight: boolean): void {
    const target = toRight ? lane.right : lane.left;
    fish.setFlipX(toRight);
    this.tweens.add({
      targets: fish,
      x: target,
      duration: Math.abs(target - fish.x) / lane.speed,
      onComplete: () => this.swim(fish, lane, !toRight),
    });
  }
}
