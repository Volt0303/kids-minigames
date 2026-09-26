import type * as Phaser from 'phaser';

declare global {
  interface Window {
    /** Development builds only: lets automated browser tests inspect the running game. */
    __kidsGame?: Phaser.Game;
  }
}
