import type * as Phaser from 'phaser';
import { fitContain, type Rect } from '../logic/rect';
import type { Picture } from './picture';

const BOB_MS = 1_400;
const HOP_HEIGHT = 40;

/**
 * A picture standing in a screen region (the guide character, the starfish):
 * fitted to the region, bottom-aligned, with a slow idle movement and a hop for
 * correct answers. The idle tween runs forever; layout restarts it in place.
 * No rotation: in Phaser 4.2 a rotated image with a bottom origin loses part of the picture.
 */
export class Character {
  private readonly image: Phaser.GameObjects.Image;
  private readonly restFrame?: string;
  private idle?: Phaser.Tweens.Tween;
  private poseTimer?: Phaser.Time.TimerEvent;
  private area?: Rect;
  private baseY = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    picture: Picture,
    /** Height of the gentle up-and-down movement while idle. */
    private readonly bob: number,
  ) {
    this.image = scene.add.image(0, 0, picture.texture, picture.frame).setOrigin(0.5, 1);
    this.restFrame = picture.frame;
  }

  layout(area: Rect): void {
    this.area = area;
    this.fit();
    this.startIdle();
  }

  /**
   * Where a point of a pose ends up on screen, as fractions of that pose's picture
   * (0,0 = top-left, 1,1 = bottom-right), standing at rest in its area.
   */
  pointOf(frame: string, fx: number, fy: number): { x: number; y: number } | undefined {
    const area = this.area;
    if (!area || !this.image.texture.has(frame)) return undefined;
    const source = this.image.texture.get(frame);
    const fit = fitContain(source.width, source.height, area);
    const width = source.width * fit.scale;
    const height = source.height * fit.scale;
    return { x: fit.x - width / 2 + fx * width, y: area.y + area.height - height + fy * height };
  }

  /** Shows another pose (frame of the same texture) for a while, then the normal one again. */
  showPose(frame: string, durationMs: number): void {
    this.poseTimer?.remove();
    this.setFrame(frame);
    this.poseTimer = this.scene.time.delayedCall(durationMs, () => this.setFrame(this.restFrame));
  }

  /** Jumps once (correct answer), then goes back to the idle movement. */
  hop(): void {
    this.idle?.remove();
    this.image.setY(this.baseY);
    this.scene.tweens.add({
      targets: this.image,
      y: this.baseY - HOP_HEIGHT,
      duration: 160,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => this.startIdle(),
    });
  }

  private setFrame(frame: string | undefined): void {
    if (frame === undefined || !this.image.texture.has(frame)) return;
    this.image.setFrame(frame);
    this.fit();
  }

  /** Fits the current frame into the area, standing on its bottom edge. */
  private fit(): void {
    const area = this.area;
    if (!area) return;
    const fit = fitContain(this.image.frame.width, this.image.frame.height, area);
    this.baseY = area.y + area.height;
    this.image.setScale(fit.scale).setX(fit.x);
    if (!this.idle?.isPlaying()) this.image.setY(this.baseY);
  }

  private startIdle(): void {
    this.idle?.remove();
    this.idle = this.scene.tweens.add({
      targets: this.image,
      y: this.baseY - this.bob,
      duration: BOB_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
