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
/** While the mouse is over it, the button grows and drifts to the right, then floats gently. */
const HOVER_SCALE = 1.12;
const HOVER_SHIFT_X = 28;
const HOVER_FLOAT_Y = 8;
const HOVER_IN_MS = 220;
const HOVER_FLOAT_MS = 700;
const HOVER_OUT_MS = 180;
/** Touch screens have no hover: `startAttention` plays the same grow-and-float on its own. */
const ATTENTION_EVERY_MS = 3_000;
const ATTENTION_HOLD_MS = 350;
/** The tap circle is a little larger than the drawn button, for small fingers. */
const TAP_MARGIN = 1.15;

const containsPoint = (circle: Phaser.Geom.Circle, x: number, y: number): boolean => circle.contains(x, y);

/**
 * Button drawn as a picture (start screen あそぶ / やめる). Only its round part is tappable.
 * Under the mouse it grows and floats to the right; it shrinks while pressed, and fires when
 * the finger or mouse button is lifted on it. Position it with `place()`, not `setPosition()`,
 * so it knows where to float back to.
 */
export class ImageButton extends Phaser.GameObjects.Image {
  private pressed = false;
  private hovered = false;
  private readonly baseScale: number;
  private restX = 0;
  private restY = 0;

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
    this.on('pointerover', () => this.setHovered(true));
    this.on('pointerout', () => {
      this.pressed = false;
      this.setHovered(false);
    });
    this.on('pointerdown', () => this.setPressed(true));
    this.on('pointerup', () => {
      if (!this.pressed) return;
      this.setPressed(false);
      onTap();
    });
    scene.add.existing(this);
  }

  /**
   * Plays the hover effect by itself every few seconds (grow and float right, then back), so
   * children on a touch screen — which has no hover — are invited to tap it. Skipped while
   * the mouse is over the button or it is pressed.
   */
  startAttention(): this {
    this.scene.time.addEvent({
      delay: ATTENTION_EVERY_MS,
      loop: true,
      callback: () => {
        if (this.hovered || this.pressed) return;
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
          targets: this,
          scale: this.baseScale * HOVER_SCALE,
          x: this.restX + HOVER_SHIFT_X,
          y: this.restY - HOVER_FLOAT_Y,
          duration: HOVER_IN_MS,
          ease: 'Back.easeOut',
          hold: ATTENTION_HOLD_MS,
          yoyo: true,
        });
      },
    });
    return this;
  }

  /** Where the button rests (and floats back to when the mouse leaves). */
  place(x: number, y: number): this {
    this.restX = x;
    this.restY = y;
    this.scene.tweens.killTweensOf(this);
    this.setPosition(x, y).setScale(this.baseScale);
    if (this.hovered) this.setHovered(true);
    return this;
  }

  private setHovered(hovered: boolean): void {
    this.hovered = hovered;
    this.scene.tweens.killTweensOf(this);
    if (!hovered) {
      this.tweenTo({ factor: 1, x: this.restX, y: this.restY }, HOVER_OUT_MS, 'Sine.easeOut');
      return;
    }
    // Grow and drift to the right, then float gently up and down while the mouse stays on it.
    const x = this.restX + HOVER_SHIFT_X;
    this.tweenTo({ factor: HOVER_SCALE, x, y: this.restY }, HOVER_IN_MS, 'Back.easeOut', () =>
      this.scene.tweens.add({
        targets: this,
        y: this.restY - HOVER_FLOAT_Y,
        duration: HOVER_FLOAT_MS,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      }),
    );
  }

  private setPressed(pressed: boolean): void {
    this.pressed = pressed;
    this.scene.tweens.killTweensOf(this);
    if (pressed) this.setScale(this.baseScale * PRESSED_SCALE);
    else this.setHovered(this.hovered);
  }

  private tweenTo(
    to: { factor: number; x: number; y: number },
    duration: number,
    ease: string,
    onComplete?: () => void,
  ): void {
    const { factor, x, y } = to;
    this.scene.tweens.add({ targets: this, scale: this.baseScale * factor, x, y, duration, ease, onComplete });
  }
}
