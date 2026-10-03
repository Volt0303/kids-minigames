import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { sushiArt } from './logic/sushiArt';
import type { SushiKind } from './stages';

const SUSHI = atlasKey('sushi');
/** Where the rice and the topping sit, at scale 1: the topping rests on the upper part of the rice. */
const RICE_Y = 38;
const TOPPING_Y = -30;

/**
 * One sushi picture: a topping on rice, or a gunkan. Centred on (0, 0), about 230 × 215
 * design units at scale 1 (NIGIRI). Reused for any kind with `setKind`.
 */
export class Nigiri extends Phaser.GameObjects.Container {
  private readonly rice: Phaser.GameObjects.Image;
  private readonly top: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.rice = scene.add.image(0, RICE_Y, SUSHI, 'rice');
    this.top = scene.add.image(0, TOPPING_Y, SUSHI, 'topping-tuna');
    this.add([this.rice, this.top]);
    scene.add.existing(this);
  }

  setKind(kind: SushiKind): this {
    const art = sushiArt(kind);
    this.top.setFrame(art.top);
    this.rice.setVisible(art.onRice);
    this.top.setY(art.onRice ? TOPPING_Y : 0);
    return this;
  }
}
