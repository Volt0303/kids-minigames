import type * as Phaser from 'phaser';
import { gameArtKey } from '../../core/assets/catalog';
import type { Viewport } from '../../core/logic/viewport';

/** In front of the backdrop, behind the tray and everything else in the field. */
const DEPTH = -1500;
/** How much of the screen's height the wave band covers, from the bottom. */
const HEIGHT_SHARE = 0.46;
/** The picture's top part (curls and crest) that must stay on screen; the rest may go below it. */
const VISIBLE_SHARE = 0.72;

/**
 * The blue wave band along the bottom of the お寿司パズル screen, behind the topping tray
 * (as in the game's design). Stretched to the screen's width; its lower part may run off
 * the bottom of the screen so the curls keep their shape.
 */
export class BottomWave {
  private readonly image: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.image = scene.add.image(0, 0, gameArtKey('sushi', 'bottom-wave')).setOrigin(0.5, 0).setDepth(DEPTH);
  }

  layout(viewport: Viewport): void {
    const { designWidth: width, designHeight: height } = viewport;
    const visible = height * HEIGHT_SHARE;
    const scaleY = visible / (this.image.frame.height * VISIBLE_SHARE);
    this.image.setScale(width / this.image.frame.width, scaleY).setPosition(width / 2, height - visible);
  }
}
