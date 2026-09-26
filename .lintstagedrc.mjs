/**
 * Runs on staged files only, which keeps the pre-commit hook fast.
 * Each entry blocks the commit when it fails.
 */
const config = {
  '*.{ts,js,mjs,cjs,java,kt,gradle,html,css}': 'node tools/check-file-size.mjs',
  'src/**/*.ts': 'eslint --max-warnings=0 --no-warn-ignored',
  '*.{ts,mjs,json,html,css}': 'prettier --check',
};

export default config;
