import * as Phaser from 'phaser';
import { COLORS } from './theme';

/** Anything the marker can point at: position plus on-screen size. */
export type HintTarget = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform & { displayWidth: number; displayHeight: number; visible: boolean };

const SHOW_MS = 3_000;
const PULSE_MS = 380;

/**
 * A thick pulsing ring that follows a target so a young child cannot miss it.
 * One per scene, reused for every hint. Following copies a position each
 * frame and allocates nothing.
 */
export class HintMarker {
  private readonly ring: Phaser.GameObjects.Arc;
  private target?: HintTarget;
  private pulse?: Phaser.Tweens.Tween;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.ring = scene.add.circle(0, 0, 100).setStrokeStyle(16, COLORS.star).setVisible(false).setDepth(80);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.follow);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.follow));
  }

  pointAt(target: HintTarget): void {
    this.hide();
    this.target = target;
    this.ring
      .setRadius(Math.max(target.displayWidth, target.displayHeight) * 0.65)
      .setPosition(target.x, target.y)
      .setScale(1)
      .setVisible(true);
    this.pulse = this.scene.tweens.add({ targets: this.ring, scale: 1.25, duration: PULSE_MS, yoyo: true, repeat: -1 });
    this.hideTimer = this.scene.time.delayedCall(SHOW_MS, () => this.hide());
  }

  hide(): void {
    this.pulse?.remove();
    this.hideTimer?.remove();
    this.pulse = undefined;
    this.hideTimer = undefined;
    this.target = undefined;
    this.ring.setVisible(false);
  }

  private readonly follow = (): void => {
    const target = this.target;
    if (!target) return;
    if (!target.visible || !target.active) {
      this.hide();
      return;
    }
    this.ring.setPosition(target.x, target.y);
  };
}
