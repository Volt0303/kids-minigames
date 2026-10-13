import { PUZZLE_SIZE, PUZZLES, type PuzzleName } from '../../core/assets/puzzles';
import { pieceOutline, tabSize } from '../../core/logic/jigsaw';

/**
 * Draws every piece's jigsaw outline of `picture` into a 2D canvas `size` pixels large (where
 * the whole picture is shown). Drawn as a picture rather than as Phaser line paths: on some
 * tablets' graphics chips those paths were drawn with stray diagonal lines.
 */
export function strokeJigsaw(
  ctx: CanvasRenderingContext2D,
  picture: PuzzleName,
  size: { width: number; height: number },
): void {
  const { cols, rows } = PUZZLES[picture];
  const width = PUZZLE_SIZE.width / cols;
  const height = PUZZLE_SIZE.height / rows;
  const tab = tabSize(width, height);
  const scale = size.width / PUZZLE_SIZE.width;
  for (let i = 0; i < cols * rows; i++) {
    const left = (i % cols) * width - tab;
    const top = Math.floor(i / cols) * height - tab;
    ctx.beginPath();
    pieceOutline(i, { cols, rows, width, height }).forEach((p, k) => {
      const x = (left + p.x) * scale;
      const y = (top + p.y) * scale;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
}
