import * as Phaser from 'phaser';
import { drawBadge, drawInset } from './badgeShape';
import type { Picture } from './picture';
import { TEXT } from './theme';

const WIDTH = 372;
const STAR_SIZE = 84;
/** Centre of the label and the value, right of the star. */
const TEXT_X = 62;
const INSET_WIDTH = 180;

/** 「★ せいかいすう 0/3」 badge from the mockup: found count in yellow, goal in white. */
export class ScoreBadge extends Phaser.GameObjects.Container {
  readonly badgeWidth = WIDTH;
  private readonly done: Phaser.GameObjects.Text;
  private readonly goal: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, height: number, star: Picture) {
    super(scene, 0, 0);
    const background = scene.add.graphics();
    drawBadge(background, WIDTH, height);
    const valueY = height * 0.17;
    drawInset(background, { x: TEXT_X, y: valueY, width: INSET_WIDTH, height: height * 0.48 });
    const icon = scene.add.image(-WIDTH / 2 + 18 + STAR_SIZE / 2, 0, star.texture, star.frame);
    icon.setScale(STAR_SIZE / Math.max(icon.frame.width, icon.frame.height));
    const label = scene.add.text(TEXT_X, -height * 0.26, 'せいかいすう', TEXT.badgeLabel).setOrigin(0.5);
    this.done = scene.add.text(0, valueY, '0', TEXT.badgeNumber).setOrigin(1, 0.5);
    this.goal = scene.add
      .text(0, valueY, '/0', { ...TEXT.badgeNumber, color: TEXT.badgeValue.color })
      .setOrigin(0, 0.5);
    this.add([background, icon, label, this.done, this.goal]).setSize(WIDTH, height);
    scene.add.existing(this);
  }

  setScore(done: number, goal: number): void {
    const doneText = String(done);
    const goalText = `/${goal}`;
    if (this.done.text === doneText && this.goal.text === goalText) return;
    this.done.setText(doneText);
    this.goal.setText(goalText);
    // Centre 「0/3」 as one piece in the pill.
    const left = TEXT_X - (this.done.width + this.goal.width) / 2;
    this.done.setX(left + this.done.width);
    this.goal.setX(left + this.done.width);
  }
}
