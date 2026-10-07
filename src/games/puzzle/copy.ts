/**
 * Words shown around おさかなパズル (instructions in hiragana / katakana).
 */
import type { GameCopy } from '../../core/ui/GameScreen';
import type { RichLines } from '../../core/ui/RichText';
import { COLORS } from '../../core/ui/theme';

export const PUZZLE_COPY: GameCopy = {
  howTo: [
    [{ text: 'ピースを ' }, { text: 'うごかして', color: COLORS.action }],
    [{ text: 'えを かんせい' }],
    [{ text: 'させよう!' }],
  ],
  footer: [[{ text: 'ピースを ただしい ばしょに' }], [{ text: 'はめよう!', color: COLORS.action }]],
  praise: { title: 'ぴったり!', line: 'じょうずだね!' },
};

/** げんきくん's bubble, as in the design (「ドラッグ」 highlighted). */
export const GUIDE_LINES: RichLines = [
  [{ text: 'ピースを ' }, { text: 'ドラッグ', color: COLORS.action }, { text: 'して、' }],
  [{ text: 'ただしい ばしょに おこう!' }],
];

/** Said for a moment when a piece snaps into place. */
export const PRAISE_LINES: RichLines = [[{ text: 'ぴったり!', color: COLORS.highlight }], [{ text: 'じょうずだね!' }]];
