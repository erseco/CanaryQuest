import Phaser from 'phaser';
import type { Sitio } from '../atlas/carta';
import type { Pueblo } from '../data/pueblos';

/** Los lugares de la carta son pueblos 3D: se abren con la maqueta del puerto. */
export class VisitaScene extends Phaser.Scene {
  constructor() {
    super('Visita');
  }
  create({ sitio }: { sitio: Sitio }) {
    this.scene.start('Puerto', { pueblo: sitio satisfies Pueblo });
  }
}
