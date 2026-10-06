/**
 * Which kind of trash appears next in 海のおそうじゲーム: a shuffled deck of every kind, so all
 * kinds come round before any repeats, skipping kinds already in the sea when possible.
 * Randomness is injected so tests can fix it.
 */
import { shuffle, type Random } from '../../../core/logic/random';

export class TrashDeck<K> {
  private deck: K[] = [];

  constructor(
    private readonly kinds: readonly K[],
    private readonly random: Random,
  ) {}

  /** The next kind: the first in the deck that is not in the sea (or simply the next one). */
  next(inSea: readonly K[]): K {
    if (this.deck.length === 0) this.deck = shuffle(this.kinds, this.random);
    let index = this.deck.findIndex((kind) => !inSea.includes(kind));
    if (index < 0) {
      // Only kinds already in the sea are left: start a fresh deck behind them.
      this.deck.push(...shuffle(this.kinds, this.random));
      index = this.deck.findIndex((kind) => !inSea.includes(kind));
    }
    const [kind] = this.deck.splice(Math.max(0, index), 1);
    if (kind === undefined) throw new RangeError('trashDeck: no kinds');
    return kind;
  }
}
