import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import type { Rect } from '../../core/logic/rect';
import { Character } from '../../core/ui/Character';
import { PraiseBubble } from '../../core/ui/PraiseBubble';

const CHARACTERS = atlasKey('characters');
const HAPPY_POSE_MS = 1_300;
/** Just left of げんきくん's mouth in the 「やったね」 pose, as fractions of the picture. */
const MOUTH = { x: 0.12, y: 0.36 } as const;

/**
 * げんきくん at the right end of the tray row (client's mockup for ②), with his
 * 「やったね!」 bubble after each sushi is made.
 */
export class Guide {
  private readonly character: Character;
  private readonly bubble: PraiseBubble;

  constructor(scene: Phaser.Scene) {
    this.character = new Character(scene, { texture: CHARACTERS, frame: 'guide' }, 8);
    // Left of his head as in the mockup. It may cover the last slot for a moment, but it only
    // shows while the finished sushi is on the board, when the tray cannot be used anyway.
    this.bubble = new PraiseBubble(scene, { title: 'やったね!', line: 'おいしそう!' }, true);
  }

  layout(guide: Rect, bubble: Rect): void {
    this.character.layout(guide);
    this.bubble.layout(bubble);
    const mouth = this.character.pointOf('guide-happy', MOUTH.x, MOUTH.y);
    if (mouth) this.bubble.speakFrom(mouth);
  }

  cheer(): void {
    this.bubble.show();
    this.character.showPose('guide-happy', HAPPY_POSE_MS);
    this.character.hop();
  }
}
