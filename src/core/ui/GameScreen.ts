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
import { gameRegions } from '../logic/gameLayout';
import { fitContain, rect, type Rect } from '../logic/rect';
import type { Viewport } from '../logic/viewport';
import { BACKDROP_DEPTH, Background } from './Background';
import { Banner } from './Banner';
import { Bubbles } from './Bubbles';
import { Character } from './Character';
import { FIELD_RADIUS, FieldFrame } from './FieldFrame';
import { FieldPicture } from './FieldPicture';
import { FooterMessage } from './FooterMessage';
import { Header } from './Header';
import { HowToCard } from './HowToCard';
import type { Picture } from './picture';
import { PraiseBubble, type Praise } from './PraiseBubble';
import { PromptCard } from './PromptCard';
import type { RichLines } from './RichText';

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
  /** Show the client's guide character (games ①–④ only). */
  guide: boolean;
  onClose: () => void;
}

const UI = atlasKey('ui');

/** The header shows the game's flatter header logo, or else its start-screen logo. */
function headerLogo(art: string | undefined): { game: GameArtGame; file: GameArtFile } | undefined {
  if (hasGameArt(art, 'header-title')) return { game: art, file: 'header-title' };
  if (hasGameArt(art, 'start-title')) return { game: art, file: 'start-title' };
  return undefined;
}
const CHARACTERS = atlasKey('characters');
/** How long the guide keeps its 「やったね」 pose after a correct answer / a cleared stage. */
const HAPPY_POSE_MS = 1_300;
const CELEBRATE_POSE_MS = 2_200;
/** Just left of げんきくん's mouth in the 「やったね」 pose, as fractions of the picture. */
const MOUTH = { x: 0.12, y: 0.36 } as const;

/**
 * Everything around a game's play field, laid out like the client's layout diagram:
 * header bar (title / how-to / progress areas), the field with its background,
 * bubbles and frame, the 「お題」 and 「あそびかた」 cards, and the message bar
 * (starfish, message in its own box, praise bubble, guide character), plus the clear banner.
 */
export class GameScreen {
  readonly banner: Banner;
  private readonly backdrop?: Background;
  private readonly background?: FieldPicture;
  private readonly frame: FieldFrame;
  private readonly bubbles?: Bubbles;
  private readonly header: Header;
  private readonly prompt: PromptCard;
  private readonly howTo: HowToCard;
  private readonly deco: Phaser.GameObjects.Image;
  private readonly footer: FooterMessage;
  private readonly mascot: Character;
  private readonly guide?: Character;
  private readonly praise: PraiseBubble;
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
    this.backdrop = hasGameArt(config.art, 'backdrop')
      ? new Background(scene, gameArtKey(config.art, 'backdrop'), BACKDROP_DEPTH)
      : undefined;
    this.background = config.background && new FieldPicture(scene, backgroundKey(config.background), FIELD_RADIUS);
    this.frame = new FieldFrame(scene);
    this.bubbles = config.bubbles ? new Bubbles(scene) : undefined;
    const logo = headerLogo(config.art);
    this.header = new Header(scene, {
      title: config.title,
      logo: logo && { texture: gameArtKey(logo.game, logo.file) },
      icon: config.icon,
      clock: { texture: UI, frame: 'icon-clock' },
      star: { texture: UI, frame: 'icon-star' },
      onClose: config.onClose,
    });
    this.prompt = new PromptCard(scene, { texture: UI, frame: 'deco-bubbles' });
    this.howTo = new HowToCard(scene, config.copy.howTo, { texture: UI, frame: 'icon-hand-tap' });
    this.deco = scene.add.image(0, 0, UI, 'deco-bubbles');
    this.footer = new FooterMessage(scene, config.copy.footer, { texture: UI, frame: 'panel-message' });
    this.mascot = new Character(scene, { texture: CHARACTERS, frame: 'starfish' }, 8);
    this.guide = config.guide ? new Character(scene, { texture: CHARACTERS, frame: 'guide' }, 10) : undefined;
    this.praise = new PraiseBubble(scene, config.copy.praise, config.guide);
    this.withGuide = config.guide;
    this.banner = new Banner(scene);
  }

  /** Positions everything; returns the play field for the game's own objects. */
  layout(viewport: Viewport): Rect {
    const regions = gameRegions(viewport, this.withGuide);
    this.backdrop?.layout(rect(0, 0, viewport.designWidth, viewport.designHeight));
    this.background?.layout(regions.field);
    this.frame.layout(regions.field);
    this.bubbles?.layout(regions.field);
    this.header.layout(regions.header);
    this.prompt.layout(regions.prompt);
    this.howTo.layout(regions.howTo);
    const decoFit = fitContain(this.deco.frame.width, this.deco.frame.height, regions.deco);
    this.deco.setScale(decoFit.scale).setPosition(decoFit.x, decoFit.y);
    this.footer.layout(regions.footer);
    this.mascot.layout(regions.mascot);
    if (regions.guide) this.guide?.layout(regions.guide);
    this.praise.layout(regions.bubble);
    // The bubble shows with the 「やったね」 pose, so its tail points at that pose's mouth.
    const mouth = this.guide?.pointOf('guide-happy', MOUTH.x, MOUTH.y);
    if (mouth) this.praise.speakFrom(mouth);
    this.banner.layout(regions.field);
    return regions.field;
  }

  setPrompt(lines: RichLines, picture?: Picture): void {
    this.prompt.setPrompt(lines, picture);
  }

  /** The 「お題」 card's picture area, for games that draw their own task there. */
  get promptContentArea(): Rect | undefined {
    return this.prompt.contentArea;
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
    this.guide?.showPose('guide-happy', HAPPY_POSE_MS);
    this.guide?.hop();
  }

  /** Stage or game cleared: the guide shows its 「やったね」 pose while the banner is shown. */
  celebrate(): void {
    this.guide?.showPose('guide-happy', CELEBRATE_POSE_MS);
  }
}
