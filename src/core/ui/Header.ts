import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { IconButton } from './IconButton';
import type { Picture } from './picture';
import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';
import { COLORS, TEXT } from './theme';

export interface HeaderConfig {
  title: string;
  /** The game's title logo; without it the title is shown as text. */
  logo?: Picture;
  /** Small picture before a text title (e.g. a fish). */
  icon?: Picture;
  /** Decoration just after the title (e.g. the turtle in ⑥'s mockup). */
  deco?: Picture;
  clock: Picture;
  star: Picture;
  onClose: () => void;
  /**
   * Share of the room between the title and the badges kept free for the game's own header
   * content (e.g. ④'s note); the title gets the rest. 0 (default) keeps none.
   */
  extraShare?: number;
}

const GAP = 22;
const BADGE_HEIGHT = 148;
const CLOSE_RADIUS = 54;
const ICON_SIZE = 100;
/** Height of the decoration after the title, relative to the header row. */
const DECO_HEIGHT = 0.64;
/** The logo may be a little taller than the header row, as in the mockup. */
const LOGO_HEIGHT = 1.2;
/** Room for the close button's white ring and shadow at the screen edge. */
const EDGE = 14;

/**
 * Header from the mockup, drawn straight on the backdrop (no bar): the title logo on the
 * left; stage/time badge, ★ correct-count badge and the red × close button on the right.
 */
export class Header {
  private readonly title: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private readonly icon?: Phaser.GameObjects.Image;
  private readonly deco?: Phaser.GameObjects.Image;
  private readonly status: StatusBadge;
  private readonly score: ScoreBadge;
  private readonly close: IconButton;
  private readonly extraShare: number;
  /** The room kept for the game's own header content (see HeaderConfig.extraShare). */
  extraArea?: Rect;

  constructor(scene: Phaser.Scene, config: HeaderConfig) {
    const logo = config.logo && scene.textures.exists(config.logo.texture) ? config.logo : undefined;
    if (logo) {
      this.title = scene.add.image(0, 0, logo.texture, logo.frame).setOrigin(0, 0.5);
    } else {
      this.icon = config.icon && scene.add.image(0, 0, config.icon.texture, config.icon.frame);
      this.title = scene.add.text(0, 0, config.title, TEXT.title).setOrigin(0, 0.5);
    }
    this.deco = config.deco && scene.add.image(0, 0, config.deco.texture, config.deco.frame).setOrigin(0, 0.5);
    this.status = new StatusBadge(scene, BADGE_HEIGHT, config.clock);
    this.score = new ScoreBadge(scene, BADGE_HEIGHT, config.star);
    this.extraShare = config.extraShare ?? 0;
    this.close = new IconButton(scene, { symbol: '×', radius: CLOSE_RADIUS, color: COLORS.close }, config.onClose);
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
    const y = area.y + area.height / 2;
    // Right side first, at full size unless the screen is too narrow for it and a title.
    const rightWidth = this.status.badgeWidth + GAP + this.score.badgeWidth + GAP + CLOSE_RADIUS * 2 + EDGE;
    const scale = Math.min(1, (area.width * 0.6) / rightWidth);
    let x = area.x + area.width - EDGE - CLOSE_RADIUS * scale;
    this.close.setScale(scale).setPosition(x, y);
    x -= (CLOSE_RADIUS + GAP + this.score.badgeWidth / 2) * scale;
    this.score.setScale(scale).setPosition(x, y);
    x -= (this.score.badgeWidth / 2 + GAP + this.status.badgeWidth / 2) * scale;
    this.status.setScale(scale).setPosition(x, y);
    const titleRight = x - (this.status.badgeWidth / 2 + GAP) * scale;
    if (this.extraShare > 0) {
      const extraWidth = (titleRight - area.x) * this.extraShare;
      this.extraArea = { x: titleRight - extraWidth, y: area.y, width: extraWidth, height: area.height };
      this.layoutTitle(area, titleRight - extraWidth - GAP, y);
      return;
    }
    this.layoutTitle(area, titleRight, y);
  }

  /** Logo (or icon + text) from the left edge, as large as the space allows, then the decoration. */
  private layoutTitle(area: Rect, right: number, y: number): void {
    let x = area.x;
    if (this.icon) {
      this.icon.setScale(ICON_SIZE / Math.max(this.icon.frame.width, this.icon.frame.height));
      this.icon.setPosition(x + this.icon.displayWidth / 2, y);
      x += this.icon.displayWidth + GAP / 2;
    }
    const decoWidth = this.layoutDeco(area.height);
    const room = right - x - (decoWidth > 0 ? decoWidth + GAP : 0);
    const maxHeight = this.icon ? this.title.height : area.height * LOGO_HEIGHT;
    const scale = Math.min(maxHeight / this.title.height, room / this.title.width);
    this.title.setScale(scale).setPosition(x, y);
    this.deco?.setPosition(x + this.title.displayWidth + GAP, y);
  }

  /** Sizes the decoration to the header row; returns its width (0 without one). */
  private layoutDeco(rowHeight: number): number {
    if (!this.deco) return 0;
    this.deco.setScale((rowHeight * DECO_HEIGHT) / this.deco.frame.height);
    return this.deco.displayWidth;
  }
}
