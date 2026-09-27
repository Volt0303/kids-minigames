import { describe, expect, it } from 'vitest';
import { ATLASES, atlasKey, spriteNames, spriteSpec, type AtlasName } from './catalog';

const atlases = Object.keys(ATLASES) as AtlasName[];

describe('sprite catalog', () => {
  it.each(atlases)('%s: names are lowercase kebab-case, so they match the art file names', (atlas) => {
    for (const name of spriteNames(atlas)) expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(atlases)('%s: every sprite has a Japanese name and a size that fits a texture atlas', (atlas) => {
    for (const name of spriteNames(atlas)) {
      const { ja, width, height } = spriteSpec(atlas, name);
      expect(ja.length).toBeGreaterThan(0);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(Math.max(width, height)).toBeLessThanOrEqual(1024);
    }
  });

  it('builds atlas texture keys', () => {
    expect(atlasKey('fish')).toBe('atlas-fish');
  });

  it('rejects unknown sprites', () => {
    expect(() => spriteSpec('fish', 'shark' as never)).toThrow('Unknown sprite fish/shark');
  });
});
