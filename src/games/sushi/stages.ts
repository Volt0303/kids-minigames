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
  // The tray always shows all six slots filled; the stages get harder through the toppings.
  // Stage 1: six toppings that look very different.
  { goal: 5, durationMs: 60_000, choices: ['tuna', 'shrimp', 'egg', 'ikura', 'octopus', 'salmon'] },
  // Stage 2: one look-alike pair (マグロ / トロ).
  { goal: 5, durationMs: 60_000, choices: ['tuna', 'fatty-tuna', 'shrimp', 'egg', 'ikura', 'salmon'] },
  // Stage 3: two look-alike pairs (マグロ / トロ, イカ / えんがわ).
  {
    goal: 5,
    durationMs: 60_000,
    choices: ['tuna', 'fatty-tuna', 'squid', 'engawa', 'salmon', 'shrimp'],
  },
];

/** Toppings that are easy to confuse; stage 3 asks for these more often. */
export const LOOK_ALIKES: Partial<Record<SushiKind, SushiKind>> = {
  tuna: 'fatty-tuna',
  'fatty-tuna': 'tuna',
  squid: 'engawa',
  engawa: 'squid',
};
