import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import type { Rect } from '../../core/logic/rect';
import { RichText, type RichLines } from '../../core/ui/RichText';
import { POP_FONT_FAMILY } from '../../core/ui/theme';

/** The cloud's rounded ends (never stretched), as a share of its width. */
const CAP = 0.2;

/**
 * The guide's speech bubble in おさかなパズル (「ピースを ドラッグして、ただしい ばしょに おこう!」),
 * drawn as the cloud bubble next to the guide. `say` changes the words for a moment.
 */
export class SpeechBubble {
  private readonly cloud: Phaser.GameObjects.NineSlice;
  private readonly text: RichText;
  private area?: Rect;
  private timer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly lines: RichLines,
  ) {
    this.cloud = scene.add.nineslice(0, 0, atlasKey('ui'), 'bubble-cloud').setOrigin(0);
    const { width, height } = this.cloud.frame;
    this.cloud.setSlices(width, height, width * CAP, width * CAP, 0, 0);
    this.text = new RichText(scene, {
      fontFamily: POP_FONT_FAMILY,
      fontStyle: '800',
      fontSize: '46px',
      color: '#3a2412',
    });
    this.text.setContent(lines);
  }

  layout(area: Rect): void {
    this.area = area;
    this.draw();
  }

  /** Says something else for `ms`, then the usual words again. */
  say(lines: RichLines, ms: number): void {
    this.timer?.remove();
    this.text.setContent(lines);
    this.draw();
    this.timer = this.scene.time.delayedCall(ms, () => {
      this.text.setContent(this.lines);
      this.draw();
    });
  }

  private draw(): void {
    const area = this.area;
    if (!area) return;
    // The cloud picture (the user's art), stretched in the middle only so its ends stay round.
    const frame = this.cloud.frame;
    const scale = area.height / frame.height;
    this.cloud
      .setSize(area.width / scale, frame.height)
      .setScale(scale)
      .setPosition(area.x, area.y);
    const inner = { width: area.width - area.height * 0.7, height: area.height * 0.62 };
    const textScale = Math.min(
      1,
      inner.width / Math.max(1, this.text.textWidth),
      inner.height / Math.max(1, this.text.textHeight),
    );
    this.text.setScale(textScale).setPosition(area.x + area.width / 2, area.y + area.height * 0.52);
  }
}
