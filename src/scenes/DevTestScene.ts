import * as Phaser from 'phaser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { getLayoutMode, minTouchSize } from '../core/logic/layout';

/**
 * Development test scene: checks rendering, animation, touch, drag,
 * screen-size handling and app exit on each target device.
 */
export class DevTestScene extends Phaser.Scene {
  private info!: Phaser.GameObjects.Text;
  private fish!: Phaser.GameObjects.Image;
  private ball!: Phaser.GameObjects.Arc;
  private exitButton!: Phaser.GameObjects.Container;
  private swim?: Phaser.Tweens.Tween;

  constructor() {
    super('DevTest');
  }

  create(): void {
    this.makeFishTexture();

    this.info = this.add.text(16, 12, '', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.35)',
      padding: { x: 8, y: 6 },
    });

    this.fish = this.add.image(0, 0, 'test-fish').setInteractive({ useHandCursor: true });
    this.fish.on('pointerdown', () => this.pop(this.fish.x, this.fish.y, 0xffe066));

    this.ball = this.add.circle(0, 0, 40, 0xff7aa2).setStrokeStyle(6, 0xffffff);
    this.ball.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(this.ball);
    this.ball.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => this.ball.setPosition(x, y));

    this.exitButton = this.makeButton('× おわる', () => this.exitApp());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, targets: unknown[]) => {
      if (targets.length === 0) this.pop(p.x, p.y, 0xffffff);
    });

    this.scale.on('resize', () => this.layout());
    this.layout();
  }

  update(): void {
    const { width, height } = this.scale;
    const renderer = this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas';
    const chrome = /Chrome\/([\d.]+)/.exec(navigator.userAgent)?.[1] ?? 'unknown';
    this.info.setText(
      [
        `Phaser ${Phaser.VERSION} / ${renderer} / Chrome ${chrome}`,
        `Screen ${width}×${height}  ratio ${(width / height).toFixed(2)}  layout: ${getLayoutMode(width, height)}`,
        `FPS ${this.game.loop.actualFps.toFixed(0)}  platform: ${Capacitor.getPlatform()}`,
      ].join('\n'),
    );
  }

  /** Re-position everything for the current screen size. */
  private layout(): void {
    const { width, height } = this.scale;
    const size = minTouchSize(height);

    this.fish.setDisplaySize(size * 2, size * 1.2).setPosition(width * 0.2, height * 0.55);
    this.swim?.remove();
    this.swim = this.tweens.add({
      targets: this.fish,
      x: width * 0.8,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => this.fish.setFlipX(true),
      onRepeat: () => this.fish.setFlipX(false),
    });

    this.ball.setRadius(size / 2).setPosition(width * 0.5, height * 0.8);
    this.exitButton.setPosition(width - 110, 50);
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
    const bg = this.add.rectangle(0, 0, 190, 70, 0x3a86ff).setStrokeStyle(4, 0xffffff);
    const text = this.add
      .text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);
    const button = this.add.container(0, 0, [bg, text]).setSize(190, 70);
    button.setInteractive({ useHandCursor: true }).on('pointerup', onTap);
    return button;
  }

  private pop(x: number, y: number, color: number): void {
    const ring = this.add.circle(x, y, 20, color, 0.9);
    this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
  }

  private exitApp(): void {
    if (Capacitor.isNativePlatform()) {
      void App.exitApp();
    } else {
      this.pop(this.scale.width - 110, 50, 0xff4d4d);
      console.warn('Exit requested (only works inside the Android app).');
    }
  }
}
