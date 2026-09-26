import * as Phaser from 'phaser';
import type { Rect } from '../core/logic/rect';
import type { StageConfig } from '../core/logic/stageFlow';
import { GameScene } from '../core/scenes/GameScene';

export const DEMO_GAME_SCENE_KEY = 'DemoGame';

const FISH_COUNT = 10;
const FISH_WIDTH = 240;
const FISH_HEIGHT = 140;
const COLORS = { orange: 0xff9f1c, blue: 0x4cc9f0, green: 0x80ed99 } as const;
type FishColor = keyof typeof COLORS;
const DECOYS: readonly FishColor[] = ['blue', 'green'];

const textureKey = (color: FishColor): string => `demo-fish-${color}`;

/**
 * Framework demo (placeholder art): tap the orange fish among others.
 * Exercises the shared UI, stage flow, hints and feedback; it is not one of
 * the six games.
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

  constructor(title: string) {
    super(DEMO_GAME_SCENE_KEY, title);
  }

  protected buildField(): void {
    for (const color of Object.keys(COLORS) as FishColor[]) this.makeFishTexture(color);
    for (let i = 0; i < FISH_COUNT; i++) {
      const fish = this.add.image(0, 0, textureKey('orange')).setDisplaySize(FISH_WIDTH, FISH_HEIGHT);
      fish.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onFishTap(fish));
      this.fish.push(fish);
    }
  }

  protected layoutField(field: Rect): void {
    this.field = field;
    for (const fish of this.fish) this.place(fish);
  }

  protected startStage(index: number): void {
    this.setPrompt('オレンジの\nさかなを タッチ！', textureKey('orange'));
    // More decoys in later stages: 4 targets, then 3, then 2.
    const targets = 4 - index;
    this.fish.forEach((fish, i) => this.recolor(fish, i < targets ? 'orange' : this.randomDecoy()));
    for (const fish of this.fish) this.place(fish);
  }

  protected findHintTarget(): Phaser.GameObjects.Image | undefined {
    return this.fish.find((fish) => fish.getData('target') === true);
  }

  private onFishTap(fish: Phaser.GameObjects.Image): void {
    if (!this.isPlaying) return;
    if (fish.getData('target') === true) {
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
    const left = field.x + FISH_WIDTH / 2;
    const right = field.x + field.width - FISH_WIDTH / 2;
    const y = Phaser.Math.FloatBetween(field.y + FISH_HEIGHT / 2, field.y + field.height - FISH_HEIGHT / 2);
    const x = Phaser.Math.FloatBetween(left, right);

    this.tweens.killTweensOf(fish);
    fish.setPosition(x, y).setDisplaySize(FISH_WIDTH, FISH_HEIGHT).setAngle(0);
    const speed = Phaser.Math.FloatBetween(0.15, 0.3); // design units per ms
    this.swim(fish, { left, right, speed }, Math.random() < 0.5);
  }

  /** Swims to one edge, then turns around. The fish art faces left, so it is flipped when moving right. */
  private swim(
    fish: Phaser.GameObjects.Image,
    lane: { left: number; right: number; speed: number },
    toRight: boolean,
  ): void {
    const target = toRight ? lane.right : lane.left;
    fish.setFlipX(toRight);
    this.tweens.add({
      targets: fish,
      x: target,
      duration: Math.abs(target - fish.x) / lane.speed,
      onComplete: () => this.swim(fish, lane, !toRight),
    });
  }

  private recolor(fish: Phaser.GameObjects.Image, color: FishColor): void {
    fish.setTexture(textureKey(color)).setData('target', color === 'orange');
  }

  private randomDecoy(): FishColor {
    return Phaser.Utils.Array.GetRandom([...DECOYS]);
  }

  private makeFishTexture(color: FishColor): void {
    const key = textureKey(color);
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(COLORS[color]).fillEllipse(90, 60, 150, 90);
    g.fillTriangle(150, 60, 200, 20, 200, 100);
    g.fillStyle(0xffffff).fillCircle(50, 48, 12);
    g.fillStyle(0x222222).fillCircle(46, 48, 6);
    g.generateTexture(key, 205, 120);
    g.destroy();
  }
}
