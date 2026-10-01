/**
 * Every sprite and background the six games use. Sprites are grouped into texture atlases.
 *
 * Plain data (no Phaser): read by tools/build-atlases.mjs, which packs the art
 * from assets-src/images/<atlas>/<name>.png — or a labelled placeholder when
 * the art does not exist yet — into public/assets/<atlas>.{png,json}.
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
  ui: {
    'hand-tap': sprite('ゆび', 200, 200),
    magnifier: sprite('むしめがね', 180, 180),
    starfish: sprite('ヒトデ', 180, 180),
    /** Guide character (client-provided げんきくん): normal, correct answer, stage clear. */
    guide: sprite('げんきくん', 300, 420),
    'guide-happy': sprite('げんきくん（やったね）', 300, 420),
    'guide-cheer': sprite('げんきくん（おうえん）', 300, 420),
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

/**
 * Full-screen backgrounds: assets-src/images/backgrounds/<name>.png, converted to
 * public/assets/backgrounds/<name>.jpg by tools/build-images.mjs.
 */
export const BACKGROUNDS = ['sea', 'sushi-counter'] as const;

export type BackgroundName = (typeof BACKGROUNDS)[number];

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
