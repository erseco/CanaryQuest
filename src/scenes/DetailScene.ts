import Phaser from 'phaser';
import type { IslaId } from '../data/islas';
import { Jugador } from '../sistemas/Jugador';
import { Npc } from '../sistemas/Npc';
import { Enemigo } from '../sistemas/Enemigo';
import { Musica } from '../sistemas/Musica';
import type { QuestManager } from '../sistemas/QuestManager';

/** Salida al overworld de isla y, opcionalmente, al mapa Detail padre (interiores). */
export interface RetornoDetalle {
  islaId: IslaId;
  x: number;
  y: number;
  /**
   * Si hay padre, el borde inferior vuelve a ese Detail (p. ej. Chistera → Isleta).
   * `retorno` del padre se restaura tal cual para no romper la cadena.
   */
  parent?: { mapaId: string; x: number; y: number; retorno: RetornoDetalle };
}

interface DatosDetalle {
  mapaId: string;
  retorno: RetornoDetalle;
  /** Override del Spawn Point del .tmj (p. ej. al salir de un interior). */
  entrada?: { x: number; y: number };
}

interface PuntoMapa {
  nombre: string;
  tipo: string;
  x: number;
  y: number;
  etiqueta?: string;
}

const RADIO_PUERTA = 40;

/**
 * Escena de detalle (pueblos, ciudades, dunas, locales, mazmorras) con tilemap Tiled 32 px.
 * Aquí viven NPCs, monstruos e items de misión. El overworld (Island) no los tiene.
 */
export class DetailScene extends Phaser.Scene {
  private datos!: DatosDetalle;
  private jugador!: Jugador;
  private npcs: Npc[] = [];
  private enemigos: Enemigo[] = [];
  private cabras: Phaser.GameObjects.Sprite[] = [];
  private puertas: PuntoMapa[] = [];
  private puertaCercana: PuntoMapa | null = null;
  private npcCercano: Npc | null = null;
  private aviso!: Phaser.GameObjects.Text;
  private altoMapa = 0;
  private saliendo = false;
  private entrada = { x: 0, y: 0 };

  constructor() {
    super('Detail');
  }

  init(datos: DatosDetalle): void {
    this.datos = datos;
    this.npcs = [];
    this.enemigos = [];
    this.cabras = [];
    this.puertas = [];
    this.puertaCercana = null;
    this.npcCercano = null;
    this.saliendo = false;
  }

  create(): void {
    const mapa = this.make.tilemap({ key: `map-${this.datos.mapaId}` });
    const tilesets = this.cargarTilesets(mapa);
    mapa.createLayer('Below Player', tilesets, 0, 0);
    const mundo = mapa.createLayer('World', tilesets, 0, 0)!;
    const encima = mapa.createLayer('Above Player', tilesets, 0, 0)!;
    mundo.setCollisionByProperty({ collides: true });
    encima.setDepth(30);
    this.altoMapa = mapa.heightInPixels;

    const spawn = mapa.findObject('Objects', (o) => o.name === 'Spawn Point');
    this.entrada = this.datos.entrada ?? {
      x: spawn?.x ?? 352,
      y: spawn?.y ?? 1216,
    };
    this.jugador = new Jugador(this, this.entrada.x, this.entrada.y);
    this.physics.add.collider(this.jugador, mundo);
    this.jugador.setDepth(10);

    this.poblarContenido(mapa);

    this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.jugador.setCollideWorldBounds(true);
    this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
    this.cameras.main.fadeIn(250);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const mundo2 = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const npc = this.npcs.find((n) => n.estaCerca(mundo2.x, mundo2.y, 30));
      if (npc && npc.estaCerca(this.jugador.x, this.jugador.y)) {
        this.hablarCon(npc);
        return;
      }
      const puerta = this.puertas.find(
        (p) => Phaser.Math.Distance.Between(mundo2.x, mundo2.y, p.x, p.y) < RADIO_PUERTA,
      );
      if (puerta && this.cercaDe(puerta)) {
        this.entrarPuerta(puerta);
        return;
      }
      this.jugador.irA(mundo2.x, mundo2.y);
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

    this.input.keyboard?.on('keydown-E', () => this.interactuar());
    this.input.keyboard?.on('keydown-ENTER', () => this.interactuar());

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
    this.game.events.emit('escena-cambiada', { escena: 'Detail', mapaId: this.datos.mapaId });
  }

