# Coding Standards

Every change must follow these rules. The mechanical ones are enforced before each commit;
the rest are checked in review.

## Rules

1. **No file over 300 lines.** Every line counts, including blank lines and comments.
   When a file approaches the limit, split it along a real responsibility boundary, not at an arbitrary line.
2. **Explicit error handling.** No empty `catch`, no floating promises, throw `Error` objects only.
   Errors from the platform layer (Capacitor, browser APIs) are handled at that boundary.
3. **Robust types.** No `any`, no non-null assertions (`!`), no unchecked casts of untrusted data.
   `switch` statements over union types must be exhaustive.
4. **Efficient algorithms and frame cost.**
   - Nothing is allocated inside `update()` or other per-frame code; reuse objects.
   - Objects that appear and disappear repeatedly (fish, trash, sushi) come from an object pool.
   - Hit-testing uses Phaser's input system and hit areas, not loops over every object on every pointer event.
   - Work that can happen at build time (cutting puzzle pieces, packing texture atlases) is not done at runtime.
5. **Design.**
   - Game rules and stage data live in `logic/` folders and `stages.ts` files and **never import Phaser,
     Capacitor, scenes or browser globals**. They are plain TypeScript with unit tests.
   - Scenes are thin: they draw, animate and forward input to the logic.
   - Stages are data (configuration objects), not code branches.
   - `src/games/<id>` may depend on `src/core`; `src/core` never depends on a game; games never depend on each other.
6. **Maintainability.** Platform features (exit, pause/resume, audio, storage) sit behind interfaces owned by
   `src/core`, with a Capacitor implementation for Android and a browser implementation for development.
   Changing a platform detail means changing one adapter, not every game.

## Limits enforced by ESLint

| Rule | Limit |
|---|---|
| Lines per file | 300 |
| Lines per function | 60 |
| Cyclomatic complexity | 10 |
| Nesting depth | 3 |
| Parameters per function | 4 |
| Nested callbacks | 3 |
| Classes per file | 1 |

Tests may exceed the per-function and nesting limits.

## What runs before every commit

The Git pre-commit hook (husky + lint-staged) blocks the commit unless all of these pass:

1. `tools/check-file-size.mjs` — 300-line limit on staged source files
2. ESLint with zero warnings on staged TypeScript (rules in `eslint.rules.mjs`)
3. Prettier formatting check
4. `tsc --noEmit` on the whole project
5. `vitest run` — all unit tests

Run everything at once with `npm run verify`. Fix formatting with `npm run format`.

## What automation cannot check

Rules 4, 5 and 6 are only partly machine-checkable. A linter cannot see a quadratic loop inside a short
function, or an allocation hidden in a helper called every frame. These are reviewed by hand.
