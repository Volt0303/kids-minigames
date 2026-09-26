/**
 * What the games need from the device. Games and the session controller use
 * only this interface; each platform provides one adapter.
 */

/** Stops a subscription. */
export type Unsubscribe = () => void;

export interface Platform {
  /** Close the game and return to the app that launched it. */
  exit(): Promise<void>;

  /** `false` when another app comes to the front, `true` when this app returns. */
  onActiveChange(listener: (active: boolean) => void): Unsubscribe;

  /** Hardware back button (Android) or Escape key (browser). */
  onBack(listener: () => void): Unsubscribe;

  /** The launching app opened this game again while it was still running. */
  onRelaunch(listener: () => void): Unsubscribe;
}
