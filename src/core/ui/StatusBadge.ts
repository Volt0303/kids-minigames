import * as Phaser from 'phaser';
import { drawBadge, drawInset } from './badgeShape';
import type { Picture } from './picture';
import { TEXT } from './theme';

const PADDING_X = 44;
const CLOCK_SIZE = 54;
const GAP = 12;

/**
 * 「ステージ 1/3」 above 「⏱ のこり 55びょう」 (seconds in big yellow digits), as in the mockup.
 * Texts change only when their value changes (once a second at most).
 */
export class StatusBadge extends Phaser.GameObjects.Container {
  readonly badgeWidth: number;
  private readonly stage: Phaser.GameObjects.Text;
  private readonly clock: Phaser.GameObjects.Image;
  private readonly prefix: Phaser.GameObjects.Text;
  private readonly seconds: Phaser.GameObjects.Text;
  private readonly suffix: Phaser.GameObjects.Text;
  private readonly rowY: number;

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
    this.add([background, this.stage, this.clock, this.prefix, this.seconds, this.suffix]);
    this.setSize(this.badgeWidth, height);
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
