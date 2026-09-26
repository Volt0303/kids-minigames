#!/usr/bin/env node
/**
 * Fails when a source file exceeds the project's line limit.
 *
 * Counts every line, including blanks and comments — the literal reading of
 * the rule, and the one that cannot be gamed by reformatting.
 *
 * Usage:
 *   node tools/check-file-size.mjs [files...]   check the given files (lint-staged)
 *   node tools/check-file-size.mjs              check every tracked or new file
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const LIMIT = Number(process.env.MAX_FILE_LINES ?? 300);
const WARN_AT = Math.floor(LIMIT * 0.9);
const EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.cjs', '.java', '.kt', '.gradle', '.html', '.css']);
const IGNORED = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)\.gradle\//,
  /(^|\/)android\/app\/src\/main\/assets\/public\//,
  /(^|\/)android\/capacitor-cordova-android-plugins\//,
];

/** Files passed as arguments, or the whole repository when called with none. */
function listFiles() {
  const fromArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const candidates =
    fromArgs.length > 0
      ? fromArgs
      : execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
          .split('\n')
          .filter(Boolean);

  return candidates
    .filter((file) => EXTENSIONS.has(extname(file)))
    .filter((file) => !IGNORED.some((pattern) => pattern.test(file)))
    .filter((file) => {
      try {
        return statSync(file).isFile();
      } catch {
        return false; // deleted but still listed by git
      }
    });
}

function countLines(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  // A trailing newline produces a final empty element that is not a real line.
  if (lines.at(-1) === '') lines.pop();
  return lines.length;
}

function main() {
  let files;
  try {
    files = listFiles();
  } catch (error) {
    console.error(`check-file-size: could not list files via git — ${error.message}`);
    process.exit(2);
  }

  const violations = [];
  const warnings = [];

  for (const file of files) {
    let lines;
    try {
      lines = countLines(file);
    } catch (error) {
      console.error(`check-file-size: could not read ${file} — ${error.message}`);
      process.exit(2);
    }
    if (lines > LIMIT) violations.push({ file, lines });
    else if (lines >= WARN_AT) warnings.push({ file, lines });
  }

  for (const { file, lines } of warnings.sort((a, b) => b.lines - a.lines)) {
    console.warn(`  warn  ${String(lines).padStart(4)}  ${file}  (limit ${LIMIT})`);
  }

  if (violations.length === 0) {
    console.log(`check-file-size: ${files.length} files checked, all within ${LIMIT} lines.`);
    return;
  }

  console.error(`\ncheck-file-size: ${violations.length} file(s) over the ${LIMIT}-line limit:\n`);
  for (const { file, lines } of violations.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${String(lines).padStart(4)}  ${file}  (+${lines - LIMIT})`);
  }
  console.error('\nSplit them along their seams — a file this long usually holds more than one responsibility.\n');
  process.exit(1);
}

main();
