import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { NIGIRI_SIZE, type SushiKind } from '../../core/assets/sushi';
import type { HintTarget } from '../../core/ui/HintMarker';
import { Nigiri } from '../../core/ui/Nigiri';
import type { Change, Item } from './stages';

/** Where and how big a sprite is drawn: centre and size in design units. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One item of a 間違い探し picture: a plain picture, or a whole nigiri (rice and topping as
 * one piece, so they always line up). Nigiri cannot be tinted or flipped.
 */
export class DiffSprite {
  private readonly image: Phaser.GameObjects.Image;
  private readonly nigiri: Nigiri;
  private shown?: HintTarget;

  constructor(scene: Phaser.Scene) {
    this.image = scene.add.image(0, 0, atlasKey('fish'), 'tuna').setVisible(false);
    this.nigiri = new Nigiri(scene).setSize(NIGIRI_SIZE.width, NIGIRI_SIZE.height).setVisible(false);
  }

  /** The visible picture (for the hint), if any. */
  get target(): HintTarget | undefined {
    return this.shown;
  }

  /**
   * Sets up the item with its change and returns its size at scale 1. A hidden item is set up
   * too (its place is still needed, e.g. for things standing on it) but not shown.
   */
  setUp(item: Item, change: Change | undefined): { width: number; height: number } {
    this.image.setVisible(false).clearTint();
    this.nigiri.setVisible(false);
    const shown = item.sushi ? this.setUpNigiri(item.sushi, change) : this.setUpImage(item, change);
    this.shown = change?.kind === 'hide' ? undefined : shown.setVisible(true);
    return shown === this.image ? { width: this.image.frame.width, height: this.image.frame.height } : NIGIRI_SIZE;
  }

  private setUpNigiri(kind: SushiKind, change: Change | undefined): Nigiri {
    return this.nigiri.setKind(change?.kind === 'sushi' ? change.to : kind);
  }

  private setUpImage(item: Item, change: Change | undefined): Phaser.GameObjects.Image {
    const frame = change?.kind === 'swap' ? change.frame : item.frame;
    this.image.setTexture(atlasKey(item.atlas), frame);
    if (change?.kind === 'tint') this.image.setTint(change.color);
    return this.image.setFlipX((item.flip ?? false) !== (change?.kind === 'flip'));
  }

  place(box: Box, scale: number, scaleY: number): void {
    this.image.setPosition(box.x, box.y).setScale(scale, scaleY);
    this.nigiri.setPosition(box.x, box.y).setScale(scale, scaleY);
  }

  hide(): void {
    this.image.setVisible(false);
    this.nigiri.setVisible(false);
    this.shown = undefined;
  }
}
