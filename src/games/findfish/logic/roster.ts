/**
 * Chooses the fish for one stage: the target, how many of it appear, and the
 * other fish around it. Randomness is passed in, so results are testable.
 */
import { LOOK_ALIKES, type Fish, type FindFishStage } from '../stages';

/** Returns a number in [0, 1), like Math.random. */
export type Random = () => number;

export interface Roster {
  target: Fish;
  /** Every fish on screen, in random order; contains exactly `targets` copies of the target. */
  fish: Fish[];
  targets: number;
}

function pick<T>(items: readonly T[], random: Random): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new RangeError('pick: empty list');
  return item;
}

function shuffle<T>(items: T[], random: Random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

interface RosterContext {
  stage: FindFishStage;
  all: readonly Fish[];
  random: Random;
}

/** Other fish: look-alikes first when the stage wants them, then any fish that is not the target. */
function decoys(target: Fish, count: number, { stage, all, random }: RosterContext): Fish[] {
  const similar = LOOK_ALIKES[target] ?? [];
  const others = all.filter((f) => f !== target && !similar.includes(f));
  const result: Fish[] = [];
  if (stage.lookAlikes) {
    // About a third of the decoys look like the target.
    const lookAlikeCount = Math.min(count, Math.max(2, Math.round(count / 3)));
    for (let i = 0; i < lookAlikeCount && similar.length > 0; i++) result.push(pick(similar, random));
  }
  while (result.length < count) result.push(pick(others, random));
  return result;
}

/**
 * @param capacity how many fish fit on this screen (may be below stage.fishCount)
 * @param all every fish that exists in the art catalog
 */
export function buildRoster(stage: FindFishStage, capacity: number, all: readonly Fish[], random: Random): Roster {
  const target = pick(stage.targetPool, random);
  const total = Math.max(stage.goal, Math.min(stage.fishCount, capacity));
  const fish = [
    ...Array.from({ length: stage.goal }, () => target),
    ...decoys(target, total - stage.goal, { stage, all, random }),
  ];
  return { target, fish: shuffle(fish, random), targets: stage.goal };
}
