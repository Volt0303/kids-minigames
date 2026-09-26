import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { complexityRules, correctnessRules, pureLogicRules, robustnessRules, testOverrides } from './eslint.rules.mjs';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'android/**', 'tools/**', '*.config.mjs', 'eslint.rules.mjs'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: { ...correctnessRules, ...robustnessRules, ...complexityRules },
  },
  {
    files: ['src/**/logic/**/*.ts', 'src/games/*/stages.ts'],
    ignores: ['**/*.test.ts'],
    rules: pureLogicRules,
  },
  {
    files: ['**/*.test.ts'],
    rules: testOverrides,
  },
  prettier,
);
