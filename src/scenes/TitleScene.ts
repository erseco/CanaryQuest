import Phaser from 'phaser';
import { SaveManager } from '../sistemas/SaveManager';
import { Musica } from '../sistemas/Musica';
import { iniciarOrquestador } from '../sistemas/Orquestador';

export class TitleScene extends Phaser.Scene {
  private opciones: Phaser.GameObjects.Text[] = [];
  private seleccion = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    const { width, height } = this.scale;
    const fondo = this.add.image(width / 2, height / 2, 'titulo-fondo');
    const escala = Math.max(width / fondo.width, height / fondo.height);
    fondo.setScale(escala);

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.25)
      .setOrigin(0.5);

    this.add
      .text(width / 2, 130, 'CanaryQuest', {
        fontFamily: 'monospace',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#0a1a3a',
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 190, 'Una aventura por las Islas Canarias', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f4c542',
        stroke: '#0a1a3a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const hayPartida = SaveManager.cargar() !== null;
    const etiquetas = hayPartida
      ? ['Continuar', 'Nueva partida']
      : ['Nueva partida'];

    this.opciones = etiquetas.map((texto, i) =>
      this.add
        .text(width / 2, 320 + i * 56, texto, {
          fontFamily: 'monospace',
          fontSize: '30px',
          color: '#ffffff',
          backgroundColor: '#0a1a3aCC',
          padding: { x: 24, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.seleccionar(i))
        .on('pointerdown', () => this.elegir(i)),
    );
    this.seleccionar(0);

    Musica.reproducir(this, 'musica-titulo');
    Musica.crearBotonMute(this);

    this.input.keyboard?.on('keydown-UP', () =>
      this.seleccionar((this.seleccion + this.opciones.length - 1) % this.opciones.length),
    );
    this.input.keyboard?.on('keydown-DOWN', () =>
      this.seleccionar((this.seleccion + 1) % this.opciones.length),
    );
    this.input.keyboard?.on('keydown-ENTER', () => this.elegir(this.seleccion));
    this.input.keyboard?.on('keydown-SPACE', () => this.elegir(this.seleccion));

    this.add
      .text(width - 8, height - 6, 'Música/SFX: BrowserQuest (CC-BY-SA) · Tiles: Tuxemon (CC-BY-SA)', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffffAA',
      })
      .setOrigin(1, 1);
  }

  private seleccionar(i: number): void {
    this.seleccion = i;
    this.opciones.forEach((op, j) =>
      op.setColor(j === i ? '#f4c542' : '#ffffff').setScale(j === i ? 1.08 : 1),
    );
  }

  private elegir(i: number): void {
    const texto = this.opciones[i].text;
    const partida =
      texto === 'Continuar' ? SaveManager.cargar() ?? SaveManager.nueva() : SaveManager.nueva();
    if (texto === 'Nueva partida') SaveManager.guardar(partida);
    this.registry.set('partida', partida);
    iniciarOrquestador(this.game);
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('UI');
      this.scene.start('Island', { islaId: partida.islaActual });
    });
  }
}
