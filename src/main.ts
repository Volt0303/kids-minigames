import * as Phaser from 'phaser';
import { DevTestScene } from './scenes/DevTestScene';
import { GAME_TITLES, isGameId } from './games/registry';

// Which game this build is for (set by the build script; empty = development test scene).
const gameId = import.meta.env.VITE_GAME as string | undefined;
document.title = isGameId(gameId) ? GAME_TITLES[gameId] : 'Kids Mini Games (dev)';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b3d6b',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: { activePointers: 1 },
  scene: [DevTestScene],
});
