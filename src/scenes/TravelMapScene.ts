import Phaser from 'phaser';
import { ISLAS, type IslaId } from '../data/islas';
import { destinosDesde, type MedioTransporte } from '../sistemas/viajes';
import { Musica } from '../sistemas/Musica';
import type { Partida } from '../sistemas/SaveManager';

interface DatosViaje {
  origen: IslaId;
  medio: MedioTransporte;
}

/**
 * Mapa del archipiélago para elegir destino. El ferry (Fred Olsen /
 * Naviera Armas) sale del puerto; el avión de Binter, del aeropuerto.
 */
export class TravelMapScene extends Phaser.Scene {
  private datos!: DatosViaje;
  private destinos: IslaId[] = [];
  private seleccion = 0;
  private marcadores = new Map<IslaId, Phaser.GameObjects.Container>();
  private escala = 1;
  private offsetX = 0;
  private offsetY = 0;
  private viajando = false;

  constructor() {
    super('TravelMap');
  }

  init(datos: DatosViaje): void {
    this.datos = datos;
    this.destinos = destinosDesde(datos.origen, datos.medio);
    this.seleccion = 0;
    this.marcadores.clear();
    this.viajando = false;
  }

  create(): void {
    const { width, height } = this.scale;
    const fondo = this.add.image(0, 0, 'mapa-mundo').setOrigin(0);
    this.escala = Math.min(width / fondo.width, height / fondo.height);
    fondo.setScale(this.escala);
    this.offsetX = (width - fondo.width * this.escala) / 2;
    this.offsetY = (height - fondo.height * this.escala) / 2;
    fondo.setPosition(this.offsetX, this.offsetY);

    const esBarco = this.datos.medio === 'barco';
    this.add
      .text(
        width / 2,
        16,
        esBarco ? '⚓ Ferry — ¿a qué isla navegamos?' : '✈ Binter — ¿a qué isla volamos?',
        {
          fontFamily: 'monospace',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#0a1a3aCC',
          padding: { x: 14, y: 8 },
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(100);

    for (const isla of Object.values(ISLAS)) {
      const px = this.offsetX + isla.mapaMundo.x * this.escala;
      const py = this.offsetY + isla.mapaMundo.y * this.escala;
      const esOrigen = isla.id === this.datos.origen;
      const esDestino = this.destinos.includes(isla.id);

      const contenedor = this.add.container(px, py).setDepth(50);
      const etiqueta = this.add
        .text(0, 18, isla.nombre, {
          fontFamily: 'monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: esOrigen ? '#9fd8ff' : esDestino ? '#ffffff' : '#ffffff55',
          stroke: '#0a1a3a',
          strokeThickness: 4,
        })
        .setOrigin(0.5, 0);
      contenedor.add(etiqueta);
      if (esOrigen) {
        contenedor.add(
          this.add
            .text(0, -14, 'Estás aquí', {
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#9fd8ff',
              stroke: '#0a1a3a',
              strokeThickness: 3,
            })
            .setOrigin(0.5, 1),
        );
      }
      if (esDestino) {
        const circulo = this.add.circle(0, 0, 14, 0xf4c542, 0.35).setStrokeStyle(2, 0xf4c542);
        contenedor.addAt(circulo, 0);
        circulo.setInteractive({ useHandCursor: true });
        circulo.on('pointerdown', () => this.viajarA(isla.id));
        this.tweens.add({
          targets: circulo,
          scale: 1.25,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }
      this.marcadores.set(isla.id, contenedor);
    }

    this.add
      .text(width / 2, height - 14, '←/→ elegir · ENTER viajar · ESC volver', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#0a1a3aCC',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setDepth(100);

    this.resaltarSeleccion();

    this.input.keyboard?.on('keydown-LEFT', () => this.mover(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.mover(1));
    this.input.keyboard?.on('keydown-UP', () => this.mover(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.mover(1));
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.destinos[this.seleccion] !== undefined) this.viajarA(this.destinos[this.seleccion]);
    });
    this.input.keyboard?.on('keydown-ESC', () => this.volver());

    Musica.reproducir(this, 'musica-mapa');
    this.cameras.main.fadeIn(300);
  }

  private mover(delta: number): void {
    if (this.destinos.length === 0) return;
    this.seleccion =
      (this.seleccion + delta + this.destinos.length) % this.destinos.length;
    this.resaltarSeleccion();
  }

  private resaltarSeleccion(): void {
    this.destinos.forEach((id, i) => {
      this.marcadores.get(id)?.setScale(i === this.seleccion ? 1.35 : 1);
    });
  }

  private volver(): void {
    if (this.viajando) return;
    this.scene.start('Island', { islaId: this.datos.origen });
  }

  private viajarA(destino: IslaId): void {
    if (this.viajando) return;
    this.viajando = true;

    const origen = ISLAS[this.datos.origen];
    const destinoIsla = ISLAS[destino];
    const x0 = this.offsetX + origen.mapaMundo.x * this.escala;
    const y0 = this.offsetY + origen.mapaMundo.y * this.escala;
    const x1 = this.offsetX + destinoIsla.mapaMundo.x * this.escala;
    const y1 = this.offsetY + destinoIsla.mapaMundo.y * this.escala;

    const vehiculo = this.add
      .image(x0, y0, this.datos.medio === 'barco' ? 'ferry' : 'avion')
      .setDepth(80)
      .setFlipX(x1 < x0);
    this.sound.play('sfx-teleport', { volume: 0.6 });

    this.tweens.add({
      targets: vehiculo,
      x: x1,
      y: y1,
      duration: 2200,
      ease: this.datos.medio === 'barco' ? 'sine.inOut' : 'quad.inOut',
      onComplete: () => {
        if (destinoIsla.ilustracion === null) {
          // Isla sin arte todavía
          this.game.events.emit('dialogo', {
            clave: 'proximamente',
            alTerminar: () => {
              vehiculo.destroy();
              this.viajando = false;
            },
          });
          return;
        }
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          const partida = this.registry.get('partida') as Partida;
          partida.islaActual = destino;
          this.scene.start('Island', { islaId: destino });
        });
      },
    });
  }
}
