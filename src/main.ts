import * as Phaser from 'phaser';
import { loadFonts } from './core/display/fonts';
import { readScreenMetrics, ViewportController } from './core/display/ViewportController';
import { computeViewport } from './core/logic/viewport';
import { createPlatform } from './core/platform/createPlatform';
import { COLORS, toCssHex } from './core/ui/theme';
import { START_SCENE_KEY, StartScene } from './core/scenes/StartScene';
import { SessionController } from './core/session/SessionController';
import { GAME_TITLES, isGameId } from './games/registry';
import { createGameScene } from './games/scenes';

// Which game this build is for: set by the build script (VITE_GAME), or in development
// by the page address, e.g. http://127.0.0.1:5173/?game=findfish. Empty = framework demo.
const requested =
  (import.meta.env.VITE_GAME as string | undefined) ??
  (import.meta.env.DEV ? (new URLSearchParams(window.location.search).get('game') ?? undefined) : undefined);
const gameId = isGameId(requested) ? requested : undefined;
const title = gameId ? GAME_TITLES[gameId] : 'テストゲーム';
const play = createGameScene(gameId, title);
document.title = title;

function startGame(): Phaser.Game {
  // The canvas is sized in physical pixels; ViewportController keeps it that way on resize.
  const initial = computeViewport(readScreenMetrics());

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: toCssHex(COLORS.background),
    scale: {
      mode: Phaser.Scale.NONE,
      width: initial.physicalWidth,
      height: initial.physicalHeight,
      zoom: initial.canvasZoom,
    },
    input: { activePointers: 1 },
    // Phaser caps each frame's time step at 1/60 s for its first 120 frames (and after every
    // resume). On a tablet drawing 20–30 frames a second, that made everything move at a third
    // to half speed for the first seconds of a stage. Long stalls are still capped (fps.min).
    fps: { panicMax: 0 },
    // The first scene starts automatically; the session controller switches to the others.
    scene: [new StartScene(title), play.scene],
  });

  ViewportController.attach(game, initial);
  SessionController.attach(game, createPlatform(), { start: START_SCENE_KEY, play: play.key });
  return game;
}

// Text is rendered once into textures, so the font must be ready before the game starts.
void loadFonts().then(() => {
  const game = startGame();
  // Test hook for automated browser tests; removed from production builds.
  if (import.meta.env.DEV) window.__kidsGame = game;
});
