import type * as Phaser from 'phaser';
import { atlasKey } from '../assets/catalog';
import type { GameRegions } from '../logic/gameLayout';
import { fitContain, type Rect } from '../logic/rect';
import { Character } from './Character';
import { FooterMessage } from './FooterMessage';
import { HowToCard } from './HowToCard';
import type { Picture } from './picture';
import { PraiseBubble, type Praise } from './PraiseBubble';
import { PromptCard } from './PromptCard';
import type { RichLines } from './RichText';

const UI = atlasKey('ui');
const CHARACTERS = atlasKey('characters');
/** How long the guide keeps its 「やったね」 pose after a correct answer / a cleared stage. */
const HAPPY_POSE_MS = 1_300;
const CELEBRATE_POSE_MS = 2_200;
/** Just left of げんきくん's mouth in the 「やったね」 pose, as fractions of the picture. */
const MOUTH = { x: 0.12, y: 0.36 } as const;

export interface SidePanelsConfig {
  howTo: RichLines;
  footer: RichLines;
  praise: Praise;
  guide: boolean;
}

/**
 * The parts of the standard game screen around the field: the 「お題」 and 「あそびかた」 cards
 * on the right, and the message bar (bubbles, starfish, message, praise bubble, guide).
 * Games with the open layout draw their own instead and leave these out.
 */
export class SidePanels {
  private readonly prompt: PromptCard;
  private readonly howTo: HowToCard;
  private readonly deco: Phaser.GameObjects.Image;
  private readonly footer: FooterMessage;
  private readonly mascot: Character;
  private readonly guide?: Character;
  private readonly praise: PraiseBubble;

  constructor(scene: Phaser.Scene, config: SidePanelsConfig) {
    this.prompt = new PromptCard(scene, { texture: UI, frame: 'deco-bubbles' });
    this.howTo = new HowToCard(scene, config.howTo, { texture: UI, frame: 'icon-hand-tap' });
    this.deco = scene.add.image(0, 0, UI, 'deco-bubbles');
    this.footer = new FooterMessage(scene, config.footer, { texture: UI, frame: 'panel-message' });
    this.mascot = new Character(scene, { texture: CHARACTERS, frame: 'starfish' }, 8);
    this.guide = config.guide ? new Character(scene, { texture: CHARACTERS, frame: 'guide' }, 10) : undefined;
    this.praise = new PraiseBubble(scene, config.praise, config.guide);
  }

  layout(regions: GameRegions): void {
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
  }

  setPrompt(lines: RichLines, picture?: Picture): void {
    this.prompt.setPrompt(lines, picture);
  }

  get promptContentArea(): Rect | undefined {
    return this.prompt.contentArea;
  }

  praiseCorrect(): void {
    this.praise.show();
    this.guide?.showPose('guide-happy', HAPPY_POSE_MS);
    this.guide?.hop();
  }

  celebrate(): void {
    this.guide?.showPose('guide-happy', CELEBRATE_POSE_MS);
  }
}
