import type * as Phaser from 'phaser';
import { contentBand } from '../logic/gameLayout';
import type { Viewport } from '../logic/viewport';

/** In front of the backdrop, behind the field and everything else. */
const DEPTH = -1500;
/** The picture's top part (curls and crest) that must stay on screen; the rest may go below it. */
const VISIBLE_SHARE = 0.72;

/**
 * A blue wave band along the bottom of the game screen (a game's `bottom-wave` picture),
 * stretched across the game's content width (between the side margins, never outside them);
 * its lower part may run off the bottom of the screen
 * so the curls keep their shape. `heightShare`: how much of the screen's height it covers.
 */
export class BottomWave {
  private readonly image: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    private readonly heightShare: number,
  ) {
    this.image = scene.add.image(0, 0, textureKey).setOrigin(0.5, 0).setDepth(DEPTH);
  }

  layout(viewport: Viewport): void {
    const height = viewport.designHeight;
    const band = contentBand(viewport);
    const visible = height * this.heightShare;
    const scaleY = visible / (this.image.frame.height * VISIBLE_SHARE);
    this.image
      .setScale(band.width / this.image.frame.width, scaleY)
      .setPosition(band.x + band.width / 2, height - visible);
  }
}
