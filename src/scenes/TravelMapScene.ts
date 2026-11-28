import { CURSOR } from '../cursores';
import Phaser from 'phaser';
import { fondoCarta } from '../atlas/carta';
import { ISLAS, buscarTerminal, type IslaId, type Punto, type Terminal } from '../data/islas';
import { destinosDesde, medioDe, type Destino, type MedioTransporte } from '../sistemas/viajes';
import { muelle } from '../puerto/paseo';
import { PASEO } from '../data/dialogos';
import { Musica } from '../sistemas/Musica';
import { ESCALA_VEHICULO, texturaFerry } from '../sistemas/vehiculos';
import type { Partida } from '../sistemas/SaveManager';

interface DatosViaje {
  origen: IslaId;
  /** Id de la terminal (puerto o aeropuerto) desde la que se sale. */
  terminal: string;
  desdePueblo?: boolean;
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
  private enPantalla!: (p: Punto) => Punto;
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

  create(): void {
    const { width, height } = this.scale;
    this.enPantalla = fondoCarta(this);

    const esBarco = this.medio === 'barco';
    this.add
      .text(width / 2, 16, `${esBarco ? '⚓' : '✈'} ${this.origen.nombre} — ¿a dónde ${esBarco ? 'navegamos' : 'volamos'}?`, {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#173e43',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setDepth(100);

    // «Estás aquí» en la terminal de salida (la ilustración ya rotula las islas)
    const aqui = this.enPantalla(this.origen.mapa);
    this.add.circle(aqui.x, aqui.y, 6, 0x9fd8ff).setDepth(50);
    this.add
      .text(aqui.x, aqui.y - 10, 'Estás aquí', {
        fontFamily: 'Georgia, serif',
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
      circulo.setInteractive({ cursor: CURSOR.usar });
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
        fontFamily: 'Georgia, serif',
        fontSize: '17px',
        color: '#f4c542',
        backgroundColor: '#173e43',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 1)
      .setDepth(100);
    this.add
      .text(width / 2, height - 10, '←/→ elegir · ENTER viajar · ESC volver', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#ffffff',
        backgroundColor: '#173e43',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5, 1)
      .setDepth(100);

    if (this.datos.desdePueblo) {
      this.add.text(width - 12, 60, PASEO.volverMuelle, {
        fontFamily: 'Georgia, serif', fontSize: '16px', backgroundColor: '#173e42', padding: { x: 10, y: 8 },
      }).setOrigin(1, 0).setDepth(100).setInteractive({ cursor: CURSOR.usar }).on('pointerdown', () => this.volver());
    }
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
    if (this.datos.desdePueblo) {
      this.scene.start('Puerto', { pueblo: 'agaete', llegada: muelle('agaete') });
      return;
    }
    this.scene.start('Island', { islaId: this.datos.origen, lugar: this.origen.id });
  }

  private viajarA(destino: Destino): void {
    if (this.viajando) return;
    this.viajando = true;

    const desde = this.enPantalla(this.origen.mapa);
    const hasta = this.enPantalla(destino.terminal.mapa);
    const alOeste = hasta.x < desde.x;
    const esBarco = this.medio === 'barco';
    const clave = esBarco ? texturaFerry(destino.compania, alOeste) : alOeste ? 'avion-oeste' : 'avion';
    const vehiculo = this.add.image(desde.x, desde.y, clave).setScale(ESCALA_VEHICULO).setDepth(80);
    // El avión, visto desde arriba, apunta al destino (la versión oeste ya mira a la izquierda)
    const rumbo = Math.atan2(hasta.y - desde.y, hasta.x - desde.x) - (alOeste ? Math.PI : 0);
    const sombra = esBarco
      ? null
      : this.add.image(desde.x, desde.y, clave).setTint(0x000000).setAlpha(0.25).setScale(ESCALA_VEHICULO * 0.8).setRotation(rumbo).setDepth(79);
    vehiculo.setRotation(esBarco ? 0 : rumbo);
    // Estela de espuma: una pompa por cada tramo que avanza la popa del ferry, para
    // que no se amontone al zarpar y al atracar
    const estela = esBarco
      ? this.add
          .particles(0, 0, 'espuma', {
            emitting: false,
            lifespan: 1200,
            speedX: { min: -5, max: 5 },
            speedY: { min: -4, max: 4 },
            scale: { start: 0.5, end: 1.2 },
            alpha: { start: 0.55, end: 0 },
          })
          .setDepth(79)
      : null;
    const popa = { x: vehiculo.displayWidth * (alOeste ? 0.45 : -0.45), y: vehiculo.displayHeight * 0.4 };
    const ultima = { ...desde };
    this.sound.play('sfx-teleport', { volume: 0.6 });

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 2200,
      ease: esBarco ? 'sine.inOut' : 'quad.inOut',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        const x = Phaser.Math.Linear(desde.x, hasta.x, t);
        const y = Phaser.Math.Linear(desde.y, hasta.y, t);
        if (esBarco) {
          // El ferry cabecea suavemente con las olas
          const s = this.time.now / 1000;
          vehiculo.setPosition(x, y + Math.sin(s * 5) * 0.8).setRotation(Math.sin(s * 3.4) * 0.035);
          if (Phaser.Math.Distance.Between(x, y, ultima.x, ultima.y) > 1.5) {
            estela?.emitParticleAt(x + popa.x, y + popa.y);
            Object.assign(ultima, { x, y });
          }
          return;
        }
        // El avión despega, sube y aterriza: crece y su sombra se separa en el mar
        const altura = Math.sin(Math.PI * t);
        vehiculo.setPosition(x, y - altura * 6).setScale(ESCALA_VEHICULO * (0.8 + 0.2 * altura));
        sombra?.setPosition(x + altura * 7, y + altura * 12);
      },
      onComplete: () => {
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          const partida = this.registry.get('partida') as Partida;
          partida.islaActual = destino.isla;
          if (destino.terminal.id === 'gc-agaete') {
            this.scene.start('Puerto', { pueblo: 'agaete', llegada: muelle('agaete') });
            return;
          }
          // Se desembarca en la terminal de llegada
          this.scene.start('Island', {
            islaId: destino.isla,
            lugar: destino.terminal.id,
          });
        });
      },
    });
  }
}
