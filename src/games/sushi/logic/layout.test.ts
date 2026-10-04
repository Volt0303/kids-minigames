import { describe, expect, it } from 'vitest';
import { rect } from '../../../core/logic/rect';
import { cardRects, MIN_CARD, planBoard, planPuzzle } from './layout';

const fields = [rect(24, 224, 1150, 660), rect(24, 224, 3000, 660), rect(24, 224, 1318, 660)];

describe('planPuzzle', () => {
  it('puts the board above the tray, both inside the field', () => {
    for (const field of fields) {
      const { board, tray } = planPuzzle(field);
      expect(board.y + board.height).toBeLessThan(tray.y);
      expect(tray.y + tray.height).toBeLessThanOrEqual(field.y + field.height);
    }
  });
});

describe('cardRects', () => {
  it('fits up to 8 cards in one row inside the tray, without overlapping, large enough to tap', () => {
    for (const field of fields) {
      const { tray } = planPuzzle(field);
      const cards = cardRects(tray, 8);
      for (const [i, card] of cards.entries()) {
        expect(card.x).toBeGreaterThanOrEqual(tray.x);
        expect(card.x + card.width).toBeLessThanOrEqual(tray.x + tray.width);
        expect(card.height).toBeGreaterThanOrEqual(MIN_CARD);
        expect(card.width).toBeGreaterThanOrEqual(MIN_CARD * 0.9);
        const next = cards[i + 1];
        if (next) expect(next.x).toBeGreaterThan(card.x + card.width);
      }
    }
  });
});

describe('planBoard', () => {
  it('stands the sushi on the board, inside the board area', () => {
    for (const field of fields) {
      const area = planPuzzle(field).board;
      const { board, sushi } = planBoard(area, 472 / 220);
      expect(sushi.x).toBeCloseTo(board.x + board.width / 2);
      expect(sushi.y).toBeGreaterThan(area.y);
      expect(board.y + board.height).toBeLessThanOrEqual(area.y + area.height + 0.001);
    }
  });
});
