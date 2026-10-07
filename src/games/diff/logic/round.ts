/**
 * One play of a 間違い探し stage: a random scene of the stage, mirrored half of the time, with
 * `goal` differences on different items, each one of the changes its item allows. So the
 * pictures differ from play to play while the two always match except where intended.
 */
import { pick, shuffle, type Random } from '../../../core/logic/random';
import type { Item, Round, Scene } from './scene';

/** The scene's items seen in a mirror: left and right swapped, every picture turned. */
export function mirrored(items: readonly Item[]): Item[] {
  return items.map((item) => ({ ...item, x: 1 - item.x, flip: !(item.flip ?? false) }));
}

export function makeRound(scenes: readonly Scene[], goal: number, random: Random): Round {
  const scene = pick(scenes, random);
  if (scene.variations.length < goal) {
    throw new RangeError(`diff: a scene offers ${scene.variations.length} differences, ${goal} needed`);
  }
  const items = random() < 0.5 ? mirrored(scene.items) : scene.items;
  const differences = shuffle(scene.variations, random)
    .slice(0, goal)
    .map((variation) => ({ item: variation.item, change: pick(variation.changes, random) }));
  return { setting: scene.setting, items, differences };
}
