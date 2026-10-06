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

/** The 「お題」 card: the picture to make. */
export const PUZZLE_PROMPT: RichLines = [
  [{ text: 'この え', color: COLORS.highlight }, { text: 'を' }],
  [{ text: 'つくろう!' }],
];
