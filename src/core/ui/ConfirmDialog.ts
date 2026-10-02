import type * as Phaser from 'phaser';
import type { Viewport } from '../logic/viewport';
import { BigButton } from './BigButton';
import { COLORS, TEXT } from './theme';

const DEPTH = 200;
const PANEL_WIDTH = 1000;
const PANEL_HEIGHT = 520;
const RADIUS = 48;
const BUTTON = { width: 380, height: 150 } as const;
const BUTTON_GAP = 60;
const CONTINUE_COLOR = 0x2a9d8f;

type Part = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.Visible;

/**
 * 「ゲームを おわりますか？」 — asked when the × close button is tapped, so a child who taps it
 * by mistake can carry on. A dimmed full-screen shade stops taps reaching the game behind it.
 */
export class ConfirmDialog {
  private readonly shade: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly message: Phaser.GameObjects.Text;
  private readonly quitButton: BigButton;
  private readonly continueButton: BigButton;
  private readonly parts: readonly Part[];
  private onQuit?: () => void;
  private onContinue?: () => void;
  private opened = false;

  constructor(scene: Phaser.Scene) {
    this.shade = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.45).setOrigin(0).setInteractive();
    this.panel = scene.add.graphics();
    this.message = scene.add.text(0, 0, 'ゲームを おわりますか？', TEXT.dialog).setOrigin(0.5);
    this.quitButton = new BigButton(scene, { ...BUTTON, label: 'おわる', icon: '×', color: COLORS.close }, () =>
      this.choose(this.onQuit),
    );
    this.continueButton = new BigButton(scene, { ...BUTTON, label: 'つづける', icon: '▶', color: CONTINUE_COLOR }, () =>
      this.choose(this.onContinue),
    );
    this.parts = [this.shade, this.panel, this.message, this.quitButton, this.continueButton];
    for (const [i, part] of this.parts.entries()) part.setDepth(DEPTH + i);
    this.setVisible(false);
  }

  get isOpen(): boolean {
    return this.opened;
  }

  layout(viewport: Viewport): void {
    const cx = viewport.designWidth / 2;
    const cy = viewport.designHeight / 2;
    this.shade.setSize(viewport.designWidth, viewport.designHeight);
    this.panel
      .clear()
      .fillStyle(COLORS.panel)
      .fillRoundedRect(cx - PANEL_WIDTH / 2, cy - PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, RADIUS)
      .lineStyle(8, COLORS.barBorder)
      .strokeRoundedRect(cx - PANEL_WIDTH / 2, cy - PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, RADIUS);
    this.message.setPosition(cx, cy - 110);
    const offset = (BUTTON.width + BUTTON_GAP) / 2;
    this.quitButton.setPosition(cx - offset, cy + 110);
    this.continueButton.setPosition(cx + offset, cy + 110);
  }

  /** Shows the question; exactly one of the callbacks runs, once, when the child answers. */
  open(onQuit: () => void, onContinue: () => void): void {
    if (this.opened) return;
    this.opened = true;
    this.onQuit = onQuit;
    this.onContinue = onContinue;
    this.setVisible(true);
  }

  private choose(action: (() => void) | undefined): void {
    if (!this.opened) return;
    this.opened = false;
    this.setVisible(false);
    action?.();
  }

  private setVisible(visible: boolean): void {
    for (const part of this.parts) part.setVisible(visible);
    if (visible) this.shade.setInteractive();
    else this.shade.disableInteractive();
  }
}
