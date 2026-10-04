/**
 * Words shown around お寿司パズル, following the client's mockup
 * (instructions in hiragana / katakana).
 */
import type { GameCopy } from '../../core/ui/GameScreen';
import type { RichLines } from '../../core/ui/RichText';
import { COLORS } from '../../core/ui/theme';

export const SUSHI_COPY: GameCopy = {
  howTo: [
    [{ text: 'お題と おなじ ネタを' }],
    [{ text: 'シャリの うえに' }],
    [{ text: 'のせよう!', color: COLORS.action }],
  ],
  footer: [
    [{ text: 'ネタを えらんで、' }],
    [{ text: 'おいしい おすし', color: COLORS.action }, { text: 'を つくろう!' }],
  ],
  praise: { title: 'せいかい!', line: 'できたね!' },
};

/** The bubble above the board, as in the client's mockup (with 「のせてね!」 highlighted). */
export const INSTRUCTION: RichLines = [
  [{ text: 'えらんだ ネタを シャリの うえに ' }, { text: 'のせてね!', color: COLORS.action }],
];
