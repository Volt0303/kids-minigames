import * as Phaser from 'phaser';
import type { Picture } from './picture';

export interface ImageButtonStyle {
  picture: Picture;
  /** Displayed width (design units). */
  width: number;
  /** The round button inside the picture, as fractions of the picture (rays around it are not tappable). */
  disc: { x: number; y: number; radius: number };
}

const PRESSED_SCALE = 0.92;
/** The tap circle is a little larger than the drawn button, for small fingers. */
const TAP_MARGIN = 1.15;

const containsPoint = (circle: Phaser.Geom.Circle, x: number, y: number): boolean => circle.contains(x, y);

/**
 * Button drawn as a picture (start screen あそぶ / やめる). Only its round part is tappable,
 * it shrinks while pressed, and it fires when the finger is lifted on it.
 */
export class ImageButton extends Phaser.GameObjects.Image {
  private pressed = false;
  private baseScale = 1;

  constructor(scene: Phaser.Scene, style: ImageButtonStyle, onTap: () => void) {
    super(scene, 0, 0, style.picture.texture, style.picture.frame);
    this.baseScale = style.width / this.frame.width;
    this.setScale(this.baseScale);
    const { disc } = style;
    const circle = new Phaser.Geom.Circle(
      disc.x * this.frame.width,
      disc.y * this.frame.height,
      disc.radius * this.frame.width * TAP_MARGIN,
    );
    this.setInteractive({ hitArea: circle, hitAreaCallback: containsPoint, useHandCursor: true });
    this.on('pointerdown', () => this.setPressed(true));
    this.on('pointerout', () => this.setPressed(false));
    this.on('pointerup', () => {
      if (!this.pressed) return;
      this.setPressed(false);
      onTap();
    });
    scene.add.existing(this);
  }

  private setPressed(pressed: boolean): void {
    this.pressed = pressed;
    this.setScale(this.baseScale * (pressed ? PRESSED_SCALE : 1));
  }
}
