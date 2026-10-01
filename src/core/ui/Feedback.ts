import type * as Phaser from 'phaser';
import { COLORS } from './theme';

const STAR_TEXTURE = 'fx-star';
const BURST_COUNT = 14;
/** Tilt rather than shift, so it never fights a movement tween on the same object. */
const WOBBLE_DEGREES = 14;

/** Sound keys loaded by GameScene (see public/sfx). */
type Wobbly = Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject;

export const SFX = { correct: 'sfx-correct', wrong: 'sfx-wrong', clear: 'sfx-clear' } as const;

function ensureStarTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(STAR_TEXTURE)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(COLORS.star).fillCircle(24, 24, 24);
  g.fillStyle(0xffffff).fillCircle(24, 24, 11);
  g.generateTexture(STAR_TEXTURE, 48, 48);
  g.destroy();
}

/**
 * Correct / wrong reactions. The particle emitter is created once per scene
 * and reused for every burst, so taps do not allocate new game objects.
 * Wrong answers get a gentle wobble — no red cross, no penalty.
 */
export class Feedback {
  private readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  /**
   * The running wobble per object. Checked with `isActive()` rather than cleared in
   * `onComplete`, because a tween killed early (e.g. by a stage change) never completes.
   */
  private readonly wobbles = new WeakMap<Wobbly, Phaser.Tweens.Tween>();

  constructor(private readonly scene: Phaser.Scene) {
    ensureStarTexture(scene);
    this.emitter = scene.add.particles(0, 0, STAR_TEXTURE, {
      speed: { min: 250, max: 650 },
      scale: { start: 1.2, end: 0 },
      lifespan: 650,
      emitting: false,
    });
    this.emitter.setDepth(90);
  }

  correct(x: number, y: number): void {
    this.emitter.explode(BURST_COUNT, x, y);
    this.play(SFX.correct);
  }

  wrong(target: Wobbly): void {
    this.play(SFX.wrong);
    if (this.wobbles.get(target)?.isActive()) return;
    const wobble = this.scene.tweens.add({
      targets: target,
      angle: { from: -WOBBLE_DEGREES, to: WOBBLE_DEGREES },
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => target.setAngle(0),
    });
    this.wobbles.set(target, wobble);
  }

  clear(): void {
    this.play(SFX.clear);
  }

  private play(key: string): void {
    if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key);
  }
}
