import type * as Phaser from 'phaser';
import { LayoutScene } from '../display/LayoutScene';
import { center, inset, split } from '../logic/rect';
import type { Viewport } from '../logic/viewport';
import { SessionController } from '../session/SessionController';
import { BigButton } from '../ui/BigButton';
import { FONT_FAMILY } from '../ui/theme';

export const START_SCENE_KEY = 'Start';

const BUTTON_WIDTH = 560;
const BUTTON_HEIGHT = 220;

/**
 * First screen of every game (client requirement 1): the player chooses to
 * play (あそぶ) or not (やめる). Not choosing exits after the idle timeout.
 */
export class StartScene extends LayoutScene {
  private title!: Phaser.GameObjects.Text;
  private playButton!: BigButton;
  private stopButton!: BigButton;

  constructor(private readonly gameTitle: string) {
    super(START_SCENE_KEY);
  }

  protected build(): void {
    const session = SessionController.of(this.game);
    this.title = this.add
      .text(0, 0, this.gameTitle, {
        fontFamily: FONT_FAMILY,
        fontStyle: 'bold',
        fontSize: '110px',
        color: '#ffffff',
        stroke: '#0b3d6b',
        strokeThickness: 14,
      })
      .setOrigin(0.5);

    const size = { width: BUTTON_WIDTH, height: BUTTON_HEIGHT };
    this.playButton = new BigButton(this, { ...size, label: 'あそぶ', icon: '▶', color: 0x2a9d8f }, () =>
      session.dispatch({ type: 'play', at: Date.now() }),
    );
    this.stopButton = new BigButton(this, { ...size, label: 'やめる', icon: '×', color: 0x8d99ae }, () =>
      session.dispatch({ type: 'quit' }),
    );
  }

  protected layout(viewport: Viewport): void {
    const [titleArea, buttonArea] = split(inset(this.screen, 60), 'vertical', [1, 1]);
    const titleCenter = center(titleArea);
    this.title.setPosition(titleCenter.x, titleCenter.y);

    // Buttons side by side, centred; wide screens spread them further apart.
    const rowWidth = viewport.mode === 'wide' ? BUTTON_WIDTH * 3.2 : BUTTON_WIDTH * 2.4;
    const row = { ...buttonArea, x: center(buttonArea).x - rowWidth / 2, width: rowWidth };
    const [playArea, stopArea] = split(row, 'horizontal', [1, 1]);
    const playCenter = center(playArea);
    const stopCenter = center(stopArea);
    this.playButton.setPosition(playCenter.x, playCenter.y);
    this.stopButton.setPosition(stopCenter.x, stopCenter.y);
  }
}
