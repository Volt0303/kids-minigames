import * as Phaser from 'phaser';
import { atlasKey } from '../assets/catalog';
import { NIGIRI_LAYOUT, sushiArt, topY, type SushiKind } from '../assets/sushi';

const SUSHI = atlasKey('sushi');

/**
 * One sushi picture: a topping on rice, or a gunkan. Centred on (0, 0), about 230 × 215
 * design units at scale 1 (NIGIRI_SIZE). Reused for any kind with `setKind`.
 */
export class Nigiri extends Phaser.GameObjects.Container {
  private readonly rice: Phaser.GameObjects.Image;
  private readonly top: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.rice = scene.add.image(0, NIGIRI_LAYOUT.riceY, SUSHI, 'rice');
    this.top = scene.add.image(0, NIGIRI_LAYOUT.toppingY, SUSHI, 'topping-tuna');
    this.add([this.rice, this.top]);
    scene.add.existing(this);
  }

  setKind(kind: SushiKind): this {
    const art = sushiArt(kind);
    this.top.setFrame(art.top);
    this.rice.setVisible(art.onRice);
    this.top.setY(topY(kind));
    return this;
  }
}
