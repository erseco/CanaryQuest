import Phaser from 'phaser';
import { CARTA } from '../data/dialogos';
import { ISLAS, buscarTerminal, type IslaId } from '../data/islas';
import { Jugador } from '../sistemas/Jugador';
import { Musica } from '../sistemas/Musica';

interface Poi {
  nombre: string;
  tipo: string;
  x: number;
  y: number;
}

const RADIO_POI = 48;

/** POIs del overworld que abren un mapa de detalle (pueblo, dunas, ciudades…). */
const ENTRADAS_DETALLE = new Set(['pueblo', 'dunas', 'las-palmas', 'isleta', 'roque-nublo']);

/**
 * Overworld de isla: ilustración + polígono andable + POIs.
 * Sin NPCs, monstruos ni items de misión — eso vive solo en DetailScene.
 */
export class IslandScene extends Phaser.Scene {
  private islaId!: IslaId;
  private jugador!: Jugador;
  private andable!: Phaser.Geom.Polygon;
  private pois: Poi[] = [];
  private poiCercano: Poi | null = null;
  private aviso!: Phaser.GameObjects.Text;
  private saliendo = false;
  private localizador!: Phaser.GameObjects.Arc;
  private miniatura!: Phaser.GameObjects.Image;

  constructor() {
    super('Island');
  }

  init(datos: { islaId: IslaId; lugar?: string; entrada?: { x: number; y: number } }): void {
    this.islaId = datos.islaId;
    this.saliendo = false;
    this.poiCercano = null;
  }

