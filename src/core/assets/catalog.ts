/**
 * Every sprite and background the six games use. Sprites are grouped into texture atlases.
 *
 * Plain data (no Phaser): read by tools/build-atlases.mjs and tools/build-images.mjs.
 * Source art lives in assets-src/images/ (see assets-src/README.md):
 *   atlases/<atlas>/<name>.png   → packed into public/assets/<atlas>.{png,json}
 *                                  (a labelled placeholder when the art does not exist yet)
 *   backgrounds/<name>.png       → public/assets/backgrounds/<name>.jpg
 *   games/<game>/<file>.png      → public/assets/games/<game>/<file>.jpg|png
 *
 * `width` / `height`: display size in design units (screen 1080 tall).
 * Art is scaled to fit inside this box. Fish and sea creatures face LEFT.
 * `ja`: the name shown or spoken to the child (hiragana/katakana).
 */

export interface SpriteSpec {
  ja: string;
  width: number;
  height: number;
}

const sprite = (ja: string, width: number, height: number): SpriteSpec => ({ ja, width, height });

export const ATLASES = {
  fish: {
    tuna: sprite('マグロ', 360, 170),
    bonito: sprite('カツオ', 330, 160),
    salmon: sprite('サーモン', 340, 170),
    'sea-bream': sprite('タイ', 320, 200),
    yellowtail: sprite('ブリ', 350, 160),
    flatfish: sprite('ヒラメ', 300, 190),
    'striped-orange': sprite('オレンジの さかな', 240, 160),
    'blue-tropical': sprite('あおい さかな', 240, 170),
    'yellow-tropical': sprite('きいろい さかな', 230, 190),
    pufferfish: sprite('フグ', 240, 220),
    octopus: sprite('タコ', 260, 250),
    squid: sprite('イカ', 200, 300),
    turtle: sprite('カメ', 320, 240),
    crab: sprite('カニ', 250, 190),
  },
  sushi: {
    rice: sprite('シャリ', 300, 150),
    'topping-tuna': sprite('マグロ', 320, 140),
    'topping-fatty-tuna': sprite('トロ', 320, 140),
    'topping-salmon': sprite('サーモン', 320, 140),
    'topping-shrimp': sprite('エビ', 330, 150),
    'topping-egg': sprite('たまご', 310, 150),
    'topping-octopus': sprite('タコ', 320, 140),
    'topping-squid': sprite('イカ', 320, 140),
    'topping-engawa': sprite('えんがわ', 320, 140),
    'gunkan-ikura': sprite('いくら', 280, 210),
    geta: sprite('げた', 900, 220),
    plate: sprite('おさら', 380, 130),
  },
  trash: {
    can: sprite('あきかん', 150, 230),
    'pet-bottle': sprite('ペットボトル', 130, 320),
    'plastic-bag': sprite('ビニールぶくろ', 250, 270),
    'glass-bottle': sprite('びん', 120, 310),
    'food-tray': sprite('トレー', 270, 150),
    net: sprite('あみ', 290, 230),
  },
  props: {
    teacup: sprite('ゆのみ', 170, 190),
    'soy-dish': sprite('しょうゆ', 230, 130),
    wasabi: sprite('わさび', 150, 120),
    ginger: sprite('ガリ', 180, 130),
  },
  /** Shared interface pictures: buttons (btn-*) and small icons (icon-*). */
  ui: {
    /** Start screen buttons (the yellow rays are part of the pictures). */
    'btn-start': sprite('あそぶ', 600, 425),
    'btn-close': sprite('やめる', 460, 452),
    'icon-hand-tap': sprite('ゆび', 200, 200),
    'icon-magnifier': sprite('むしめがね', 180, 180),
    'icon-clock': sprite('とけい', 120, 120),
    'icon-star': sprite('ほし', 120, 110),
    /** Message panel with bubbles at both ends; stretched in the middle only (nine-slice). */
    'panel-message': sprite('メッセージ', 1000, 340),
    'deco-bubbles': sprite('あわ', 180, 180),
  },
  /** Characters around the play field. */
  characters: {
    /** Guide character (client-provided げんきくん, games ①–④ only): normal and 「やったね」 poses. */
    guide: sprite('げんきくん', 300, 420),
    'guide-happy': sprite('げんきくん（やったね）', 300, 420),
    /** Starfish next to the message. */
    starfish: sprite('ヒトデ', 180, 180),
    /** Turtle next to the title in the header (game ⑥, as in the client's mockup). */
    turtle: sprite('カメ', 260, 260),
  },
  scenery: {
    'seaweed-1': sprite('かいそう', 200, 520),
    'seaweed-2': sprite('かいそう', 180, 440),
    'rock-1': sprite('いわ', 380, 230),
    'rock-2': sprite('いわ', 300, 200),
    'coral-1': sprite('さんご', 320, 300),
    'coral-2': sprite('さんご', 280, 260),
    starfish: sprite('ヒトデ', 170, 170),
    shell: sprite('かい', 170, 150),
    bubble: sprite('あわ', 80, 80),
  },
} as const satisfies Record<string, Record<string, SpriteSpec>>;

