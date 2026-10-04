/**
 * Words shown around 注文のお手伝いゲーム, following the client's mockup
 * (instructions in hiragana / katakana).
 */
import type { GameCopy } from '../../core/ui/GameScreen';
import type { RichLines } from '../../core/ui/RichText';
import { COLORS } from '../../core/ui/theme';
import type { Order } from './logic/orders';
import { sushiName } from '../../core/assets/sushi';

const tap = { text: 'タップ', color: COLORS.action };

export const ORDER_COPY: GameCopy = {
  howTo: [[{ text: 'お題と おなじ' }], [{ text: 'おすしを' }], [tap, { text: 'しよう!' }]],
  footer: [
    [{ text: 'ちゅうもんを ' }, { text: 'まちがえないでね!', color: COLORS.action }],
    [{ text: 'おすしやさんの おてつだいを しよう!' }],
  ],
  praise: { title: 'せいかい!', line: 'おいしそう!' },
};

/** 「マグロを とってね!」 for one kind; 「ちゅうもんの おすしを とってね!」 for several. */
export function orderPrompt(order: Order): RichLines {
  const first = order[0];
  if (order.length === 1 && first) {
    return [[{ text: sushiName(first.kind), color: COLORS.highlight }, { text: 'を' }], [{ text: 'とってね!' }]];
  }
  return [[{ text: 'ちゅうもんの', color: COLORS.highlight }], [{ text: 'おすしを とってね!' }]];
}
