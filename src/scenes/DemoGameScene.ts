import * as Phaser from 'phaser';
import { loadAtlas } from '../core/assets/atlas';
import { atlasKey, spriteNames, spriteSpec, type SpriteName } from '../core/assets/catalog';
import type { Rect } from '../core/logic/rect';
import type { StageConfig } from '../core/logic/stageFlow';
import { GameScene } from '../core/scenes/GameScene';
import { plain } from '../core/ui/RichText';

export const DEMO_GAME_SCENE_KEY = 'DemoGame';

type Fish = SpriteName<'fish'>;

/** The field is split into a grid; each fish swims inside its own cell, so fish never overlap. */
const GRID = { rows: 5, columns: 2 } as const;
const FISH_COUNT = GRID.rows * GRID.columns;
/** Fish height relative to its cell, leaving room between rows. */
const CELL_FILL = 0.8;
const FOUND_FLOAT = 140;
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
    super(DEMO_GAME_SCENE_KEY, title, {
      background: 'sea',
      bubbles: true,
      copy: {
        subtitle: plain('じゅんびちゅう'),
        howTo: plain('このゲームは', 'じゅんびちゅう', 'です'),
        footer: plain('もうすぐ あそべるよ！'),
        praise: { title: 'せいかい！', line: 'よく できたね！' },
      },
    });
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
    this.fish.forEach((fish, i) => this.place(fish, i));
  }

  protected startStage(index: number): void {
    this.target = TARGETS[index] ?? 'tuna';
    this.setPrompt(plain(`${spriteSpec('fish', this.target).ja}を`, 'タッチ！'), {
      texture: FISH_TEXTURE,
      frame: this.target,
    });
    const decoys = spriteNames('fish').filter((name) => name !== this.target);
    const targetCount = TARGETS_ON_SCREEN[index] ?? 2;
    this.fish.forEach((fish, i) => fish.setFrame(i < targetCount ? this.target : Phaser.Utils.Array.GetRandom(decoys)));
    this.fish.forEach((fish, i) => this.place(fish, i));
  }

  protected findHintTarget(): Phaser.GameObjects.Image | undefined {
    return this.fish.find((fish) => fish.frame.name === this.target);
  }

  private onFishTap(fish: Phaser.GameObjects.Image): void {
    if (!this.isPlaying) return;
    if (fish.frame.name === this.target) {
      this.reportCorrect(fish.x, fish.y);
      this.respawn(fish);
    } else {
      this.reportWrong(fish);
    }
  }

  /** A found fish floats up and fades away, then swims in again from another spot in its cell. */
  private respawn(fish: Phaser.GameObjects.Image): void {
    fish.disableInteractive();
    this.tweens.add({
      targets: fish,
      y: fish.y - FOUND_FLOAT,
      alpha: 0,
      duration: 400,
      onComplete: () => this.place(fish, this.fish.indexOf(fish)),
    });
  }

  /** Puts fish number `index` in its grid cell and sets it swimming there. */
  private place(fish: Phaser.GameObjects.Image, index: number): void {
    const field = this.field;
    if (!field) return;
    const cellWidth = field.width / GRID.columns;
    const cellHeight = field.height / GRID.rows;
    const left = field.x + (index % GRID.columns) * cellWidth;
    const y = field.y + (Math.floor(index / GRID.columns) + 0.5) * cellHeight;
    const scale = Math.min(1, (cellHeight * CELL_FILL) / fish.frame.height, (cellWidth * 0.9) / fish.frame.width);
    fish.setScale(scale);
    const halfWidth = (fish.frame.width * scale) / 2;
    const lane = {
      left: left + halfWidth,
      right: left + cellWidth - halfWidth,
      speed: Phaser.Math.FloatBetween(0.1, 0.2), // design units per ms
    };

    this.tweens.killTweensOf(fish);
    fish.setPosition(Phaser.Math.FloatBetween(lane.left, lane.right), y).setAngle(0).setAlpha(1).setInteractive();
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
