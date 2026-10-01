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
  private idle?: Phaser.Tweens.Tween;
  private baseY = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    picture: Picture,
    /** Height of the gentle up-and-down movement while idle. */
    private readonly bob: number,
  ) {
    this.image = scene.add.image(0, 0, picture.texture, picture.frame).setOrigin(0.5, 1);
  }

  layout(area: Rect): void {
    const fit = fitContain(this.image.frame.width, this.image.frame.height, area);
    this.baseY = area.y + area.height;
    this.image.setScale(fit.scale).setPosition(fit.x, this.baseY);
    this.startIdle();
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
