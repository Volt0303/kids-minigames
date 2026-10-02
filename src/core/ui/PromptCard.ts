import type * as Phaser from 'phaser';
import { fitContain, inset, rect, type Rect } from '../logic/rect';
import { CARD_LABEL_SPACE, drawCard } from './cardShape';
import type { Picture } from './picture';
import { RichText, type RichLines } from './RichText';
import { COLORS, TEXT } from './theme';

const PADDING = 30;
/** Share of the card's inner height used by the text above the picture. */
const TEXT_SHARE = 0.4;
/** Pictures may be enlarged a little to fill the card, but not so much that they blur. */
const MAX_PICTURE_SCALE = 1.6;
/**
 * Bubble decorations, as in the mockup: lower left and right middle of the card body.
 * x/y are fractions of the card body; size is relative to the body's height.
 */
const BUBBLE_SPOTS = [
  { x: 0.2, y: 0.78, size: 0.2, alpha: 0.55 },
  { x: 0.8, y: 0.54, size: 0.24, alpha: 0.55 },
] as const;

/**
 * The 「お題」 (task) card from the mockups: what to do, with the important word
 * highlighted, and a picture of it. Children who cannot read use the picture.
 */
export class PromptCard {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly caption: RichText;
  private readonly image: Phaser.GameObjects.Image;
  /** Swallows taps on the card so objects moving behind it cannot be tapped through it. */
  private readonly blocker: Phaser.GameObjects.Zone;
  private readonly bubbles: Phaser.GameObjects.Image[];
  private area?: Rect;

  constructor(
    private readonly scene: Phaser.Scene,
    /** Bubble decoration drawn in the card's empty corners. */
    bubble: Picture,
  ) {
    this.panel = scene.add.graphics();
    this.label = scene.add.text(0, 0, 'お題', TEXT.cardLabel);
    this.bubbles = BUBBLE_SPOTS.map((spot) => scene.add.image(0, 0, bubble.texture, bubble.frame).setAlpha(spot.alpha));
    this.caption = new RichText(scene, TEXT.cardText);
    this.image = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.blocker = scene.add.zone(0, 0, 1, 1).setOrigin(0).setInteractive();
  }

  /** Shows the task text and a picture; pass no picture for text only. */
  setPrompt(lines: RichLines, picture?: Picture): void {
    this.caption.setContent(lines);
    if (picture && this.scene.textures.exists(picture.texture)) {
      this.image.setTexture(picture.texture, picture.frame).setVisible(true);
    } else {
      this.image.setVisible(false);
    }
    this.arrange();
  }

  layout(area: Rect): void {
    this.area = area;
    drawCard(this.panel, this.label, area, {
      fill: COLORS.promptCard,
      border: COLORS.promptBorder,
      label: COLORS.promptLabel,
    });
    this.blocker.setPosition(area.x, area.y).setSize(area.width, area.height);
    this.arrange();
  }

  private arrange(): void {
    if (!this.area) return;
    const body = rect(
      this.area.x,
      this.area.y + CARD_LABEL_SPACE,
      this.area.width,
      this.area.height - CARD_LABEL_SPACE,
    );
    BUBBLE_SPOTS.forEach((spot, i) => {
      const image = this.bubbles[i];
      if (!image) return;
      const size = body.height * spot.size;
      image
        .setScale(size / Math.max(image.frame.width, image.frame.height))
        .setPosition(body.x + body.width * spot.x, body.y + body.height * spot.y);
    });
    const inner = inset(body, PADDING);
    const textHeight = inner.height * TEXT_SHARE;
    const textScale = Math.min(
      1,
      inner.width / Math.max(1, this.caption.textWidth),
      textHeight / Math.max(1, this.caption.textHeight),
    );
    this.caption.setScale(textScale).setPosition(inner.x + inner.width / 2, inner.y + textHeight / 2);

    const imageArea = rect(inner.x, inner.y + textHeight, inner.width, inner.height - textHeight);
    const fit = fitContain(this.image.frame.width, this.image.frame.height, imageArea);
    this.image.setPosition(fit.x, fit.y).setScale(Math.min(fit.scale, MAX_PICTURE_SCALE));
  }
}
