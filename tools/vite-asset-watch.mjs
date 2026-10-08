/**
 * Vite dev-server plugin: rebuilds the game pictures as soon as a source picture in
 * assets-src/images/ is saved, added or removed, then reloads the page — so a new picture
 * shows without restarting `npm run dev` or running `npm run assets` by hand.
 *
 *   atlases/<atlas>/…  → build-atlases (+ build-images: the loading screen uses two characters)
 *   games/<game>/…     → build-images
 *   puzzles/…          → build-puzzles
 *
 * App icons and the Android launch screen only matter in the APK; build:apks rebuilds those.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';

const SOURCE = path.resolve('assets-src/images');
/** Waits this long after the last change, so saving several files runs each tool once. */
const DEBOUNCE_MS = 400;

/** The tools a changed file needs, by its folder under assets-src/images. */
function toolsFor(file) {
  const [folder] = path.relative(SOURCE, file).split(path.sep);
  switch (folder) {
    case 'atlases':
      return ['build-atlases.mjs', 'build-images.mjs'];
    case 'games':
      return ['build-images.mjs'];
    case 'puzzles':
      return ['build-puzzles.mjs'];
    default:
      return [];
  }
}

function run(tool) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`tools/${tool}`], { stdio: ['ignore', 'ignore', 'inherit'] });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${tool} exited with code ${code}`))));
  });
}

export function assetWatch() {
  return {
    name: 'kids-game-asset-watch',
    apply: 'serve',
    configureServer(server) {
      const pending = new Set();
      let timer;
      let running = Promise.resolve();

      const rebuild = () => {
        const tools = [...pending];
        pending.clear();
        running = running.then(async () => {
          try {
            for (const tool of tools) await run(tool);
            server.config.logger.info(`pictures rebuilt (${tools.join(', ')})`, { timestamp: true });
            server.ws.send({ type: 'full-reload' });
          } catch (error) {
            server.config.logger.error(`picture rebuild failed: ${error instanceof Error ? error.message : error}`);
          }
        });
      };

      const onChange = (file) => {
        if (!file.startsWith(SOURCE + path.sep)) return;
        const tools = toolsFor(file);
        if (tools.length === 0) return;
        for (const tool of tools) pending.add(tool);
        clearTimeout(timer);
        timer = setTimeout(rebuild, DEBOUNCE_MS);
      };

      server.watcher.add(SOURCE);
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
