/** The six games. Each one is built into its own Android app. */
export const GAME_IDS = ['ocean', 'sushi', 'findfish', 'puzzle', 'diff', 'order'] as const;

export type GameId = (typeof GAME_IDS)[number];

export const GAME_TITLES: Record<GameId, string> = {
  ocean: '海のおそうじゲーム',
  sushi: 'お寿司パズル',
  findfish: 'おさかな探し',
  puzzle: 'おさかなパズル',
  diff: '間違い探し',
  order: '注文のお手伝いゲーム',
};

export function isGameId(value: string | undefined): value is GameId {
  return !!value && (GAME_IDS as readonly string[]).includes(value);
}
