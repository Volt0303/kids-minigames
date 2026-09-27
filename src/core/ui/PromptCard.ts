import type * as Phaser from 'phaser';
import { fitContain, inset, rect, type Rect } from '../logic/rect';
import { COLORS, TEXT } from './theme';

const RADIUS = 40;
const PADDING = 36;
const HEADING_HEIGHT = 90;
const CAPTION_HEIGHT = 190;

/** A texture, or one frame of an atlas. */
export interface PromptPicture {
  texture: string;
  frame?: string;
}

/**
 * The "お題" (task) panel from the mockups: a picture of what to look for and
 * a short caption. Children who cannot read use the picture.
 */
export class PromptCard {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly heading: Phaser.GameObjects.Text;
  private readonly image: Phaser.GameObjects.Image;
  private readonly caption: Phaser.GameObjects.Text;
  private area?: Rect;

  constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add.graphics();
    this.heading = scene.add.text(0, 0, 'おだい', TEXT.heading).setOrigin(0.5, 0);
    this.image = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this.caption = scene.add.text(0, 0, '', TEXT.caption).setOrigin(0.5);
  }

  /** Shows a picture and caption; pass no picture for text only. */
  setPrompt(caption: string, picture?: PromptPicture): void {
    this.caption.setText(caption);
    if (picture && this.scene.textures.exists(picture.texture)) {
      this.image.setTexture(picture.texture, picture.frame).setVisible(true);
    } else {
      this.image.setVisible(false);
    }
    this.arrange();
  }

  layout(area: Rect): void {
    this.area = area;
    this.panel
      .clear()
      .fillStyle(COLORS.panel, 0.95)
      .fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS)
      .lineStyle(8, COLORS.panelBorder)
      .strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    this.arrange();
  }

  private arrange(): void {
    if (!this.area) return;
    const inner = inset(this.area, PADDING);
    const centerX = inner.x + inner.width / 2;
    this.heading.setPosition(centerX, inner.y);
    this.caption.setWordWrapWidth(inner.width).setPosition(centerX, inner.y + inner.height - CAPTION_HEIGHT / 2);

    const imageArea = rect(
      inner.x,
      inner.y + HEADING_HEIGHT,
      inner.width,
      inner.height - HEADING_HEIGHT - CAPTION_HEIGHT,
    );
    const frame = this.image.frame;
    const fit = fitContain(frame.width, frame.height, imageArea);
    this.image.setPosition(fit.x, fit.y).setScale(fit.scale);
  }
}
