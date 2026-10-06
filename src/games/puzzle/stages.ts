/**
 * Stage settings for おさかなパズル (requirements document, game ④).
 * Plain data: the scene reads it; tests check it.
 */
import { pieceCount, type PuzzleName } from '../../core/assets/puzzles';
import type { StageConfig } from '../../core/logic/stageFlow';

/** `goal` is the number of pieces: the stage is cleared when the picture is complete. */
export interface PuzzleStage extends StageConfig {
  picture: PuzzleName;
}

const stage = (picture: PuzzleName): PuzzleStage => ({ goal: pieceCount(picture), durationMs: 60_000, picture });

export const STAGES: readonly PuzzleStage[] = [
  // Stage 1: 4 pieces (2 × 2).
  stage('tuna'),
  // Stage 2: 6 pieces (3 × 2).
  stage('sea-bream'),
  // Stage 3: 6 pieces, a different picture.
  stage('sushi'),
];
