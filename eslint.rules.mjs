/**
 * Quality rules, grouped by the requirement each rule serves so the reason a
 * rule exists stays attached to it.
 *
 * What a linter cannot decide:
 *  - Algorithmic efficiency. The `complexity` group gates its proxies —
 *    branching, nesting, function size. A quadratic hit-test inside a small
 *    tidy function still passes; that is what review is for.
 *  - Per-frame cost in games (allocating objects inside `update()`, creating
 *    tweens every frame). Reviewed by hand; see CONTRIBUTING.md.
 */

export const MAX_FILE_LINES = 300;

export const correctnessRules = {
  // Unhandled async is the most common source of silent failure.
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/require-await': 'error',

  // Throw and reject with Errors, never bare strings — a string has no stack.
  '@typescript-eslint/only-throw-error': 'error',
  '@typescript-eslint/prefer-promise-reject-errors': 'error',

  // A swallowed exception is worse than a crash: it hides the fault.
  'no-empty': ['error', { allowEmptyCatch: false }],
  'no-unsafe-finally': 'error',
  'no-fallthrough': 'error',

  // Adding a game, stage type or layout mode must break every switch that
  // handles it, at build time.
  '@typescript-eslint/switch-exhaustiveness-check': 'error',

  // Shipped code reports problems through warn/error only.
  'no-console': ['error', { allow: ['warn', 'error'] }],
};

export const robustnessRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',

  // `foo!` asserts a fact the compiler cannot see; handle the null instead.
  '@typescript-eslint/no-non-null-assertion': 'error',

  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' },
  ],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-var': 'error',
  'prefer-const': 'error',
};

export const complexityRules = {
  'max-lines': ['error', { max: MAX_FILE_LINES, skipBlankLines: false, skipComments: false }],
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: false, skipComments: false, IIFEs: true }],
  complexity: ['error', { max: 10 }],
  'max-depth': ['error', 3],
  'max-params': ['error', 4],
  'max-nested-callbacks': ['error', 3],
  'max-classes-per-file': ['error', 1],
  'no-await-in-loop': 'warn',
};

/**
 * Design rule: game rules and stage data stay engine-independent so they can
 * be unit-tested and survive an engine change. Applied to `logic/` folders and
 * `stages.ts` files.
 */
export const pureLogicRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['phaser', 'phaser/*'], message: 'Logic modules must not depend on Phaser.' },
        { group: ['@capacitor/*'], message: 'Logic modules must not depend on Capacitor.' },
        { group: ['**/scenes/**', '**/ui/**'], message: 'Logic modules must not import scenes or UI.' },
      ],
    },
  ],
  'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage'],
};

/** Relaxations for tests and build tools — linear, not shipped. */
export const testOverrides = {
  'max-lines-per-function': 'off',
  'max-nested-callbacks': 'off',
  'no-console': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
};
