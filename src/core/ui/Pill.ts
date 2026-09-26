import * as Phaser from 'phaser';
import { TEXT } from './theme';

const PADDING_X = 36;

/**
 * Rounded label with a coloured background (timer, progress, stage number).
 * Only redraws when its text actually changes.
 */
export class Pill extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private current = '';

  constructor(
    scene: Phaser.Scene,
    private readonly color: number,
    private readonly pillHeight: number,
  ) {
    super(scene, 0, 0);
    this.background = scene.add.graphics();
    this.label = scene.add.text(0, 0, '', TEXT.pill).setOrigin(0.5);
    this.add([this.background, this.label]);
    scene.add.existing(this);
  }

  /** Current width in design units (depends on the text). */
  get pillWidth(): number {
    return this.label.width + PADDING_X * 2;
  }

  setLabel(text: string): this {
    if (text === this.current) return this;
    this.current = text;
    this.label.setText(text);
    const width = this.pillWidth;
    const height = this.pillHeight;
    this.background
      .clear()
      .fillStyle(this.color)
      .fillRoundedRect(-width / 2, -height / 2, width, height, height / 2)
      .lineStyle(6, 0xffffff)
      .strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    return this;
  }
}
