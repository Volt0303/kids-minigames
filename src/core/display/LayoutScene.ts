import * as Phaser from 'phaser';
import { rect, type Rect } from '../logic/rect';
import type { Viewport } from '../logic/viewport';
import { VIEWPORT_CHANGED, ViewportController } from './ViewportController';

/**
 * Base class for every scene. Scenes position objects in design units
 * (always 1080 tall; width follows the screen) and never deal with pixels.
 *
 * Subclasses implement `build()` (create objects once) and `layout()`
 * (position them; called on start and on every screen-size change).
 * Pointer positions must be read as `pointer.worldX / worldY`.
 */
export abstract class LayoutScene extends Phaser.Scene {
  private currentViewport?: Viewport;

  /** Current design-space metrics. Available from `build()` onwards. */
  protected get viewport(): Viewport {
    if (!this.currentViewport) throw new Error(`${this.scene.key}: viewport used before create()`);
    return this.currentViewport;
  }

  /** The whole screen as a rectangle in design units. */
  protected get screen(): Rect {
    return rect(0, 0, this.viewport.designWidth, this.viewport.designHeight);
  }

  create(): void {
    this.applyViewport(ViewportController.of(this.game).viewport);
    this.build();
    this.layout(this.viewport);

    const onChange = (next: Viewport): void => {
      this.applyViewport(next);
      this.layout(next);
    };
    this.game.events.on(VIEWPORT_CHANGED, onChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(VIEWPORT_CHANGED, onChange));
  }

  /** Create the scene's objects. Runs once, before the first `layout()`. */
  protected abstract build(): void;

  /** Position the scene's objects for the given viewport. */
  protected abstract layout(viewport: Viewport): void;

  private applyViewport(viewport: Viewport): void {
    this.currentViewport = viewport;
    this.cameras.main
      .setSize(viewport.physicalWidth, viewport.physicalHeight)
      .setOrigin(0, 0)
      .setZoom(viewport.scale)
      .setScroll(0, 0);
  }
}
