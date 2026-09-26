import type { Platform, Unsubscribe } from './Platform';

/**
 * Development stand-in for the Android app, used in the desktop browser.
 * Exit reloads the page, which is the closest equivalent of a fresh launch.
 */
export class BrowserPlatform implements Platform {
  exit(): Promise<void> {
    console.warn('Exit requested — reloading to simulate the next launch.');
    window.location.reload();
    return Promise.resolve();
  }

  onActiveChange(listener: (active: boolean) => void): Unsubscribe {
    const handler = (): void => listener(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  onBack(listener: () => void): Unsubscribe {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') listener();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }

  onRelaunch(): Unsubscribe {
    // A browser tab is never relaunched while running.
    return () => undefined;
  }
}
