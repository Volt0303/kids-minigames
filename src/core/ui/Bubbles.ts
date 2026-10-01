import * as Phaser from 'phaser';
import {
  bubbleAlpha,
  bubbleCount,
  bubbleX,
  createBubble,
  MAX_BUBBLES,
  spawnBubble,
  stepBubble,
  ventPositions,
  type Bubble,
  type BubbleArea,
} from '../logic/bubbles';
import type { Viewport } from '../logic/viewport';

const TEXTURE = 'fx-bubble';
const TEXTURE_RADIUS = 64;
/** In front of the background, behind every game object. */
const DEPTH = -500;
/** Start and end just outside the screen so bubbles never pop in or out. */
const EDGE = 60;

function ensureBubbleTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE)) return;
  const r = TEXTURE_RADIUS;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xe6f7ff, 0.22).fillCircle(r, r, r - 3);
  // A thin darker rim keeps the bubble visible on bright water; the white rim inside it shines.
  g.lineStyle(4, 0x2a7fb8, 0.45).strokeCircle(r, r, r - 2);
  g.lineStyle(6, 0xffffff, 0.95).strokeCircle(r, r, r - 6);
  // Soft reflection along the lower right edge.
  g.lineStyle(6, 0xffffff, 0.45)
    .beginPath()
    .arc(r, r, r - 14, 0.15, 1.35)
    .strokePath();
  // Bright highlight at the upper left.
  g.fillStyle(0xffffff, 0.95).fillCircle(r - 24, r - 24, 11);
  g.fillStyle(0xffffff, 0.7).fillCircle(r - 6, r - 38, 5);
  g.generateTexture(TEXTURE, r * 2, r * 2);
  g.destroy();
}

/**
 * Air bubbles of different sizes slowly rising and swaying over an underwater
 * background. Sprites are created once (pool); each frame only updates numbers.
 */
export class Bubbles {
  private readonly images: Phaser.GameObjects.Image[] = [];
  private readonly bubbles: Bubble[] = [];
  private area?: BubbleArea;
  private elapsed = 0;

  constructor(private readonly scene: Phaser.Scene) {
    ensureBubbleTexture(scene);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update));
  }

  layout(viewport: Viewport): void {
    const area: BubbleArea = {
      width: viewport.designWidth,
      top: -EDGE,
      bottom: viewport.designHeight + EDGE,
      vents: ventPositions(viewport.designWidth, Math.random),
    };
    this.area = area;
    const count = bubbleCount(area.width);
    while (this.images.length < Math.min(count, MAX_BUBBLES)) {
      this.images.push(this.scene.add.image(0, 0, TEXTURE).setDepth(DEPTH));
      this.bubbles.push(createBubble(area, Math.random, true));
    }
    this.images.forEach((image, i) => image.setVisible(i < count));
    // Spread them over the new screen so a resize does not leave an empty area.
    for (const bubble of this.bubbles) spawnBubble(bubble, area, Math.random, true);
  }

  private readonly update = (_time: number, delta: number): void => {
    const area = this.area;
    if (!area) return;
    const seconds = Math.min(delta, 100) / 1000;
    this.elapsed += seconds;
    this.images.forEach((image, i) => {
      const bubble = this.bubbles[i];
      if (!bubble || !image.visible) return;
      stepBubble(bubble, area, seconds, Math.random);
      image
        .setPosition(bubbleX(bubble, this.elapsed), bubble.y)
        .setScale(bubble.radius / TEXTURE_RADIUS)
        .setAlpha(bubbleAlpha(bubble, area));
    });
  };
}
