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
}

const ART: Record<SushiKind, SushiArt> = {
  tuna: { top: 'topping-tuna', onRice: true },
  'fatty-tuna': { top: 'topping-fatty-tuna', onRice: true },
  salmon: { top: 'topping-salmon', onRice: true },
  shrimp: { top: 'topping-shrimp', onRice: true },
  egg: { top: 'topping-egg', onRice: true },
  octopus: { top: 'topping-octopus', onRice: true },
  squid: { top: 'topping-squid', onRice: true },
  engawa: { top: 'topping-engawa', onRice: true },
  ikura: { top: 'gunkan-ikura', onRice: false },
};

export function sushiArt(kind: SushiKind): SushiArt {
  return ART[kind];
}

/** Japanese name shown in the order (マグロ, エビ…). */
export function sushiName(kind: SushiKind): string {
  return spriteSpec('sushi', ART[kind].top).ja;
}
