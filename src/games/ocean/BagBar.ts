import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import { FONT_FAMILY } from '../../core/ui/theme';

const UI = atlasKey('ui');
/** Most bags in a row (the largest stage goal). */
const MAX_BAGS = 12;
const BADGE_FILL = 0x1e5bb8;
const BADGE_EDGE = 0xd6f0ff;
const ROW_FILL = 0xffffff;
const ROW_EDGE = 0x5cb8ef;
const RADIUS = 26;
const GAP = 18;
/** Space inside the row before the first bag and after the last. */
const ROW_PADDING = 16;
/** Share of the bar's width used by the 「あつめたゴミ」 badge. */
const BADGE_SHARE = 0.36;
/** The badge is at most this wide relative to its height. */
const BADGE_ASPECT = 2.7;

const font = (size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT_FAMILY,
  fontStyle: 'bold',
  fontSize: `${size}px`,
  color,
});

/**
 * ①'s bottom bar, as in the client's mockup: the 「あつめたゴミ 3/8こ」 badge with a bag, and a row
 * of bags — one per piece of trash to collect, turning blue as trash is collected.
 */
export class BagBar {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private readonly count: Phaser.GameObjects.Text;
  private readonly goalText: Phaser.GameObjects.Text;
  private readonly bags: Phaser.GameObjects.Image[] = [];
  private done = 0;
  private goal = 1;
  private area?: Rect;
  private badge?: Rect;

  constructor(scene: Phaser.Scene) {
    this.panel = scene.add.graphics();
    this.icon = scene.add.image(0, 0, UI, 'bag-empty');
    this.label = scene.add.text(0, 0, 'あつめたゴミ', font(30, '#ffffff')).setOrigin(0, 0.5);
    this.count = scene.add.text(0, 0, '0', font(64, '#ffd23f')).setOrigin(1, 0.5);
    this.goalText = scene.add.text(0, 0, '/8こ', font(40, '#ffffff')).setOrigin(0, 0.5);
    for (let i = 0; i < MAX_BAGS; i++) this.bags.push(scene.add.image(0, 0, UI, 'bag-empty').setVisible(false));
  }

  layout(area: Rect): void {
    this.area = area;
    this.badge = rect(area.x, area.y, Math.min(area.width * BADGE_SHARE, area.height * BADGE_ASPECT), area.height);
    this.layoutBadge(this.badge);
    this.arrangeBags();
  }

  /** Bag icon on the left; 「あつめたゴミ」 above 「3/8こ」 on the right. */
  private layoutBadge(badge: Rect): void {
    const iconBox = rect(badge.x + 10, badge.y + 10, badge.height - 20, badge.height - 20);
    const iconFit = fitContain(this.icon.frame.width, this.icon.frame.height, iconBox);
    this.icon.setPosition(iconFit.x, iconFit.y).setScale(iconFit.scale);
    const textLeft = badge.x + badge.height - 4;
    const textWidth = badge.x + badge.width - textLeft - 14;
    const middle = textLeft + textWidth / 2;
    const labelScale = Math.min(1, textWidth / this.label.width, (badge.height * 0.3) / this.label.height);
    this.label
      .setOrigin(0.5)
      .setScale(labelScale)
      .setPosition(middle, badge.y + badge.height * 0.28);
    const numbersWidth = this.count.width + this.goalText.width;
    const numberScale = Math.min(1, textWidth / numbersWidth, (badge.height * 0.55) / this.count.height);
    const numbersLeft = middle - (numbersWidth * numberScale) / 2;
    const numbersY = badge.y + badge.height * 0.67;
    this.count.setScale(numberScale).setPosition(numbersLeft + this.count.width * numberScale, numbersY);
    this.goalText.setScale(numberScale).setPosition(numbersLeft + this.count.width * numberScale, numbersY + 4);
    this.badge = badge;
  }

  /** Shows `done` of `goal` pieces of trash collected. */
  setProgress(done: number, goal: number): void {
    if (done === this.done && goal === this.goal) return;
    this.done = done;
    this.goal = Math.min(goal, MAX_BAGS);
    this.count.setText(String(done));
    this.goalText.setText(`/${goal}こ`);
    if (this.badge) this.layoutBadge(this.badge);
    this.arrangeBags();
  }

  /**
   * The row is just as long as the stage's bags (plus a little padding), starting right
   * after the badge; the bags fill it from the left.
   */
  private arrangeBags(): void {
    const area = this.area;
    const badge = this.badge;
    if (!area || !badge) return;
    const rowHeight = area.height * 0.78;
    const left = badge.x + badge.width + GAP;
    const room = area.x + area.width - left - ROW_PADDING * 2;
    const cell = Math.min(rowHeight * 0.9, room / this.goal);
    const row = rect(left, area.y + (area.height - rowHeight) / 2, cell * this.goal + ROW_PADDING * 2, rowHeight);
    this.drawPanels(badge, row);
    this.bags.forEach((bag, i) => {
      bag.setVisible(i < this.goal);
      if (i >= this.goal) return;
      bag.setFrame(i < this.done ? 'bag-full' : 'bag-empty');
      const size = cell * 0.86;
      bag
        .setScale(size / Math.max(bag.frame.width, bag.frame.height))
        .setPosition(row.x + ROW_PADDING + (i + 0.5) * cell, row.y + row.height / 2);
    });
  }

  private drawPanels(badge: Rect, row: Rect): void {
    this.panel
      .clear()
      .fillStyle(BADGE_FILL)
      .fillRoundedRect(badge.x, badge.y, badge.width, badge.height, RADIUS)
      .lineStyle(5, BADGE_EDGE)
      .strokeRoundedRect(badge.x, badge.y, badge.width, badge.height, RADIUS)
      .fillStyle(ROW_FILL)
      .fillRoundedRect(row.x, row.y, row.width, row.height, RADIUS)
      .lineStyle(5, ROW_EDGE)
      .strokeRoundedRect(row.x, row.y, row.width, row.height, RADIUS);
  }
}
