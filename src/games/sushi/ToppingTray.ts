import type * as Phaser from 'phaser';
import type { SushiKind } from '../../core/assets/sushi';
import type { Rect } from '../../core/logic/rect';
import { FONT_FAMILY } from '../../core/ui/theme';
import { SLOT_COUNT, slotRects, usedSlots } from './logic/layout';
import { ToppingCard, type CardEvents } from './ToppingCard';

const WOOD = 0xf0b45a;
const WOOD_EDGE = 0xb9772f;
const SLOT_FILL = 0xfdf3e1;
const SLOT_EDGE = 0xe2c08f;
/** 「ネタをえらぼう」 pill from the mockup: dark blue with a light edge, half above the tray's top edge. */
const LABEL_FILL = 0x1e5bb8;
const LABEL_EDGE = 0x8cc8f5;
const LABEL_HEIGHT = 64;
const RADIUS = 26;
const SLOT_RADIUS = 18;

/**
 * The 「ネタをえらぼう」 tray from the design: a wooden panel with six cream slots. A stage's
 * toppings fill the middle slots; the rest stay empty.
 */
export class ToppingTray {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  /** The label's pill, drawn over the tray's edge. */
  private readonly badge: Phaser.GameObjects.Graphics;
  private readonly cards: ToppingCard[] = [];
  private kinds: readonly SushiKind[] = [];
  private slots: Rect[] = [];

  constructor(scene: Phaser.Scene, events: CardEvents) {
    this.panel = scene.add.graphics();
    this.badge = scene.add.graphics().setDepth(1);
    this.label = scene.add
      .text(0, 0, 'ネタを えらぼう', { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '38px', color: '#ffffff' })
      .setOrigin(0.5);
    for (let i = 0; i < SLOT_COUNT; i++) this.cards.push(new ToppingCard(scene, events));
  }

  layout(area: Rect): void {
    this.slots = slotRects(area);
    this.panel
      .clear()
      .fillStyle(WOOD)
      .fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS)
      .lineStyle(6, WOOD_EDGE)
      .strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    for (const slot of this.slots) {
      this.panel
        .fillStyle(SLOT_FILL)
        .fillRoundedRect(slot.x, slot.y, slot.width, slot.height, SLOT_RADIUS)
        .lineStyle(4, SLOT_EDGE)
        .strokeRoundedRect(slot.x, slot.y, slot.width, slot.height, SLOT_RADIUS);
    }
    // Label pill at the top left, sitting on the tray's top edge like the client's mockup.
    const pillWidth = this.label.width + 64;
    const pillHeight = LABEL_HEIGHT;
    const pillX = area.x + 22;
    const pillY = area.y - pillHeight * 0.42;
    this.label.setDepth(1);
    this.badge
      .clear()
      .fillStyle(LABEL_FILL)
      .fillRoundedRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2)
      .lineStyle(5, LABEL_EDGE)
      .strokeRoundedRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    this.label.setPosition(pillX + pillWidth / 2, pillY + pillHeight / 2);
    this.showCards();
  }

  /** Puts these toppings in the middle slots, in this order. */
  setKinds(kinds: readonly SushiKind[]): void {
    this.kinds = kinds.slice(0, SLOT_COUNT);
    this.showCards();
  }

  cardFor(kind: SushiKind): ToppingCard | undefined {
    return this.cards.find((card, i) => i < this.kinds.length && card.kind === kind);
  }

  /** All pictures back in their slots at once. */
  resetPictures(): void {
    this.cards.forEach((card, i) => {
      if (i < this.kinds.length) card.goHome(false);
    });
  }

  private showCards(): void {
    const used = usedSlots(this.kinds.length);
    this.cards.forEach((card, i) => {
      const kind = this.kinds[i];
      const slot = this.slots[used[i] ?? -1];
      if (kind && slot) card.show(kind, slot);
      else card.hide();
    });
  }
}
