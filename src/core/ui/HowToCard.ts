import type * as Phaser from 'phaser';
import { inset, rect, type Rect } from '../logic/rect';
import { CARD_LABEL_SPACE, drawCard } from './cardShape';
import type { Picture } from './picture';
import { RichText, type RichLines } from './RichText';
import { COLORS, TEXT } from './theme';

const PADDING = 26;
const ICON_SHARE = 0.3;

/** The 「あそびかた」 (how to play) card from the mockups: a pointing hand and a short instruction. */
export class HowToCard {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly text: RichText;

  constructor(scene: Phaser.Scene, lines: RichLines, icon: Picture) {
    this.panel = scene.add.graphics();
    this.label = scene.add.text(0, 0, 'あそびかた', TEXT.cardLabel);
    this.icon = scene.add.image(0, 0, icon.texture, icon.frame);
    this.text = new RichText(scene, TEXT.howToText, 'left').setContent(lines);
  }

  layout(area: Rect): void {
    drawCard(this.panel, this.label, area, {
      fill: COLORS.howToCard,
      border: COLORS.howToBorder,
      label: COLORS.howToLabel,
    });
    const inner = inset(rect(area.x, area.y + CARD_LABEL_SPACE, area.width, area.height - CARD_LABEL_SPACE), PADDING);
    const iconSize = Math.min(inner.width * ICON_SHARE, inner.height);
    const centerY = inner.y + inner.height / 2;
    this.icon
      .setScale(iconSize / Math.max(this.icon.frame.width, this.icon.frame.height))
      .setPosition(inner.x + iconSize / 2, centerY);

    const textLeft = inner.x + iconSize + PADDING / 2;
    const textWidth = inner.x + inner.width - textLeft;
    const scale = Math.min(
      1,
      textWidth / Math.max(1, this.text.textWidth),
      inner.height / Math.max(1, this.text.textHeight),
    );
    this.text.setScale(scale).setPosition(textLeft, centerY);
  }
}
