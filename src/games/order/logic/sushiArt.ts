/**
 * Which pictures make up each sushi. Nigiri are drawn as a topping on rice (the same
 * pictures as the sushi puzzle); the いくら gunkan is one picture.
 */
import { spriteSpec, type SpriteName } from '../../../core/assets/catalog';
import type { SushiKind } from '../stages';

export type SushiFrame = SpriteName<'sushi'>;

export interface SushiArt {
  /** The picture on top (the topping, or the whole gunkan). */
  top: SushiFrame;
  /** Drawn on rice. */
  onRice: boolean;
  /**
   * How much lower than usual the topping sits (design units at scale 1). The shrimp is
   * curved, so its middle would otherwise arch above the rice.
   */
  drop: number;
}

const ART: Record<SushiKind, SushiArt> = {
  tuna: { top: 'topping-tuna', onRice: true, drop: 0 },
  'fatty-tuna': { top: 'topping-fatty-tuna', onRice: true, drop: 0 },
  salmon: { top: 'topping-salmon', onRice: true, drop: 0 },
  shrimp: { top: 'topping-shrimp', onRice: true, drop: 14 },
  egg: { top: 'topping-egg', onRice: true, drop: 0 },
  octopus: { top: 'topping-octopus', onRice: true, drop: 0 },
  squid: { top: 'topping-squid', onRice: true, drop: 0 },
  engawa: { top: 'topping-engawa', onRice: true, drop: 0 },
  ikura: { top: 'gunkan-ikura', onRice: false, drop: 0 },
};

export function sushiArt(kind: SushiKind): SushiArt {
  return ART[kind];
}

/** Japanese name shown in the order (マグロ, エビ…). */
export function sushiName(kind: SushiKind): string {
  return spriteSpec('sushi', ART[kind].top).ja;
}
