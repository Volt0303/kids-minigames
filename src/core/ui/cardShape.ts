import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';

export interface CardColors {
  fill: number;
  border: number;
  label: number;
}

const RADIUS = 36;
const LABEL_HEIGHT = 64;
const LABEL_PADDING_X = 34;

/** Space the label tab takes at the top of the card. */
export const CARD_LABEL_SPACE = LABEL_HEIGHT / 2 + 12;

/**
 * Draws a card with a coloured label tab centred on its top edge (「おだい」, 「あそびかた」),
 * as in the mockups. `label` is the tab's text object; it is moved onto the tab.
 */
export function drawCard(
  graphics: Phaser.GameObjects.Graphics,
  label: Phaser.GameObjects.Text,
  area: Rect,
  colors: CardColors,
): void {
  const top = area.y + LABEL_HEIGHT / 2;
  const height = area.height - LABEL_HEIGHT / 2;
  const tabWidth = label.width + LABEL_PADDING_X * 2;
  const centerX = area.x + area.width / 2;
  graphics
    .clear()
    .fillStyle(colors.fill)
    .fillRoundedRect(area.x, top, area.width, height, RADIUS)
    .lineStyle(8, colors.border)
    .strokeRoundedRect(area.x, top, area.width, height, RADIUS)
    .fillStyle(colors.label)
    .fillRoundedRect(centerX - tabWidth / 2, area.y, tabWidth, LABEL_HEIGHT, LABEL_HEIGHT / 2);
  label.setOrigin(0.5).setPosition(centerX, area.y + LABEL_HEIGHT / 2);
}
