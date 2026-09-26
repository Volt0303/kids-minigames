import { describe, expect, it } from 'vitest';
import { reduceFlow, secondsLeft, startFlow, type FlowEvent, type FlowState, type StageConfig } from './stageFlow';

const STAGES: StageConfig[] = [
  { goal: 2, durationMs: 60_000 },
  { goal: 3, durationMs: 60_000 },
];

function run(events: FlowEvent[], start: FlowState = startFlow(STAGES)) {
  let state = start;
  const effects: string[] = [];
  for (const event of events) {
    const result = reduceFlow(state, event);
    state = result.state;
    effects.push(...result.effects);
  }
  return { state, effects };
}

describe('clearing a stage', () => {
  it('clears early when the goal is reached', () => {
    const { state, effects } = run([{ type: 'correct' }, { type: 'correct' }]);
    expect(state).toMatchObject({ status: 'cleared', endedBy: 'goal' });
    expect(effects).toEqual(['stage-clear']);
  });

  it('ends positively when time runs out, without failing', () => {
    const { state, effects } = run([{ type: 'correct' }, { type: 'tick', dtMs: 60_000 }]);
    expect(state).toMatchObject({ status: 'cleared', endedBy: 'time', remainingMs: 0, progress: 1 });
    expect(effects).toEqual(['stage-clear']);
  });

  it('moves to the next stage with a fresh timer and progress', () => {
    const { state, effects } = run([{ type: 'tick', dtMs: 60_000 }, { type: 'next' }]);
    expect(state).toMatchObject({ index: 1, progress: 0, remainingMs: 60_000, status: 'playing' });
    expect(effects).toEqual(['stage-clear', 'stage-start']);
  });

  it('finishes the game after the last stage', () => {
    const { state, effects } = run([
      { type: 'tick', dtMs: 60_000 },
      { type: 'next' },
      { type: 'correct' },
      { type: 'correct' },
      { type: 'correct' },
    ]);
    expect(state.status).toBe('finished');
    expect(effects.at(-1)).toBe('all-clear');
  });
});

describe('ignored events', () => {
  it('ignores ticks and correct actions after a stage ended', () => {
    const cleared = run([{ type: 'correct' }, { type: 'correct' }]).state;
    expect(reduceFlow(cleared, { type: 'tick', dtMs: 5000 }).state).toBe(cleared);
    expect(reduceFlow(cleared, { type: 'correct' }).state).toBe(cleared);
  });

  it('ignores next while still playing, or after the game finished', () => {
    expect(run([{ type: 'next' }]).state.index).toBe(0);
    const finished = run([{ type: 'tick', dtMs: 60_000 }, { type: 'next' }, { type: 'tick', dtMs: 60_000 }]).state;
    expect(reduceFlow(finished, { type: 'next' }).state).toBe(finished);
  });
});

describe('hints', () => {
  it('fires after 8 seconds without progress, and again every 8 seconds while still stuck', () => {
    const { effects } = run([
      { type: 'tick', dtMs: 7_900 },
      { type: 'tick', dtMs: 200 },
      { type: 'tick', dtMs: 5_000 },
      { type: 'tick', dtMs: 3_000 },
    ]);
    expect(effects).toEqual(['hint', 'hint']);
  });

  it('restarts the hint clock after a correct action', () => {
    const { effects } = run([{ type: 'tick', dtMs: 7_000 }, { type: 'correct' }, { type: 'tick', dtMs: 7_000 }]);
    expect(effects).toEqual([]);
  });
});

describe('configuration errors', () => {
  it('rejects an empty stage list', () => {
    expect(() => startFlow([])).toThrow(RangeError);
  });
});

describe('secondsLeft', () => {
  it('rounds up so the display never shows 0 while time remains', () => {
    expect(secondsLeft(run([{ type: 'tick', dtMs: 59_100 }]).state)).toBe(1);
    expect(secondsLeft(startFlow(STAGES))).toBe(60);
  });
});
