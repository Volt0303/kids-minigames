import type * as Phaser from 'phaser';
import { loadAtlas, loadGameArt } from '../assets/atlas';
import { atlasKey, gameArtKey, hasGameArt, type GameArtGame } from '../assets/catalog';
import { LayoutScene } from '../display/LayoutScene';
import { watchSceneLoading } from '../display/loadingOverlay';
import type { Viewport } from '../logic/viewport';
import { SessionController } from '../session/SessionController';
import { Background } from '../ui/Background';
import { ImageButton } from '../ui/ImageButton';
import { FONT_FAMILY } from '../ui/theme';
import { contentBand } from '../logic/gameLayout';

export const START_SCENE_KEY = 'Start';

const UI = atlasKey('ui');
/** Title logo: centre height and largest width (design units), as in the start-screen mockup. */
const TITLE_Y = 0.36;
const TITLE_MAX_WIDTH = 1180;
const TITLE_SCREEN_SHARE = 0.62;
/** Buttons: centre height and sizes; the pair is centred with a clear gap between the pictures (rays included). */
const BUTTONS_Y = 0.7;
const BUTTON_GAP = 70;
const START = { width: 470, disc: { x: 0.49, y: 0.545, radius: 0.3 } } as const;
const CLOSE = { width: 330, disc: { x: 0.5, y: 0.55, radius: 0.335 } } as const;

/**
 * First screen of every game (client requirement 1): the player chooses to play (▶) or
 * not (×); not choosing exits after the idle timeout. Games with start-screen art show
 * their background and title logo; the others show the title as text.
 */
export class StartScene extends LayoutScene {
  private background?: Background;
  /** The title logo; undefined when the game has none and the title is shown as text. */
  private logo?: Phaser.GameObjects.Image;
  private title!: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  private playButton!: ImageButton;
  private stopButton!: ImageButton;

  constructor(
    private readonly gameTitle: string,
    /** The game whose start-screen art to show (when it has any). */
    private readonly artGame?: GameArtGame,
  ) {
    super(START_SCENE_KEY);
  }

  preload(): void {
    // Spinner on until this screen's own pictures are ready (an already-loaded screen just blips it).
    watchSceneLoading(this);
    loadAtlas(this.load, 'ui');
    if (hasGameArt(this.artGame, 'start-background')) loadGameArt(this.load, this.artGame, 'start-background');
    if (hasGameArt(this.artGame, 'start-title')) loadGameArt(this.load, this.artGame, 'start-title');
  }

  protected build(): void {
    const session = SessionController.of(this.game);
    const backgroundKey = this.artGame && gameArtKey(this.artGame, 'start-background');
    const titleKey = this.artGame && gameArtKey(this.artGame, 'start-title');
    if (backgroundKey && this.textures.exists(backgroundKey)) this.background = new Background(this, backgroundKey);
    this.logo = titleKey && this.textures.exists(titleKey) ? this.add.image(0, 0, titleKey) : undefined;
    this.title = this.logo ?? this.makeTextTitle();

    this.playButton = new ImageButton(
      this,
      { picture: { texture: UI, frame: 'btn-start' }, width: START.width, disc: START.disc },
      () => session.dispatch({ type: 'play', at: Date.now() }),
    ).startAttention(); // touch screens have no hover: ▶ invites a tap on its own
    this.stopButton = new ImageButton(
      this,
      { picture: { texture: UI, frame: 'btn-close' }, width: CLOSE.width, disc: CLOSE.disc },
      () => session.dispatch({ type: 'quit' }),
    );
  }

  protected layout(viewport: Viewport): void {
    const { designWidth: width, designHeight: height } = viewport;
    this.background?.layout(this.screen, contentBand(viewport));
    const centerX = width / 2;

    if (this.logo) {
      const titleWidth = Math.min(TITLE_MAX_WIDTH, width * TITLE_SCREEN_SHARE);
      this.logo.setScale(titleWidth / this.logo.width);
    }
    this.title.setPosition(centerX, height * TITLE_Y);

    const left = centerX - (START.width + BUTTON_GAP + CLOSE.width) / 2;
    this.playButton.place(left + START.width / 2, height * BUTTONS_Y);
    this.stopButton.place(left + START.width + BUTTON_GAP + CLOSE.width / 2, height * BUTTONS_Y);
  }

  /** Game name as text, for games without a title logo yet. */
  private makeTextTitle(): Phaser.GameObjects.Text {
    return this.add
      .text(0, 0, this.gameTitle, {
        fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
        fontSize: '110px',
        color: '#ffffff',
        stroke: '#0b3d6b',
        strokeThickness: 14,
      })
      .setOrigin(0.5);
  }
}
