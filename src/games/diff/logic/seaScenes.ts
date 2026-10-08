/**
 * The sea scenes of 間違い探し (stages 1 and 2). Fish swim below the water line (about 25% of
 * the picture), things on the floor stand in the sand (from about 82%). Flips are only offered
 * for things that look different when turned (not crabs, octopuses, bubbles or shells), and
 * changes are never just a colour: a thing is gone, turned, or a different kind of thing.
 */
import { FLIP, HIDE, facingRight, fish, lying, scenery, swap, vary, type Scene } from './scene';

/** Stage 1: 3 easy differences. */
export const SEA_EASY: readonly Scene[] = [
  // A reef with tropical fish.
  {
    setting: 'sea',
    items: [
      scenery('seaweed-1', 0.16, 0.6, 0.6),
      scenery('rock-1', 0.5, 0.86, 0.22),
      scenery('coral-1', 0.86, 0.74, 0.36),
      fish('yellow-tropical', 0.3, 0.42, 0.2),
      facingRight(fish('blue-tropical', 0.72, 0.38, 0.18)),
      fish('pufferfish', 0.55, 0.6, 0.2),
      lying(scenery('starfish', 0.3, 0.9, 0.16)),
      lying(scenery('shell', 0.72, 0.9, 0.14)),
    ],
    variations: [
      vary(6, HIDE),
      vary(3, swap('striped-orange'), FLIP, HIDE),
      vary(4, FLIP, swap('sea-bream')),
      vary(5, HIDE, swap('sea-bream')),
      vary(7, HIDE),
      vary(2, swap('coral-2')),
    ],
  },
  // A turtle above the sand, a crab and shells.
  {
    setting: 'sea',
    items: [
      scenery('coral-2', 0.14, 0.7, 0.3),
      scenery('seaweed-2', 0.88, 0.62, 0.5),
      scenery('rock-2', 0.6, 0.86, 0.18),
      fish('crab', 0.38, 0.86, 0.15),
      fish('turtle', 0.35, 0.42, 0.26),
      facingRight(fish('striped-orange', 0.7, 0.36, 0.18)),
      lying(scenery('shell', 0.82, 0.9, 0.12)),
      scenery('bubble', 0.55, 0.32, 0.07),
    ],
    variations: [
      vary(3, HIDE),
      vary(4, FLIP),
      vary(5, swap('yellow-tropical'), HIDE),
      vary(6, HIDE, swap('starfish')),
      vary(7, HIDE),
      vary(1, HIDE),
    ],
  },
  // Open water: an octopus, a puffer and a blue fish.
  {
    setting: 'sea',
    items: [
      scenery('seaweed-1', 0.88, 0.6, 0.56),
      scenery('coral-1', 0.14, 0.74, 0.34),
      scenery('rock-1', 0.6, 0.87, 0.2),
      fish('octopus', 0.42, 0.6, 0.24),
      fish('pufferfish', 0.7, 0.42, 0.18),
      fish('blue-tropical', 0.25, 0.38, 0.17),
      lying(scenery('starfish', 0.82, 0.92, 0.14)),
      scenery('bubble', 0.45, 0.3, 0.07),
    ],
    variations: [
      vary(3, swap('squid'), HIDE),
      vary(4, HIDE, FLIP),
      vary(5, swap('yellow-tropical'), FLIP),
      vary(6, HIDE),
      vary(7, HIDE),
      vary(1, swap('coral-2')),
    ],
  },
];

/** Stage 2: 4 differences in fuller scenes. */
export const SEA_FULL: readonly Scene[] = [
  // A turtle, a sea bream and an octopus over the coral.
  {
    setting: 'sea',
    items: [
      scenery('coral-2', 0.12, 0.76, 0.32),
      scenery('seaweed-2', 0.86, 0.64, 0.52),
      scenery('rock-2', 0.62, 0.88, 0.18),
      fish('turtle', 0.3, 0.46, 0.26),
      fish('sea-bream', 0.68, 0.38, 0.2),
      fish('octopus', 0.66, 0.64, 0.24),
      fish('crab', 0.38, 0.86, 0.15),
      scenery('bubble', 0.5, 0.33, 0.08),
      scenery('bubble', 0.9, 0.4, 0.06),
    ],
    variations: [
      vary(6, HIDE),
      vary(4, swap('salmon'), FLIP),
      vary(3, FLIP),
      vary(0, swap('coral-1')),
      vary(5, HIDE, swap('squid')),
      vary(7, HIDE),
      vary(2, swap('rock-1')),
    ],
  },
  // Big fish: a tuna and a squid, a flatfish on the sand.
  {
    setting: 'sea',
    items: [
      scenery('seaweed-1', 0.1, 0.6, 0.58),
      scenery('coral-1', 0.9, 0.72, 0.34),
      scenery('rock-1', 0.32, 0.87, 0.2),
      fish('tuna', 0.45, 0.4, 0.2),
      fish('squid', 0.75, 0.42, 0.24),
      lying(fish('flatfish', 0.62, 0.9, 0.14)),
      facingRight(fish('yellow-tropical', 0.28, 0.62, 0.16)),
      fish('pufferfish', 0.62, 0.64, 0.17),
      lying(scenery('shell', 0.12, 0.92, 0.12)),
      scenery('bubble', 0.2, 0.32, 0.07),
    ],
    variations: [
      vary(3, swap('bonito'), FLIP),
      vary(4, HIDE, swap('octopus')),
      vary(5, HIDE),
      vary(6, swap('blue-tropical'), HIDE),
      vary(7, FLIP, swap('striped-orange')),
      vary(8, HIDE),
      vary(9, HIDE),
      vary(1, swap('coral-2')),
    ],
  },
  // Rocks: a crab on a rock, a turtle swimming by.
  {
    setting: 'sea',
    items: [
      scenery('rock-2', 0.82, 0.84, 0.24),
      scenery('seaweed-2', 0.18, 0.64, 0.5),
      scenery('coral-2', 0.56, 0.74, 0.26),
      facingRight(fish('turtle', 0.64, 0.4, 0.24)),
      fish('striped-orange', 0.3, 0.36, 0.17),
      facingRight(fish('blue-tropical', 0.4, 0.58, 0.16)),
      fish('crab', 0.82, 0.66, 0.13),
      lying(scenery('starfish', 0.3, 0.92, 0.14)),
      scenery('bubble', 0.86, 0.3, 0.07),
      lying(scenery('shell', 0.6, 0.93, 0.11)),
    ],
    variations: [
      vary(3, FLIP),
      vary(4, swap('yellow-tropical'), HIDE),
      vary(5, swap('sea-bream'), FLIP),
      vary(6, HIDE),
      vary(7, HIDE, swap('shell')),
      vary(8, HIDE),
      vary(2, swap('coral-1')),
      vary(9, HIDE),
    ],
  },
];
