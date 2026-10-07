import type * as Phaser from 'phaser';
import { puzzleKey, type PuzzleName } from '../../core/assets/puzzles';
import { rect, type Rect } from '../../core/logic/rect';
import { POP_FONT_FAMILY } from '../../core/ui/theme';
import { BLUE_LABEL, LabelPicture, PINK_LABEL, RIBBON } from './LabelPicture';
import { LABEL_SPACE, RIBBON_SPACE, TOP_ROW } from './logic/board';

/** Warm, rich yellow panel (the board mat stays light so the picture reads well). */
const YELLOW = { fill: 0xffdf8a, edge: 0xf2a922, inner: 0xfff3d0 };
/** Soft warm shadow under the board and the tray, for depth. */
const SHADOW = { color: 0x9a5a00, alpha: 0.28, offset: 10 };
const PINK = { fill: 0xfde4ee, edge: 0xf6a5c0 };
const TRAY = { fill: 0xffeab0, edge: 0xe9a43a };
const RADIUS = 30;
/** Space between the label's tail and the board's corner. */
const LABEL_GAP = 22;
/** Behind the board, the pieces and everything else in the field. */
const DEPTH = -30;
const font = (size: number): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: POP_FONT_FAMILY,
  fontStyle: '800',
  fontSize: `${size}px`,
  color: '#ffffff',
});

/**
 * The two big panels of おさかなパズル from the design: the yellow 「パズルを うごかそう!」 panel
 * (board area and the cream tray strip) and the pink 「えを かんせいさせよう!」 panel with the
 * finished picture and the 「かんせいず」 ribbon.
 */
export class PuzzlePanels {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly puzzleLabel: LabelPicture;
  private readonly previewLabel: LabelPicture;
  private readonly ribbonLabel: LabelPicture;
  private readonly preview: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(DEPTH);
    this.puzzleLabel = new LabelPicture(
      scene,
      BLUE_LABEL,
      scene.add.text(0, 0, 'パズルを うごかそう!', font(40)),
      DEPTH + 3,
    );
    this.previewLabel = new LabelPicture(
      scene,
      PINK_LABEL,
      scene.add.text(0, 0, 'えを かんせいさせよう!', font(40)),
      DEPTH + 3,
    );
    this.ribbonLabel = new LabelPicture(scene, RIBBON, scene.add.text(0, 0, 'かんせいず', font(48)), DEPTH + 3);
    this.preview = scene.add
      .image(0, 0, puzzleKey('tuna'))
      .setOrigin(0)
      .setDepth(DEPTH + 1);
  }

  show(picture: PuzzleName): void {
    this.preview.setTexture(puzzleKey(picture));
  }

  layout(parts: { puzzlePanel: Rect; tray: Rect; board: Rect; previewPanel: Rect; preview: Rect }): void {
    const g = this.graphics.clear();
    this.panel(g, parts.puzzlePanel, YELLOW.fill, YELLOW.edge);
    // A white mat under the board, and the cream tray strip.
    const mat = rect(parts.board.x - 12, parts.board.y - 12, parts.board.width + 24, parts.board.height + 24);
    const t = parts.tray;
    g.fillStyle(SHADOW.color, SHADOW.alpha)
      .fillRoundedRect(mat.x + SHADOW.offset, mat.y + SHADOW.offset, mat.width, mat.height, 20)
      .fillRoundedRect(t.x + SHADOW.offset * 0.6, t.y + SHADOW.offset * 0.6, t.width, t.height, 22);
    g.fillStyle(YELLOW.inner).fillRoundedRect(mat.x, mat.y, mat.width, mat.height, 20);
    g.lineStyle(6, YELLOW.edge).strokeRoundedRect(mat.x, mat.y, mat.width, mat.height, 20);
    g.fillStyle(TRAY.fill).fillRoundedRect(parts.tray.x, parts.tray.y, parts.tray.width, parts.tray.height, 22);
    g.lineStyle(4, TRAY.edge).strokeRoundedRect(parts.tray.x, parts.tray.y, parts.tray.width, parts.tray.height, 22);
    const labelHeight = TOP_ROW - 12;
    // The label's tail points at the board picture's top-left corner, from a little above it.
    const tail = this.puzzleLabel.tailOffset(labelHeight);
    this.puzzleLabel.place({
      x: parts.board.x - tail.x - LABEL_GAP * 0.4,
      y: parts.board.y - tail.y - LABEL_GAP,
      height: labelHeight,
      maxWidth: parts.puzzlePanel.x + parts.puzzlePanel.width - parts.board.x,
    });

    this.panel(g, parts.previewPanel, PINK.fill, PINK.edge);
    this.previewLabel.place({
      x: parts.previewPanel.x + parts.previewPanel.width / 2,
      y: parts.previewPanel.y + 4,
      height: LABEL_SPACE - 4,
      maxWidth: parts.previewPanel.width - 30,
      centre: true,
    });
    const p = parts.preview;
    g.fillStyle(0xffffff).fillRoundedRect(p.x - 10, p.y - 10, p.width + 20, p.height + 20, 18);
    g.lineStyle(6, YELLOW.edge).strokeRoundedRect(p.x - 10, p.y - 10, p.width + 20, p.height + 20, 18);
    this.preview.setPosition(p.x, p.y).setDisplaySize(p.width, p.height);
    this.ribbon(parts.previewPanel, p);
  }

  private panel(g: Phaser.GameObjects.Graphics, area: Rect, fill: number, edge: number): void {
    g.fillStyle(0xffffff, 0.85).fillRoundedRect(area.x - 6, area.y - 6, area.width + 12, area.height + 12, RADIUS + 6);
    g.fillStyle(fill).fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    g.lineStyle(6, edge).strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
  }

  /** The 「かんせいず」 ribbon under the finished picture. */
  private ribbon(panel: Rect, picture: Rect): void {
    const height = RIBBON_SPACE + 10;
    this.ribbonLabel.place({
      x: panel.x + panel.width / 2,
      y: picture.y + picture.height + 4,
      height,
      maxWidth: Math.min(panel.width - 40, picture.width * 0.95),
      centre: true,
    });
  }
}
