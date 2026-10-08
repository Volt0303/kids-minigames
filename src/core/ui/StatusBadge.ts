import * as Phaser from 'phaser';
import { drawBadge, drawInset } from './badgeShape';
import type { Picture } from './picture';
import { POP_FONT_FAMILY, TEXT } from './theme';

const PADDING_X = 44;
const CLOCK_SIZE = 54;
const GAP = 12;
/** Time taken off (e.g. a hint): red seconds, a floating 「-5びょう」 and a little shake. */
/** The seconds' usual colour (TEXT.badgeNumber). */
const SECONDS_COLOR = TEXT.badgeNumber.color;
/** Above the games' fields; below praise particles (90), banners (100) and the close dialog (200). */
const BADGE_DEPTH = 60;
const LOSS = {
  color: '#ff2a4f',
  /** The 「-5びょう」: its scale (of the big badge digits) and roughly its height at that scale. */
  scale: 1.4,
  size: 92,
  /** It stays this long, then drifts this far down while fading. */
  holdMs: 2_600,
  fadeMs: 800,
  rise: 50,
  shake: 14,
};

/**
 * 「ステージ 1/3」 above 「⏱ のこり 55びょう」 (seconds in big yellow digits), as in the mockup.
 * Texts change only when their value changes (once a second at most). When time is taken
 * off, the seconds flash red and pop, 「-5びょう」 floats out below and the badge shakes.
 */
export class StatusBadge extends Phaser.GameObjects.Container {
  readonly badgeWidth: number;
  private readonly stage: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Image;
  private readonly prefix: Phaser.GameObjects.Text;
  private readonly seconds: Phaser.GameObjects.Text;
  private readonly suffix: Phaser.GameObjects.Text;
  private readonly rowY: number;
  /** The floating 「-5びょう」 (one, reused). */
  private readonly loss: Phaser.GameObjects.Text;
  /** Red glow around the badge while time is taken off. */
  private readonly glow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, height: number, clock: Picture) {
    super(scene, 0, 0);
    this.rowY = height * 0.17;
    this.stage = scene.add.text(0, -height * 0.26, '', TEXT.badgeLabel).setOrigin(0.5);
    this.clock = scene.add.image(0, this.rowY, clock.texture, clock.frame);
    this.clock.setScale(CLOCK_SIZE / Math.max(this.clock.frame.width, this.clock.frame.height));
    this.prefix = scene.add.text(0, this.rowY, 'のこり', TEXT.badgeValue).setOrigin(0, 0.5);
    this.seconds = scene.add.text(0, this.rowY, '60', TEXT.badgeNumber).setOrigin(0, 0.5);
    this.suffix = scene.add.text(0, this.rowY, 'びょう', TEXT.badgeValue).setOrigin(0, 0.5);

    // Sized for the widest row (two-digit seconds) so the badge never changes width.
    this.badgeWidth = this.rowWidth + PADDING_X * 2;
    const background = scene.add.graphics();
    drawBadge(background, this.badgeWidth, height);
    drawInset(background, { x: 0, y: this.rowY, width: this.badgeWidth - PADDING_X, height: height * 0.48 });
    this.loss = scene.add
      .text(0, 0, '', {
        // Own style: letter spacing with a thick outline cuts letters off in Phaser's text.
        fontFamily: POP_FONT_FAMILY,
        fontStyle: '800',
        fontSize: '66px',
        color: LOSS.color,
        stroke: '#ffffff',
        strokeThickness: 12,
        padding: { x: 10, y: 10 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.glow = scene.add.graphics().setVisible(false);
    this.glow
      .fillStyle(0xff2a4f)
      .fillRoundedRect(-this.badgeWidth / 2 - 16, -height / 2 - 16, this.badgeWidth + 32, height + 32, 40);
    this.add([this.glow, background, this.stage, this.clock, this.prefix, this.seconds, this.suffix, this.loss]);
    this.setSize(this.badgeWidth, height);
    // Above the play area, so the 「-5びょう」 popping out below is never covered by the game.
    this.setDepth(BADGE_DEPTH);
    this.arrangeRow();
    scene.add.existing(this);
  }

  setStage(index: number, total: number): void {
    const label = `ステージ ${index + 1}/${total}`;
    if (this.stage.text !== label) this.stage.setText(label);
  }

  setSecondsLeft(seconds: number): void {
    const label = String(seconds);
    if (this.seconds.text === label) return;
    this.seconds.setText(label);
    this.arrangeRow();
  }

  /**
   * Shows that `seconds` were taken off the clock, plainly enough for a child to notice: the
   * badge glows red and shakes, the seconds turn red and pulse, and a big 「-5びょう」 pops out
   * below it, stays a moment and only then drifts away.
   */
  showLoss(seconds: number): void {
    const tweens = this.scene.tweens;
    tweens.killTweensOf([this, this.seconds, this.loss, this.glow]);
    this.flashBadge();
    this.flashSeconds();
    this.popLoss(seconds);
  }

  /** A red glow around the badge, flashing, and a shake (relative, so it ends where it started). */
  private flashBadge(): void {
    this.glow.setAlpha(0).setVisible(true);
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.9,
      duration: 260,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.glow.setVisible(false),
    });
    this.scene.tweens.add({ targets: this, x: `+=${LOSS.shake}`, duration: 45, yoyo: true, repeat: 7 });
  }

  /** The seconds turn red and pulse, then go back to yellow. */
  private flashSeconds(): void {
    this.seconds.setColor(LOSS.color).setScale(1);
    this.scene.tweens.add({
      targets: this.seconds,
      scale: 1.5,
      duration: 220,
      yoyo: true,
      repeat: 6,
      onComplete: () => this.seconds.setColor(SECONDS_COLOR).setScale(1),
    });
  }

  /** 「-5びょう」 pops out big below the badge, wiggles, stays, then drifts down and fades. */
  private popLoss(seconds: number): void {
    const tweens = this.scene.tweens;
    const startY = this.height * 0.5 + LOSS.size * 0.45;
    this.loss
      .setText(`-${seconds}びょう`)
      .setPosition(0, startY)
      .setAlpha(1)
      .setScale(0.4)
      .setAngle(0)
      .setVisible(true);
    tweens.add({ targets: this.loss, scale: LOSS.scale, duration: 320, ease: 'Back.easeOut' });
    tweens.add({ targets: this.loss, angle: { from: -6, to: 6 }, duration: 180, yoyo: true, repeat: 3, delay: 320 });
    tweens.add({
      targets: this.loss,
      y: startY + LOSS.rise,
      alpha: 0,
      delay: LOSS.holdMs,
      duration: LOSS.fadeMs,
      ease: 'Sine.easeIn',
      onComplete: () => this.loss.setVisible(false).setAngle(0),
    });
  }

  private get rowWidth(): number {
    return this.clock.displayWidth + GAP + this.prefix.width + GAP + this.seconds.width + GAP / 2 + this.suffix.width;
  }

  /** Clock, 「のこり」, seconds and 「びょう」, centred in the badge. */
  private arrangeRow(): void {
    let x = -this.rowWidth / 2;
    this.clock.setX(x + this.clock.displayWidth / 2);
    x += this.clock.displayWidth + GAP;
    this.prefix.setX(x);
    x += this.prefix.width + GAP;
    this.seconds.setX(x);
    this.suffix.setX(x + this.seconds.width + GAP / 2);
  }
}
