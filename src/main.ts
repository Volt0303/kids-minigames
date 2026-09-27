import * as Phaser from 'phaser';
import { loadFonts } from './core/display/fonts';
import { readScreenMetrics, ViewportController } from './core/display/ViewportController';
import { computeViewport } from './core/logic/viewport';
import { createPlatform } from './core/platform/createPlatform';
import { START_SCENE_KEY, StartScene } from './core/scenes/StartScene';
import { SessionController } from './core/session/SessionController';
import { GAME_TITLES, isGameId } from './games/registry';
import { DEMO_GAME_SCENE_KEY, DemoGameScene } from './scenes/DemoGameScene';

// Which game this build is for (set by the build script; empty = framework demo game).
const gameId = import.meta.env.VITE_GAME as string | undefined;
const title = isGameId(gameId) ? GAME_TITLES[gameId] : 'テストゲーム';
document.title = title;

function startGame(): Phaser.Game {
  // The canvas is sized in physical pixels; ViewportController keeps it that way on resize.
  const initial = computeViewport(readScreenMetrics());

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b3d6b',
    scale: {
      mode: Phaser.Scale.NONE,
      width: initial.physicalWidth,
      height: initial.physicalHeight,
      zoom: initial.canvasZoom,
    },
    input: { activePointers: 1 },
    // The first scene starts automatically; the session controller switches to the others.
    scene: [new StartScene(title), new DemoGameScene(title)],
  });

  ViewportController.attach(game, initial);
  SessionController.attach(game, createPlatform(), { start: START_SCENE_KEY, play: DEMO_GAME_SCENE_KEY });
  return game;
}

// Text is rendered once into textures, so the font must be ready before the game starts.
void loadFonts().then(() => {
  const game = startGame();
  // Test hook for automated browser tests; removed from production builds.
  if (import.meta.env.DEV) window.__kidsGame = game;
});
