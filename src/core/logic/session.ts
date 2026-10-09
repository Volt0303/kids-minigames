/**
 * Session rules shared by every game (client integration requirements):
 *  1. The player chooses to play or not on the start screen.
 *  2. The app exits itself when the game ends or the player quits.
 *  3. Switching to another app pauses; returning resumes.
 * Plus: idle timeouts, and a fresh start after a long pause or a relaunch. Android's back
 * button returns from a game to the start screen, and exits from the start screen.
 *
 * Pure reducer: (state, event) -> (next state, effects to perform). No timers,
 * no platform calls — the caller supplies the time and executes the effects.
 */

export type SessionPhase = 'start' | 'playing' | 'paused' | 'exited';

export type SessionEvent =
  | { type: 'play'; at: number }
  | { type: 'quit' }
  | { type: 'back'; at: number }
  | { type: 'finished' }
  | { type: 'input'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'background'; at: number }
  | { type: 'foreground'; at: number }
  | { type: 'relaunch'; at: number };

/** What the caller must do after an event. */
export type SessionEffect = 'begin-play' | 'pause' | 'resume' | 'restart' | 'exit';

export interface SessionState {
  phase: SessionPhase;
  /** Phase to return to when a pause ends. */
  resumeTo: 'start' | 'playing';
  pausedAt: number;
  lastInputAt: number;
}

export interface SessionConfig {
  /** No touch on the start screen for this long -> exit. */
  startIdleMs: number;
  /** No touch during play for this long -> exit. */
  playIdleMs: number;
  /** Paused longer than this -> back to the start screen on return. */
  maxPauseMs: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  startIdleMs: 30_000,
  playIdleMs: 90_000,
  maxPauseMs: 5 * 60_000,
};

export interface SessionResult {
  state: SessionState;
  effects: SessionEffect[];
}

export function initialSession(now: number): SessionState {
  return { phase: 'start', resumeTo: 'start', pausedAt: 0, lastInputAt: now };
}

const unchanged = (state: SessionState): SessionResult => ({ state, effects: [] });

const toStart = (at: number, effects: SessionEffect[]): SessionResult => ({ state: initialSession(at), effects });

const exit = (state: SessionState): SessionResult => ({ state: { ...state, phase: 'exited' }, effects: ['exit'] });

function onPlay(state: SessionState, at: number): SessionResult {
  if (state.phase !== 'start') return unchanged(state);
  return { state: { ...state, phase: 'playing', lastInputAt: at }, effects: ['begin-play'] };
}

function onInput(state: SessionState, at: number): SessionResult {
  if (state.phase === 'paused') return unchanged(state);
  return { state: { ...state, lastInputAt: at }, effects: [] };
}

/** Back: from the game to the start screen; from the start screen out of the app. */
function onBack(state: SessionState, at: number): SessionResult {
  if (state.phase === 'playing') return toStart(at, ['restart']);
  if (state.phase === 'start') return exit(state);
  return unchanged(state);
}

function onTick(state: SessionState, at: number, config: SessionConfig): SessionResult {
  const idle = at - state.lastInputAt;
  if (state.phase === 'start' && idle >= config.startIdleMs) return exit(state);
  if (state.phase === 'playing' && idle >= config.playIdleMs) return exit(state);
  return unchanged(state);
}

function onBackground(state: SessionState, at: number): SessionResult {
  if (state.phase !== 'start' && state.phase !== 'playing') return unchanged(state);
  return { state: { ...state, phase: 'paused', resumeTo: state.phase, pausedAt: at }, effects: ['pause'] };
}

/** Idempotent: Android reports "active" more often than "inactive", so extra resumes are ignored. */
function onForeground(state: SessionState, at: number, config: SessionConfig): SessionResult {
  if (state.phase !== 'paused') return unchanged(state);
  if (at - state.pausedAt > config.maxPauseMs) return toStart(at, ['restart']);
  return { state: { ...state, phase: state.resumeTo, lastInputAt: at }, effects: ['resume'] };
}

function handle(state: SessionState, event: SessionEvent, config: SessionConfig): SessionResult {
  switch (event.type) {
    case 'play':
      return onPlay(state, event.at);
    case 'quit':
    case 'finished':
      return exit(state);
    case 'back':
      return onBack(state, event.at);
    case 'input':
      return onInput(state, event.at);
    case 'tick':
      return onTick(state, event.at, config);
    case 'background':
      return onBackground(state, event.at);
    case 'foreground':
      return onForeground(state, event.at, config);
    case 'relaunch':
      // The game is hidden from Recents, so being launched again is how it "returns":
      // resume a short pause, start fresh after a long one, ignore it when already in front.
      return onForeground(state, event.at, config);
  }
}

export function reduceSession(
  state: SessionState,
  event: SessionEvent,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
): SessionResult {
  // Once exited, nothing else may happen (e.g. a late timer tick).
  if (state.phase === 'exited') return unchanged(state);
  return handle(state, event, config);
}
