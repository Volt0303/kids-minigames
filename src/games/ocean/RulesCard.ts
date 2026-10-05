import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import { CARD_LABEL_SPACE, drawCard } from '../../core/ui/cardShape';
import { RichText, type RichLines } from '../../core/ui/RichText';
import { COLORS, TEXT } from '../../core/ui/theme';
import type { FishKind, TrashKind } from './stages';

const PADDING = 20;
const GAP = 10;
/** Space under the card's label tab before the first section. */
const TOP_SPACE = 20;
/** Share of a section's height used by its mark and text; the pictures go below. */
/** One line of text per rule. */
const TEXT_SHARE = 0.4;
const OK_COLOR = 0xe5383b;
const NO_COLOR = 0x2b6fd6;
const DIVIDER = 0xf6bccd;

interface Rule {
  mark: 'ok' | 'no';
  lines: RichLines;
  texture: string;
  frames: readonly string[];
}

interface Section {
  mark: 'ok' | 'no';
  text: RichText;
  pictures: Phaser.GameObjects.Image[];
}

/**
 * ①'s 「あそびかた」 card, as in the client's mockup: a red ○ with 「ゴミを タップして あつめよう!」
 * and trash pictures, and a blue ✕ with 「さかなは タップしないでね!」 and fish pictures.
 */
export class RulesCard {
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly marks: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly sections: Section[];

  constructor(scene: Phaser.Scene, rules: { trash: readonly TrashKind[]; fish: readonly FishKind[] }) {
    this.panel = scene.add.graphics();
    this.marks = scene.add.graphics();
    this.label = scene.add.text(0, 0, 'あそびかた', TEXT.cardLabel);
    const section = (rule: Rule): Section => ({
      mark: rule.mark,
      text: new RichText(scene, TEXT.popCard, 'left').setContent(rule.lines),
      pictures: rule.frames.map((frame) => scene.add.image(0, 0, rule.texture, frame)),
    });
    this.sections = [
      section({
        mark: 'ok',
        lines: [[{ text: 'ゴミ', color: COLORS.highlight }, { text: 'を タップして あつめよう!' }]],
        texture: atlasKey('trash'),
        frames: rules.trash,
      }),
      section({
        mark: 'no',
        lines: [[{ text: 'さかな', color: '#2b6fd6' }, { text: 'は タップしないでね!' }]],
        texture: atlasKey('fish'),
        frames: rules.fish,
      }),
    ];
  }

  layout(area: Rect): void {
    drawCard(this.panel, this.label, area, {
      fill: COLORS.howToCard,
      border: COLORS.howToBorder,
      label: COLORS.howToLabel,
    });
    this.marks.clear();
    const top = area.y + CARD_LABEL_SPACE + TOP_SPACE;
    const body = rect(area.x + PADDING, top, area.width - PADDING * 2, area.y + area.height - PADDING - top);
    const half = (body.height - GAP) / 2;
    this.sections.forEach((section, i) =>
      this.layoutSection(section, rect(body.x, body.y + i * (half + GAP), body.width, half)),
    );
    const dividerY = body.y + half + GAP / 2;
    this.panel.lineStyle(3, DIVIDER).lineBetween(body.x, dividerY, body.x + body.width, dividerY);
  }

  private layoutSection(section: Section, area: Rect): void {
    const textHeight = area.height * TEXT_SHARE;
    const markSize = Math.min(textHeight * 0.8, 70);
    this.drawMark(section.mark, area.x + markSize / 2, area.y + textHeight / 2, markSize);
    const textLeft = area.x + markSize + GAP;
    const textWidth = area.x + area.width - textLeft;
    const scale = Math.min(
      1,
      textWidth / Math.max(1, section.text.textWidth),
      textHeight / Math.max(1, section.text.textHeight),
    );
    section.text.setScale(scale).setPosition(textLeft, area.y + textHeight / 2);

    const row = rect(area.x, area.y + textHeight, area.width, area.height - textHeight);
    const cell = row.width / section.pictures.length;
    section.pictures.forEach((picture, i) => {
      const box = rect(row.x + i * cell + 4, row.y + 2, cell - 8, row.height - 4);
      const fit = fitContain(picture.frame.width, picture.frame.height, box);
      picture.setPosition(fit.x, fit.y).setScale(Math.min(fit.scale, 1));
    });
  }

  /** A bold red ○ or blue ✕. */
  private drawMark(mark: 'ok' | 'no', x: number, y: number, size: number): void {
    const line = size * 0.18;
    const r = (size - line) / 2;
    if (mark === 'ok') {
      this.marks.lineStyle(line, OK_COLOR).strokeCircle(x, y, r);
      return;
    }
    this.marks
      .lineStyle(line, NO_COLOR)
      .lineBetween(x - r, y - r, x + r, y + r)
      .lineBetween(x - r, y + r, x + r, y - r);
  }
}
