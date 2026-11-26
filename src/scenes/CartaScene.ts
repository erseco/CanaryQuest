import Phaser from 'phaser';
import { CARTA, VISITAS } from '../data/dialogos';
import { ISLAS, type IslaId, type Punto } from '../data/islas';
import type { Pueblo } from '../data/pueblos';
import { fondoCarta, SITIOS, type Sitio } from '../atlas/carta';

export interface RegresoCarta {
  islaId: IslaId;
  entrada?: Punto;
  pueblo?: Pueblo;
}
export class CartaScene extends Phaser.Scene {
  constructor() {
    super('Carta');
  }
  create(regreso: RegresoCarta) {
    if (this.scene.isActive('UI')) this.scene.sleep('UI');
    const pantalla = fondoCarta(this);
    const estilo = {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#fff2d5',
      backgroundColor: '#163e44',
      padding: { x: 12, y: 7 },
    };
    const irIsla = () => {
      if (this.scene.isSleeping('UI')) this.scene.wake('UI');
      else this.scene.launch('UI');
      this.scene.start('Island', { islaId: regreso.islaId, entrada: regreso.entrada });
    };
    const volver = () =>
      regreso.pueblo ? this.scene.start('Puerto', { pueblo: regreso.pueblo }) : irIsla();
    this.add.text(24, 18, CARTA.titulo, { fontFamily: 'Georgia', fontSize: '32px', color: '#fff2d5' });
    this.add
      .text(936, 18, CARTA.volver, estilo)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', volver);
    this.add
      .text(24, 65, ISLAS[regreso.islaId].nombre + ' ↗', estilo)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', irIsla);
    this.input.keyboard?.once('keydown-ESC', volver);
    const sitios = Object.keys(SITIOS) as Sitio[];
    let actual = 0;
    const botones: Phaser.GameObjects.Text[] = [];
    const visitar = (sitio: Sitio) => this.scene.start('Visita', { sitio });
    for (const [i, sitio] of sitios.entries()) {
      const p = pantalla(SITIOS[sitio].carta);
      this.add
        .circle(p.x, p.y, 9, 0xf9d689)
        .setStrokeStyle(3, 0x23545a)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => visitar(sitio));
      const boton = this.add
        .text(18 + (i%3) * 309, 446 + Math.floor(i/3)*39, VISITAS[sitio].nombre + ' ↗', estilo)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => visitar(sitio));
      botones.push(boton);
    }
    const seleccionar = (i: number) => {
      actual = i;
      botones.forEach((b, j) => b.setColor(i === j ? '#ffdb8c' : '#fff2d5'));
    };
    this.add.text(25, 425, CARTA.sitios, {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#e6e7ce',
    });
    seleccionar(0);
    this.input.keyboard?.on('keydown-LEFT', () => seleccionar((actual + sitios.length - 1) % sitios.length));
    this.input.keyboard?.on('keydown-RIGHT', () => seleccionar((actual + 1) % sitios.length));
    this.input.keyboard?.on('keydown-ENTER', () => visitar(sitios[actual]));
  }
}
