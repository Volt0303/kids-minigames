import type * as Phaser from 'phaser';
import { LayoutScene } from '../display/LayoutScene';
import type { Rect } from '../logic/rect';
import {
  currentStage,
  reduceFlow,
  secondsLeft,
  startFlow,
  type FlowEffect,
  type FlowResult,
  type FlowState,
  type StageConfig,
} from '../logic/stageFlow';
import type { Viewport } from '../logic/viewport';
import { SessionController } from '../session/SessionController';
import { Feedback, SFX } from '../ui/Feedback';
import { GameScreen, type GameScreenConfig } from '../ui/GameScreen';
import { HintMarker, type HintTarget } from '../ui/HintMarker';
import type { Picture } from '../ui/picture';
import type { RichLines } from '../ui/RichText';

/** The stage clock is advanced on a timer, not every frame, to keep per-frame work at zero. */
const FLOW_TICK_MS = 100;

/** Everything a game shows around its field (title comes from the build). */
export type GameSceneOptions = Omit<GameScreenConfig, 'title' | 'onClose'>;

/**
 * Base class for the six games. Provides the screen around the field (GameScreen:
 * header with × close button, 「お題」 and 「あそびかた」 cards, footer, praise
 * bubble), the stage flow (3 stages, 60 s each, no failure), hints, clear banners
 * and the final exit.
 *
 * A game implements its field: `buildField`, `layoutField`, `startStage`,
 * `findHintTarget`, and reports actions with `reportCorrect` / `reportWrong`.
 */
export abstract class GameScene extends LayoutScene {
  protected abstract readonly stages: readonly StageConfig[];
  protected feedback!: Feedback;
  private flow!: FlowState;
  private ui!: GameScreen;
  private hint!: HintMarker;

  constructor(
    key: string,
    private readonly gameTitle: string,
    private readonly options: GameSceneOptions,
  ) {
    super(key);
  }

  /** Create the game's own objects (once). */
  protected abstract buildField(): void;

  /** Position the game's objects inside the play field. */
  protected abstract layoutField(field: Rect, viewport: Viewport): void;

  /** Set up a stage: prompt, objects, difficulty. Called after layout. */
  protected abstract startStage(index: number, stage: StageConfig): void;

  /** Something correct to point at when the child is stuck (every 8 s without progress). */
  protected abstract findHintTarget(): HintTarget | undefined;

  /** Shows the hint. Override for games whose hint is not "point at an object" (e.g. the puzzle). */
  protected showHint(): void {
    const target = this.findHintTarget();
    if (target) this.hint.pointAt(target);
  }

  /** Load the game's own assets. */
  protected preloadGame(): void {
    // Optional for games without extra assets.
  }

  preload(): void {
    this.load.audio(SFX.correct, 'sfx/correct.wav');
    this.load.audio(SFX.wrong, 'sfx/wrong.wav');
    this.load.audio(SFX.clear, 'sfx/clear.wav');
    GameScreen.preload(this.load, this.screenConfig);
    this.preloadGame();
  }

  create(): void {
    super.create();
    this.enterStage();
  }

  protected build(): void {
    this.ui = new GameScreen(this, this.screenConfig);
    this.feedback = new Feedback(this);
    this.buildField();
    this.hint = new HintMarker(this);
    this.flow = startFlow(this.stages);
    this.time.addEvent({
      delay: FLOW_TICK_MS,
      loop: true,
      callback: () => this.apply(reduceFlow(this.flow, { type: 'tick', dtMs: FLOW_TICK_MS })),
    });
  }

  protected layout(viewport: Viewport): void {
    this.layoutField(this.ui.layout(viewport), viewport);
  }

  /** Shows what to do now on the 「お題」 card; highlight the key word with a colour. */
  protected setPrompt(lines: RichLines, picture?: Picture): void {
    this.ui.setPrompt(lines, picture);
  }

  protected reportCorrect(x: number, y: number): void {
    this.hint.hide();
    this.feedback.correct(x, y);
    this.ui.praiseCorrect();
    this.apply(reduceFlow(this.flow, { type: 'correct' }));
  }

  protected reportWrong(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    this.feedback.wrong(target);
  }

  /** True while the child can act (not during clear banners). */
  protected get isPlaying(): boolean {
    return this.flow.status === 'playing';
  }

  private apply(result: FlowResult): void {
    const changed = result.state !== this.flow;
    this.flow = result.state;
    if (changed) this.refreshHud();
    for (const effect of result.effects) this.perform(effect);
  }

  private perform(effect: FlowEffect): void {
    switch (effect) {
      case 'hint':
        this.showHint();
        break;
      case 'stage-clear':
        this.feedback.clear();
        this.ui.banner.show(this.flow.endedBy === 'goal' ? 'クリア！' : 'よくできたね！', () =>
          this.apply(reduceFlow(this.flow, { type: 'next' })),
        );
        break;
      case 'all-clear':
        this.feedback.clear();
        this.ui.banner.show('ぜんぶクリア！', () => SessionController.of(this.game).dispatch({ type: 'finished' }));
        break;
      case 'stage-start':
        this.enterStage();
        break;
    }
  }

  private enterStage(): void {
    this.hint.hide();
    this.ui.setStage(this.flow.index, this.stages.length);
    this.refreshHud();
    this.startStage(this.flow.index, currentStage(this.flow));
  }

  private refreshHud(): void {
    this.ui.setProgress(this.flow.progress, currentStage(this.flow).goal, secondsLeft(this.flow));
  }

  private get screenConfig(): GameScreenConfig {
    return {
      ...this.options,
      title: this.gameTitle,
      onClose: () => SessionController.of(this.game).dispatch({ type: 'quit' }),
    };
  }
}
