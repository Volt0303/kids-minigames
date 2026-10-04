import { describe, expect, it } from 'vitest';
import { pick, shuffle } from './random';

const sequence = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe('pick', () => {
  it('picks by the random value', () => {
    expect(pick(['a', 'b', 'c', 'd'], () => 0.5)).toBe('c');
  });

  it('rejects an empty list', () => {
    expect(() => pick([], () => 0)).toThrow(RangeError);
  });
});

describe('shuffle', () => {
  it('keeps every item and leaves the input unchanged', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, sequence([0.9, 0.1, 0.5, 0.3]));
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});
