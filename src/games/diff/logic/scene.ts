/**
 * The building blocks of 間違い探し's pictures: sprites placed as shares of the picture, the
 * changes that make the right picture differ, and scenes (a layout plus the changes each of
 * its items may get). Plain data — no Phaser.
 */
import type { AtlasName } from '../../../core/assets/catalog';
import { sushiArt, type SushiKind } from '../../../core/assets/sushi';

/** One sprite in a picture. x / y: centre as shares of the picture; size: height as a share of it. */
export interface Item {
  atlas: AtlasName;
  frame: string;
  x: number;
  y: number;
  size: number;
  flip?: boolean;
  /** Lies flat on the sea floor: drawn squashed (seen at an angle) with its bottom in the sand. */
  flat?: boolean;
  /** At most this share of the picture's width (default 0.3). */
  maxWidth?: number;
  /** A nigiri / gunkan of this kind, drawn as one piece (the topping always on its rice). */
  sushi?: SushiKind;
  /**
   * Stands on item `on` (an earlier one, e.g. the table): x is then its centre and y its bottom
   * as shares of that item's width / height, and size its width as a share of that width.
   * So a group looks the same on every screen shape.
   */
  on?: number;
}

/** How the right picture differs from the left at one item. */
export type Change =
  | { kind: 'hide' }
  | { kind: 'swap'; frame: string }
  | { kind: 'tint'; color: number }
  | { kind: 'flip' }
  | { kind: 'sushi'; to: SushiKind };

export interface Difference {
  /** Index of the changed item in the item list. */
  item: number;
  change: Change;
}

/** The changes item `item` may get in a round (one of them is picked). */
export interface Variation {
  item: number;
  changes: readonly Change[];
}

export type Setting = 'sea' | 'sushi';

/** One layout of a stage: its items and the possible differences. */
export interface Scene {
  setting: Setting;
  items: readonly Item[];
  variations: readonly Variation[];
}

/** What one play of a stage shows: a scene, possibly mirrored, with its differences picked. */
export interface Round {
  setting: Setting;
  items: readonly Item[];
  differences: readonly Difference[];
}

/** Tints that show clearly on light things. */
export const BLUE = 0x7fc8ff;
export const PINK = 0xff8a8a;

export const HIDE: Change = { kind: 'hide' };
export const FLIP: Change = { kind: 'flip' };
export const swap = (frame: string): Change => ({ kind: 'swap', frame });
export const tint = (color: number): Change => ({ kind: 'tint', color });
export const toSushi = (to: SushiKind): Change => ({ kind: 'sushi', to });
export const vary = (item: number, ...changes: Change[]): Variation => ({ item, changes });

export const fish = (frame: string, x: number, y: number, size: number): Item => ({ atlas: 'fish', frame, x, y, size });
export const scenery = (frame: string, x: number, y: number, size: number): Item => ({
  atlas: 'scenery',
  frame,
  x,
  y,
  size,
});
export const sushi = (frame: string, x: number, y: number, size: number): Item => ({
  atlas: 'sushi',
  frame,
  x,
  y,
  size,
});
export const prop = (frame: string, x: number, y: number, size: number): Item => ({
  atlas: 'props',
  frame,
  x,
  y,
  size,
});
/** Facing right (the art faces left). */
export const facingRight = (item: Item): Item => ({ ...item, flip: true });
/** Lying flat on the sand. */
export const lying = (item: Item): Item => ({ ...item, flat: true });
/** `item` standing on item `parent` (its x / y / size then measured across that item). */
export const on = (parent: number, item: Item): Item => ({ ...item, on: parent });

/** Nigiri on the sushi table, as a share of its width. */
const NIGIRI_WIDTH = 0.16;

/** A nigiri standing on item `parent`: centre x and bottom y across it. */
export const nigiri = (kind: SushiKind, parent: number, x: number, y: number): Item => ({
  atlas: 'sushi',
  frame: sushiArt(kind).top,
  sushi: kind,
  on: parent,
  x,
  y,
  size: NIGIRI_WIDTH,
});