export type AtlasName = keyof typeof ATLASES;
export type SpriteName<A extends AtlasName> = keyof (typeof ATLASES)[A] & string;

/** Play-field pictures shared by games: assets-src/images/backgrounds/<name>.png (built to JPEG). */
export const BACKGROUNDS = ['sea', 'sushi-counter'] as const;

export type BackgroundName = (typeof BACKGROUNDS)[number];

/**
 * Pictures that belong to one game: assets-src/images/games/<game>/<file>.png.
 * - start-background: start-screen picture (JPEG)
 * - start-title:      start-screen title logo, transparent (PNG)
 * - header-title:     flatter title logo for the game screen's header, transparent (PNG)
 * - backdrop:         full-screen picture behind the game screen (JPEG)
 * A game shows the plain look for any file it does not list here.
 */
export const GAME_ART_FILES = ['start-background', 'start-title', 'header-title', 'backdrop'] as const;

export type GameArtFile = (typeof GAME_ART_FILES)[number];

export const GAME_ART = {
  findfish: ['start-background', 'start-title', 'header-title', 'backdrop'],
  // order: its header-title picture has its own background, so the header shows the start-screen logo.
  order: ['start-background', 'start-title', 'backdrop'],
} as const satisfies Record<string, readonly GameArtFile[]>;

export type GameArtGame = keyof typeof GAME_ART;

/** Whether `game` has its own `file` (false for games without any game art). */
export function hasGameArt(game: string | undefined, file: GameArtFile): game is GameArtGame {
  if (!game || !(game in GAME_ART)) return false;
  const files: readonly GameArtFile[] = GAME_ART[game as GameArtGame];
  return files.includes(file);
}

/** File extension after the build: transparent pictures stay PNG, the rest become JPEG. */
export function gameArtExtension(file: GameArtFile): 'png' | 'jpg' {
  return file === 'start-title' || file === 'header-title' ? 'png' : 'jpg';
}

/** Phaser texture key of a game's picture. */
export function gameArtKey(game: GameArtGame, file: GameArtFile): string {
  return `game-${game}-${file}`;
}

/** Where a game's picture is served from (relative, like Phaser's own loader paths). */
export function gameArtUrl(game: GameArtGame, file: GameArtFile): string {
  return `assets/games/${game}/${file}.${gameArtExtension(file)}`;
}

/**
 * The guide character's happy pose, built on its own (not packed into the `characters` atlas)
 * so the pre-game loading screen can show it before Phaser has loaded anything. Games without
 * the guide character (per GAME_HAS_GUIDE in games/registry.ts) must not use this.
 */
export const LOADING_GUIDE_URL = 'assets/loading-guide.png';

/**
 * The loading-screen picture for games without the guide character (⑤ ⑥): our own starfish
 * (also shown in every game's message bar), built on its own for the same reason.
 */
export const LOADING_MASCOT_URL = 'assets/loading-mascot.png';

/** Phaser texture key of a background. */
export function backgroundKey(name: BackgroundName): string {
  return `bg-${name}`;
}

/** Phaser texture key of an atlas. */
export function atlasKey(atlas: AtlasName): string {
  return `atlas-${atlas}`;
}

export function spriteSpec<A extends AtlasName>(atlas: A, name: SpriteName<A>): SpriteSpec {
  const specs: Record<string, SpriteSpec> = ATLASES[atlas];
  const spec = specs[name];
  if (!spec) throw new Error(`Unknown sprite ${atlas}/${name}`);
  return spec;
}

export function spriteNames<A extends AtlasName>(atlas: A): SpriteName<A>[] {
  return Object.keys(ATLASES[atlas]) as SpriteName<A>[];
}
