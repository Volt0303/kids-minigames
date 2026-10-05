import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { minTouchSize } from '../../core/logic/layout';
import type { Random } from '../../core/logic/random';
import type { Rect } from '../../core/logic/rect';
import { DESIGN_HEIGHT } from '../../core/logic/viewport';
import { spawnTrash, trashPose, type TrashMotion } from './logic/sea';
import type { TrashKind } from './stages';

const TRASH = atlasKey('trash');
/** Most pieces at once (stage 3's trash on screen, plus pieces still flying away). */
const POOL_SIZE = 8;
/** Trash is this tall, as a share of the field's height (its catalog size caps it). */
const HEIGHT_SHARE = 0.19;
/** Depth in front of the fish, or behind them (stage 3). */
const FRONT_DEPTH = -5;
const BEHIND_DEPTH = -15;
/** Tap area: at least the minimum touch size (requirements 6.6), a little larger than the picture. */
const MIN_TAP = minTouchSize(DESIGN_HEIGHT);
const TAP_PADDING = 16;
const FADE_IN_MS = 400;

export interface Trash {
  image: Phaser.GameObjects.Image;
  kind: TrashKind;
  motion: TrashMotion;
  /** Seconds since it appeared. */
  age: number;
  /** In the sea and tappable. */
  active: boolean;
}

const containsPoint = (area: Phaser.Geom.Rectangle, x: number, y: number): boolean => area.contains(x, y);

/** The pieces of trash in the sea: they appear near the top, sink, then bob in place (object pool). */
export class TrashLayer {
  readonly pieces: Trash[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const image = scene.add.image(0, 0, TRASH, 'can').setVisible(false);
      this.pieces.push({ image, kind: 'can', motion: { x: 0, startY: 0, restY: 0, phase: 0 }, age: 0, active: false });
    }
  }

  /** The piece shown by this picture, if it is a piece of trash still in the sea. */
  pieceOf(object: Phaser.GameObjects.GameObject): Trash | undefined {
    return this.pieces.find((piece) => piece.active && piece.image === object);
  }

  /** The different kinds of trash in the sea, left to right as they are in the water. */
  kindsInSea(): TrashKind[] {
    const inSea = this.pieces.filter((piece) => piece.active).sort((a, b) => a.motion.x - b.motion.x);
    return [...new Set(inSea.map((piece) => piece.kind))];
  }

  activeCount(): number {
    return this.pieces.filter((piece) => piece.active).length;
  }

  /** Puts a new piece of trash in the sea, away from the others. */
  spawn(kind: TrashKind, field: Rect, behindFish: boolean, random: Random): void {
    const piece = this.pieces.find((p) => !p.active && !p.image.visible);
    if (!piece) return;
    const others = this.pieces.filter((p) => p.active).map((p) => p.motion.x);
    piece.motion = spawnTrash(others, random);
    piece.age = 0;
    piece.kind = kind;
    piece.active = true;
    const image = piece.image.setFrame(kind).setAlpha(0).setVisible(true);
    image.setDepth(behindFish && random() < 0.5 ? BEHIND_DEPTH : FRONT_DEPTH);
    this.fit(piece, field);
    this.scene.tweens.add({ targets: image, alpha: 1, duration: FADE_IN_MS });
  }

  /** Sizes a piece for the field, with a tap area of at least the minimum touch size. */
  private fit(piece: Trash, field: Rect): void {
    const image = piece.image;
    const scale = Math.min(1, (field.height * HEIGHT_SHARE) / image.frame.height);
    image.setScale(scale);
    const halfWidth = Math.max((image.frame.width * scale) / 2 + TAP_PADDING, MIN_TAP / 2) / scale;
    const halfHeight = Math.max((image.frame.height * scale) / 2 + TAP_PADDING, MIN_TAP / 2) / scale;
    const area = new Phaser.Geom.Rectangle(
      image.frame.width / 2 - halfWidth,
      image.frame.height / 2 - halfHeight,
      halfWidth * 2,
      halfHeight * 2,
    );
    image.setInteractive(area, containsPoint);
  }

  /** Moves every piece in the sea (no allocation: called every frame). */
  update(seconds: number, field: Rect, sinkSpeed: number): void {
    for (const piece of this.pieces) {
      if (!piece.active) continue;
      piece.age += seconds;
      const pose = trashPose(piece.motion, piece.age, sinkSpeed);
      piece.image.setPosition(field.x + pose.x * field.width, field.y + pose.y * field.height).setAngle(pose.angle);
    }
  }

  /** Resizes the pieces after a screen-size change. */
  layout(field: Rect): void {
    for (const piece of this.pieces) if (piece.active) this.fit(piece, field);
  }

  /** Taken out of the sea: no longer tappable; the scene animates it away, then calls `release`. */
  take(piece: Trash): void {
    piece.active = false;
    piece.image.disableInteractive();
  }

  release(piece: Trash): void {
    this.scene.tweens.killTweensOf(piece.image);
    piece.active = false;
    piece.image.disableInteractive().setVisible(false);
  }

  clear(): void {
    for (const piece of this.pieces) this.release(piece);
  }
}
