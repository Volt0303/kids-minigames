import * as Phaser from 'phaser';
import { readScreenMetrics, ViewportController } from './core/display/ViewportController';
import { computeViewport } from './core/logic/viewport';
import { GAME_TITLES, isGameId } from './games/registry';
import { DevTestScene } from './scenes/DevTestScene';

// Which game this build is for (set by the build script; empty = development test scene).
const gameId = import.meta.env.VITE_GAME as string | undefined;
document.title = isGameId(gameId) ? GAME_TITLES[gameId] : 'Kids Mini Games (dev)';

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
  scene: [DevTestScene],
});

ViewportController.attach(game, initial);
