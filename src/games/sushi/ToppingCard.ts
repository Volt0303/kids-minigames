import type * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { sushiArt, sushiName, type SushiKind } from '../../core/assets/sushi';
import { fitContain, rect, type Rect } from '../../core/logic/rect';
import { FONT_FAMILY } from '../../core/ui/theme';

const SUSHI = atlasKey('sushi');
const CARD_FILL = 0xfffaf0;
const CARD_EDGE = 0xe6c99a;
const RADIUS = 18;
/** Share of the card's height used by the picture; the name goes below it. */
const PICTURE_SHARE = 0.68;
/** The topping is drawn above the cards and the board; while dragged, above everything in the field. */
const PICTURE_DEPTH = 5;
const DRAG_DEPTH = 50;

export interface CardEvents {
  onTap: (card: ToppingCard) => void;
  onDrop: (card: ToppingCard) => void;
}

/**
 * One topping in the 「ネタをえらぼう」 tray: a card with the topping's picture and name.
 * The picture can be tapped or dragged onto the rice; it goes back to its card afterwards.
 */
export class ToppingCard {
  kind: SushiKind = 'tuna';
  /** The topping picture that moves (tap, drag, onto the rice and back). */
  readonly picture: Phaser.GameObjects.Image;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.Text;
  private home = { x: 0, y: 0, scale: 1 };
  private dragging = false;

  constructor(
    private readonly scene: Phaser.Scene,
    events: CardEvents,
  ) {
    this.panel = scene.add.graphics();
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

  /** Shows the card for a topping in `area`, its picture resting on it. */
  show(kind: SushiKind, area: Rect): void {
    this.kind = kind;
    this.picture.setFrame(sushiArt(kind).piece);
    this.name.setText(sushiName(kind));
    this.panel
      .clear()
      .fillStyle(CARD_FILL)
      .fillRoundedRect(area.x, area.y, area.width, area.height, RADIUS)
      .lineStyle(4, CARD_EDGE)
      .strokeRoundedRect(area.x, area.y, area.width, area.height, RADIUS);
    const pictureArea = rect(area.x + 8, area.y + 8, area.width - 16, area.height * PICTURE_SHARE - 8);
    const fit = fitContain(this.picture.frame.width, this.picture.frame.height, pictureArea);
    this.home = { x: fit.x, y: fit.y, scale: fit.scale };
    const nameY = area.y + area.height * (PICTURE_SHARE + (1 - PICTURE_SHARE) / 2);
    this.name.setPosition(area.x + area.width / 2, nameY);
    this.name.setScale(Math.min(1, (area.width - 12) / Math.max(1, this.name.width)));
    this.setVisible(true);
    this.goHome(false);
  }

  hide(): void {
    this.setVisible(false);
  }

  /** Back onto the card: at once, or sliding back. */
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
    this.panel.setVisible(visible);
    this.name.setVisible(visible);
    this.picture.setVisible(visible);
    if (visible) this.picture.setInteractive();
    else this.picture.disableInteractive();
  }
}
