/**
 * Stage settings for 海のおそうじゲーム (requirements document, game ①).
 * Plain data: the scene reads it; tests check it.
 */
import type { SpriteName } from '../../core/assets/catalog';
import type { StageConfig } from '../../core/logic/stageFlow';

export type TrashKind = SpriteName<'trash'>;
export type FishKind = SpriteName<'fish'>;

/** `goal` is the number of pieces of trash to collect. */
export interface OceanStage extends StageConfig {
  /** Pieces of trash in the sea at any time (a new one appears for each one collected). */
  trashOnScreen: number;
  /** How fast trash sinks, in field heights per second. */
  sinkSpeed: number;
  /** Fish swimming by (they must not be tapped). */
  fishCount: number;
  /** Swimming lanes for the fish. */
  lanes: number;
  /** Fish speed in design units per second. */
  fishSpeed: number;
  /** Some trash drifts behind the fish (still tappable through them). */
  trashBehindFish: boolean;
}

export const TRASH_KINDS: readonly TrashKind[] = [
  'can',
  'pet-bottle',
  'plastic-bag',
  'glass-bottle',
  'food-tray',
  'net',
  'paper-cup',
];

/** Small, friendly fish (no big fish that would hide most of the trash). */
export const FISH_KINDS: readonly FishKind[] = [
  'yellow-tropical',
  'blue-tropical',
  'striped-orange',
  'sea-bream',
  'pufferfish',
  'salmon',
  'crab',
];

export const STAGES: readonly OceanStage[] = [
  // Stage 1: slow, few fish.
  {
    goal: 8,
    durationMs: 60_000,
    trashOnScreen: 3,
    sinkSpeed: 0.05,
    fishCount: 3,
    lanes: 3,
    fishSpeed: 60,
    trashBehindFish: false,
  },
  // Stage 2: more fish.
  {
    goal: 10,
    durationMs: 60_000,
    trashOnScreen: 4,
    sinkSpeed: 0.07,
    fishCount: 6,
    lanes: 3,
    fishSpeed: 80,
    trashBehindFish: false,
  },
  // Stage 3: faster; some trash partly behind the fish.
  {
    goal: 12,
    durationMs: 60_000,
    trashOnScreen: 4,
    sinkSpeed: 0.09,
    fishCount: 8,
    lanes: 4,
    fishSpeed: 110,
    trashBehindFish: true,
  },
];
