import type * as Phaser from 'phaser';

/**
 * The plain-CSS spinner in index.html: already visible and spinning before any JavaScript
 * runs, so the page is never just a flash of background colour. `watchSceneLoading` shows
 * it again for any later screen that has its own pictures still to load, and hides it once
 * that scene is ready to draw (an already-loaded screen only blips it, imperceptibly).
 */
const ELEMENT_ID = 'loading';
const HIDDEN_CLASS = 'hidden';

function element(): HTMLElement | null {
  return document.getElementById(ELEMENT_ID);
}

export function hideLoadingOverlay(): void {
  element()?.classList.add(HIDDEN_CLASS);
}

function showLoadingOverlay(): void {
  element()?.classList.remove(HIDDEN_CLASS);
}

/** A scene's loader plugin lives as long as the scene does, even across repeated start/stop
 * (e.g. relaunching a game); this stops `watchSceneLoading` from piling up a fresh pair of
 * listeners on it every time the scene's own `preload()` runs again. */
const watched = new WeakSet<Phaser.Loader.LoaderPlugin>();

/** Ties the overlay to one scene's own loading, for as long as the scene exists. */
export function watchSceneLoading(scene: Phaser.Scene): void {
  if (watched.has(scene.load)) return;
  watched.add(scene.load);
  scene.load.on('start', showLoadingOverlay);
  scene.load.on('complete', hideLoadingOverlay);
}
