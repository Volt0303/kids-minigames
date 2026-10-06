import { describe, expect, it } from 'vitest';
import { TRASH_KINDS } from '../stages';
import { TrashDeck } from './trashDeck';

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

describe('TrashDeck', () => {
  it('shows every kind once before any kind repeats (with nothing in the sea)', () => {
    const deck = new TrashDeck(TRASH_KINDS, seeded(5));
    for (let round = 0; round < 3; round++) {
      const drawn = TRASH_KINDS.map(() => deck.next([]));
      expect(new Set(drawn).size).toBe(TRASH_KINDS.length);
    }
  });

  it('avoids kinds already in the sea', () => {
    const deck = new TrashDeck(TRASH_KINDS, seeded(9));
    const inSea = ['can', 'net', 'paper-cup'] as const;
    for (let i = 0; i < 20; i++) expect(inSea).not.toContain(deck.next(inSea));
  });
});
