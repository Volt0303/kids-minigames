import { describe, expect, it } from 'vitest';
import { spriteNames, type AtlasName } from '../../../core/assets/catalog';
import { STAGES } from '../stages';
import type { Change, Item, Scene } from './scene';
import { spotOf } from './spots';

const all = STAGES.flatMap((stage) => stage.scenes.map((scene) => ({ stage, scene })));
const exists = (atlas: AtlasName, frame: string): boolean => (spriteNames(atlas) as string[]).includes(frame);

/** Whether `change` can be shown on `item` (nigiri change kind; pictures swap to real frames). */
function fits(item: Item, change: Change): boolean {
  switch (change.kind) {
    case 'hide':
      return true;
    case 'sushi':
      return item.sushi !== undefined && change.to !== item.sushi;
    case 'swap':
      return item.sushi === undefined && exists(item.atlas, change.frame) && change.frame !== item.frame;
    case 'tint':
    case 'flip':
      return item.sushi === undefined;
  }
}

describe('scenes', () => {
  it('every stage has several scenes, each offering enough differences on different items', () => {
    for (const stage of STAGES) {
      expect(stage.scenes.length).toBeGreaterThanOrEqual(3);
      for (const scene of stage.scenes) {
        const items = scene.variations.map((v) => v.item);
        expect(new Set(items).size).toBe(items.length);
        expect(items.length).toBeGreaterThan(stage.goal);
      }
    }
  });

  it('use only sprites that exist, inside the picture, standing only on earlier plain items', () => {
    for (const { scene } of all) {
      scene.items.forEach((item, i) => {
        expect(exists(item.atlas, item.frame), `${item.atlas}/${item.frame}`).toBe(true);
        expect(item.x).toBeGreaterThan(0);
        expect(item.x).toBeLessThan(1);
        expect(item.y).toBeGreaterThan(0);
        expect(item.y).toBeLessThan(1);
        if (item.on === undefined) return;
        expect(item.on).toBeLessThan(i);
        expect(scene.items[item.on]?.on).toBeUndefined();
      });
    }
  });

  it('offer only changes that can be shown on their item', () => {
    const variations = all.flatMap(({ scene }) => scene.variations.map((v) => ({ item: scene.items[v.item], v })));
    for (const { item, v } of variations) {
      expect(item).toBeDefined();
      expect(v.changes.length).toBeGreaterThan(0);
      if (item) for (const change of v.changes) expect(fits(item, change), JSON.stringify(change)).toBe(true);
    }
  });

  it('keep the possible differences apart, so one tap finds one difference', () => {
    const apart = (scene: Scene): void => {
      const spots = scene.variations.map((v) => {
        const item = scene.items[v.item];
        if (!item) throw new RangeError('missing item');
        return { spot: spotOf(item), on: item.on };
      });
      spots.forEach((a, i) =>
        spots.slice(i + 1).forEach((b) => {
          // Only compare places measured the same way (on the picture, or on the same table).
          if (a.on !== b.on) return;
          const distance = Math.hypot((a.spot.x - b.spot.x) * 1.3, a.spot.y - b.spot.y);
          expect(distance).toBeGreaterThan(Math.min(a.spot.radius, b.spot.radius));
        }),
      );
    };
    for (const { scene } of all) apart(scene);
  });
});
