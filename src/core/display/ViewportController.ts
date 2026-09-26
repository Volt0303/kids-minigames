import type * as Phaser from 'phaser';
import { computeViewport, sameViewport, type ScreenMetrics, type Viewport } from '../logic/viewport';

/** Game-level event emitted with the new Viewport after the screen size changes. */
export const VIEWPORT_CHANGED = 'viewport-changed';

export function readScreenMetrics(): ScreenMetrics {
  return { cssWidth: window.innerWidth, cssHeight: window.innerHeight, pixelRatio: window.devicePixelRatio };
}

const controllers = new WeakMap<Phaser.Game, ViewportController>();

/**
 * Keeps the canvas at physical-pixel resolution and tells scenes when the
 * design space changes. One controller per game.
 */
export class ViewportController {
  private current: Viewport;
  private pendingFrame = 0;

  private constructor(
    private readonly game: Phaser.Game,
    initial: Viewport,
  ) {
    this.current = initial;
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('orientationchange', this.onWindowResize);
    game.events.once('destroy', () => this.detach());
  }

  /** Starts tracking the window. `initial` must match the size the game was created with. */
  static attach(game: Phaser.Game, initial: Viewport): ViewportController {
    const controller = new ViewportController(game, initial);
    controllers.set(game, controller);
    return controller;
  }

  static of(game: Phaser.Game): ViewportController {
    const controller = controllers.get(game);
    if (!controller) throw new Error('ViewportController.attach() must run before scenes use the viewport');
    return controller;
  }

  get viewport(): Viewport {
    return this.current;
  }

  /** Applies new screen metrics; does nothing when the result is unchanged. */
  update(metrics: ScreenMetrics): void {
    const next = computeViewport(metrics);
    if (sameViewport(next, this.current)) return;
    this.current = next;
    // Order matters: setZoom() rewrites the canvas CSS size from the *current* game size,
    // while resize() skips the CSS update when zoom is 1. Resizing first keeps both correct.
    this.game.scale.resize(next.physicalWidth, next.physicalHeight);
    this.game.scale.setZoom(next.canvasZoom);
    this.game.events.emit(VIEWPORT_CHANGED, next);
  }

  /** Resize events arrive in bursts; handle at most one per animation frame. */
  private readonly onWindowResize = (): void => {
    if (this.pendingFrame !== 0) return;
    this.pendingFrame = window.requestAnimationFrame(() => {
      this.pendingFrame = 0;
      this.update(readScreenMetrics());
    });
  };

  private detach(): void {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('orientationchange', this.onWindowResize);
    if (this.pendingFrame !== 0) window.cancelAnimationFrame(this.pendingFrame);
    controllers.delete(this.game);
  }
}
