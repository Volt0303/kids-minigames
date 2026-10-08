/**
 * Words shown around おさかな探し, exactly as written in the client's mockup.
 */
import type { SpriteName } from '../../core/assets/catalog';
import type { RichLines } from '../../core/ui/RichText';
import type { GameCopy } from '../../core/ui/GameScreen';
import { COLORS } from '../../core/ui/theme';

const tap = { text: 'タップ', color: COLORS.action };

export const FIND_FISH_COPY: GameCopy = {
  howTo: [[{ text: 'お題の' }], [{ text: 'おさかなを' }], [tap, { text: 'しよう!' }]],
  footer: [
    [{ text: 'いろいろな おさかなを みつけて、' }],
    [{ text: 'おさかなはかせ', color: COLORS.action }, { text: 'をめざそう!' }],
  ],
  praise: { title: 'せいかい!', line: 'よく みつけたね!' },
};

/** 「マグロを みつけてね!」 with the fish name highlighted. */
export function findPrompt(name: string): RichLines {
  return [[{ text: name, color: COLORS.highlight }, { text: 'を' }], [{ text: 'みつけてね!' }]];
}

/** Picture before the title in the header. */
export const TITLE_FISH: SpriteName<'fish'> = 'blue-tropical';
