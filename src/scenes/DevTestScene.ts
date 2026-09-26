import * as Phaser from 'phaser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LayoutScene } from '../core/display/LayoutScene';
import { minTouchSize } from '../core/logic/layout';
import { inset, split, type Rect } from '../core/logic/rect';
import type { Viewport } from '../core/logic/viewport';

const INFO_REFRESH_MS = 500;
const MARGIN = 40;
const CHROME_VERSION = /Chrome\/([\d.]+)/.exec(navigator.userAgent)?.[1] ?? 'unknown';

/**
 * Development test scene: checks rendering, animation, touch, drag, sound,
 * layout modes, pause/resume and app exit on each target device.
 * Everything is positioned in design units (1080 tall).
 */
export class DevTestScene extends LayoutScene {
  private info!: Phaser.GameObjects.Text;
  private regions!: Phaser.GameObjects.Graphics;
  private fish!: Phaser.GameObjects.Image;
  private ball!: Phaser.GameObjects.Arc;
  private exitButton!: Phaser.GameObjects.Container;
  private swim?: Phaser.Tweens.Tween;
  private pauseCount = 0;
  private resumeCount = 0;

  constructor() {
    super('DevTest');
  }

  preload(): void {
    this.load.audio('tap', 'dev/tap.wav');
  }

  protected build(): void {
    this.makeFishTexture();
    this.regions = this.add.graphics();
    this.info = this.add.text(MARGIN, MARGIN, '', {
      fontFamily: 'sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.35)',
      padding: { x: 14, y: 10 },
    });

    this.fish = this.add.image(0, 0, 'test-fish').setInteractive({ useHandCursor: true });
    this.fish.on('pointerdown', () => this.onFishTap());

    this.ball = this.add.circle(0, 0, 70, 0xff7aa2).setStrokeStyle(8, 0xffffff);
    this.ball.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(this.ball);
    this.ball.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => this.ball.setPosition(x, y));

    this.exitButton = this.makeButton('× おわる', () => this.exitApp());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, targets: unknown[]) => {
      if (targets.length === 0) this.pop(p.worldX, p.worldY, 0xffffff);
    });

    this.listenForLifecycle();
    this.time.addEvent({ delay: INFO_REFRESH_MS, loop: true, callback: () => this.refreshInfo() });
  }

  protected layout(viewport: Viewport): void {
    const size = minTouchSize(viewport.designHeight);
    const [main, side] = this.splitScreen(viewport);

    this.drawRegions([main, side]);
    this.fish.setDisplaySize(size * 2, size * 1.2).setPosition(main.x + size, main.y + main.height * 0.55);
    this.swim?.remove();
    this.swim = this.tweens.add({
      targets: this.fish,
      x: main.x + main.width - size,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => this.fish.setFlipX(true),
      onRepeat: () => this.fish.setFlipX(false),
    });

    this.ball.setPosition(side.x + side.width / 2, side.y + side.height / 2);
    this.exitButton.setPosition(viewport.designWidth - MARGIN - 150, MARGIN + 55);
    this.refreshInfo();
  }

  /** Wide screens get a side panel to the right; standard screens get it below. */
  private splitScreen(viewport: Viewport): Rect[] {
    const area = inset(this.screen, MARGIN);
    return viewport.mode === 'wide'
      ? split(area, 'horizontal', [2, 1], MARGIN)
      : split(area, 'vertical', [2, 1], MARGIN);
  }

  private drawRegions(areas: Rect[]): void {
    this.regions.clear().lineStyle(4, 0x8ecae6, 0.6);
    for (const area of areas) this.regions.strokeRect(area.x, area.y, area.width, area.height);
  }

  /** Updated on a timer, not every frame, to avoid per-frame string building. */
  private refreshInfo(): void {
    const vp = this.viewport;
    const renderer = this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas';
    this.info.setText(
      [
        `Phaser ${Phaser.VERSION} / ${renderer} / Chrome ${CHROME_VERSION}`,
        `Physical ${vp.physicalWidth}×${vp.physicalHeight}  pixel ratio ${(1 / vp.canvasZoom).toFixed(2)}`,
        `Design ${vp.designWidth}×${vp.designHeight}  layout: ${vp.mode}`,
        `FPS ${this.game.loop.actualFps.toFixed(0)}  platform: ${Capacitor.getPlatform()}`,
        `paused ${this.pauseCount}  resumed ${this.resumeCount}`,
      ].join('\n'),
    );
  }

  /** Counts background/foreground switches (client requirement: pause and resume). */
  private listenForLifecycle(): void {
    const onChange = (isActive: boolean): void => {
      if (isActive) this.resumeCount += 1;
      else this.pauseCount += 1;
      this.refreshInfo();
    };
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => onChange(isActive)).catch((error: unknown) => {
        console.error('Could not listen for app state changes', error);
      });
    } else {
      document.addEventListener('visibilitychange', () => onChange(document.visibilityState === 'visible'));
    }
  }

  private onFishTap(): void {
    this.pop(this.fish.x, this.fish.y, 0xffe066);
    this.sound.play('tap');
  }

  private makeFishTexture(): void {
    if (this.textures.exists('test-fish')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff9f1c).fillEllipse(90, 60, 150, 90);
    g.fillTriangle(150, 60, 200, 20, 200, 100);
    g.fillStyle(0xffffff).fillCircle(50, 48, 12);
    g.fillStyle(0x222222).fillCircle(46, 48, 6);
    g.generateTexture('test-fish', 205, 120);
    g.destroy();
  }

  private makeButton(label: string, onTap: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 300, 110, 0x3a86ff).setStrokeStyle(6, 0xffffff);
    const text = this.add
      .text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '46px', color: '#ffffff' })
      .setOrigin(0.5);
    const button = this.add.container(0, 0, [bg, text]).setSize(300, 110);
    button.setInteractive({ useHandCursor: true }).on('pointerup', onTap);
    return button;
  }

  private pop(x: number, y: number, color: number): void {
    const ring = this.add.circle(x, y, 30, color, 0.9);
    this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
  }

  private exitApp(): void {
    if (Capacitor.isNativePlatform()) {
      App.exitApp().catch((error: unknown) => console.error('Could not exit the app', error));
    } else {
      this.pop(this.exitButton.x, this.exitButton.y, 0xff4d4d);
      console.warn('Exit requested (only works inside the Android app).');
    }
  }
}
