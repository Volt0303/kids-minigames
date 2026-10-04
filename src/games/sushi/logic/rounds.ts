/**
 * Which sushi to make next in お寿司パズル. Randomness is injected so tests can fix it.
 */
import type { SushiKind } from '../../../core/assets/sushi';
import { pick, type Random } from '../../../core/logic/random';
import { LOOK_ALIKES } from '../stages';

/**
 * The next sushi to ask for: one of the stage's toppings, never the same as the one just
 * made. When the tray has look-alikes, half of the orders ask for one of them, so the
 * child has to look carefully (マグロ next to トロ).
 */
export function nextTarget(choices: readonly SushiKind[], previous: SushiKind | undefined, random: Random): SushiKind {
  const fresh = choices.filter((kind) => kind !== previous);
  const pool = fresh.length > 0 ? fresh : choices;
  const tricky = pool.filter((kind) => {
    const twin = LOOK_ALIKES[kind];
    return twin !== undefined && choices.includes(twin);
  });
  if (tricky.length > 0 && random() < 0.5) return pick(tricky, random);
  return pick(pool, random);
}
