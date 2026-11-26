import Phaser from 'phaser';
import { CARTA, VISITAS } from '../data/dialogos';
import { SITIOS, type Sitio } from '../atlas/carta';

export class VisitaScene extends Phaser.Scene {
  constructor() {
    super('Visita');
  }
  async create({ sitio }: { sitio: Sitio }) {
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
      this.scene.start('Detail', {
        mapaId: 'las-palmas',
        retorno: { islaId, x: entrada.x, y: entrada.y },
      });
    };
    const carta = () => this.scene.start('Carta', { islaId, entrada });
    const frame = this.textures.getFrame('atlas', 'misa-front')!;
    const sprite = document.createElement('canvas');
    sprite.width = frame.cutWidth;
    sprite.height = frame.cutHeight;
    sprite
      .getContext('2d')!
      .drawImage(
        frame.source.image as HTMLImageElement,
        frame.cutX,
        frame.cutY,
        frame.cutWidth,
        frame.cutHeight,
        0,
        0,
        sprite.width,
        sprite.height,
      );
    try {
      const { pasear } = await import('../atlas/pasear');
      const cerrar = await pasear(sitio, sprite, carta, isla, ciudad);
      this.events.once('shutdown', cerrar);
    } catch (error) {
      console.warn('Visita 3D no disponible', error);
      if (sitio === 'las-palmas') {
        ciudad();
        return;
      }
      if (sitio !== 'la-caleta') { isla(); return; }
      this.add.image(480, 270, 'orto-caleta').setDisplaySize(960, 540);
      this.add.text(20, 20, VISITAS[sitio].nombre, {
        fontFamily: 'Georgia',
        fontSize: '30px',
        backgroundColor: '#173e43',
      });
      this.add
        .text(20, 470, CARTA.isla, {
          fontSize: '24px',
          backgroundColor: '#173e43',
          padding: { x: 14, y: 8 },
        })
        .setInteractive()
        .on('pointerdown', isla);
      this.input.keyboard?.once('keydown-ESC', isla);
    }
  }
}