  private cargarTilesets(mapa: Phaser.Tilemaps.Tilemap): Phaser.Tilemaps.Tileset[] {
    const clavePorNombre: Record<string, string> = {
      'tuxemon-sample-32px-extruded': 'tiles-pueblo',
      'pixellab-dunas': 'tiles-dunas',
      'pixellab-pueblo': 'tiles-plaza',
      'pixellab-ciudad': 'tiles-ciudad',
      'pixellab-chistera': 'tiles-chistera',
    };
    const cargados: Phaser.Tilemaps.Tileset[] = [];
    for (const ts of mapa.tilesets) {
      const clave = clavePorNombre[ts.name] ?? 'tiles-pueblo';
      const añadido = mapa.addTilesetImage(ts.name, clave);
      if (añadido) cargados.push(añadido);
    }
    if (cargados.length === 0) {
      const fallback = mapa.addTilesetImage('tuxemon-sample-32px-extruded', 'tiles-pueblo');
      if (fallback) cargados.push(fallback);
    }
    return cargados;
  }

  private prop(o: Phaser.Types.Tilemaps.TiledObject, clave: string): string | undefined {
    const props = o.properties as Array<{ name: string; value: unknown }> | undefined;
    if (!Array.isArray(props)) return undefined;
    const p = props.find((x) => x.name === clave);
    return p?.value !== undefined ? String(p.value) : undefined;
  }

