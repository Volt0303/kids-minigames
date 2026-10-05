import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import type { TrashKind } from './stages';

const TRASH = atlasKey('trash');
/** Most kinds shown at once (the most trash on screen in any stage). */
const MAX_KINDS = 4;
const GAP = 10;
/** Pictures may grow a little past their natural size to fill the card. */
const MAX_SCALE = 1.4;

/**
 * The pictures inside the 「お題」 card: the kinds of trash in the sea right now, side by side,
 * so the card always shows what to tap. Updated whenever trash appears or is collected.
 */
export class TrashTicket {
  private readonly images: Phaser.GameObjects.Image[] = [];
  private kinds: readonly TrashKind[] = [];
  private area?: Rect;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < MAX_KINDS; i++) this.images.push(scene.add.image(0, 0, TRASH, 'can').setVisible(false));
  }

  layout(area: Rect): void {
    this.area = area;
    this.arrange();
  }

  show(kinds: readonly TrashKind[]): void {
    const shown = kinds.slice(0, MAX_KINDS);
    if (shown.length === this.kinds.length && shown.every((kind, i) => kind === this.kinds[i])) return;
    this.kinds = shown;
    this.arrange();
  }

  /** Centre of a kind's picture in the card (where collected trash of that kind flies to). */
  pointOf(kind: TrashKind): { x: number; y: number } | undefined {
    const image = this.images[this.kinds.indexOf(kind)];
    return image?.visible ? { x: image.x, y: image.y } : undefined;
  }

  private arrange(): void {
    const area = this.area;
    this.images.forEach((image, i) => {
      const kind = this.kinds[i];
      image.setVisible(!!area && kind !== undefined);
      if (!area || kind === undefined) return;
      const count = this.kinds.length;
      const cell = (area.width - GAP * (count - 1)) / count;
      const box = rect(area.x + i * (cell + GAP), area.y, cell, area.height);
      image.setFrame(kind);
      const fit = fitContain(image.frame.width, image.frame.height, box);
      image.setPosition(fit.x, fit.y).setScale(Math.min(fit.scale, MAX_SCALE));
    });
  }
}