  create(datos: { islaId: IslaId; lugar?: string; entrada?: { x: number; y: number } }): void {
    const isla = ISLAS[this.islaId];
    const fondo = this.add.image(0, 0, `isla-${this.islaId}`).setOrigin(0);

    const mapa = this.make.tilemap({ key: `map-${this.islaId}` });
    const orilla = mapa.getObjectLayer('colisiones')!.objects[0];
    this.andable = new Phaser.Geom.Polygon(
      orilla.polygon!.map((p) => new Phaser.Math.Vector2(p.x, p.y)),
    );
    this.pois = mapa.getObjectLayer('pois')!.objects.map((o) => ({
      nombre: o.name,
      tipo: o.type!,
      x: o.x!,
      y: o.y!,
    }));
    const spawn = datos.entrada ?? this.pois.find((p) => p.nombre === (datos.lugar ?? 'spawn'))!;
    this.jugador = new Jugador(this, spawn.x, spawn.y, (x, y) =>
      Phaser.Geom.Polygon.Contains(this.andable, x, y),
    );

    this.jugador.setDepth(12);
    for (const poi of this.pois) {
      if (poi.tipo === 'spawn') continue;
      const terminal = buscarTerminal(poi.nombre)?.terminal;
      const icono = terminal
        ? terminal.tipo === 'puerto'
          ? '⚓'
          : '✈'
        : poi.tipo === 'paisaje'
          ? '▲'
          : '★';
      const y = poi.y - 14;
      this.add.circle(poi.x, y, 12, 0x18494b).setStrokeStyle(2, 0xf3d490).setDepth(5);
      this.add
        .text(poi.x, y, icono, { fontFamily: 'Arial', fontSize: '15px', color: '#fbebbd' })
        .setOrigin(0.5)
        .setDepth(6);
      const nombre =
        terminal?.nombre.replace(/^Puerto de |^Aeropuerto de /, '') ??
        isla.zonas?.find((z) => z.mapa === poi.nombre)?.etiqueta ??
        CARTA.lugares[poi.nombre];
      if (nombre)
        this.add
          .text(poi.x, y - 16, nombre, {
            fontFamily: 'Georgia',
            fontSize: '15px',
            color: '#fff7d8',
            stroke: '#254744',
            strokeThickness: 4,
          })
          .setOrigin(0.5, 1)
          .setDepth(5);
    }

    this.cameras.main.setBounds(0, 0, fondo.width, fondo.height);
    this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
    this.cameras.main.fadeIn(300);

    // Tap-to-move / activar POI
    this.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer, objetos: Phaser.GameObjects.GameObject[]) => {
        if (objetos.length) return;
        const mundo = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        this.jugador.irA(mundo.x, mundo.y);
      },
    );

    this.aviso = this.add
      .text(this.scale.width / 2, this.scale.height - 90, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#0a1a3aCC',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    this.input.keyboard?.on('keydown-E', () => this.activarPoi());
    this.input.keyboard?.on('keydown-ENTER', () => this.activarPoi());

    const papel = {
      fontFamily: 'Georgia, serif',
      fontSize: '17px',
      color: '#fff1d3',
      backgroundColor: '#173f46',
      padding: { x: 13, y: 7 },
    };
    this.add
      .text(this.scale.width / 2, 10, isla.nombre, { ...papel, fontSize: '25px' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);
    const abrirCarta = () =>
      this.scene.start('Carta', {
        islaId: this.islaId,
        entrada: { x: this.jugador.x, y: this.jugador.y },
      });
    this.add
      .text(this.scale.width / 2, 50, CARTA.titulo + ' ↗', papel)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', abrirCarta);
    this.input.keyboard?.on('keydown-C', abrirCarta);

    // La miniatura usa la misma textura y proyección que el terreno bajo los pies.
    const borde = this.add.rectangle(878, 130, 124, 104, 0xf4d8a0).setDepth(89).setScrollFactor(0);
    this.miniatura = this.add
      .image(878, 130, fondo.texture.key)
      .setDisplaySize(120, 100)
      .setScrollFactor(0)
      .setDepth(90)
      .setInteractive({ useHandCursor: true });
    this.localizador = this.add
      .circle(0, 0, 4, 0xffde7c)
      .setStrokeStyle(2, 0x315054)
      .setScrollFactor(0)
      .setDepth(92);
    const destinos = this.pois
      .filter((p) => p.tipo !== 'spawn')
      .map((p) => ({
        p,
        marca: this.add
          .circle(0, 0, 2.5, 0xf3e9cd)
          .setStrokeStyle(1, 0x314844)
          .setScrollFactor(0)
          .setDepth(91),
      }));
    const situar = () =>
      destinos.forEach(({ p, marca }) =>
        marca.setPosition(
          this.miniatura.x + (p.x / fondo.width - 0.5) * this.miniatura.displayWidth,
          this.miniatura.y + (p.y / fondo.height - 0.5) * this.miniatura.displayHeight,
        ),
      );
    situar();
    let ampliada = false;
    const ampliar = () => {
      ampliada = !ampliada;
      this.miniatura
        .setPosition(ampliada ? 480 : 878, ampliada ? 271 : 130)
        .setDisplaySize(ampliada ? 432 : 120, ampliada ? 360 : 100);
      borde
        .setPosition(this.miniatura.x, this.miniatura.y)
        .setSize(this.miniatura.displayWidth + 4, this.miniatura.displayHeight + 4);
      situar();
    };
    this.miniatura.on('pointerdown', ampliar);
    this.input.keyboard?.on('keydown-M', ampliar);
    Musica.reproducir(this, 'musica-isla');

    // Depuración: ?debug=1 pinta el polígono andable
    if (new URLSearchParams(location.search).get('debug') === '1') {
      const g = this.add.graphics().setDepth(50);
      g.lineStyle(3, 0xff00ff, 0.8);
      g.strokePoints(this.andable.points, true);
    }

    this.game.events.emit('escena-cambiada', { escena: 'Island', islaId: this.islaId });
  }

  update(_time: number, delta: number): void {
    this.jugador.bloqueado = this.registry.get('dialogo-abierto') === true;
    const pad = (this.registry.get('pad') as { x: number; y: number }) ?? { x: 0, y: 0 };
    this.jugador.padTactil.set(pad.x, pad.y);
    this.jugador.actualizar(delta);

    this.localizador.setPosition(
      this.miniatura.x + (this.jugador.x / this.miniatura.width - 0.5) * this.miniatura.displayWidth,
      this.miniatura.y + (this.jugador.y / this.miniatura.height - 0.5) * this.miniatura.displayHeight,
    );
    // Detectar POI cercano
    let cercano: Poi | null = null;
    let radio = RADIO_POI;
    for (const p of this.pois) {
      if (p.tipo === 'spawn') continue;
      const distancia = Math.hypot(p.x - this.jugador.x, p.y - this.jugador.y);
      if (distancia < radio) {
        cercano = p;
        radio = distancia;
      }
    }
    if (cercano !== this.poiCercano) {
      this.poiCercano = cercano;
      if (cercano === null) {
        this.aviso.setVisible(false);
      } else {
        this.aviso
          .setText(this.etiquetaPoi(cercano) + (cercano.tipo === 'paisaje' ? '' : CARTA.activar))
          .setVisible(true);
        this.aviso.removeAllListeners('pointerdown');
        this.aviso.disableInteractive();
        if (cercano.tipo !== 'paisaje')
          this.aviso.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.activarPoi());
      }
    }
  }

  private etiquetaPoi(poi: Poi): string {
    const zona = ISLAS[this.islaId].zonas?.find((z) => z.mapa === poi.nombre);
    const terminal = buscarTerminal(poi.nombre)?.terminal;
    if (terminal) return `${terminal.nombre} (${terminal.tipo === 'puerto' ? 'ferry' : 'Binter'})`;
    return CARTA.lugares[poi.nombre] ?? zona?.etiqueta ?? poi.nombre;
  }

  private activarPoi(): void {
    if (this.poiCercano === null || this.saliendo) return;
    const poi = this.poiCercano;
    if (ENTRADAS_DETALLE.has(poi.nombre) || poi.tipo === 'entrada') {
      this.saliendo = true;
      this.cameras.main.fadeOut(250);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (poi.nombre === 'la-caleta' || poi.nombre === 'las-palmas') {
          this.scene.start('Visita', { sitio: poi.nombre });
          return;
        }
        if (poi.nombre === 'pueblo') {
          this.scene.start('Puerto', { entrada: { x: poi.x, y: poi.y } });
          return;
        }
        this.scene.start('Detail', {
          mapaId: poi.nombre,
          retorno: { islaId: this.islaId, x: poi.x, y: poi.y },
        });
      });
    } else if (poi.nombre === 'gc-agaete') {
      this.saliendo = true;
      this.scene.start('Puerto', { pueblo: 'agaete', entrada: { x: poi.x, y: poi.y } });
    } else if (poi.tipo === 'transporte') {
      this.scene.start('TravelMap', { origen: this.islaId, terminal: poi.nombre });
    } else if (poi.tipo === 'hito') {
      this.game.events.emit('llegar', { poi: poi.nombre });
    }
  }
}
