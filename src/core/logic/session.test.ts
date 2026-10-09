import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SESSION_CONFIG as C,
  initialSession,
  reduceSession,
  type SessionEvent,
  type SessionState,
} from './session';

/** Applies events in order and returns the final state and every effect produced. */
function run(events: SessionEvent[], start: SessionState = initialSession(0)) {
  let state = start;
  const effects: string[] = [];
  for (const event of events) {
    const result = reduceSession(state, event);
    state = result.state;
    effects.push(...result.effects);
  }
  return { state, effects };
}

describe('requirement 1: play or not on the start screen', () => {
  it('starts playing when the player chooses to play', () => {
    expect(run([{ type: 'play', at: 1000 }])).toMatchObject({ state: { phase: 'playing' }, effects: ['begin-play'] });
  });

  it('exits when the player chooses not to play', () => {
    expect(run([{ type: 'quit' }])).toMatchObject({ state: { phase: 'exited' }, effects: ['exit'] });
  });

  it('exits after the start-screen idle timeout', () => {
    expect(run([{ type: 'tick', at: C.startIdleMs - 1 }]).effects).toEqual([]);
    expect(run([{ type: 'tick', at: C.startIdleMs }]).effects).toEqual(['exit']);
  });

  it('ignores a second play event', () => {
    expect(
      run([
        { type: 'play', at: 1 },
        { type: 'play', at: 2 },
      ]).effects,
    ).toEqual(['begin-play']);
  });
});

describe('requirement 2: exit when the game ends', () => {
  it('exits when all stages are finished', () => {
    expect(run([{ type: 'play', at: 0 }, { type: 'finished' }]).effects).toEqual(['begin-play', 'exit']);
  });

  it('exits after the play idle timeout, and touches reset it', () => {
    const touched = run([
      { type: 'play', at: 0 },
      { type: 'input', at: 60_000 },
      { type: 'tick', at: C.playIdleMs + 1 },
    ]);
    expect(touched.state.phase).toBe('playing');
    expect(
      run([
        { type: 'play', at: 0 },
        { type: 'tick', at: C.playIdleMs },
      ]).effects,
    ).toContain('exit');
  });

  it('does nothing after exit, even on late timer ticks', () => {
    expect(run([{ type: 'quit' }, { type: 'tick', at: 999_999 }, { type: 'play', at: 1 }]).effects).toEqual(['exit']);
  });
});

describe('requirement 3: pause on app switch, resume on return', () => {
  it('pauses and resumes into the phase it left', () => {
    const result = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 1000 },
      { type: 'foreground', at: 2000 },
    ]);
    expect(result).toMatchObject({ state: { phase: 'playing' }, effects: ['begin-play', 'pause', 'resume'] });
  });

  it('ignores a resume when not paused (Android sends extra resumes)', () => {
    expect(
      run([
        { type: 'play', at: 0 },
        { type: 'foreground', at: 10 },
      ]).effects,
    ).toEqual(['begin-play']);
  });

  it('ignores a second background event', () => {
    const effects = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 1 },
      { type: 'background', at: 2 },
    ]).effects;
    expect(effects).toEqual(['begin-play', 'pause']);
  });

  it('does not time out while paused, and restarts the idle clock on resume', () => {
    const result = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 1000 },
      { type: 'tick', at: C.playIdleMs + 5000 },
      { type: 'foreground', at: C.playIdleMs + 6000 },
      { type: 'tick', at: C.playIdleMs + 7000 },
    ]);
    expect(result.state.phase).toBe('playing');
  });

  it('returns to the start screen after a long pause', () => {
    const result = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 1000 },
      { type: 'foreground', at: 1000 + C.maxPauseMs + 1 },
    ]);
    expect(result).toMatchObject({ state: { phase: 'start' }, effects: ['begin-play', 'pause', 'restart'] });
  });

  it('ignores touches while paused', () => {
    const paused = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 5 },
    ]).state;
    expect(reduceSession(paused, { type: 'input', at: 9 }).state).toBe(paused);
  });
});

describe('relaunch by the order app (how the game returns, since it is hidden from Recents)', () => {
  it('resumes a short pause, and the following foreground event changes nothing', () => {
    const result = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 10 },
      { type: 'relaunch', at: 20 },
      { type: 'foreground', at: 21 },
    ]);
    expect(result).toMatchObject({ state: { phase: 'playing' }, effects: ['begin-play', 'pause', 'resume'] });
  });

  it('starts fresh after a long pause', () => {
    const result = run([
      { type: 'play', at: 0 },
      { type: 'background', at: 10 },
      { type: 'relaunch', at: 10 + C.maxPauseMs + 1 },
    ]);
    expect(result).toMatchObject({ state: { phase: 'start' }, effects: ['begin-play', 'pause', 'restart'] });
  });

  it('changes nothing when the game is already in front', () => {
    expect(
      run([
        { type: 'play', at: 0 },
        { type: 'relaunch', at: 5 },
      ]).effects,
    ).toEqual(['begin-play']);
  });
});

describe("Android's back button", () => {
  it('returns from the game to the start screen, with a fresh idle clock', () => {
    const { state, effects } = run([
      { type: 'play', at: 1 },
      { type: 'back', at: 5_000 },
    ]);
    expect(effects).toEqual(['begin-play', 'restart']);
    expect(state.phase).toBe('start');
    expect(state.lastInputAt).toBe(5_000);
  });

  it('exits from the start screen', () => {
    expect(run([{ type: 'back', at: 1 }])).toMatchObject({ state: { phase: 'exited' }, effects: ['exit'] });
  });

  it('does nothing while paused', () => {
    const { effects } = run([
      { type: 'play', at: 1 },
      { type: 'background', at: 2 },
      { type: 'back', at: 3 },
    ]);
    expect(effects).toEqual(['begin-play', 'pause']);
  });
});
