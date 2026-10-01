import * as Phaser from 'phaser';
import { drawBadge } from './badgeShape';
import { TEXT } from './theme';

const PADDING_X = 30;

/** Stage and time remaining, stacked in one compact badge (requirements document 6.3). */
export class StatusBadge extends Phaser.GameObjects.Container {
  private readonly stage: Phaser.GameObjects.Text;
  private readonly time: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, height: number) {
    super(scene, 0, 0);
    const background = scene.add.graphics();
    this.stage = scene.add.text(0, -height * 0.22, '', TEXT.badgeLabel).setOrigin(0.5);
    this.time = scene.add.text(0, height * 0.2, '', TEXT.badgeValue).setOrigin(0.5);
    // Sized for the longest texts so the badge never changes width.
    const width = Math.max(
      this.measure('ステージ 3/3', TEXT.badgeLabel),
      this.measure('のこり 60びょう', TEXT.badgeValue),
    );
    drawBadge(background, width + PADDING_X * 2, height);
    this.add([background, this.stage, this.time]).setSize(width + PADDING_X * 2, height);
    scene.add.existing(this);
  }

  setStage(index: number, total: number): void {
    const label = `ステージ ${index + 1}/${total}`;
    if (this.stage.text !== label) this.stage.setText(label);
  }

  setSecondsLeft(seconds: number): void {
    const label = `のこり ${seconds}びょう`;
    if (this.time.text !== label) this.time.setText(label);
  }

  private measure(text: string, style: Phaser.Types.GameObjects.Text.TextStyle): number {
    const probe = this.scene.make.text({ text, style }, false);
    const width = probe.width;
    probe.destroy();
    return width;
  }
}
