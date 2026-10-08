/**
 * Stage progression shared by every game: each stage ends when its goal is
 * reached or its time runs out (no failure — time-out still ends positively),
 * then the next stage starts; after the last stage the game is finished.
 * Also decides when a hint is due: every HINT_DELAY_MS without progress, repeatedly.
 * A game may take time off the clock (e.g. for using a hint button): never down to zero, so
 * the stage never ends because of it.
 *
 * Pure reducer. The scene ticks it on a timer (not every frame) and performs
 * the returned effects.
 */

export interface StageConfig {
  /** Correct actions needed to clear the stage early. */
  goal: number;
  durationMs: number;
}

export type FlowStatus = 'playing' | 'cleared' | 'finished';

export interface FlowState {
  stages: readonly StageConfig[];
  index: number;
  progress: number;
  remainingMs: number;
  /** Time since the last correct action or the last hint. */
  sinceProgressMs: number;
  status: FlowStatus;
  /** Why the current stage ended (only meaningful when cleared or finished). */
  endedBy: 'goal' | 'time';
}

export type FlowEvent =
  { type: 'tick'; dtMs: number } | { type: 'correct' } | { type: 'next' } | { type: 'spend'; ms: number };

export type FlowEffect = 'stage-start' | 'hint' | 'stage-clear' | 'all-clear';

export interface FlowResult {
  state: FlowState;
  effects: FlowEffect[];
}

export const HINT_DELAY_MS = 8_000;
/** Taking time off never leaves less than this (an already lower clock is left as it is). */
export const MIN_LEFT_AFTER_SPEND_MS = 1_000;

function stageStart(stages: readonly StageConfig[], index: number): FlowState {
  const stage = stages[index];
  if (!stage) throw new RangeError(`stageFlow: no stage at index ${index}`);
  return {
    stages,
    index,
    progress: 0,
    remainingMs: stage.durationMs,
    sinceProgressMs: 0,
    status: 'playing',
    endedBy: 'goal',
  };
}

export function startFlow(stages: readonly StageConfig[]): FlowState {
  if (stages.length === 0) throw new RangeError('stageFlow: at least one stage is required');
  return stageStart(stages, 0);
}

export function currentStage(state: FlowState): StageConfig {
  const stage = state.stages[state.index];
  if (!stage) throw new RangeError(`stageFlow: no stage at index ${state.index}`);
  return stage;
}

function endStage(state: FlowState, endedBy: FlowState['endedBy']): FlowResult {
  const isLast = state.index === state.stages.length - 1;
  return {
    state: { ...state, status: isLast ? 'finished' : 'cleared', endedBy },
    effects: [isLast ? 'all-clear' : 'stage-clear'],
  };
}

function onTick(state: FlowState, dtMs: number, hintDelayMs: number): FlowResult {
  const next = { ...state, remainingMs: state.remainingMs - dtMs, sinceProgressMs: state.sinceProgressMs + dtMs };
  if (next.remainingMs <= 0) return endStage({ ...next, remainingMs: 0 }, 'time');
  // Restart the hint clock so a child who is still stuck gets another hint later.
  if (next.sinceProgressMs >= hintDelayMs) return { state: { ...next, sinceProgressMs: 0 }, effects: ['hint'] };
  return { state: next, effects: [] };
}

function onCorrect(state: FlowState): FlowResult {
  const next = { ...state, progress: state.progress + 1, sinceProgressMs: 0 };
  return next.progress >= currentStage(next).goal ? endStage(next, 'goal') : { state: next, effects: [] };
}

/** Takes `ms` off the clock, down to MIN_LEFT_AFTER_SPEND_MS at the lowest; also counts as help. */
function onSpend(state: FlowState, ms: number): FlowResult {
  const floor = Math.min(state.remainingMs, MIN_LEFT_AFTER_SPEND_MS);
  const remainingMs = Math.max(floor, state.remainingMs - Math.max(0, ms));
  return { state: { ...state, remainingMs, sinceProgressMs: 0 }, effects: [] };
}

export function reduceFlow(state: FlowState, event: FlowEvent, hintDelayMs = HINT_DELAY_MS): FlowResult {
  switch (event.type) {
    case 'tick':
      return state.status === 'playing' ? onTick(state, event.dtMs, hintDelayMs) : { state, effects: [] };
    case 'correct':
      return state.status === 'playing' ? onCorrect(state) : { state, effects: [] };
    case 'spend':
      return state.status === 'playing' ? onSpend(state, event.ms) : { state, effects: [] };
    case 'next':
      return state.status === 'cleared'
        ? { state: stageStart(state.stages, state.index + 1), effects: ['stage-start'] }
        : { state, effects: [] };
  }
}

/** Whole seconds left, rounded up, for the timer display. */
export function secondsLeft(state: FlowState): number {
  return Math.ceil(state.remainingMs / 1000);
}
