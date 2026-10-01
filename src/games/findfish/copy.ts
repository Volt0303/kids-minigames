/**
 * Words shown around おさかな探し, following the client's mockup (hiragana per
 * requirements document 6.7).
 */
import type { SpriteName } from '../../core/assets/catalog';
import type { RichLines } from '../../core/ui/RichText';
import type { GameCopy } from '../../core/ui/GameScreen';
import { COLORS } from '../../core/ui/theme';

const tap = { text: 'タップ', color: COLORS.action };

export const FIND_FISH_COPY: GameCopy = {
  subtitle: [[{ text: 'おだいの おさかなを' }], [tap, { text: 'して みつけよう！' }]],
  howTo: [[{ text: 'おだいの' }], [{ text: 'おさかなを' }], [tap, { text: 'しよう！' }]],
  footer: [
    [{ text: 'いろいろな おさかなを みつけて、' }],
    [{ text: 'おさかな' }, { text: 'はかせ', color: COLORS.action }, { text: 'を めざそう！' }],
  ],
  praise: { title: 'せいかい！', line: 'よく みつけたね！' },
};

/** 「マグロを みつけてね！」 with the fish name highlighted. */
export function findPrompt(name: string): RichLines {
  return [[{ text: name, color: COLORS.highlight }, { text: 'を' }], [{ text: 'みつけてね！' }]];
}

/** Picture before the title in the header. */
export const TITLE_FISH: SpriteName<'fish'> = 'blue-tropical';
