import type * as Phaser from 'phaser';
import type { Rect } from '../logic/rect';
import { FieldPicture } from './FieldPicture';

/** Field pictures sit here; a full-screen backdrop goes further back (BACKDROP_DEPTH). */
const DEPTH = -1000;
export const BACKDROP_DEPTH = -2000;

/**
 * A full-screen (or any rectangle) background picture with square corners: cut evenly at the
 * sides to fit the screen's shape, or centred whole when it is too narrow (see FieldPicture).
 */
export class Background {
  private readonly picture: FieldPicture;

  constructor(scene: Phaser.Scene, textureKey: string, depth = DEPTH) {
    this.picture = new FieldPicture(scene, textureKey, 0, depth);
  }

  /** False when the image failed to load; the scene's background colour shows instead. */
  get available(): boolean {
    return this.picture.available;
  }

  /** Fills `area` with the picture; never draws outside it. */
  layout(area: Rect): void {
    this.picture.layout(area);
  }
}
