import type * as Phaser from 'phaser';

/** Anything the hint can point at: a picture that can be scaled. */
export type HintTarget = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Transform & { displayWidth: number; displayHeight: number; visible: boolean };

const SHOW_MS = 3_000;
const PULSE_MS = 320;
/** How much bigger the target gets at the top of each pulse. */
const PULSE_SCALE = 1.35;

/**
 * Hint for a stuck child: the correct object grows and shrinks a few times, then
 * goes back to its normal size. One per scene, reused for every hint.
 */
export class HintMarker {
  private target?: HintTarget;
  private baseScaleX = 1;
  private baseScaleY = 1;
  private pulse?: Phaser.Tweens.Tween;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {}

  pointAt(target: HintTarget): void {
    this.hide();
    this.target = target;
    this.baseScaleX = target.scaleX;
    this.baseScaleY = target.scaleY;
    this.pulse = this.scene.tweens.add({
      targets: target,
      scaleX: target.scaleX * PULSE_SCALE,
      scaleY: target.scaleY * PULSE_SCALE,
      duration: PULSE_MS,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.hideTimer = this.scene.time.delayedCall(SHOW_MS, () => this.hide());
  }

  /** Stops the pulse and puts the target back to its normal size. */
  hide(): void {
    const target = this.target;
    const pulse = this.pulse;
    this.hideTimer?.remove();
    this.hideTimer = undefined;
    this.pulse = undefined;
    this.target = undefined;
    if (!target || !pulse) return;
    // If the game already reset the object (its tweens killed for a new stage), its size is no longer ours to restore.
    const ours = !pulse.isDestroyed();
    pulse.remove();
    if (ours && target.active) target.setScale(this.baseScaleX, this.baseScaleY);
  }
}