  private poblarContenido(mapa: Phaser.Tilemaps.Tilemap): void {
    const objetos = mapa.getObjectLayer('Objects')?.objects ?? [];

    // Zonas con cartel flotante (Triana, Vegueta, Catedral…)
    for (const o of objetos) {
      if (o.type !== 'zona') continue;
      const titulo = this.etiquetaZona(o.name);
      this.add
        .text(o.x ?? 0, (o.y ?? 0) - 20, titulo, {
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#0a1a3a',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(40);
    }

    // Decor genérico (props PixelLab precargados como decor-<nombre>)
    for (const o of objetos) {
      if (o.type !== 'decor') continue;
      const clave = `decor-${o.name}`;
      if (!this.textures.exists(clave)) continue;
      this.add
        .image(o.x ?? 0, o.y ?? 0, clave)
        .setOrigin(0.5, 0.85)
        .setDepth(6);
    }

    // Puertas a otros Details
    for (const o of objetos) {
      if (o.type !== 'puerta') continue;
      this.puertas.push({
        nombre: o.name,
        tipo: 'puerta',
        x: o.x ?? 0,
        y: o.y ?? 0,
        etiqueta: this.prop(o, 'etiqueta') ?? `Entrar en ${o.name}`,
      });
      this.add
        .text(o.x ?? 0, (o.y ?? 0) - 28, '🚪', { fontSize: '22px' })
        .setOrigin(0.5)
        .setDepth(7);
    }

    // NPCs desde Tiled (type npc) o por mapa
    for (const o of objetos) {
      if (o.type !== 'npc') continue;
      this.crearNpcDesdeObjeto(o);
    }

    if (this.datos.mapaId === 'pueblo') {
      const pastor = new Npc(this, 490, 1030, 'pastor', 'hero', 7);
      pastor.setScale(1.4).setDepth(10);
      this.npcs.push(pastor);
    }

    if (this.datos.mapaId === 'dunas') {
      const cabrasTiled = objetos.filter((o) => o.name === 'cabra' || o.type === 'fauna');
      const enemigosTiled = objetos.filter((o) => o.name === 'alimana' || o.type === 'enemigo');
      const posCabras: Array<[number, number]> =
        cabrasTiled.length > 0
          ? cabrasTiled.map((o) => [o.x ?? 200, o.y ?? 300])
          : [
              [200, 280],
              [420, 320],
              [560, 240],
            ];
      for (const [x, y] of posCabras) {
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
      const posAlimana =
        enemigosTiled.length > 0
          ? { x: enemigosTiled[0].x ?? 480, y: enemigosTiled[0].y ?? 400 }
          : { x: 480, y: 400 };
      this.crearAlimana(posAlimana.x, posAlimana.y);
    }
  }

  private etiquetaZona(id: string): string {
    const nombres: Record<string, string> = {
      triana: 'Triana',
      vegueta: 'Vegueta',
      catedral: 'Catedral de Santa Ana',
      isleta: 'La Isleta',
      chistera: 'La Chistera',
    };
    return nombres[id] ?? id;
  }

  private crearNpcDesdeObjeto(o: Phaser.Types.Tilemaps.TiledObject): void {
    const x = o.x ?? 0;
    const y = o.y ?? 0;
    if (o.name === 'comico') {
      // Preferir sprite PixelLab si existe; si no, hero reutilizado
      const textura = this.textures.exists('decor-comico') ? 'decor-comico' : 'hero';
      const npc = new Npc(this, x, y, 'comico', textura, textura === 'hero' ? 1 : undefined);
      if (textura === 'hero') npc.setScale(1.5);
      npc.setDepth(12);
      this.npcs.push(npc);
      return;
    }
    const npc = new Npc(this, x, y, o.name, 'hero', 1);
    npc.setDepth(10);
    this.npcs.push(npc);
  }

  private crearAlimana(x: number, y: number): void {
    const alimana = new Enemigo(this, x, y, 'alimana', 'crab');
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
        this.time.delayedCall(9000, () => {
          if (this.scene.isActive() && this.datos.mapaId === 'dunas') {
            this.crearAlimana(480, 400);
          }
        });
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.saliendo) return;
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

    if (this.jugador.y > this.altoMapa - 12) {
      this.salirMapa();
      return;
    }

    const puerta =
      this.puertas.find((p) => this.cercaDe(p)) ?? null;
    const npc = this.npcs.find((n) => n.estaCerca(this.jugador.x, this.jugador.y)) ?? null;

    if (npc !== this.npcCercano || puerta !== this.puertaCercana) {
      this.npcCercano = npc;
      this.puertaCercana = puerta;
      if (npc) {
        this.aviso.setText(`Hablar con ${this.nombreAmigable(npc.nombre)} — E`).setVisible(true);
      } else if (puerta) {
        this.aviso.setText(`${puerta.etiqueta ?? puerta.nombre} — E`).setVisible(true);
      } else {
        this.aviso.setVisible(false);
      }
    }
  }

  private cercaDe(p: PuntoMapa): boolean {
    return Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, p.x, p.y) < RADIO_PUERTA;
  }

  private nombreAmigable(id: string): string {
    if (id === 'comico') return 'el cómico';
    if (id === 'pastor') return 'el pastor';
    return id;
  }

  private interactuar(): void {
    if (this.npcCercano !== null) {
      this.hablarCon(this.npcCercano);
      return;
    }
    if (this.puertaCercana !== null) this.entrarPuerta(this.puertaCercana);
  }

  private hablarCon(npc: Npc): void {
    this.sound.play('sfx-npc', { volume: 0.6 });
    this.game.events.emit('npc-hablar', { npc: npc.nombre, escena: this.scene.key });
  }

  private entrarPuerta(puerta: PuntoMapa): void {
    if (this.saliendo) return;
    this.saliendo = true;
    this.jugador.bloqueado = true;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Detail', {
        mapaId: puerta.nombre,
        retorno: {
          islaId: this.datos.retorno.islaId,
          x: this.datos.retorno.x,
          y: this.datos.retorno.y,
          parent: {
            mapaId: this.datos.mapaId,
            x: puerta.x,
            y: puerta.y + 40,
            retorno: this.datos.retorno,
          },
        },
      });
    });
  }

  private salirMapa(): void {
    if (this.saliendo) return;
    this.saliendo = true;
    this.jugador.bloqueado = true;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const parent = this.datos.retorno.parent;
      if (parent) {
        this.scene.start('Detail', {
          mapaId: parent.mapaId,
          entrada: { x: parent.x, y: parent.y },
          retorno: parent.retorno,
        });
        return;
      }
      this.scene.start('Island', {
        islaId: this.datos.retorno.islaId,
        entrada: { x: this.datos.retorno.x, y: this.datos.retorno.y },
      });
    });
  }
}
