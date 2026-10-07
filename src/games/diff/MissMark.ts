import * as Phaser from 'phaser';
import { POP_FONT_FAMILY } from '../../core/ui/theme';

const CLOUD = { fill: 0xffffff, edge: 0x8cc8ff, edgeWidth: 6 };
/** The puffs of the cloud: x, y, radius (design units). */
const PUFFS = [
  [-38, 6, 34],
  [0, -14, 44],
  [40, 4, 34],
  [-14, 22, 30],
  [20, 24, 30],
] as const;
const SHOW_MS = 900;
const RISE = 60;

/**
 * A gentle "not here": a small white cloud with a blue ？ that pops up where the child tapped,
 * floats up and fades (no penalty). The container is what the shared wobble shakes.
 */
export class MissMark {
  readonly container: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {
    const cloud = scene.add.graphics();
    // Edge first (bigger circles), then the white puffs over it, so the inside has no seams.
    cloud.fillStyle(CLOUD.edge);
    for (const [x, y, r] of PUFFS) cloud.fillCircle(x, y, r + CLOUD.edgeWidth);
    cloud.fillStyle(CLOUD.fill);
    for (const [x, y, r] of PUFFS) cloud.fillCircle(x, y, r);
    const mark = scene.add
      .text(0, 2, '？', {
        fontFamily: POP_FONT_FAMILY,
        fontStyle: '800',
        fontSize: '64px',
        color: '#3d8fe0',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.container = scene.add.container(0, 0, [cloud, mark]).setDepth(25).setVisible(false);
  }

  show(x: number, y: number): void {
    const c = this.container;
    this.scene.tweens.killTweensOf(c);
    c.setPosition(x, y).setScale(0.3).setAlpha(1).setAngle(0).setVisible(true);
    this.scene.tweens.add({ targets: c, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({
      targets: c,
      y: y - RISE,
      alpha: 0,
      delay: SHOW_MS * 0.45,
      duration: SHOW_MS * 0.55,
      ease: 'Sine.easeIn',
      onComplete: () => c.setVisible(false),
    });
  }
}
