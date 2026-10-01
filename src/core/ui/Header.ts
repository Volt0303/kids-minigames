import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { IconButton } from './IconButton';
import type { Picture } from './picture';
import { RichText, type RichLines } from './RichText';
import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';
import { COLORS, TEXT } from './theme';

export interface HeaderConfig {
  title: string;
  /** Small picture before the title (e.g. a fish). */
  icon?: Picture;
  /** Small picture after the title (e.g. a magnifying glass). */
  badge?: Picture;
  /** Short instruction next to the title; hidden when the screen is too narrow. */
  subtitle: RichLines;
  onClose: () => void;
}

const RADIUS = 36;
const GAP = 24;
const ICON_SIZE = 100;
const CLOSE_RADIUS = 48;

/**
 * Header panel from the mockups: icon, big title, instruction line on the left;
 * stage/time, score and the close (×) button on the right.
 */
export class Header {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly icon?: Phaser.GameObjects.Image;
  private readonly badge?: Phaser.GameObjects.Image;
  private readonly subtitle: RichText;
  private readonly status: StatusBadge;
  private readonly score: ScoreBadge;
  private readonly close: IconButton;

  constructor(scene: Phaser.Scene, config: HeaderConfig) {
    this.panel = scene.add.graphics();
    this.icon = config.icon && scene.add.image(0, 0, config.icon.texture, config.icon.frame);
    this.title = scene.add.text(0, 0, config.title, TEXT.title).setOrigin(0, 0.5);
    this.badge = config.badge && scene.add.image(0, 0, config.badge.texture, config.badge.frame);
    this.subtitle = new RichText(scene, TEXT.subtitle, 'left').setContent(config.subtitle);
    this.status = new StatusBadge(scene, 120);
    this.score = new ScoreBadge(scene, 120);
    this.close = new IconButton(scene, { symbol: '×', radius: CLOSE_RADIUS, color: COLORS.muted }, config.onClose);
  }

  setStage(index: number, total: number): void {
    this.status.setStage(index, total);
  }

  setSecondsLeft(seconds: number): void {
    this.status.setSecondsLeft(seconds);
  }

  setScore(done: number, goal: number): void {
    this.score.setScore(done, goal);
  }

  layout(area: Rect): void {
    this.panel
      .clear()
      .fillStyle(COLORS.panel, 0.94)
      .fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS)
      .lineStyle(6, COLORS.panelBorder)
      .strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    const y = area.y + area.height / 2;
    const leftEnd = this.layoutRight(area, y);
    this.layoutLeft(area.x + GAP, leftEnd - GAP, y);
  }

  /** Places close, score and status from the right edge; returns where the left side must end. */
  private layoutRight(area: Rect, y: number): number {
    let right = area.x + area.width - GAP;
    this.close.setPosition(right - CLOSE_RADIUS, y);
    right -= CLOSE_RADIUS * 2 + GAP;
    this.score.setPosition(right - this.score.width / 2, y);
    right -= this.score.width + GAP;
    this.status.setPosition(right - this.status.width / 2, y);
    return right - this.status.width;
  }

  /** Icon, title, badge and subtitle; the subtitle hides and the title shrinks when space runs out. */
  private layoutLeft(left: number, right: number, y: number): void {
    let x = left;
    if (this.icon) x = this.placePicture(this.icon, x, y);
    const badgeSpace = this.badge ? ICON_SIZE * 0.8 + GAP : 0;
    this.title.setScale(Math.min(1, (right - x - badgeSpace) / this.title.width));
    this.title.setPosition(x, y);
    x += this.title.displayWidth + GAP / 2;
    if (this.badge) x = this.placePicture(this.badge, x, y, 0.8);
    this.subtitle.setVisible(x + GAP + this.subtitle.textWidth <= right).setPosition(x + GAP, y);
  }

  private placePicture(image: Phaser.GameObjects.Image, x: number, y: number, size = 1): number {
    const scale = (ICON_SIZE * size) / Math.max(image.frame.width, image.frame.height);
    image.setScale(scale).setPosition(x + image.displayWidth / 2, y);
    return x + image.displayWidth + GAP / 2;
  }
}
