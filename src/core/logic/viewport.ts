/**
 * Maps the device screen to the design space every game is written in.
 *
 * Design space: always DESIGN_HEIGHT units tall; its width follows the screen's
 * aspect ratio (3840 on 1920x540, 1728 on 1280x800, 1920 on 1920x1080).
 * The canvas renders at physical pixels so art stays sharp on high-density screens.
 */
import { getLayoutMode, type LayoutMode } from './layout';

export const DESIGN_HEIGHT = 1080;

/** Rendering above 2x costs fill-rate without a visible gain on these tablets. */
export const MAX_PIXEL_RATIO = 2;

export interface ScreenMetrics {
  /** Viewport size in CSS pixels (window.innerWidth / innerHeight). */
  cssWidth: number;
  cssHeight: number;
  /** window.devicePixelRatio */
  pixelRatio: number;
}

export interface Viewport {
  /** Canvas buffer size in physical pixels. */
  physicalWidth: number;
  physicalHeight: number;
  /** Phaser scale-manager zoom: canvas CSS size = physical size x zoom. */
  canvasZoom: number;
  /** Camera zoom: physical pixels per design unit. */
  scale: number;
  /** Design-space size (height is always DESIGN_HEIGHT). */
  designWidth: number;
  designHeight: number;
  mode: LayoutMode;
}

function sanitizeRatio(pixelRatio: number): number {
  if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) return 1;
  return Math.min(pixelRatio, MAX_PIXEL_RATIO);
}

function atLeastOne(value: number): number {
  return Number.isFinite(value) && value >= 1 ? value : 1;
}

export function computeViewport(metrics: ScreenMetrics): Viewport {
  const ratio = sanitizeRatio(metrics.pixelRatio);
  const physicalWidth = Math.round(atLeastOne(metrics.cssWidth) * ratio);
  const physicalHeight = Math.round(atLeastOne(metrics.cssHeight) * ratio);
  const scale = physicalHeight / DESIGN_HEIGHT;
  const designWidth = Math.round(physicalWidth / scale);

  return {
    physicalWidth,
    physicalHeight,
    canvasZoom: 1 / ratio,
    scale,
    designWidth,
    designHeight: DESIGN_HEIGHT,
    mode: getLayoutMode(designWidth, DESIGN_HEIGHT),
  };
}

/** Two viewports that would produce the same canvas and camera. */
export function sameViewport(a: Viewport, b: Viewport): boolean {
  return a.physicalWidth === b.physicalWidth && a.physicalHeight === b.physicalHeight && a.canvasZoom === b.canvasZoom;
}
