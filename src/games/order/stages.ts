/**
 * Stage settings for 注文のお手伝いゲーム (requirements document, game ⑥).
 * Plain data: the scene reads it; tests check it.
 */
import { SUSHI_KINDS, type SushiKind } from '../../core/assets/sushi';
import type { StageConfig } from '../../core/logic/stageFlow';

/** `goal` is the number of sushi (貫) to serve in the stage, over several orders. */
export interface OrderStage extends StageConfig {
  /** Different kinds in one order. */
  kindsPerOrder: number;
  /** Most pieces of one kind in an order. */
  maxPerKind: number;
  /** Kinds used in this stage, for orders and for the other sushi around them. */
  menu: readonly SushiKind[];
  /** Most sushi on the platter or the shelf for each order, ordered ones included. */
  pieces: number;
  /** Sushi slide past along the shelf instead of standing still on the platter. */
  conveyor: boolean;
  /** Conveyor speed in design units per second. */
  speed: number;
}

export const STAGES: readonly OrderStage[] = [
  // Stage 1: one kind per order; sushi that look very different.
  {
    goal: 6,
    durationMs: 60_000,
    kindsPerOrder: 1,
    maxPerKind: 3,
    menu: ['tuna', 'shrimp', 'egg', 'ikura', 'salmon'],
    pieces: 6,
    conveyor: false,
    speed: 0,
  },
  // Stage 2: two kinds per order, more sushi to choose from.
  {
    goal: 8,
    durationMs: 60_000,
    kindsPerOrder: 2,
    maxPerKind: 2,
    menu: ['tuna', 'salmon', 'shrimp', 'egg', 'octopus', 'squid', 'ikura'],
    pieces: 6,
    conveyor: false,
    speed: 0,
  },
  // Stage 3: three kinds per order (one of each), sliding along the shelf, with look-alikes
  // (マグロ / トロ, イカ / えんがわ). The belt carries only what fits on screen plus one
  // (see OrderScene), so every sushi comes back round within about ten seconds.
  {
    goal: 10,
    durationMs: 60_000,
    kindsPerOrder: 3,
    maxPerKind: 1,
    menu: SUSHI_KINDS,
    pieces: 12,
    conveyor: true,
    speed: 120,
  },
];
