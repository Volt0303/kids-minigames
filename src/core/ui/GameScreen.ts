import type * as Phaser from 'phaser';
import { loadAtlas, loadBackground } from '../assets/atlas';
import { atlasKey, backgroundKey, type BackgroundName } from '../assets/catalog';
import { gameRegions } from '../logic/gameLayout';
import type { Rect } from '../logic/rect';
import type { Viewport } from '../logic/viewport';
import { Background } from './Background';
import { Banner } from './Banner';
import { Bubbles } from './Bubbles';
import { FooterMessage } from './FooterMessage';
import { Header } from './Header';
import { HowToCard } from './HowToCard';
import type { Picture } from './picture';
import { PraiseBubble, type Praise } from './PraiseBubble';
import { PromptCard } from './PromptCard';
import type { RichLines } from './RichText';

/** The words each game shows around its field. */
export interface GameCopy {
  /** Instruction next to the title (header). */
  subtitle: RichLines;
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
  /** Rising air bubbles over the background (underwater games). */
  bubbles?: boolean;
  /** Picture before the title. */
  icon?: Picture;
  /** Picture after the title; defaults to the magnifying glass. */
  badge?: Picture;
  onClose: () => void;
}

const UI = atlasKey('ui');

/**
 * Everything around a game's play field, laid out like the client's mockups:
 * background, header, 「おだい」 and 「あそびかた」 cards, footer message,
 * praise bubble and the clear banner.
 */
export class GameScreen {
  readonly banner: Banner;
  private readonly background?: Background;
  private readonly bubbles?: Bubbles;
  private readonly header: Header;
  private readonly prompt: PromptCard;
  private readonly howTo: HowToCard;
  private readonly footer: FooterMessage;
  private readonly praise: PraiseBubble;

  /** Queues the shared images; call from the scene's preload. */
  static preload(load: Phaser.Loader.LoaderPlugin, config: GameScreenConfig): void {
    loadAtlas(load, 'ui');
    if (config.background) loadBackground(load, config.background);
  }

  constructor(scene: Phaser.Scene, config: GameScreenConfig) {
    this.background = config.background && new Background(scene, backgroundKey(config.background));
    this.bubbles = config.bubbles ? new Bubbles(scene) : undefined;
    this.header = new Header(scene, {
      title: config.title,
      icon: config.icon,
      badge: config.badge ?? { texture: UI, frame: 'magnifier' },
      subtitle: config.copy.subtitle,
      onClose: config.onClose,
    });
    this.prompt = new PromptCard(scene);
    this.howTo = new HowToCard(scene, config.copy.howTo, { texture: UI, frame: 'hand-tap' });
    this.footer = new FooterMessage(scene, config.copy.footer);
    this.praise = new PraiseBubble(scene, config.copy.praise);
    this.banner = new Banner(scene);
  }

  /** Positions everything; returns the play field for the game's own objects. */
  layout(viewport: Viewport): Rect {
    const regions = gameRegions(viewport);
    this.background?.layout(viewport);
    this.bubbles?.layout(viewport);
    this.header.layout(regions.header);
    this.prompt.layout(regions.prompt);
    this.howTo.layout(regions.howTo);
    this.footer.layout(regions.footer);
    this.praise.layout(regions.field);
    this.banner.layout(regions.field);
    return regions.field;
  }

  setPrompt(lines: RichLines, picture?: Picture): void {
    this.prompt.setPrompt(lines, picture);
  }

  setStage(index: number, total: number): void {
    this.header.setStage(index, total);
  }

  setProgress(done: number, goal: number, secondsLeft: number): void {
    this.header.setScore(done, goal);
    this.header.setSecondsLeft(secondsLeft);
  }

  praiseCorrect(): void {
    this.praise.show();
  }
}
