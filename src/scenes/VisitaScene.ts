import Phaser from 'phaser';
import { SITIOS, type Sitio } from '../atlas/carta';
import { PUEBLOS, type Pueblo } from '../data/pueblos';

export class VisitaScene extends Phaser.Scene {
  constructor() {
    super('Visita');
  }
  async create({ sitio }: { sitio: Sitio }) {
    // Los lugares que ya son pueblos se abren con la maqueta del puerto.
    if (Object.hasOwn(PUEBLOS, sitio)) {
      this.scene.start('Puerto', { pueblo: sitio as Pueblo });
      return;
    }
    const { isla: islaId } = SITIOS[sitio];
    const poi = this.make
      .tilemap({ key: 'map-' + islaId })
      .getObjectLayer('pois')!
      .objects.find((p) => p.name === sitio)!;
    const entrada = { x: poi.x!, y: poi.y! };
    if (this.scene.isActive('UI')) this.scene.sleep('UI');
    this.game.events.emit('escena-cambiada', { escena: 'Visita', islaId });
    const ui = () => {
      if (this.scene.isSleeping('UI')) this.scene.wake('UI');
      else this.scene.launch('UI');
    };
    const isla = () => {
      ui();
      this.scene.start('Island', { islaId, entrada });
    };
    const ciudad = () => {
      ui();
      this.scene.start('Detail', { mapaId: 'dunas', retorno: { islaId, x: entrada.x, y: entrada.y } });
    };
    const carta = () => this.scene.start('Carta', { islaId, entrada });
    try {
      const { pasear } = await import('../atlas/pasear');
      const cerrar = await pasear(sitio, carta, isla, ciudad);
      this.events.once('shutdown', cerrar);
    } catch (error) {
      console.warn('Visita 3D no disponible', error);
      ciudad();
    }
  }
}
