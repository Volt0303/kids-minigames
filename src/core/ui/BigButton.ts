import * as Phaser from 'phaser';
import { FONT_FAMILY } from './theme';

export interface BigButtonStyle {
  label: string;
  /** Short symbol shown before the label (e.g. ▶ or ×) so non-readers recognise it. */
  icon?: string;
  width: number;
  height: number;
  color: number;
  fontSize?: number;
}

const PRESSED_SCALE = 0.94;

/**
 * Large rounded button for small children: generous hit area, visible press
 * feedback, and it only fires when the finger is lifted on the button.
 */
export class BigButton extends Phaser.GameObjects.Container {
  private pressed = false;

  constructor(scene: Phaser.Scene, style: BigButtonStyle, onTap: () => void) {
    super(scene, 0, 0);
    const { width, height, color } = style;
    const radius = height / 2;

    const shape = scene.add.graphics();
    shape.fillStyle(0x000000, 0.18).fillRoundedRect(-width / 2, -height / 2 + 10, width, height, radius);
    shape.fillStyle(color).fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    shape.lineStyle(8, 0xffffff).strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

    const text = scene.add
      .text(0, 0, style.icon ? `${style.icon} ${style.label}` : style.label, {
        fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
        fontSize: `${style.fontSize ?? Math.round(height * 0.42)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add([shape, text]).setSize(width, height);
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

  private setPressed(pressed: boolean): void {
    this.pressed = pressed;
    this.setScale(pressed ? PRESSED_SCALE : 1);
  }
}
