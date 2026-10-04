import type * as Phaser from 'phaser';
import type { SushiKind } from '../../core/assets/sushi';
import type { Rect } from '../../core/logic/rect';
import { FONT_FAMILY } from '../../core/ui/theme';
import { cardRects, TRAY_LABEL_SPACE } from './logic/layout';
import { ToppingCard, type CardEvents } from './ToppingCard';

/** Most toppings in a stage (stage 3). */
const MAX_CARDS = 8;
const TRAY_FILL = 0xf3d9a4;
const TRAY_EDGE = 0xc99a5b;
const LABEL_FILL = 0xd9822b;
const RADIUS = 26;

/** The 「ネタをえらぼう」 tray from the mockup: a wooden panel holding the topping cards. */
export class ToppingTray {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly cards: ToppingCard[] = [];
  private kinds: readonly SushiKind[] = [];
  private area?: Rect;

  constructor(scene: Phaser.Scene, events: CardEvents) {
    this.panel = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, 'ネタを えらぼう', { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5);
    for (let i = 0; i < MAX_CARDS; i++) this.cards.push(new ToppingCard(scene, events));
  }

  layout(area: Rect): void {
    this.area = area;
    this.panel
      .clear()
      .fillStyle(TRAY_FILL)
      .fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS)
      .lineStyle(5, TRAY_EDGE)
      .strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    // Label pill at the top left, like the mockup.
    const pillWidth = this.label.width + 48;
    const pillHeight = TRAY_LABEL_SPACE - 6;
    const pillX = area.x + 24;
    const pillY = area.y + 6;
    this.panel.fillStyle(LABEL_FILL).fillRoundedRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    this.label.setPosition(pillX + pillWidth / 2, pillY + pillHeight / 2);
    this.showCards();
  }

  /** Puts these toppings on the cards, in this order. */
  setKinds(kinds: readonly SushiKind[]): void {
    this.kinds = kinds;
    this.showCards();
  }

  cardFor(kind: SushiKind): ToppingCard | undefined {
    return this.cards.find((card, i) => i < this.kinds.length && card.kind === kind);
  }

  /** All cards' pictures back on their cards at once. */
  resetPictures(): void {
    this.cards.forEach((card, i) => {
      if (i < this.kinds.length) card.goHome(false);
    });
  }

  private showCards(): void {
    if (!this.area) return;
    const rects = cardRects(this.area, Math.max(1, this.kinds.length));
    this.cards.forEach((card, i) => {
      const kind = this.kinds[i];
      const area = rects[i];
      if (kind && area) card.show(kind, area);
      else card.hide();
    });
  }
}
