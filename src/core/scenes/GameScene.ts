import type * as Phaser from 'phaser';
import { loadBackground } from '../assets/atlas';
import { backgroundKey, type BackgroundName } from '../assets/catalog';
import { LayoutScene } from '../display/LayoutScene';
import { gameRegions } from '../logic/gameLayout';
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
import { Background } from '../ui/Background';
import { Banner } from '../ui/Banner';
import { Feedback, SFX } from '../ui/Feedback';
import { HintMarker, type HintTarget } from '../ui/HintMarker';
import { Hud } from '../ui/Hud';
import { PromptCard, type PromptPicture } from '../ui/PromptCard';

/** The stage clock is advanced on a timer, not every frame, to keep per-frame work at zero. */
const FLOW_TICK_MS = 100;

export interface GameSceneOptions {
  /** Full-screen background behind the game (plain colour when omitted). */
  background?: BackgroundName;
}

/**
 * Base class for the six games. Provides the background, top bar (with the × close
 * button), prompt card, stage flow
 * (3 stages, 60 s each, no failure), hints, clear banners and the final exit.
 *
 * A game implements its field: `buildField`, `layoutField`, `startStage`,
 * `findHintTarget`, and reports actions with `reportCorrect` / `reportWrong`.
 */
export abstract class GameScene extends LayoutScene {
  protected abstract readonly stages: readonly StageConfig[];
  protected feedback!: Feedback;
  private flow!: FlowState;
  private hud!: Hud;
  private prompt!: PromptCard;
  private banner!: Banner;
  private hint!: HintMarker;
  private background?: Background;

  constructor(
    key: string,
    private readonly gameTitle: string,
    private readonly options: GameSceneOptions = {},
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
    if (this.options.background) loadBackground(this.load, this.options.background);
    this.preloadGame();
  }

  create(): void {
    super.create();
    this.enterStage();
  }

  protected build(): void {
    if (this.options.background) this.background = new Background(this, backgroundKey(this.options.background));
    this.hud = new Hud(this, this.gameTitle, () => SessionController.of(this.game).dispatch({ type: 'quit' }));
    this.prompt = new PromptCard(this);
    this.feedback = new Feedback(this);
    this.buildField();
    this.banner = new Banner(this);
    this.hint = new HintMarker(this);
    this.flow = startFlow(this.stages);
    this.time.addEvent({
      delay: FLOW_TICK_MS,
      loop: true,
      callback: () => this.apply(reduceFlow(this.flow, { type: 'tick', dtMs: FLOW_TICK_MS })),
    });
  }

  protected layout(viewport: Viewport): void {
    const regions = gameRegions(viewport);
    this.background?.layout(viewport);
    this.hud.layout(regions.hud);
    this.prompt.layout(regions.panel);
    this.banner.layout(regions.field);
    this.layoutField(regions.field, viewport);
  }

  protected setPrompt(caption: string, picture?: PromptPicture): void {
    this.prompt.setPrompt(caption, picture);
  }

  protected reportCorrect(x: number, y: number): void {
    this.hint.hide();
    this.feedback.correct(x, y);
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
        this.banner.show(this.flow.endedBy === 'goal' ? 'クリア！' : 'よくできたね！', () =>
          this.apply(reduceFlow(this.flow, { type: 'next' })),
        );
        break;
      case 'all-clear':
        this.feedback.clear();
        this.banner.show('ぜんぶクリア！', () => SessionController.of(this.game).dispatch({ type: 'finished' }));
        break;
      case 'stage-start':
        this.enterStage();
        break;
    }
  }

  private enterStage(): void {
    this.hint.hide();
    this.hud.setStage(this.flow.index, this.stages.length);
    this.refreshHud();
    this.startStage(this.flow.index, currentStage(this.flow));
  }

  private refreshHud(): void {
    this.hud.setProgress(this.flow.progress, currentStage(this.flow).goal);
    this.hud.setSecondsLeft(secondsLeft(this.flow));
  }
}
