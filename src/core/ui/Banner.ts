import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { TEXT } from './theme';

const SHOW_MS = 1400;

/**
 * Large celebratory message over the play field ("クリア！", "ぜんぶクリア！").
 * One instance per scene; a new message replaces the previous one.
 */
export class Banner {
  private readonly shade: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.shade = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.35).setOrigin(0).setVisible(false).setDepth(100);
    this.text = scene.add.text(0, 0, '', TEXT.banner).setOrigin(0.5).setVisible(false).setDepth(101);
  }

  layout(area: Rect): void {
    this.shade.setPosition(area.x, area.y).setSize(area.width, area.height);
    this.text.setPosition(area.x + area.width / 2, area.y + area.height / 2);
  }

  /** Shows the message, then calls `onDone` once it has been visible long enough. */
  show(message: string, onDone: () => void): void {
    this.timer?.remove();
    this.shade.setVisible(true);
    this.text.setText(message).setVisible(true).setScale(0.3);
    this.scene.tweens.add({ targets: this.text, scale: 1, duration: 350, ease: 'Back.easeOut' });
    this.timer = this.scene.time.delayedCall(SHOW_MS, () => {
      this.hide();
      onDone();
    });
  }

  hide(): void {
    this.shade.setVisible(false);
    this.text.setVisible(false);
  }
}
