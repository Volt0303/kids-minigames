import type { GameScene, GameSetup } from '../core/scenes/GameScene';
import { DEMO_GAME_SCENE_KEY, DemoGameScene } from '../scenes/DemoGameScene';
import { FIND_FISH_SCENE_KEY, FindFishScene } from './findfish/FindFishScene';
import { ORDER_SCENE_KEY, OrderScene } from './order/OrderScene';
import { GAME_HAS_GUIDE, type GameId } from './registry';
import { SUSHI_PUZZLE_SCENE_KEY, SushiPuzzleScene } from './sushi/SushiPuzzleScene';

export interface GameEntry {
  key: string;
  scene: GameScene;
}

/** The play scene for a game. Games not built yet use the framework demo. */
export function createGameScene(id: GameId | undefined, title: string): GameEntry {
  // The framework demo (no game id) shows the guide so the shared screen can be checked in full.
  const setup: GameSetup = { title, guide: id === undefined || GAME_HAS_GUIDE[id] };
  switch (id) {
    case 'findfish':
      return { key: FIND_FISH_SCENE_KEY, scene: new FindFishScene(setup) };
    case 'order':
      return { key: ORDER_SCENE_KEY, scene: new OrderScene(setup) };
    case 'sushi':
      return { key: SUSHI_PUZZLE_SCENE_KEY, scene: new SushiPuzzleScene(setup) };
    case 'ocean':
    case 'puzzle':
    case 'diff':
    case undefined:
      return { key: DEMO_GAME_SCENE_KEY, scene: new DemoGameScene(setup) };
  }
}
