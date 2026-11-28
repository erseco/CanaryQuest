import Phaser from 'phaser';
import { CURSOR } from '../cursores';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.input.setDefaultCursor(CURSOR.andar);
    this.scene.start('Preload');
  }
}
