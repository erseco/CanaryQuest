import Phaser from 'phaser';
import { ISLAS, type IslaId } from '../data/islas';
import { Jugador } from '../sistemas/Jugador';
import { Enemigo } from '../sistemas/Enemigo';
import { Musica } from '../sistemas/Musica';
import type { QuestManager } from '../sistemas/QuestManager';

interface Poi {
  nombre: string;
  tipo: string;
  x: number;
  y: number;
}

const RADIO_POI = 48;

export class IslandScene extends Phaser.Scene {
  private islaId!: IslaId;
  private jugador!: Jugador;
  private andable!: Phaser.Geom.Polygon;
  private pois: Poi[] = [];
  private poiCercano: Poi | null = null;
  private aviso!: Phaser.GameObjects.Text;
  private cabras: Phaser.GameObjects.Sprite[] = [];
  private enemigos: Enemigo[] = [];
  private entrada = { x: 400, y: 900 };
  private saliendo = false;

  constructor() {
    super('Island');
  }

  init(datos: { islaId: IslaId; entrada?: { x: number; y: number } }): void {
    this.islaId = datos.islaId;
    this.saliendo = false;
    this.cabras = [];
    this.enemigos = [];
    this.poiCercano = null;
  }

  create(datos: { islaId: IslaId; entrada?: { x: number; y: number } }): void {
    const isla = ISLAS[this.islaId];
    const fondo = this.add.image(0, 0, `isla-${this.islaId}`).setOrigin(0);

    // Cargar polígono andable y POIs del .tmj de la isla, si existe.
    // Las islas aún sin mapa de colisiones usan un rectángulo genérico
    // y los POIs de transporte definidos en datos (pendientes de pulir).
    if (this.cache.tilemap.exists(`map-${this.islaId}`)) {
      const mapa = this.make.tilemap({ key: `map-${this.islaId}` });
      const capaColisiones = mapa.getObjectLayer('colisiones');
      const poligono = capaColisiones?.objects.find((o) => o.name === 'andable');
      const puntos = (poligono?.polygon ?? []).map(
        (p) => new Phaser.Geom.Point((poligono?.x ?? 0) + p.x, (poligono?.y ?? 0) + p.y),
      );
      this.andable = new Phaser.Geom.Polygon(puntos);

      this.pois = (mapa.getObjectLayer('pois')?.objects ?? []).map((o) => ({
        nombre: o.name,
        tipo: (o.type ?? (o as unknown as Record<string, string>)['class']) || '',
        x: o.x ?? 0,
        y: o.y ?? 0,
      }));
    } else {
      const margen = 150;
      this.andable = new Phaser.Geom.Polygon([
        new Phaser.Geom.Point(margen, margen),
        new Phaser.Geom.Point(fondo.width - margen, margen),
        new Phaser.Geom.Point(fondo.width - margen, fondo.height - margen),
        new Phaser.Geom.Point(margen, fondo.height - margen),
      ]);
      this.pois = [];
      if (isla.puerto !== null) {
        this.pois.push({ nombre: 'puerto', tipo: 'transporte', ...isla.puerto });
        this.pois.push({ nombre: 'spawn', tipo: 'spawn', x: isla.puerto.x, y: isla.puerto.y - 60 });
      }
      if (isla.aeropuerto !== null) {
        this.pois.push({ nombre: 'aeropuerto', tipo: 'transporte', ...isla.aeropuerto });
      }
    }

    const spawn = datos.entrada ?? this.pois.find((p) => p.nombre === 'spawn') ?? { x: 400, y: 900 };
    this.entrada = { x: spawn.x, y: spawn.y };
    this.jugador = new Jugador(this, spawn.x, spawn.y, (x, y) =>
      Phaser.Geom.Polygon.Contains(this.andable, x, y),
    );

    // Marcadores visuales de POIs
    for (const poi of this.pois) {
      if (poi.tipo === 'spawn') continue;
      const icono = poi.tipo === 'transporte' ? (poi.nombre === 'puerto' ? '⚓' : '✈') : '★';
      this.add
        .text(poi.x, poi.y, icono, { fontSize: '28px' })
        .setOrigin(0.5)
        .setDepth(5);
    }

    this.cameras.main.setBounds(0, 0, fondo.width, fondo.height);
    this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
    this.cameras.main.fadeIn(300);

    // Tap-to-move / activar POI
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const mundo = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.jugador.irA(mundo.x, mundo.y);
    });

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

    // Cartel con el nombre de la isla
    this.add
      .text(this.scale.width / 2, 24, isla.nombre, {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#0a1a3a',
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.crearFauna();

    // Combate y muerte
    this.input.keyboard?.on('keydown-SPACE', () => this.atacar());
    const alAtacar = () => this.atacar();
    const alMorir = () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.jugador.setPosition(this.entrada.x, this.entrada.y);
        this.jugador.pararObjetivo();
        this.cameras.main.fadeIn(300);
      });
    };
    this.game.events.on('atacar', alAtacar);
    this.game.events.on('jugador-muerto', alMorir);
    this.events.once('shutdown', () => {
      this.game.events.off('atacar', alAtacar);
      this.game.events.off('jugador-muerto', alMorir);
    });

    Musica.reproducir(this, 'musica-isla');

    // Depuración: ?debug=1 pinta el polígono andable
    if (new URLSearchParams(location.search).get('debug') === '1') {
      const g = this.add.graphics().setDepth(50);
      g.lineStyle(3, 0xff00ff, 0.8);
      g.strokePoints(this.andable.points, true);
    }

    this.game.events.emit('escena-cambiada', { escena: 'Island', islaId: this.islaId });
  }

  /** Cabras perdidas y alimañas de la misión (solo Gran Canaria en el slice). */
  private crearFauna(): void {
    if (this.islaId !== 'gran-canaria') return;
    const posicionesCabras: Array<[number, number]> = [
      [600, 1020],
      [770, 990],
      [660, 1090],
    ];
    for (const [x, y] of posicionesCabras) {
      const cabra = this.add.sprite(x, y, 'cabra').setDepth(5);
      this.tweens.add({
        targets: cabra,
        y: y - 4,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      this.cabras.push(cabra);
    }
    this.crearAlimana();
  }

  private crearAlimana(): void {
    const alimana = new Enemigo(this, 850, 900, 'alimana', 'crab', (x, y) =>
      Phaser.Geom.Polygon.Contains(this.andable, x, y),
    );
    alimana.setDepth(5);
    this.enemigos.push(alimana);
  }

  private atacar(): void {
    if (this.registry.get('dialogo-abierto') === true) return;
    const golpe = this.jugador.atacar();
    if (golpe === null) return;
    for (const enemigo of this.enemigos) {
      if (
        !enemigo.estaMuerto &&
        Phaser.Math.Distance.Between(golpe.x, golpe.y, enemigo.x, enemigo.y) < golpe.radio + 14
      ) {
        enemigo.recibirGolpe(this.jugador.x, this.jugador.y);
        this.game.events.emit('derrotado', { enemigo: enemigo.especie });
        // La alimaña reaparece pasado un rato (por si la misión la vuelve a pedir)
        this.time.delayedCall(9000, () => {
          if (this.scene.isActive() && this.islaId === 'gran-canaria') this.crearAlimana();
        });
      }
    }
  }

  update(_time: number, delta: number): void {
    this.jugador.bloqueado = this.registry.get('dialogo-abierto') === true;
    const pad = (this.registry.get('pad') as { x: number; y: number }) ?? { x: 0, y: 0 };
    this.jugador.padTactil.set(pad.x, pad.y);
    this.jugador.actualizar(delta);

    for (const enemigo of this.enemigos) {
      enemigo.actualizar(this.jugador.x, this.jugador.y);
      if (
        !enemigo.estaMuerto &&
        !this.jugador.invulnerable &&
        Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y - 10, enemigo.x, enemigo.y) < 26
      ) {
        this.jugador.recibirDano(enemigo.x, enemigo.y);
        this.game.events.emit('dano');
      }
    }

    this.enemigos = this.enemigos.filter((e) => e.active);

    // Recoger cabras al tocarlas (solo con la misión en el paso de recogerlas)
    const qm = this.registry.get('quest-manager') as QuestManager | undefined;
    const paso = qm?.pasoActual('pastor-roque-nublo');
    const puedeRecoger = paso?.tipo === 'recoger' && paso.item === 'cabra';
    for (const cabra of [...this.cabras]) {
      if (
        puedeRecoger &&
        cabra.active &&
        Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, cabra.x, cabra.y) < 28
      ) {
        this.sound.play('sfx-loot', { volume: 0.7 });
        this.cabras.splice(this.cabras.indexOf(cabra), 1);
        this.tweens.add({
          targets: cabra,
          y: cabra.y - 24,
          alpha: 0,
          duration: 350,
          onComplete: () => cabra.destroy(),
        });
        this.game.events.emit('recoger', { item: 'cabra' });
      }
    }

    // Detectar POI cercano
    const cercano =
      this.pois.find(
        (p) =>
          p.tipo !== 'spawn' &&
          Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, p.x, p.y) < RADIO_POI,
      ) ?? null;
    if (cercano !== this.poiCercano) {
      this.poiCercano = cercano;
      if (cercano === null) {
        this.aviso.setVisible(false);
      } else {
        this.aviso.setText(`${this.etiquetaPoi(cercano)} — pulsa E o toca aquí`).setVisible(true);
        this.aviso.removeAllListeners('pointerdown');
        this.aviso.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.activarPoi());
      }
    }
  }

  private etiquetaPoi(poi: Poi): string {
    const nombres: Record<string, string> = {
      pueblo: 'Entrar en el pueblo',
      puerto: 'Puerto (ferry)',
      aeropuerto: 'Aeropuerto (Binter)',
      'roque-nublo': 'Roque Nublo',
      dunas: 'Dunas de Maspalomas',
    };
    return nombres[poi.nombre] ?? poi.nombre;
  }

  private activarPoi(): void {
    if (this.poiCercano === null || this.saliendo) return;
    const poi = this.poiCercano;
    if (poi.nombre === 'pueblo') {
      this.saliendo = true;
      this.cameras.main.fadeOut(250);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Detail', {
          mapaId: 'pueblo',
          retorno: { islaId: this.islaId, x: poi.x, y: poi.y + 50 },
        });
      });
    } else if (poi.tipo === 'transporte') {
      this.scene.start('TravelMap', {
        origen: this.islaId,
        medio: poi.nombre === 'puerto' ? 'barco' : 'avion',
      });
    } else if (poi.tipo === 'hito') {
      this.game.events.emit('llegar', { poi: poi.nombre });
    }
  }
}
