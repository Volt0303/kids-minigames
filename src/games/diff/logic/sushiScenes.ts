/**
 * The sushi-table scenes of 間違い探し (stage 3): a big table (item 0) with three rows on it.
 * Rows: back (bottom at 0.28 of the table), middle (0.49), front (0.69) — the front edge of
 * the table top is at about 0.79, so the front row keeps a strip of wood in front of it.
 * Wasabi and ginger sit on small dishes (the dish is the item just before them).
 */
import { HIDE, nigiri, on, prop, sushi, swap, toSushi, vary, type Item, type Scene } from './scene';

const TABLE: Item = { ...sushi('big-table', 0.5, 0.58, 0.9), maxWidth: 0.96 };
const BACK = 0.28;
const MIDDLE = 0.49;
const FRONT = 0.69;
/** Small dish under wasabi / ginger, as a share of the table's width. */
const DISH = 0.18;

/** A small dish on the table, bottom at y. */
const dish = (x: number, y: number): Item => on(0, sushi('plate', x, y, DISH));
/** `frame` (wasabi, ginger) on the dish at item `parent`. */
const onDish = (parent: number, frame: string): Item => on(parent, prop(frame, 0.5, 0.66, 0.64));

/** Stage 3: 5 differences. */
export const SUSHI_TABLE: readonly Scene[] = [
  // Sushi in two rows, tea and soy on the right, plates in front.
  {
    setting: 'sushi',
    items: [
      TABLE,
      nigiri('tuna', 0, 0.19, BACK),
      nigiri('squid', 0, 0.4, BACK),
      nigiri('salmon', 0, 0.61, BACK),
      on(0, prop('teacup', 0.82, BACK, 0.11)),
      nigiri('egg', 0, 0.19, MIDDLE),
      nigiri('ikura', 0, 0.4, MIDDLE),
      nigiri('shrimp', 0, 0.61, MIDDLE),
      on(0, prop('soy-dish', 0.82, MIDDLE - 0.02, 0.15)),
      dish(0.22, FRONT),
      onDish(9, 'wasabi'),
      on(0, sushi('plate', 0.5, FRONT, 0.22)),
      dish(0.78, FRONT),
      onDish(12, 'ginger'),
    ],
    variations: [
      vary(1, toSushi('egg'), toSushi('salmon')),
      vary(2, toSushi('octopus')),
      vary(3, toSushi('tuna'), HIDE),
      vary(4, HIDE),
      vary(6, toSushi('shrimp'), HIDE),
      vary(7, HIDE, toSushi('egg')),
      vary(8, HIDE),
      vary(10, HIDE),
      vary(11, swap('platter-fish'), HIDE),
      vary(13, HIDE),
    ],
  },
  // Tea and soy on the left, the plate in the middle at the front.
  {
    setting: 'sushi',
    items: [
      TABLE,
      on(0, prop('teacup', 0.18, BACK, 0.11)),
      nigiri('salmon', 0, 0.39, BACK),
      nigiri('fatty-tuna', 0, 0.6, BACK),
      nigiri('egg', 0, 0.81, BACK),
      on(0, prop('soy-dish', 0.18, MIDDLE - 0.02, 0.15)),
      nigiri('octopus', 0, 0.39, MIDDLE),
      nigiri('shrimp', 0, 0.6, MIDDLE),
      nigiri('ikura', 0, 0.81, MIDDLE),
      dish(0.24, FRONT),
      onDish(9, 'wasabi'),
      on(0, sushi('plate', 0.5, FRONT, 0.22)),
      dish(0.76, FRONT),
      onDish(12, 'ginger'),
    ],
    variations: [
      vary(1, HIDE),
      vary(2, toSushi('tuna'), HIDE),
      vary(3, toSushi('squid')),
      vary(4, toSushi('engawa'), HIDE),
      vary(5, HIDE),
      vary(6, toSushi('egg')),
      vary(7, HIDE, toSushi('salmon')),
      vary(8, toSushi('tuna')),
      vary(10, HIDE),
      vary(11, swap('platter-fish')),
      vary(13, HIDE),
    ],
  },
  // Condiments at the back, two rows of sushi and a plate in front.
  {
    setting: 'sushi',
    items: [
      TABLE,
      on(0, prop('teacup', 0.15, BACK, 0.11)),
      on(0, prop('soy-dish', 0.38, BACK - 0.02, 0.15)),
      dish(0.6, BACK - 0.02),
      onDish(3, 'ginger'),
      dish(0.82, BACK - 0.02),
      onDish(5, 'wasabi'),
      nigiri('tuna', 0, 0.2, MIDDLE),
      nigiri('engawa', 0, 0.4, MIDDLE),
      nigiri('egg', 0, 0.6, MIDDLE),
      nigiri('salmon', 0, 0.8, MIDDLE),
      nigiri('shrimp', 0, 0.2, FRONT),
      nigiri('ikura', 0, 0.4, FRONT),
      nigiri('squid', 0, 0.6, FRONT),
      on(0, sushi('plate', 0.82, FRONT, 0.2)),
    ],
    variations: [
      vary(1, HIDE),
      vary(2, HIDE),
      vary(4, HIDE),
      vary(6, HIDE),
      vary(7, toSushi('salmon'), toSushi('egg')),
      vary(8, toSushi('octopus')),
      vary(9, HIDE, toSushi('tuna')),
      vary(11, HIDE),
      vary(12, toSushi('shrimp')),
      vary(13, toSushi('octopus'), HIDE),
      vary(14, swap('platter-fish')),
    ],
  },
];
