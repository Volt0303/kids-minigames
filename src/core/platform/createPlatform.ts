import { Capacitor } from '@capacitor/core';
import { AndroidPlatform } from './AndroidPlatform';
import { BrowserPlatform } from './BrowserPlatform';
import type { Platform } from './Platform';

export function createPlatform(): Platform {
  return Capacitor.getPlatform() === 'android' ? new AndroidPlatform() : new BrowserPlatform();
}
