/**
 * Stage settings for 間違い探し (requirements document, game ⑤). Each picture is assembled
 * from sprites, and the right picture is the left one with a few differences applied — so
 * the pair always matches exactly except where intended (AI cannot draw controlled pairs).
 * Every stage has several scenes; each play picks one and its differences at random.
 * Plain data: the scene reads it; tests check it.
 */
import type { StageConfig } from '../../core/logic/stageFlow';
import type { Scene } from './logic/scene';
import { SEA_EASY, SEA_FULL } from './logic/seaScenes';
import { SUSHI_TABLE } from './logic/sushiScenes';

export type { Change, Difference, Item, Round, Setting } from './logic/scene';

/** `goal` differences, in one of the stage's scenes (picked each play: logic/round.ts). */
export interface DiffStage extends StageConfig {
  scenes: readonly Scene[];
}

export const STAGES: readonly DiffStage[] = [
  // Stage 1: the sea, 3 differences that are easy to see.
  { goal: 3, durationMs: 60_000, scenes: SEA_EASY },
  // Stage 2: fuller sea scenes, 4 differences.
  { goal: 4, durationMs: 60_000, scenes: SEA_FULL },
  // Stage 3: a big sushi table, 5 differences.
  { goal: 5, durationMs: 60_000, scenes: SUSHI_TABLE },
];
