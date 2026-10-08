import * as Phaser from 'phaser';
import { atlasKey } from '../assets/catalog';
import { RichText } from './RichText';

const UI = atlasKey('ui');

export interface LabelShape {
  frame: string;
  /** End caps that are never stretched, as shares of the picture's width. */
  leftCap: number;
  rightCap: number;
  /** Where the text goes, as shares of the picture's height (its vertical centre). */
  textY: number;
  /** Text height as a share of the picture's height. */
  textShare: number;
  /** Tip of the label's tail (if it has one), as shares of the picture (inside the left cap). */
  tail?: { x: number; y: number };
}

/** The label pictures in the ui atlas (the user's art): blue pill with a tail, pink pill with sparks, the ribbon. */
export const BLUE_LABEL: LabelShape = {
  frame: 'label-blue',
  leftCap: 0.1,
  rightCap: 0.08,
  textY: 0.44,
  textShare: 0.5,
};
export const PINK_LABEL: LabelShape = {
  frame: 'label-pink',
  leftCap: 0.16,
  rightCap: 0.16,
  textY: 0.5,
  textShare: 0.62,
};
export const RIBBON: LabelShape = { frame: 'ribbon-pink', leftCap: 0.22, rightCap: 0.22, textY: 0.42, textShare: 0.44 };

/**
 * A label drawn with one of the user's pictures: stretched in the middle only (nine-slice), so
 * its rounded ends, tail and sparks keep their shape however long the text is.
 */
export class LabelPicture {
  private readonly picture: Phaser.GameObjects.NineSlice;

  constructor(
    scene: Phaser.Scene,
    private readonly shape: LabelShape,
    private readonly text: Phaser.GameObjects.Text | RichText,
    depth: number,
  ) {
    this.picture = scene.add.nineslice(0, 0, UI, shape.frame).setOrigin(0).setDepth(depth);
    const { width, height } = this.picture.frame;
    this.picture.setSlices(width, height, width * shape.leftCap, width * shape.rightCap, 0, 0);
    // Rich text is already centred on its position.
    if (text instanceof Phaser.GameObjects.Text) text.setOrigin(0.5);
    text.setDepth(depth + 1);
  }

  /** The text's size before scaling. */
  private get textSize(): { width: number; height: number } {
    const text = this.text;
    return text instanceof RichText
      ? { width: text.textWidth, height: text.textHeight }
      : { width: text.width, height: text.height };
  }

  /** Where the tail's tip is, from the label's top-left corner, when the label is `height` tall. */
  tailOffset(height: number): { x: number; y: number } {
    const frame = this.picture.frame;
    const scale = height / frame.height;
    const tail = this.shape.tail ?? { x: 0, y: 1 };
    return { x: frame.width * tail.x * scale, y: frame.height * tail.y * scale };
  }

  /**
   * Places the label `height` tall with its left edge at `x` (or centred on `x` when `centre`),
   * just long enough for its text (at most `maxWidth`). Returns its width.
   */
  place(at: { x: number; y: number; height: number; maxWidth: number; centre?: boolean }): number {
    const frame = this.picture.frame;
    const scale = at.height / frame.height;
    const caps = frame.width * (this.shape.leftCap + this.shape.rightCap) * scale;
    const size = this.textSize;
    const textScale = Math.min((at.height * this.shape.textShare) / size.height, (at.maxWidth - caps) / size.width);
    const width = Math.min(at.maxWidth, Math.max(caps * 1.4, size.width * textScale + caps));
    const x = at.centre ? at.x - width / 2 : at.x;
    this.picture
      .setSize(width / scale, frame.height)
      .setScale(scale)
      .setPosition(x, at.y);
    const left = x + frame.width * this.shape.leftCap * scale;
    const right = x + width - frame.width * this.shape.rightCap * scale;
    this.text.setScale(textScale).setPosition((left + right) / 2, at.y + at.height * this.shape.textY);
    return width;
  }
}
