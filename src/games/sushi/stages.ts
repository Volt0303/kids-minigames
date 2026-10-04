/**
 * Stage settings for お寿司パズル (requirements document, game ②).
 * Plain data: the scene reads it; tests check it.
 */
import type { SushiKind } from '../../core/assets/sushi';
import type { StageConfig } from '../../core/logic/stageFlow';

/** `goal` is the number of sushi to make (orders) in the stage. */
export interface SushiPuzzleStage extends StageConfig {
  /** Toppings in the tray to choose from; each order asks for one of them. */
  choices: readonly SushiKind[];
}

export const STAGES: readonly SushiPuzzleStage[] = [
  // Stage 1: 4 toppings that look very different.
  { goal: 5, durationMs: 60_000, choices: ['tuna', 'shrimp', 'egg', 'ikura'] },
  // Stage 2: 6 toppings.
  { goal: 5, durationMs: 60_000, choices: ['tuna', 'salmon', 'shrimp', 'egg', 'octopus', 'ikura'] },
  // Stage 3: 8 toppings, as in the client's mockup, with look-alikes (マグロ / トロ, イカ / えんがわ).
  {
    goal: 5,
    durationMs: 60_000,
    choices: ['tuna', 'fatty-tuna', 'salmon', 'shrimp', 'egg', 'octopus', 'squid', 'engawa'],
  },
];

/** Toppings that are easy to confuse; stage 3 asks for these more often. */
export const LOOK_ALIKES: Partial<Record<SushiKind, SushiKind>> = {
  tuna: 'fatty-tuna',
  'fatty-tuna': 'tuna',
  squid: 'engawa',
  engawa: 'squid',
};
