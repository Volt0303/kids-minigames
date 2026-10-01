import type * as Phaser from 'phaser';
import { BAR_PADDING } from '../logic/gameLayout';
import { headerColumns } from '../logic/headerLayout';
import type { Rect } from '../logic/rect';
import { IconButton } from './IconButton';
import { drawPanel } from './panelShape';
import type { Picture } from './picture';
import { RichText, type RichLines } from './RichText';
import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';
import { COLORS, TEXT } from './theme';

export interface HeaderConfig {
  title: string;
  /** Picture before the title (e.g. a fish). */
  icon?: Picture;
  /** Picture in the how-to area (e.g. a magnifying glass). */
  badge?: Picture;
  /** Short instruction in the how-to area. */
  subtitle: RichLines;
  onClose: () => void;
}

/** Inner padding of each area. */
const PAD = 20;
const GAP = 20;
/** Space between the three areas. */
const AREA_GAP = 16;
const ICON_SIZE = 100;
/** Magnifying glass size relative to the icon. */
const BADGE_SIZE = 0.9;
const BADGE_HEIGHT = 120;
const CLOSE_RADIUS = 48;
/** Keeps contents clear of an area's border. */
const VERTICAL_ROOM = 12;

/**
 * Header bar from the client's layout diagram and sample: one plain panel holding three
 * areas side by side — title (icon + game name), how-to (magnifying glass + instruction)
 * and progress (stage/time, ★ correct count, close ×).
 */
export class Header {
  private readonly panels: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly icon?: Phaser.GameObjects.Image;
  private readonly badge?: Phaser.GameObjects.Image;
  private readonly subtitle: RichText;
  private readonly status: StatusBadge;
  private readonly score: ScoreBadge;
  private readonly close: IconButton;

  constructor(scene: Phaser.Scene, config: HeaderConfig) {
    this.panels = scene.add.graphics();
    this.icon = config.icon && scene.add.image(0, 0, config.icon.texture, config.icon.frame);
    this.title = scene.add.text(0, 0, config.title, TEXT.title).setOrigin(0, 0.5);
    this.badge = config.badge && scene.add.image(0, 0, config.badge.texture, config.badge.frame);
    this.subtitle = new RichText(scene, TEXT.subtitle, 'left').setContent(config.subtitle);
    this.status = new StatusBadge(scene, BADGE_HEIGHT);
    this.score = new ScoreBadge(scene, BADGE_HEIGHT);
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

  layout(bar: Rect): void {
    const columns = headerColumns(bar, BAR_PADDING, AREA_GAP, {
      title: PAD * 2 + (this.icon ? ICON_SIZE + GAP / 2 : 0) + this.title.width,
      howTo: PAD * 2 + (this.badge ? ICON_SIZE * BADGE_SIZE + GAP / 2 : 0) + this.subtitle.textWidth,
      progress: PAD * 2 + this.status.width + GAP + this.score.width + GAP + CLOSE_RADIUS * 2,
    });
    const tallest = Math.max(this.title.height, this.subtitle.textHeight, BADGE_HEIGHT, ICON_SIZE);
    const scale = Math.min(columns.scale, (columns.title.height - VERTICAL_ROOM) / tallest);

    // One plain panel; the three areas are arranged inside it without boxes of their own.
    this.panels.clear();
    drawPanel(this.panels, bar, { fill: COLORS.bar, border: COLORS.barBorder, radius: 36 });

    this.layoutTitle(columns.title, scale);
    this.layoutHowTo(columns.howTo, scale);
    this.layoutProgress(columns.progress, scale);
  }

  /** Icon and game name, from the left of the title area. */
  private layoutTitle(area: Rect, scale: number): void {
    const y = area.y + area.height / 2;
    let x = area.x + PAD * scale;
    if (this.icon) x = this.placePicture(this.icon, x, y, scale);
    this.title.setScale(scale).setPosition(x, y);
  }

  /** Magnifying glass and the instruction, from the left of the how-to area. */
  private layoutHowTo(area: Rect, scale: number): void {
    const y = area.y + area.height / 2;
    let x = area.x + PAD * scale;
    if (this.badge) x = this.placePicture(this.badge, x, y, BADGE_SIZE * scale);
    this.subtitle.setScale(scale).setPosition(x, y);
  }

  /** Stage/time, score and close, at the right end of the progress area (as in the sample). */
  private layoutProgress(area: Rect, scale: number): void {
    const y = area.y + area.height / 2;
    const total = (this.status.width + GAP + this.score.width + GAP + CLOSE_RADIUS * 2) * scale;
    let x = area.x + area.width - PAD * scale - total;
    this.status.setScale(scale).setPosition(x + (this.status.width * scale) / 2, y);
    x += (this.status.width + GAP) * scale;
    this.score.setScale(scale).setPosition(x + (this.score.width * scale) / 2, y);
    x += (this.score.width + GAP) * scale;
    this.close.setScale(scale).setPosition(x + CLOSE_RADIUS * scale, y);
  }

  private placePicture(image: Phaser.GameObjects.Image, x: number, y: number, size: number): number {
    const scale = (ICON_SIZE * size) / Math.max(image.frame.width, image.frame.height);
    image.setScale(scale).setPosition(x + image.displayWidth / 2, y);
    return x + image.displayWidth + (GAP / 2) * size;
  }
}
