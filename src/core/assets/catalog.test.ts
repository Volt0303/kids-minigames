import { describe, expect, it } from 'vitest';
import {
  ATLASES,
  atlasKey,
  gameArtExtension,
  gameArtKey,
  hasGameArt,
  spriteNames,
  spriteSpec,
  type AtlasName,
} from './catalog';

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

describe('game art', () => {
  it('knows which games have which pictures', () => {
    expect(hasGameArt('findfish', 'start-title')).toBe(true);
    expect(hasGameArt('diff', 'start-title')).toBe(false);
    expect(hasGameArt(undefined, 'backdrop')).toBe(false);
  });

  it('keeps the transparent title as PNG and the pictures as JPEG', () => {
    expect(gameArtExtension('start-title')).toBe('png');
    expect(gameArtExtension('start-background')).toBe('jpg');
    expect(gameArtExtension('backdrop')).toBe('jpg');
  });

  it('builds texture keys per game and file', () => {
    expect(gameArtKey('findfish', 'backdrop')).toBe('game-findfish-backdrop');
  });
});
