/**
 * Words shown around 間違い探し (instructions in hiragana / katakana).
 */
import type { GameCopy } from '../../core/ui/GameScreen';
import type { RichLines } from '../../core/ui/RichText';
import { COLORS } from '../../core/ui/theme';

export const DIFF_COPY: GameCopy = {
  howTo: [[{ text: 'ちがう ところを' }], [{ text: 'タップ', color: COLORS.action }, { text: 'しよう!' }]],
  footer: [[{ text: '2まいの えを よく みて、' }], [{ text: 'ちがいを ぜんぶ みつけよう!', color: COLORS.action }]],
  praise: { title: 'せいかい!', line: 'よく みつけたね!' },
};

/** The one-line instruction above the two pictures. */
export const INSTRUCTION: RichLines = [
  [{ text: 'ふたつの えで ちがう ところを ' }, { text: 'タップ', color: COLORS.action }, { text: 'してね!' }],
];
