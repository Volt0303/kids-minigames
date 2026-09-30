/**
 * Stage settings for おさかな探し (requirements document 7.3).
 * Plain data: the scene reads it; tests check it.
 */
import type { SpriteName } from '../../core/assets/catalog';
import type { StageConfig } from '../../core/logic/stageFlow';

export type Fish = SpriteName<'fish'>;

export interface FindFishStage extends StageConfig {
  /** Fish on screen, including the targets (fewer if the screen is too narrow). */
  fishCount: number;
  rows: number;
  /** Swimming speed in design units per second. */
  speed: number;
  /** One of these is chosen as the fish to find. */
  targetPool: readonly Fish[];
  /** Include fish that look like the target (stage 3). */
  lookAlikes: boolean;
}

/** Fish that are easy to confuse with the key fish. */
export const LOOK_ALIKES: Partial<Record<Fish, readonly Fish[]>> = {
  tuna: ['bonito', 'yellowtail'],
  salmon: ['yellowtail'],
  'sea-bream': ['striped-orange'],
};

export const STAGES: readonly FindFishStage[] = [
  // Stage 1: very different shapes, slow.
  {
    goal: 3,
    durationMs: 60_000,
    fishCount: 8,
    rows: 3,
    speed: 70,
    targetPool: ['octopus', 'crab', 'turtle', 'pufferfish'],
    lookAlikes: false,
  },
  // Stage 2: more fish.
  {
    goal: 4,
    durationMs: 60_000,
    fishCount: 12,
    rows: 4,
    speed: 90,
    targetPool: ['sea-bream', 'salmon', 'flatfish', 'squid', 'yellow-tropical'],
    lookAlikes: false,
  },
  // Stage 3: look-alikes (マグロ / カツオ / ブリ), faster.
  {
    goal: 5,
    durationMs: 60_000,
    fishCount: 15,
    rows: 4,
    speed: 120,
    targetPool: ['tuna'],
    lookAlikes: true,
  },
];
