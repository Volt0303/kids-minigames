import { App } from '@capacitor/app';
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { Platform, Unsubscribe } from './Platform';

/** Native side: android/app/src/main/java/.../KioskPlugin.java */
interface KioskPlugin {
  exit(): Promise<void>;
  addListener(event: 'relaunch', listener: () => void): Promise<PluginListenerHandle>;
}

const Kiosk = registerPlugin<KioskPlugin>('Kiosk');

/**
 * Capacitor listeners register asynchronously. The returned function removes
 * the listener once registration has finished, and reports failures instead
 * of swallowing them.
 */
function subscribe(registration: Promise<PluginListenerHandle>, what: string): Unsubscribe {
  const handle = registration.catch((error: unknown) => {
    console.error(`Could not listen for ${what}`, error);
    return undefined;
  });
  return () => {
    handle
      .then((h) => h?.remove())
      .catch((error: unknown) => console.error(`Could not stop listening for ${what}`, error));
  };
}

export class AndroidPlatform implements Platform {
  exit(): Promise<void> {
    return Kiosk.exit();
  }

  onActiveChange(listener: (active: boolean) => void): Unsubscribe {
    return subscribe(
      App.addListener('appStateChange', ({ isActive }) => listener(isActive)),
      'app state changes',
    );
  }

  onBack(listener: () => void): Unsubscribe {
    // Registering this listener also stops Android's default back behaviour.
    return subscribe(
      App.addListener('backButton', () => listener()),
      'the back button',
    );
  }

  onRelaunch(listener: () => void): Unsubscribe {
    return subscribe(Kiosk.addListener('relaunch', listener), 'relaunch');
  }
}
