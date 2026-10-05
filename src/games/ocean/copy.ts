/**
 * Words shown around 海のおそうじゲーム, following the client's mockup
 * (instructions in hiragana / katakana).
 */
import type { GameCopy } from '../../core/ui/GameScreen';
import type { RichLines } from '../../core/ui/RichText';
import { COLORS } from '../../core/ui/theme';

const tap = { text: 'タップ', color: COLORS.action };

export const OCEAN_COPY: GameCopy = {
  howTo: [
    [{ text: 'ゴミを ' }, tap, { text: 'して' }],
    [{ text: 'あつめよう!' }],
    [{ text: 'さかなは タップしないでね' }],
  ],
  footer: [[{ text: 'ゴミを ひろって、' }], [{ text: 'うみを きれいに', color: COLORS.action }, { text: ' しよう!' }]],
  praise: { title: 'せいかい!', line: 'きれいに なったね!' },
};

/** The 「お題」 card: 「ゴミだけを タップしてね!」 on one line (so it can be large), 「ゴミ」 highlighted. */
export const TRASH_PROMPT: RichLines = [[{ text: 'ゴミ', color: COLORS.highlight }, { text: 'だけを タップしてね!' }]];
