import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { minTouchSize } from '../../core/logic/layout';
import { DESIGN_HEIGHT } from '../../core/logic/viewport';
import { PIECE } from './logic/placement';
import { Nigiri } from './Nigiri';
import type { SushiKind } from './stages';

const SUSHI = atlasKey('sushi');
const PLATE_Y = 72;
/** Minimum tap area on screen (requirements 6.6: about 13% of the screen height). */
const MIN_TAP = minTouchSize(DESIGN_HEIGHT);

/**
 * A sushi on its plate, put out on the counter or the conveyor. Tapping it calls the
 * scene back; it is reused for any kind (object pool), and loses its plate on the tray.
 */
export class SushiPiece extends Phaser.GameObjects.Container {
  kind: SushiKind = 'tuna';
  /** On the counter or belt and tappable (false while flying, on the tray, or unused). */
  available = false;
  private readonly plate: Phaser.GameObjects.Image;
  private readonly nigiri: Nigiri;

  constructor(scene: Phaser.Scene, onTap: (piece: SushiPiece) => void) {
    super(scene, 0, 0);
    this.plate = scene.add.image(0, PLATE_Y, SUSHI, 'plate');
    this.nigiri = new Nigiri(scene);
    this.add([this.plate, this.nigiri]);
    this.setSize(PIECE.width, PIECE.height).setVisible(false);
    this.on('pointerdown', () => onTap(this));
    scene.add.existing(this);
  }

  /** Puts the piece out (on its plate) at a place and size. */
  serve(kind: SushiKind, x: number, y: number, scale: number): void {
    this.scene.tweens.killTweensOf(this);
    this.kind = kind;
    this.nigiri.setKind(kind);
    this.plate.setVisible(true);
    this.setPosition(x, y).setScale(scale).setAlpha(1).setAngle(0).setVisible(true);
    // The tap area grows on small screens so it never drops below the minimum touch size.
    const width = Math.max(PIECE.width, MIN_TAP / scale);
    const height = Math.max(PIECE.height, MIN_TAP / scale);
    this.setSize(width, height).setInteractive();
    this.available = true;
  }

  /** Taken: no longer tappable, and without its plate (it goes onto the tray). */
  take(): void {
    this.available = false;
    this.disableInteractive();
    this.plate.setVisible(false);
  }

  /** Back to the pool. */
  clear(): void {
    this.scene.tweens.killTweensOf(this);
    this.available = false;
    this.disableInteractive();
    this.setVisible(false);
  }
}
