/**
 * The sushi shared by the sushi games (② お寿司パズル, ⑥ 注文のお手伝い): which kinds there
 * are and which pictures make each one. Nigiri are drawn as a topping on rice; the いくら
 * gunkan is one picture.
 */
import { spriteSpec, type SpriteName } from './catalog';

/** The sushi used by the sushi games (② puzzle, ⑥ orders). */
export const SUSHI_KINDS = [
  'tuna',
  'fatty-tuna',
  'salmon',
  'shrimp',
  'egg',
  'octopus',
  'squid',
  'engawa',
  'ikura',
] as const;

export type SushiKind = (typeof SUSHI_KINDS)[number];

export type SushiFrame = SpriteName<'sushi'>;

export interface SushiArt {
  /** The picture on top (the topping, or the whole gunkan). */
  top: SushiFrame;
  /** Drawn on rice. */
  onRice: boolean;
  /** The topping on its own, as chosen in ② お寿司パズル's tray (for a gunkan: the loose roe). */
  piece: SushiFrame;
  /**
   * How much lower than usual the topping sits (design units at scale 1). The shrimp is
   * curved, so its middle would otherwise arch above the rice.
   */
  drop: number;
}

const ART: Record<SushiKind, SushiArt> = {
  tuna: { top: 'topping-tuna', onRice: true, piece: 'topping-tuna', drop: 0 },
  'fatty-tuna': { top: 'topping-fatty-tuna', onRice: true, piece: 'topping-fatty-tuna', drop: 0 },
  salmon: { top: 'topping-salmon', onRice: true, piece: 'topping-salmon', drop: 0 },
  shrimp: { top: 'topping-shrimp', onRice: true, piece: 'topping-shrimp', drop: 14 },
  egg: { top: 'topping-egg', onRice: true, piece: 'topping-egg', drop: 0 },
  octopus: { top: 'topping-octopus', onRice: true, piece: 'topping-octopus', drop: 0 },
  squid: { top: 'topping-squid', onRice: true, piece: 'topping-squid', drop: 0 },
  engawa: { top: 'topping-engawa', onRice: true, piece: 'topping-engawa', drop: 0 },
  ikura: { top: 'gunkan-ikura', onRice: false, piece: 'topping-ikura', drop: 0 },
};

export function sushiArt(kind: SushiKind): SushiArt {
  return ART[kind];
}

/** Japanese name shown in the order (マグロ, エビ…). */
export function sushiName(kind: SushiKind): string {
  return spriteSpec('sushi', ART[kind].top).ja;
}

/** A nigiri picture (topping on rice), in design units at scale 1: see core/ui/Nigiri. */
export const NIGIRI_SIZE = { width: 230, height: 215 } as const;

/**
 * Where the rice and the topping sit relative to the nigiri's centre, at scale 1: the
 * topping rests on the upper part of the rice. A gunkan is one picture at the centre.
 */
export const NIGIRI_LAYOUT = { riceY: 34, toppingY: 0 } as const;

/** Vertical position of the top picture (topping or gunkan) relative to the nigiri's centre, at scale 1. */
export function topY(kind: SushiKind): number {
  const art = ART[kind];
  return art.onRice ? NIGIRI_LAYOUT.toppingY + art.drop : 0;
}

/**
 * Where the topping on its own lands on the rice, relative to the nigiri's centre, at scale 1.
 * For a gunkan the loose roe lands like any topping, then becomes the gunkan picture (topY).
 */
export function pieceY(kind: SushiKind): number {
  return ART[kind].onRice ? topY(kind) : NIGIRI_LAYOUT.toppingY;
}
