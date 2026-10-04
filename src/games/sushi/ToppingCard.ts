import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { sushiArt, sushiName, type SushiKind } from '../../core/assets/sushi';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import { FONT_FAMILY } from '../../core/ui/theme';

const SUSHI = atlasKey('sushi');
/** Share of the slot's height used by the picture; the name goes below it. */
const PICTURE_SHARE = 0.7;
/** The topping is drawn above the tray and the board; while dragged, above everything in the field. */
const PICTURE_DEPTH = 5;
const DRAG_DEPTH = 50;

export interface CardEvents {
  onTap: (card: ToppingCard) => void;
  onDrop: (card: ToppingCard) => void;
}

/**
 * One topping in a slot of the 「ネタをえらぼう」 tray: its picture and name. The picture can
 * be tapped or dragged onto the rice; it goes back to its slot afterwards.
 */
export class ToppingCard {
  kind: SushiKind = 'tuna';
  /** The topping picture that moves (tap, drag, onto the rice and back). */
  readonly picture: Phaser.GameObjects.Image;
  private readonly name: Phaser.GameObjects.Text;
  private home = { x: 0, y: 0, scale: 1 };
  private dragging = false;

  constructor(
    private readonly scene: Phaser.Scene,
    events: CardEvents,
  ) {
    this.name = scene.add
      .text(0, 0, '', { fontFamily: FONT_FAMILY, fontStyle: 'bold', fontSize: '30px', color: '#5b3a1a' })
      .setOrigin(0.5);
    this.picture = scene.add.image(0, 0, SUSHI, 'topping-tuna').setDepth(PICTURE_DEPTH);
    this.picture.setInteractive({ draggable: true, useHandCursor: true });
    // A new touch starts as a tap; it becomes a drag only once the finger moves.
    this.picture.on('pointerdown', () => {
      this.dragging = false;
    });
    this.picture.on('dragstart', () => {
      this.dragging = true;
      this.picture.setDepth(DRAG_DEPTH);
    });
    this.picture.on('drag', (_pointer: Phaser.Input.Pointer, x: number, y: number) => this.picture.setPosition(x, y));
    this.picture.on('dragend', () => events.onDrop(this));
    this.picture.on('pointerup', () => {
      if (!this.dragging) events.onTap(this);
    });
    this.setVisible(false);
  }

  /** Shows a topping in a tray slot, its picture resting there. */
  show(kind: SushiKind, slot: Rect): void {
    this.kind = kind;
    this.picture.setFrame(sushiArt(kind).piece);
    this.name.setText(sushiName(kind));
    const pictureArea = rect(slot.x + 10, slot.y + 10, slot.width - 20, slot.height * PICTURE_SHARE - 10);
    const fit = fitContain(this.picture.frame.width, this.picture.frame.height, pictureArea);
    this.home = { x: fit.x, y: fit.y, scale: fit.scale };
    const nameY = slot.y + slot.height * (PICTURE_SHARE + (1 - PICTURE_SHARE) / 2);
    this.name.setPosition(slot.x + slot.width / 2, nameY);
    this.name.setScale(Math.min(1, (slot.width - 12) / Math.max(1, this.name.width)));
    this.setVisible(true);
    this.goHome(false);
  }

  hide(): void {
    this.setVisible(false);
  }

  /** Back into its slot: at once, or sliding back. */
  goHome(animate: boolean, onDone?: () => void): void {
    this.scene.tweens.killTweensOf(this.picture);
    const { x, y, scale } = this.home;
    // Back to the topping on its own (a gunkan made on the board changed the picture).
    this.picture.setFrame(sushiArt(this.kind).piece).setVisible(true).setAlpha(1).setAngle(0);
    if (!animate) {
      this.picture.setPosition(x, y).setScale(scale).setDepth(PICTURE_DEPTH);
      onDone?.();
      return;
    }
    this.scene.tweens.add({
      targets: this.picture,
      x,
      y,
      scale,
      duration: 260,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.picture.setDepth(PICTURE_DEPTH);
        onDone?.();
      },
    });
  }

  private setVisible(visible: boolean): void {
    this.name.setVisible(visible);
    this.picture.setVisible(visible);
    if (visible) this.picture.setInteractive();
    else this.picture.disableInteractive();
  }
}
