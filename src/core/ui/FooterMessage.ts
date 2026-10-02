import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import type { Picture } from './picture';
import { RichText, type RichLines } from './RichText';
import { TEXT } from './theme';

/** Parts of the panel picture that must not stretch (its bubble ends), as fractions of its width. */
const LEFT_CAP = 0.17;
const RIGHT_CAP = 0.15;
/** Text starts this far in from the panel's left edge, relative to the panel's height. */
const TEXT_LEFT = 0.66;
/** Space after the text for the right-hand bubbles, relative to the panel's height. */
const TEXT_RIGHT = 0.85;
/** Text height relative to the panel's height (leaves room for the panel's rim). */
const TEXT_SHARE = 0.62;

/**
 * Encouraging message (e.g. 「おさかなはかせを めざそう!」) in the bubble panel next to the
 * starfish, as in the client's mockup. The panel picture is a nine-slice: only its middle
 * stretches with the text, so the bubbles at both ends keep their shape.
 */
export class FooterMessage {
  private readonly panel: Phaser.GameObjects.NineSlice;
  private readonly text: RichText;

  constructor(scene: Phaser.Scene, lines: RichLines, panel: Picture) {
    this.panel = scene.add.nineslice(0, 0, panel.texture, panel.frame).setOrigin(0, 0.5);
    const frame = this.panel.frame;
    this.panel.setSlices(frame.width, frame.height, frame.width * LEFT_CAP, frame.width * RIGHT_CAP, 0, 0);
    this.text = new RichText(scene, TEXT.footer, 'left').setContent(lines);
  }

  layout(area: Rect): void {
    const height = area.height;
    const textScale = Math.min(
      (height * TEXT_SHARE) / Math.max(1, this.text.textHeight),
      (area.width - height * (TEXT_LEFT + TEXT_RIGHT)) / Math.max(1, this.text.textWidth),
    );
    const width = Math.min(area.width, this.text.textWidth * textScale + height * (TEXT_LEFT + TEXT_RIGHT));

    // Built at the picture's own height and scaled as a whole, so the ends are never squashed.
    const scale = height / this.panel.frame.height;
    const y = area.y + height / 2;
    this.panel
      .setSize(width / scale, this.panel.frame.height)
      .setScale(scale)
      .setPosition(area.x, y);
    this.text.setScale(textScale).setPosition(area.x + height * TEXT_LEFT, y);
  }
}
