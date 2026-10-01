import * as Phaser from 'phaser';

/** A run of text; `color` overrides the base colour (used to highlight a word). */
export interface Segment {
  text: string;
  color?: string;
}

/** Lines of segments, e.g. [[{ text: 'マグロ', color: red }, { text: 'を' }], [{ text: 'みつけてね！' }]]. */
export type RichLines = readonly (readonly Segment[])[];

export type RichAlign = 'center' | 'left';

const LINE_SPACING = 1.12;

/** Plain lines without highlights. */
export function plain(...lines: string[]): RichLines {
  return lines.map((text) => [{ text }]);
}

/**
 * Multi-line text where single words can have their own colour. Positioned by
 * its vertical middle; horizontally by its centre ('center') or left edge ('left').
 * Content is rebuilt only when it changes (stage changes), never per frame.
 */
export class RichText extends Phaser.GameObjects.Container {
  private blockWidth = 0;
  private blockHeight = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly style: Phaser.Types.GameObjects.Text.TextStyle,
    private readonly align: RichAlign = 'center',
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
  }

  get textWidth(): number {
    return this.blockWidth;
  }

  get textHeight(): number {
    return this.blockHeight;
  }

  setContent(lines: RichLines): this {
    this.removeAll(true);
    const rows = lines.map((line) => this.buildLine(line));
    const lineHeight = Math.max(0, ...rows.map((r) => r.height)) * LINE_SPACING;
    this.blockWidth = Math.max(0, ...rows.map((r) => r.width));
    this.blockHeight = lineHeight * rows.length;

    rows.forEach((row, i) => {
      const y = -this.blockHeight / 2 + lineHeight * (i + 0.5);
      let x = this.align === 'center' ? -row.width / 2 : 0;
      for (const text of row.texts) {
        text.setOrigin(0, 0.5).setPosition(x, y);
        x += text.width;
      }
    });
    return this;
  }

  private buildLine(line: readonly Segment[]): { texts: Phaser.GameObjects.Text[]; width: number; height: number } {
    const texts = line.map((segment) => {
      const style = segment.color ? { ...this.style, color: segment.color } : this.style;
      const text = this.scene.make.text({ text: segment.text, style }, false);
      this.add(text);
      return text;
    });
    return {
      texts,
      width: texts.reduce((sum, t) => sum + t.width, 0),
      height: Math.max(0, ...texts.map((t) => t.height)),
    };
  }
}
