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

export interface LoadingOverlayArt {
  /** URL of this game's backdrop picture, if it has one. */
  backdropUrl?: string;
  /** URL of the guide character's happy pose; omit for games that must not show it. */
  avatarUrl?: string;
}

/**
 * Calls `onReady` once every picture in `urls` has finished loading (or failed — a missing
 * picture must not keep the loading screen blank). `style.backgroundImage` alone does not
 * wait for that, and showing a picture before it is ready leaves a gap of plain page colour.
 */
function whenImagesReady(urls: readonly string[], onReady: () => void): void {
  let pending = urls.length;
  if (pending === 0) onReady();
  for (const url of urls) {
    const image = new Image();
    let done = false;
    const ready = (): void => {
      if (done) return;
      done = true;
      pending -= 1;
      if (pending === 0) onReady();
    };
    // Decoded, not just downloaded, so the first frame after showing it already has the picture.
    const decoded = (): void => void image.decode().then(ready, ready);
    image.onload = decoded;
    image.onerror = ready;
    image.src = url;
    // Already cached (e.g. loaded by index.html's early script): onload may not fire again.
    if (image.complete) decoded();
  }
}

/**
 * Sets the loading screen's backdrop and centre character for this game build — the same
 * classes and picture addresses on <html> that index.html's early script already set, so this
 * changes nothing visible; it is the authoritative copy of that hand-kept table. The character
 * and the backdrop appear together once both pictures are decoded; games without the
 * character get the plain circle (`no-guide`).
 */
export function configureLoadingOverlay({ backdropUrl, avatarUrl }: LoadingOverlayArt, onShown: () => void): void {
  const root = document.documentElement;
  root.classList.toggle('no-guide', !avatarUrl);
  root.classList.toggle('has-backdrop', !!backdropUrl);
  const urls = [avatarUrl, backdropUrl].filter((url): url is string => !!url);
  whenImagesReady(urls, () => {
    if (avatarUrl) root.style.setProperty('--loading-avatar', `url('${avatarUrl}')`);
    if (backdropUrl) root.style.setProperty('--loading-backdrop', `url('${backdropUrl}')`);
    root.classList.add('revealed');
    onShown();
  });
}

/** A scene's loader plugin lives as long as the scene does, even across repeated start/stop
 * (e.g. relaunching a game); this stops the `start` listener below from piling up a fresh
 * copy every time the scene's own `preload()` runs again. */
const watched = new WeakSet<Phaser.Loader.LoaderPlugin>();

/**
 * Ties the overlay to one scene's own loading: shown as soon as this scene starts loading
 * its pictures, hidden only once that scene has actually finished building them (the
 * loader's own `complete` fires a touch earlier — before `create()` has run — which could
 * still show a half-built or stale frame for an instant).
 */
export function watchSceneLoading(scene: Phaser.Scene): void {
  if (!watched.has(scene.load)) {
    watched.add(scene.load);
    scene.load.on('start', showLoadingOverlay);
  }
  scene.events.once('create', hideLoadingOverlay);
}
