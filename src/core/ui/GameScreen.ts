import type * as Phaser from 'phaser';
import { loadAtlas, loadBackground, loadGameArt } from '../assets/atlas';
import {
  atlasKey,
  backgroundKey,
  gameArtKey,
  hasGameArt,
  type BackgroundName,
  type GameArtFile,
  type GameArtGame,
} from '../assets/catalog';
import { gameRegions, openRegions, type GameRegions } from '../logic/gameLayout';
import { rect, type Rect } from '../logic/rect';
import type { Viewport } from '../logic/viewport';
import { BACKDROP_DEPTH, Background } from './Background';
import { Banner } from './Banner';
import { Bubbles } from './Bubbles';
import { FIELD_RADIUS, FieldFrame } from './FieldFrame';
import { FieldPicture } from './FieldPicture';
import { Header } from './Header';
import { HeaderPanel } from './HeaderPanel';
import type { Picture } from './picture';
import type { Praise } from './PraiseBubble';
import type { RichLines } from './RichText';
import { SidePanels } from './SidePanels';

/** The words each game shows around its field. */
export interface GameCopy {
  /** 「あそびかた」 card. */
  howTo: RichLines;
  /** Encouraging message under the field. */
  footer: RichLines;
  /** Speech bubble after a correct answer. */
  praise: Praise;
}

export interface GameScreenConfig {
  title: string;
  copy: GameCopy;
  background?: BackgroundName;
  /** The game whose own pictures to use: its backdrop behind everything and its title logo in the header. */
  art?: GameArtGame;
  /** Rising air bubbles over the background (underwater games). */
  bubbles?: boolean;
  /** Picture before the title. */
  icon?: Picture;
  /** Decoration after the title (e.g. ⑥'s turtle). */
  titleDeco?: Picture;
  /** Show the client's guide character (games ①–④ only; standard layout). */
  guide: boolean;
  /**
   * 'standard' (default): field with cards on the right and the message bar below.
   * 'open': only the header; the field fills the rest and the game draws its own cards.
   */
  layout?: 'standard' | 'open';
  onClose: () => void;
}

const UI = atlasKey('ui');

/** The header shows the game's flatter header logo, or else its start-screen logo. */
function headerLogo(art: string | undefined): { game: GameArtGame; file: GameArtFile } | undefined {
  if (hasGameArt(art, 'header-title')) return { game: art, file: 'header-title' };
  if (hasGameArt(art, 'start-title')) return { game: art, file: 'start-title' };
  return undefined;
}
/**
 * Everything around a game's play field. The standard layout follows the client's layout
 * diagram: header (title / progress / ×), the field with its background, bubbles and frame,
 * and the side panels (「お題」 and 「あそびかた」 cards, message bar with the guide). The open
 * layout keeps only the header over a panel: the field fills the rest of the screen on the
 * game's backdrop, and the game draws its own cards there (② お寿司パズル).
 */
export class GameScreen {
  readonly banner: Banner;
  private readonly backdrop?: Background;
  private readonly background?: FieldPicture;
  private readonly frame?: FieldFrame;
  private readonly bubbles?: Bubbles;
  private readonly headerPanel?: HeaderPanel;
  private readonly header: Header;
  private readonly sides?: SidePanels;
  private readonly withGuide: boolean;

  /** Queues the shared images; call from the scene's preload. */
  static preload(load: Phaser.Loader.LoaderPlugin, config: GameScreenConfig): void {
    loadAtlas(load, 'ui');
    loadAtlas(load, 'characters');
    if (config.background) loadBackground(load, config.background);
    if (hasGameArt(config.art, 'backdrop')) loadGameArt(load, config.art, 'backdrop');
    const logo = headerLogo(config.art);
    if (logo) loadGameArt(load, logo.game, logo.file);
  }

  constructor(scene: Phaser.Scene, config: GameScreenConfig) {
    const open = config.layout === 'open';
    this.backdrop = hasGameArt(config.art, 'backdrop')
      ? new Background(scene, gameArtKey(config.art, 'backdrop'), BACKDROP_DEPTH)
      : undefined;
    this.background = config.background && new FieldPicture(scene, backgroundKey(config.background), FIELD_RADIUS);
    this.frame = open ? undefined : new FieldFrame(scene);
    this.bubbles = config.bubbles ? new Bubbles(scene) : undefined;
    this.headerPanel = open ? new HeaderPanel(scene) : undefined;
    const logo = headerLogo(config.art);
    this.header = new Header(scene, {
      title: config.title,
      logo: logo && { texture: gameArtKey(logo.game, logo.file) },
      icon: config.icon,
      deco: config.titleDeco,
      clock: { texture: UI, frame: 'icon-clock' },
      star: { texture: UI, frame: 'icon-star' },
      onClose: config.onClose,
    });
    this.sides = open ? undefined : new SidePanels(scene, { ...config.copy, guide: config.guide });
    this.withGuide = config.guide;
    this.banner = new Banner(scene);
  }

  /** Positions everything; returns the play field for the game's own objects. */
  layout(viewport: Viewport): Rect {
    this.backdrop?.layout(rect(0, 0, viewport.designWidth, viewport.designHeight));
    let regions: Pick<GameRegions, 'header' | 'field'>;
    if (this.sides) {
      const standard = gameRegions(viewport, this.withGuide);
      this.sides.layout(standard);
      regions = standard;
    } else {
      regions = openRegions(viewport);
    }
    this.background?.layout(regions.field);
    this.frame?.layout(regions.field);
    this.bubbles?.layout(regions.field);
    this.headerPanel?.layout(regions.header);
    this.header.layout(regions.header);
    this.banner.layout(regions.field);
    return regions.field;
  }

  setPrompt(lines: RichLines, picture?: Picture): void {
    this.sides?.setPrompt(lines, picture);
  }

  /** The 「お題」 card's picture area, for games that draw their own task there. */
  get promptContentArea(): Rect | undefined {
    return this.sides?.promptContentArea;
  }

  setStage(index: number, total: number): void {
    this.header.setStage(index, total);
  }

  setProgress(done: number, goal: number, secondsLeft: number): void {
    this.header.setScore(done, goal);
    this.header.setSecondsLeft(secondsLeft);
  }

  praiseCorrect(): void {
    this.sides?.praiseCorrect();
  }

  /** Stage or game cleared: the guide shows its 「やったね」 pose while the banner is shown. */
  celebrate(): void {
    this.sides?.celebrate();
  }
}
