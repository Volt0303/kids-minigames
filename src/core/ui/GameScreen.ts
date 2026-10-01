import type * as Phaser from 'phaser';
import { loadAtlas, loadBackground } from '../assets/atlas';
import { atlasKey, backgroundKey, type BackgroundName } from '../assets/catalog';
import { gameRegions } from '../logic/gameLayout';
import type { Rect } from '../logic/rect';
import type { Viewport } from '../logic/viewport';
import { Background } from './Background';
import { Banner } from './Banner';
import { Bubbles } from './Bubbles';
import { Character } from './Character';
import { FieldFrame } from './FieldFrame';
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
  /** Show the client's guide character (games ①–④ only). */
  guide: boolean;
  onClose: () => void;
}

const UI = atlasKey('ui');
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
  private readonly background?: Background;
  private readonly frame: FieldFrame;
  private readonly bubbles?: Bubbles;
  private readonly header: Header;
  private readonly prompt: PromptCard;
  private readonly howTo: HowToCard;
  private readonly footer: FooterMessage;
  private readonly mascot: Character;
  private readonly guide?: Character;
  private readonly praise: PraiseBubble;
  private readonly withGuide: boolean;

  /** Queues the shared images; call from the scene's preload. */
  static preload(load: Phaser.Loader.LoaderPlugin, config: GameScreenConfig): void {
    loadAtlas(load, 'ui');
    if (config.background) loadBackground(load, config.background);
  }

  constructor(scene: Phaser.Scene, config: GameScreenConfig) {
    this.background = config.background && new Background(scene, backgroundKey(config.background));
    this.frame = new FieldFrame(scene);
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
    this.mascot = new Character(scene, { texture: UI, frame: 'starfish' }, 8);
    this.guide = config.guide ? new Character(scene, { texture: UI, frame: 'guide' }, 10) : undefined;
    this.praise = new PraiseBubble(scene, config.copy.praise, config.guide);
    this.withGuide = config.guide;
    this.banner = new Banner(scene);
  }

  /** Positions everything; returns the play field for the game's own objects. */
  layout(viewport: Viewport): Rect {
    const regions = gameRegions(viewport, this.withGuide);
    this.background?.layout(regions.field);
    this.frame.layout(regions.field);
    this.bubbles?.layout(regions.field);
    this.header.layout(regions.header);
    this.prompt.layout(regions.prompt);
    this.howTo.layout(regions.howTo);
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
