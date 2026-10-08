import type * as Phaser from 'phaser';
import type { Rect } from '../../core/logic/rect';
import type { HintTarget } from '../../core/ui/HintMarker';
import { spotOf, type Spot } from './logic/spots';
import { PictureBackground, SAND_TOP } from './PictureBackground';
import { DiffSprite, type Box } from './DiffSprite';
import { FoundMark } from './FoundMark';
import type { Change, Difference, Item, Setting } from './stages';

/** Most items in a picture. */
const POOL_SIZE = 16;
/** An item is at most this share of the picture's width, unless it says otherwise. */
const MAX_WIDTH = 0.3;
/** Items keep this far (design units) inside the picture's frame. */
const INSET = 12;
/** How much flat-lying things are squashed (seen at an angle). */
const FLAT = 0.6;
/** A difference's spot is a little larger than its picture. */
const SPOT_SCALE = 0.65;
const MIN_SPOT = 0.09;
/** Every tap circle is at least this wide, in design units (1080 = screen height): spec 6.6, 13%+. */
const MIN_TAP = 150;
/** Most differences in a stage (one circle each). */
const MAX_MARKS = 5;
/** Circles keep this far inside the picture, and shrink at most to this share near an edge. */
const MARK_INSET = 10;
const MIN_MARK = 0.6;

/**
 * One of the two pictures of 間違い探し: a background, the scene's sprites (with the stage's
 * differences applied on the right picture), and a circle on each difference found.
 */
export class DiffPicture {
  private readonly background: PictureBackground;
  private readonly sprites: DiffSprite[] = [];
  private readonly marks: FoundMark[] = [];
  /** Where each item is drawn (also for hidden ones), filled by draw(). */
  private boxes: Box[] = [];
  private items: readonly Item[] = [];
  private changes = new Map<number, Change>();
  private setting: Setting = 'sea';
  private area?: Rect;
  private marked: Spot[] = [];

  constructor(scene: Phaser.Scene) {
    this.background = new PictureBackground(scene);
    for (let i = 0; i < POOL_SIZE; i++) this.sprites.push(new DiffSprite(scene));
    for (let i = 0; i < MAX_MARKS; i++) this.marks.push(new FoundMark(scene));
  }

  get bounds(): Rect | undefined {
    return this.area;
  }

  /** Shows a scene; `differences` are applied (right picture) or not (left: pass []). */
  show(setting: Setting, items: readonly Item[], differences: readonly Difference[]): void {
    if (items.length > POOL_SIZE) throw new RangeError(`diff: ${items.length} items, at most ${POOL_SIZE}`);
    this.setting = setting;
    this.items = items;
    this.changes = new Map(differences.map((d) => [d.item, d.change]));
    this.marked = [];
    for (const mark of this.marks) mark.hide();
    this.draw();
  }

  layout(area: Rect): void {
    this.area = area;
    this.draw();
  }

  /** Circles a found difference (drawn with a pen stroke). */
  mark(spot: Spot): void {
    const mark = this.marks[this.marked.length];
    this.marked.push(spot);
    const a = this.area;
    if (mark && a) mark.show(...this.markAt(a, spot), true);
  }

  /** The picture of item `index` (for the hint), if it is shown. */
  imageOf(index: number): HintTarget | undefined {
    return this.sprites[index]?.target;
  }

  /** Where a screen point is, as shares of the picture (undefined outside it). */
  toPicture(x: number, y: number): { x: number; y: number } | undefined {
    const a = this.area;
    if (!a || x < a.x || x > a.x + a.width || y < a.y || y > a.y + a.height) return undefined;
    return { x: (x - a.x) / a.width, y: (y - a.y) / a.height };
  }

  /** The tap spot of item `index` where it is actually drawn, as shares of the picture. */
  spotOf(index: number): Spot | undefined {
    const a = this.area;
    const box = this.boxes[index];
    const item = this.items[index];
    if (!a || !box || !item) return item ? spotOf(item) : undefined;
    const radius = (Math.max(box.width, box.height) * SPOT_SCALE) / a.height;
    const minimum = Math.max(MIN_SPOT, MIN_TAP / 2 / a.height);
    return { x: (box.x - a.x) / a.width, y: (box.y - a.y) / a.height, radius: Math.max(minimum, radius) };
  }

  private draw(): void {
    const a = this.area;
    if (!a) return;
    this.background.draw(this.setting, a);
    this.boxes = [];
    this.sprites.forEach((sprite, i) => {
      const item = this.items[i];
      if (!item) {
        sprite.hide();
        return;
      }
      const size = sprite.setUp(item, this.changes.get(i));
      const [box, scale, scaleY] = this.boxOf(a, item, size);
      this.boxes.push(box);
      sprite.place(box, scale, scaleY);
    });
    this.marked.forEach((spot, i) => this.marks[i]?.move(...this.markAt(a, spot)));
  }

  /** Where an item goes and its scale (x, y), from its size at scale 1. */
  private boxOf(a: Rect, item: Item, size: { width: number; height: number }): [Box, number, number] {
    const parent = item.on === undefined ? undefined : this.boxes[item.on];
    if (parent) {
      // Standing on another item: placed across it, its bottom at y.
      const scale = (parent.width * item.size) / size.width;
      const height = size.height * scale;
      const x = parent.x - parent.width / 2 + parent.width * item.x;
      const y = parent.y - parent.height / 2 + parent.height * item.y - height / 2;
      return [{ x, y, width: size.width * scale, height }, scale, scale];
    }
    // As tall as the item says, but never wider than its share of the picture's width.
    const maxWidth = a.width * (item.maxWidth ?? MAX_WIDTH);
    const scale = Math.min((a.height * item.size) / size.height, maxWidth / size.width);
    const scaleY = item.flat ? scale * FLAT : scale;
    const width = size.width * scale;
    const height = size.height * scaleY;
    const [x, y] = this.inside(a, item, width, height);
    return [{ x, y, width, height }, scale, scaleY];
  }

  /**
   * The item's centre, moved inwards just enough that it stays inside the frame (whatever the
   * screen's shape); flat things lie in the sand band.
   */
  private inside(a: Rect, item: Item, width: number, height: number): [number, number] {
    const clamp = (value: number, min: number, max: number): number =>
      min > max ? (min + max) / 2 : Math.min(max, Math.max(min, value));
    const x = clamp(a.x + a.width * item.x, a.x + INSET + width / 2, a.x + a.width - INSET - width / 2);
    const minY = item.flat ? a.y + a.height * SAND_TOP + height / 2 : a.y + INSET + height / 2;
    const y = clamp(a.y + a.height * item.y, minY, a.y + a.height - INSET - height / 2);
    return [x, y];
  }

  /**
   * A circle's centre and radius on screen. Near an edge the circle gets smaller so it stays
   * inside the frame (never below MIN_MARK of its size: then it may touch the frame).
   */
  private markAt(a: Rect, spot: Spot): [number, number, number] {
    const x = a.x + a.width * spot.x;
    const y = a.y + a.height * spot.y;
    const room = Math.min(x - a.x, a.x + a.width - x, y - a.y, a.y + a.height - y) - MARK_INSET;
    const radius = a.height * spot.radius;
    return [x, y, Math.max(radius * MIN_MARK, Math.min(radius, room))];
  }
}
