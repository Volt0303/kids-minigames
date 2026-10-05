import * as Phaser from 'phaser';
import { atlasKey } from '../../core/assets/catalog';
import { edgeAlpha, wrap } from '../../core/logic/loop';
import { pick, type Random } from '../../core/logic/random';
import type { Rect } from '../../core/logic/rect';
import { laneHeights } from './logic/sea';
import { FISH_KINDS, type OceanStage } from './stages';

const FISH = atlasKey('fish');
/** Most fish at once (stage 3). */
const POOL_SIZE = 10;
/** Fish are this tall as a share of the field's height, and not wider than this (design units). */
const HEIGHT_SHARE = 0.15;
const MAX_WIDTH = 230;
const DEPTH = -10;
/** A tapped fish wiggles, then darts away this much faster for a moment. */
const SCARED_SPEED = 3.5;
const SCARED_SECONDS = 1.2;

interface Swimmer {
  image: Phaser.GameObjects.Image;
  /** Position along the loop, in field widths (the loop is a little wider than the field). */
  along: number;
  lane: number;
  direction: 1 | -1;
  /** Seconds left of darting away after being tapped. */
  scared: number;
  active: boolean;
}

/** Room each side of the field for a fish to swim fully out of sight before it comes back. */
const LOOP_MARGIN = 0.15;

/** The fish swimming by in lanes: not to be tapped (object pool). */
export class School {
  private readonly swimmers: Swimmer[] = [];
  private lanes: number[] = [];

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const image = scene.add.image(0, 0, FISH, 'yellow-tropical').setVisible(false).setDepth(DEPTH);
      image.setInteractive();
      this.swimmers.push({ image, along: 0, lane: 0, direction: 1, scared: 0, active: false });
    }
  }

  /** Whether this picture is one of the swimming fish. */
  has(object: Phaser.GameObjects.GameObject): boolean {
    return this.swimmers.some((s) => s.active && s.image === object);
  }

  /** Puts out the stage's fish, spread over the lanes and along them. */
  start(stage: OceanStage, field: Rect, random: Random): void {
    this.lanes = laneHeights(stage.lanes);
    this.swimmers.forEach((swimmer, i) => {
      swimmer.active = i < stage.fishCount;
      swimmer.image.setVisible(swimmer.active);
      if (!swimmer.active) return;
      swimmer.lane = i % stage.lanes;
      swimmer.direction = swimmer.lane % 2 === 0 ? 1 : -1;
      swimmer.along = (i / stage.fishCount + random() * 0.1) % 1;
      swimmer.scared = 0;
      swimmer.image.setFrame(pick(FISH_KINDS, random)).setAngle(0);
    });
    this.layout(field);
  }

  layout(field: Rect): void {
    for (const swimmer of this.swimmers) {
      if (!swimmer.active) continue;
      const image = swimmer.image;
      const scale = Math.min((field.height * HEIGHT_SHARE) / image.frame.height, MAX_WIDTH / image.frame.width);
      // Fish pictures face left; flipped when swimming right.
      image.setScale(scale).setFlipX(swimmer.direction > 0);
    }
  }

  /** Swims every fish (no allocation: called every frame). */
  update(seconds: number, field: Rect, speed: number): void {
    const loopStart = -LOOP_MARGIN;
    const loopLength = 1 + LOOP_MARGIN * 2;
    for (const swimmer of this.swimmers) {
      if (!swimmer.active) continue;
      const boost = swimmer.scared > 0 ? SCARED_SPEED : 1;
      swimmer.scared = Math.max(0, swimmer.scared - seconds);
      const step = (speed * boost * seconds) / field.width;
      swimmer.along = wrap(swimmer.along + swimmer.direction * step, loopStart, loopLength);
      const x = field.x + swimmer.along * field.width;
      const y = field.y + (this.lanes[swimmer.lane] ?? 0.5) * field.height;
      const image = swimmer.image.setPosition(x, y);
      image.setAlpha(edgeAlpha(x, image.displayWidth / 2, field.x, field.x + field.width));
    }
  }

  /** A tapped fish wiggles and darts away (no penalty). */
  scare(object: Phaser.GameObjects.GameObject): void {
    const swimmer = this.swimmers.find((s) => s.active && s.image === object);
    if (swimmer) swimmer.scared = SCARED_SECONDS;
  }

  clear(): void {
    for (const swimmer of this.swimmers) {
      swimmer.active = false;
      swimmer.image.setVisible(false);
    }
  }
}
