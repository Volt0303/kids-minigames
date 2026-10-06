import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { FONT_FAMILY } from '../../core/ui/theme';

const UI = atlasKey('ui');
const RADIUS = 70;
const COLOR = 0xf5a623;
const PRESSED_SCALE = 0.9;

const containsPoint = (circle: Phaser.Geom.Circle, x: number, y: number): boolean => circle.contains(x, y);

/**
 * The round 「ヒント」 button by the board (requirements: ④'s hint shows the finished picture).
 * A magnifier with the word under it; fires when the finger is lifted on it.
 */
export class HintButton extends Phaser.GameObjects.Container {
  private pressed = false;

  constructor(scene: Phaser.Scene, onTap: () => void) {
    super(scene, 0, 0);
    const circle = scene.add.graphics();
    circle.fillStyle(0x000000, 0.18).fillCircle(0, 6, RADIUS);
    circle.fillStyle(COLOR).fillCircle(0, 0, RADIUS);
    circle.lineStyle(6, 0xffffff).strokeCircle(0, 0, RADIUS);
    const icon = scene.add.image(0, -14, UI, 'icon-magnifier');
    icon.setScale((RADIUS * 1.05) / Math.max(icon.frame.width, icon.frame.height));
    const label = scene.add
      .text(0, RADIUS * 0.52, 'ヒント', {
        fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add([circle, icon, label])
      .setSize(RADIUS * 2, RADIUS * 2)
      .setDepth(45);
    this.setInteractive(new Phaser.Geom.Circle(RADIUS, RADIUS, RADIUS * 1.1), containsPoint);
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
