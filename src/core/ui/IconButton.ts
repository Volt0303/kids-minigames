import * as Phaser from 'phaser';
import { FONT_FAMILY } from './theme';

export interface IconButtonStyle {
  symbol: string;
  radius: number;
  color: number;
}

const PRESSED_SCALE = 0.9;

/**
 * Small round button with a single symbol (e.g. the × close button).
 * Fires only when the finger is lifted on the button.
 */
export class IconButton extends Phaser.GameObjects.Container {
  private pressed = false;

  constructor(scene: Phaser.Scene, style: IconButtonStyle, onTap: () => void) {
    super(scene, 0, 0);
    const { radius, color } = style;
    const circle = scene.add.graphics();
    circle.fillStyle(0x000000, 0.18).fillCircle(0, 6, radius);
    circle.fillStyle(color).fillCircle(0, 0, radius);
    circle.lineStyle(6, 0xffffff).strokeCircle(0, 0, radius);
    const symbol = scene.add
      .text(0, 0, style.symbol, {
        fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
        fontSize: `${Math.round(radius * 1.2)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add([circle, symbol]).setSize(radius * 2, radius * 2);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.setPressed(true));
    this.on('pointerout', () => this.setPressed(false));
    this.on('pointerup', () => {
      if (!this.pressed) return;
      this.setPressed(false);
      onTap();
    });
    scene.add.existing(this);
  }

  /** Width in design units. */
  get buttonWidth(): number {
    return this.width;
  }

  private setPressed(pressed: boolean): void {
    this.pressed = pressed;
    this.setScale(pressed ? PRESSED_SCALE : 1);
  }
}
