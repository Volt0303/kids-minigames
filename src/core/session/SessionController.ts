import type * as Phaser from 'phaser';
import {
  initialSession,
  reduceSession,
  type SessionEffect,
  type SessionEvent,
  type SessionPhase,
} from '../logic/session';
import type { Platform, Unsubscribe } from '../platform/Platform';

/** Scene keys the controller switches between. */
export interface SessionScenes {
  start: string;
  play: string;
}

/** Idle timeouts are measured in seconds; checking once a second is enough. */
const TICK_MS = 1000;

const controllers = new WeakMap<Phaser.Game, SessionController>();

/**
 * Connects the session rules (core/logic/session.ts) to the device and the
 * scenes: feeds it platform and input events, and performs the effects it returns.
 */
export class SessionController {
  private state = initialSession(Date.now());
  private readonly unsubscribers: Unsubscribe[];
  private readonly tickTimer: number;

  private constructor(
    private readonly game: Phaser.Game,
    private readonly platform: Platform,
    private readonly scenes: SessionScenes,
  ) {
    this.unsubscribers = [
      platform.onActiveChange((active) =>
        this.dispatch({ type: active ? 'foreground' : 'background', at: Date.now() }),
      ),
      platform.onBack(() => this.dispatch({ type: 'back', at: Date.now() })),
      platform.onRelaunch(() => this.dispatch({ type: 'relaunch', at: Date.now() })),
    ];
    window.addEventListener('pointerdown', this.onInput, { passive: true });
    this.tickTimer = window.setInterval(() => this.dispatch({ type: 'tick', at: Date.now() }), TICK_MS);
    game.events.once('destroy', () => this.detach());
  }

  static attach(game: Phaser.Game, platform: Platform, scenes: SessionScenes): SessionController {
    const controller = new SessionController(game, platform, scenes);
    controllers.set(game, controller);
    return controller;
  }

  static of(game: Phaser.Game): SessionController {
    const controller = controllers.get(game);
    if (!controller) throw new Error('SessionController.attach() must run before scenes use the session');
    return controller;
  }

  get phase(): SessionPhase {
    return this.state.phase;
  }

  dispatch(event: SessionEvent): void {
    const { state, effects } = reduceSession(this.state, event);
    this.state = state;
    for (const effect of effects) this.perform(effect);
  }

  private perform(effect: SessionEffect): void {
    switch (effect) {
      case 'begin-play':
        this.switchTo(this.scenes.play);
        break;
      case 'pause':
        this.game.sound.pauseAll();
        this.game.pause();
        break;
      case 'resume':
        this.game.resume();
        this.game.sound.resumeAll();
        break;
      case 'restart':
        this.game.resume();
        this.game.sound.stopAll();
        this.switchTo(this.scenes.start);
        break;
      case 'exit':
        this.platform.exit().catch((error: unknown) => console.error('Could not exit the game', error));
        break;
    }
  }

  /** Stops every running scene and starts the given one from the beginning. */
  private switchTo(key: string): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key !== key) scene.scene.stop();
    }
    this.game.scene.start(key);
  }

  private readonly onInput = (): void => this.dispatch({ type: 'input', at: Date.now() });

  private detach(): void {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    window.removeEventListener('pointerdown', this.onInput);
    window.clearInterval(this.tickTimer);
    controllers.delete(this.game);
  }
}
