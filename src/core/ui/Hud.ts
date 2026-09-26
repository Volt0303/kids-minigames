import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { Pill } from './Pill';
import { COLORS, TEXT } from './theme';

const PILL_GAP = 28;

/**
 * Top bar of every game screen, as in the mockups: title on the left;
 * stage, progress and time remaining on the right.
 */
export class Hud {
  private readonly title: Phaser.GameObjects.Text;
  private readonly stage: Pill;
  private readonly progress: Pill;
  private readonly timer: Pill;
  private area?: Rect;

  constructor(scene: Phaser.Scene, title: string) {
    this.title = scene.add.text(0, 0, title, TEXT.title).setOrigin(0, 0.5);
    this.stage = new Pill(scene, COLORS.accent, 100);
    this.progress = new Pill(scene, COLORS.progress, 100);
    this.timer = new Pill(scene, COLORS.timer, 100);
  }

  setStage(index: number, total: number): void {
    this.stage.setLabel(`ステージ ${index + 1}/${total}`);
    this.arrange();
  }

  setProgress(done: number, goal: number): void {
    this.progress.setLabel(`★ ${done}/${goal}`);
    this.arrange();
  }

  setSecondsLeft(seconds: number): void {
    this.timer.setLabel(`のこり ${seconds}びょう`);
    this.arrange();
  }

  layout(area: Rect): void {
    this.area = area;
    this.title.setPosition(area.x, area.y + area.height / 2);
    this.arrange();
  }

  /** Right-aligns the pills; their widths change with the text. */
  private arrange(): void {
    if (!this.area) return;
    const y = this.area.y + this.area.height / 2;
    let right = this.area.x + this.area.width;
    for (const pill of [this.timer, this.progress, this.stage]) {
      pill.setPosition(right - pill.pillWidth / 2, y);
      right -= pill.pillWidth + PILL_GAP;
    }
  }
}
