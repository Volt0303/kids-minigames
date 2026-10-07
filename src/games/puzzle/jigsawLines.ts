import type * as Phaser from 'phaser';
import { PUZZLE_SIZE, PUZZLES, type PuzzleName } from '../../core/assets/puzzles';
import { pieceOutline, tabSize } from '../../core/logic/jigsaw';
import type { Rect } from '../../core/logic/rect';

/** Draws every piece's jigsaw outline of `picture` over `area` (where the whole picture is shown). */
export function strokeJigsaw(graphics: Phaser.GameObjects.Graphics, picture: PuzzleName, area: Rect): void {
  const { cols, rows } = PUZZLES[picture];
  const width = PUZZLE_SIZE.width / cols;
  const height = PUZZLE_SIZE.height / rows;
  const tab = tabSize(width, height);
  const scale = area.width / PUZZLE_SIZE.width;
  for (let i = 0; i < cols * rows; i++) {
    const left = (i % cols) * width - tab;
    const top = Math.floor(i / cols) * height - tab;
    const points = pieceOutline(i, { cols, rows, width, height });
    graphics.beginPath();
    points.forEach((p, k) => {
      const x = area.x + (left + p.x) * scale;
      const y = area.y + (top + p.y) * scale;
      if (k === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    });
    graphics.closePath().strokePath();
  }
}
