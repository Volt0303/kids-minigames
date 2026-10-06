/**
 * Puzzle pictures (④ おさかなパズル): assets-src/images/puzzles/<name>.png, cut into
 * rounded-rectangle pieces at build time by tools/build-puzzles.mjs. Plain data, shared by
 * the build tool and the game.
 */

export const PUZZLES = {
  tuna: { cols: 2, rows: 2 },
  'sea-bream': { cols: 3, rows: 2 },
  sushi: { cols: 3, rows: 2 },
} as const satisfies Record<string, { cols: number; rows: number }>;

export type PuzzleName = keyof typeof PUZZLES;

/** Size of the whole picture after the build (pixels; pieces are cut from it). */
export const PUZZLE_SIZE = { width: 1200, height: 800 } as const;

export function pieceCount(name: PuzzleName): number {
  const { cols, rows } = PUZZLES[name];
  return cols * rows;
}

/** Where the whole picture and its pieces are served from (relative, like Phaser's loader paths). */
export function puzzleUrl(name: PuzzleName): string {
  return `assets/puzzles/${name}.jpg`;
}

export function pieceUrl(name: PuzzleName, index: number): string {
  return `assets/puzzles/${name}-${index}.png`;
}

/** Phaser texture keys. */
export function puzzleKey(name: PuzzleName): string {
  return `puzzle-${name}`;
}

export function pieceKey(name: PuzzleName, index: number): string {
  return `puzzle-${name}-${index}`;
}
