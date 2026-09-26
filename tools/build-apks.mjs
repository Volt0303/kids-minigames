#!/usr/bin/env node
/**
 * Builds one signed release APK per game into release/.
 *
 * Usage:
 *   node tools/build-apks.mjs             all six games
 *   node tools/build-apks.mjs ocean diff  only the listed games
 *
 * Each game gets its own package name (jp.impactmirai.kidsgame.<id>), app
 * name and version, from one codebase. Signing uses android/keystore.properties.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { GAME_IDS, GAME_TITLES } from '../src/games/registry.ts';

const OUT_DIR = 'release';
const BUILT_APK = 'android/app/build/outputs/apk/release/app-release.apk';

function fail(message) {
  console.error(`\nbuild-apks: ${message}\n`);
  process.exit(1);
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

/** 1.2.3 -> 10203: increases with every release, as Android requires. */
function toVersionCode(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 99)) {
    fail(`package.json version "${version}" must be major.minor.patch with parts 0-99`);
  }
  const [major, minor, patch] = parts;
  return major * 10000 + minor * 100 + patch;
}

function selectGames() {
  const requested = process.argv.slice(2);
  if (requested.length === 0) return [...GAME_IDS];
  const unknown = requested.filter((id) => !GAME_IDS.includes(id));
  if (unknown.length > 0) fail(`unknown game id(s): ${unknown.join(', ')}. Known: ${GAME_IDS.join(', ')}`);
  return requested;
}

function buildGame(id, version, versionCode) {
  console.log(`\n=== ${id}: ${GAME_TITLES[id]} ===`);
  run('npx', ['vite', 'build', '--logLevel', 'warn'], { env: { ...process.env, VITE_GAME: id } });
  run('npx', ['cap', 'copy', 'android']);
  run(
    './gradlew',
    [
      'assembleRelease',
      '-q',
      '--console=plain',
      `-PgameId=${id}`,
      `-PgameTitle=${GAME_TITLES[id]}`,
      `-PversionCode=${versionCode}`,
      `-PversionName=${version}`,
    ],
    { cwd: 'android' },
  );
  const target = `${OUT_DIR}/kidsgame-${id}-${version}.apk`;
  copyFileSync(BUILT_APK, target);
  return target;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function main() {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const versionCode = toVersionCode(version);
  const games = selectGames();

  try {
    run('npm', ['run', '--silent', 'typecheck']);
    mkdirSync(OUT_DIR, { recursive: true });
    const apks = games.map((id) => buildGame(id, version, versionCode));
    const sums = apks.map((file) => `${sha256(file)}  ${file.slice(OUT_DIR.length + 1)}`).join('\n');
    writeFileSync(`${OUT_DIR}/SHA256SUMS.txt`, `${sums}\n`);
    console.log(`\nBuilt ${apks.length} APK(s), version ${version} (${versionCode}):`);
    for (const file of apks) console.log(`  ${file}`);
  } catch (error) {
    fail(`build failed — ${error instanceof Error ? error.message : String(error)}`);
  }
}

main();
