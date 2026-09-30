import Phaser from 'phaser';
import { ISLAS, buscarTerminal, type IslaId, type Punto, type Terminal } from '../data/islas';
import { destinosDesde, medioDe, type Destino, type MedioTransporte } from '../sistemas/viajes';
import { Musica } from '../sistemas/Musica';
import type { Partida } from '../sistemas/SaveManager';

interface DatosViaje {
  origen: IslaId;
  /** Id de la terminal (puerto o aeropuerto) desde la que se sale. */
  terminal: string;
}

/**
 * Mapa del archipiélago para elegir destino desde un puerto (líneas reales de
 * Fred. Olsen, Naviera Armas, Líneas Romero) o un aeropuerto (Binter).
 */
export class TravelMapScene extends Phaser.Scene {
  private datos!: DatosViaje;
  private medio: MedioTransporte = 'barco';
  private origen!: Terminal;
  private destinos: Destino[] = [];
  private seleccion = 0;
  private marcadores: Phaser.GameObjects.Container[] = [];
  private info!: Phaser.GameObjects.Text;
  private escala = 1;
  private offsetX = 0;
  private offsetY = 0;
  private viajando = false;

  constructor() {
    super('TravelMap');
  }

  init(datos: DatosViaje): void {
    this.datos = datos;
    this.origen = buscarTerminal(datos.terminal)!.terminal;
    this.medio = medioDe(this.origen);
    this.destinos = destinosDesde(datos.terminal);
    this.seleccion = 0;
    this.marcadores = [];
    this.viajando = false;
  }

  /** De coordenadas de mapa-mundo.jpg a pantalla. */
  private enPantalla(p: Punto): Punto {
    return { x: this.offsetX + p.x * this.escala, y: this.offsetY + p.y * this.escala };
  }

  create(): void {
    const { width, height } = this.scale;
    const fondo = this.add.image(0, 0, 'mapa-mundo').setOrigin(0);
    this.escala = Math.min(width / fondo.width, height / fondo.height);
    fondo.setScale(this.escala);
    this.offsetX = (width - fondo.width * this.escala) / 2;
    this.offsetY = (height - fondo.height * this.escala) / 2;
    fondo.setPosition(this.offsetX, this.offsetY);

    const esBarco = this.medio === 'barco';
    this.add
      .text(width / 2, 16, `${esBarco ? '⚓' : '✈'} ${this.origen.nombre} — ¿a dónde ${esBarco ? 'navegamos' : 'volamos'}?`, {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#0a1a3aCC',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    // «Estás aquí» en la terminal de salida (la ilustración ya rotula las islas)
    const aqui = this.enPantalla(this.origen.mapa);
    this.add.circle(aqui.x, aqui.y, 6, 0x9fd8ff).setDepth(50);
    this.add
      .text(aqui.x, aqui.y - 10, 'Estás aquí', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#9fd8ff',
        stroke: '#0a1a3a',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(50);

    this.destinos.forEach((d, i) => {
      const pos = this.enPantalla(d.terminal.mapa);
      this.add
        .line(0, 0, aqui.x, aqui.y, pos.x, pos.y, 0xf4c542, 0.35)
        .setOrigin(0)
        .setDepth(45);
      const circulo = this.add.circle(0, 0, 11, 0xf4c542, 0.4).setStrokeStyle(2, 0xf4c542);
      const marcador = this.add.container(pos.x, pos.y, [circulo]).setDepth(50);
      circulo.setInteractive({ useHandCursor: true });
      circulo.on('pointerover', () => {
        this.seleccion = i;
        this.resaltarSeleccion();
      });
      circulo.on('pointerdown', () => this.viajarA(d));
      this.tweens.add({ targets: circulo, scale: 1.25, duration: 600, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      this.marcadores.push(marcador);
    });

    this.info = this.add
      .text(width / 2, height - 44, '', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#f4c542',
        backgroundColor: '#0a1a3aCC',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setDepth(100);
    this.add
      .text(width / 2, height - 10, '←/→ elegir · ENTER viajar · ESC volver', {
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
      const d = this.destinos[this.seleccion];
      if (d !== undefined) this.viajarA(d);
    });
    this.input.keyboard?.on('keydown-ESC', () => this.volver());

    Musica.reproducir(this, 'musica-mapa');
    this.cameras.main.fadeIn(300);
  }

  private mover(delta: number): void {
    if (this.destinos.length === 0) return;
    this.seleccion = (this.seleccion + delta + this.destinos.length) % this.destinos.length;
    this.resaltarSeleccion();
  }

  private resaltarSeleccion(): void {
    this.marcadores.forEach((m, i) => m.setScale(i === this.seleccion ? 1.4 : 1));
    const d = this.destinos[this.seleccion];
    this.info.setText(
      d === undefined
        ? 'No hay destinos desde aquí'
        : `→ ${d.terminal.nombre} (${ISLAS[d.isla].nombre}) · ${d.compania}`,
    );
  }

  private volver(): void {
    if (this.viajando) return;
    this.scene.start('Island', { islaId: this.datos.origen, entrada: { x: this.origen.x, y: this.origen.y } });
  }

  private viajarA(destino: Destino): void {
    if (this.viajando) return;
    this.viajando = true;

    const desde = this.enPantalla(this.origen.mapa);
    const hasta = this.enPantalla(destino.terminal.mapa);
    const vehiculo = this.add
      .image(desde.x, desde.y, this.medio === 'barco' ? 'ferry' : 'avion')
      .setDepth(80)
      .setFlipX(hasta.x < desde.x);
    this.sound.play('sfx-teleport', { volume: 0.6 });

    this.tweens.add({
      targets: vehiculo,
      x: hasta.x,
      y: hasta.y,
      duration: 2200,
      ease: this.medio === 'barco' ? 'sine.inOut' : 'quad.inOut',
      onComplete: () => {
        if (ISLAS[destino.isla].ilustracion === null) {
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
          partida.islaActual = destino.isla;
          // Se desembarca en la terminal de llegada
          this.scene.start('Island', {
            islaId: destino.isla,
            entrada: { x: destino.terminal.x, y: destino.terminal.y },
          });
        });
      },
    });
  }
}
