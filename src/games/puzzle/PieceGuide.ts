import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import type { Point } from './logic/board';

/** Yellow glow: the piece's own jigsaw shape, filled. */
const GLOW = 0xffe14d;
/** On the board (over the slot outlines, under the pieces) / behind the piece in the tray. */
const SLOT_DEPTH = -18;
const TRAY_DEPTH = 0.4;
const HAND_DEPTH = 60;
/** The hand picture is this tall at the board's scale 1 (design units). */
const HAND_SIZE = 280;
/** Where the fingertip is in the hand picture (shares of it). */
const FINGERTIP = { x: 0.43, y: 0.3 };
const MOVE_MS = 950;
const MOVES = 2;
const SHOW_MS = 3_600;

export interface GuideTarget {
  /** The piece's picture (its texture key). */
  texture: string;
  /** Where the piece is in the tray, and its scale there. */
  from: Point;
  trayScale: number;
  /** Its slot on the board, and the board's scale. */
  to: Point;
  boardScale: number;
}

/**
 * The puzzle hint: which piece goes where. The piece's slot glows yellow in the piece's own
 * jigsaw shape, the piece glows in the tray, and a hand slides from the piece to the slot.
 */
export class PieceGuide {
  private readonly slotGlow: Phaser.GameObjects.Image;
  private readonly trayGlow: Phaser.GameObjects.Image;
  private readonly hand: Phaser.GameObjects.Image;
  private timer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    const glow = (depth: number): Phaser.GameObjects.Image =>
      scene.add
        .image(0, 0, atlasKey('ui'), 'icon-hand-tap')
        .setTintMode(Phaser.TintModes.FILL)
        .setTint(GLOW)
        .setDepth(depth)
        .setVisible(false);
    this.slotGlow = glow(SLOT_DEPTH);
    this.trayGlow = glow(TRAY_DEPTH);
    this.hand = scene.add
      .image(0, 0, atlasKey('ui'), 'icon-hand-tap')
      .setOrigin(FINGERTIP.x, FINGERTIP.y)
      .setDepth(HAND_DEPTH)
      .setVisible(false);
  }

  get active(): boolean {
    return this.hand.visible;
  }

  show(target: GuideTarget): void {
    this.hide();
    const tweens = this.scene.tweens;
    this.slotGlow.setTexture(target.texture).setPosition(target.to.x, target.to.y).setScale(target.boardScale);
    this.trayGlow
      .setTexture(target.texture)
      .setPosition(target.from.x, target.from.y)
      .setScale(target.trayScale * 1.32);
    for (const glow of [this.slotGlow, this.trayGlow]) {
      glow.setAlpha(0.35).setVisible(true);
      tweens.add({ targets: glow, alpha: 0.9, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const handScale = (HAND_SIZE * target.boardScale) / this.hand.frame.height;
    this.hand.setScale(handScale).setPosition(target.from.x, target.from.y).setAlpha(1).setVisible(true);
    tweens.add({
      targets: this.hand,
      x: target.to.x,
      y: target.to.y,
      duration: MOVE_MS,
      delay: 250,
      hold: 350,
      repeatDelay: 250,
      repeat: MOVES - 1,
      ease: 'Sine.easeInOut',
    });
    this.timer = this.scene.time.delayedCall(SHOW_MS, () => this.fadeOut());
  }

  hide(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.scene.tweens.killTweensOf([this.slotGlow, this.trayGlow, this.hand]);
    for (const part of [this.slotGlow, this.trayGlow, this.hand]) part.setVisible(false);
  }

  private fadeOut(): void {
    this.scene.tweens.killTweensOf([this.slotGlow, this.trayGlow, this.hand]);
    this.scene.tweens.add({
      targets: [this.slotGlow, this.trayGlow, this.hand],
      alpha: 0,
      duration: 300,
      onComplete: () => this.hide(),
    });
  }
}
