import type { GameScene } from '../core/scenes/GameScene';
import { DEMO_GAME_SCENE_KEY, DemoGameScene } from '../scenes/DemoGameScene';
import { FIND_FISH_SCENE_KEY, FindFishScene } from './findfish/FindFishScene';
import type { GameId } from './registry';

export interface GameEntry {
  key: string;
  scene: GameScene;
}

/** The play scene for a game. Games not built yet use the framework demo. */
export function createGameScene(id: GameId | undefined, title: string): GameEntry {
  switch (id) {
    case 'findfish':
      return { key: FIND_FISH_SCENE_KEY, scene: new FindFishScene(title) };
    case 'ocean':
    case 'sushi':
    case 'puzzle':
    case 'diff':
    case 'order':
    case undefined:
      return { key: DEMO_GAME_SCENE_KEY, scene: new DemoGameScene(title) };
  }
}
