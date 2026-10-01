import * as Phaser from 'phaser';
import { drawBadge } from './badgeShape';
import { TEXT } from './theme';

/** 「せいかいすう ★ 3/5」 score badge from the mockups. */
export class ScoreBadge extends Phaser.GameObjects.Container {
  private readonly value: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, height: number) {
    super(scene, 0, 0);
    const width = 300;
    const background = scene.add.graphics();
    drawBadge(background, width, height);
    const star = scene.add.text(-width / 2 + 24, 0, '★', { ...TEXT.scoreValue, fontSize: '72px' }).setOrigin(0, 0.5);
    const label = scene.add.text(40, -height * 0.26, 'せいかいすう', TEXT.badgeLabel).setOrigin(0.5);
    this.value = scene.add.text(40, height * 0.14, '', TEXT.scoreValue).setOrigin(0.5);
    this.add([background, star, label, this.value]).setSize(width, height);
    scene.add.existing(this);
  }

  setScore(done: number, goal: number): void {
    const label = `${done}/${goal}`;
    if (this.value.text !== label) this.value.setText(label);
  }
}
