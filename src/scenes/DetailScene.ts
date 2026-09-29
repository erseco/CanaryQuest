import Phaser from 'phaser';
import type { IslaId } from '../data/islas';
import { Jugador } from '../sistemas/Jugador';
import { Npc } from '../sistemas/Npc';
import { Enemigo } from '../sistemas/Enemigo';
import { Musica } from '../sistemas/Musica';
import type { QuestManager } from '../sistemas/QuestManager';
import type { Partida } from '../sistemas/SaveManager';
import { ESPECIES } from '../data/enemigos';

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

/** Profundidad dentro de la banda 10–11: por encima del suelo, por debajo de «Above Player» (30). */
const profundidad = (y: number): number => 10 + y / 10000;

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
  private corazones: Phaser.GameObjects.Image[] = [];
  private cofres: Array<{ punto: PuntoMapa; sprite: Phaser.GameObjects.Image }> = [];
  private hitos: PuntoMapa[] = [];
  private puertas: PuntoMapa[] = [];
  private puertaCercana: PuntoMapa | null = null;
  private cofreCercano: (typeof this.cofres)[number] | null = null;
  private npcCercano: Npc | null = null;
  private aviso!: Phaser.GameObjects.Text;
  private altoMapa = 0;
  private capasSolidas: Array<Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer> = [];
  private solidos: Phaser.GameObjects.Zone[] = [];
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
    this.corazones = [];
    this.cofres = [];
    this.hitos = [];
    this.puertas = [];
    this.puertaCercana = null;
    this.npcCercano = null;
    this.saliendo = false;
  }

  create(): void {
    const mapa = this.make.tilemap({ key: `map-${this.datos.mapaId}` });
    const tilesets = this.cargarTilesets(mapa);
    // Todas las capas de tiles en orden; cualquiera puede bloquear (tiles con `collides`)
    const capas = mapa.layers.map((l) => mapa.createLayer(l.name, tilesets, 0, 0)!);
    for (const c of capas) c.setCollisionByProperty({ collides: true });
    capas.find((c) => c.layer.name === 'Above Player')?.setDepth(30);
    this.capasSolidas = capas;
    this.altoMapa = mapa.heightInPixels;

    const spawn = mapa.findObject('Objects', (o) => o.name === 'Spawn Point');
    this.entrada = this.datos.entrada ?? {
      x: spawn?.x ?? 352,
      y: spawn?.y ?? 1216,
    };
    this.jugador = new Jugador(this, this.entrada.x, this.entrada.y);
    this.physics.add.collider(this.jugador, this.capasSolidas);
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

    // Tiled exporta las propiedades del mapa como array; Phaser deja {} si no hay ninguna
    const props = mapa.properties as Array<{ name: string; value: unknown }> | object;
    if (Array.isArray(props) && props.some((p) => p.name === 'niebla' && p.value === true)) {
      this.crearNiebla();
    }

    Musica.reproducir(this, 'musica-isla');
    this.game.events.emit('escena-cambiada', { escena: 'Detail', mapaId: this.datos.mapaId });
  }

  /** Niebla del alisio sobre la laurisilva: dos velos que se desplazan despacio. */
  private crearNiebla(): void {
    const { width, height } = this.scale;
    for (const [alpha, dur] of [[0.14, 9000], [0.1, 13000]] as const) {
      const velo = this.add
        .rectangle(0, 0, width * 1.5, height, 0xe8f0f0, alpha)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(35);
      this.tweens.add({ targets: velo, x: -width * 0.5, duration: dur, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      this.tweens.add({ targets: velo, alpha: alpha * 0.4, duration: dur * 0.7, yoyo: true, repeat: -1 });
    }
  }

  private cargarTilesets(mapa: Phaser.Tilemaps.Tilemap): Phaser.Tilemaps.Tileset[] {
    const clavePorNombre: Record<string, string> = {
      'tuxemon-sample-32px-extruded': 'tiles-pueblo',
      'pixellab-dunas': 'tiles-dunas',
      'pixellab-pueblo': 'tiles-plaza',
      'pixellab-ciudad': 'tiles-ciudad',
      'pixellab-chistera': 'tiles-chistera',
      'pixellab-cumbre-camino': 'tiles-cumbre-camino',
      'pixellab-cumbre-risco': 'tiles-cumbre-risco',
      'pixellab-cumbre-presa': 'tiles-cumbre-presa',
      'pixellab-casa-cueva': 'tiles-casa-cueva',
    };
    const cargados: Phaser.Tilemaps.Tileset[] = [];
    for (const ts of mapa.tilesets) {
      // Los tilesets LPC se cargan con su propio nombre como clave
      const clave = this.textures.exists(ts.name) ? ts.name : (clavePorNombre[ts.name] ?? 'tiles-pueblo');
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

    // Decor genérico (props PixelLab precargados como decor-<nombre>).
    // `solido`: bloquea en la base (tronco, fachada); `escala`: tamaño en pantalla.
    this.solidos = [];
    const solidos = this.solidos;
    for (const o of objetos) {
      if (o.type !== 'decor') continue;
      const clave = `decor-${o.name}`;
      if (!this.textures.exists(clave)) continue;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const img = this.add
        .image(x, y, clave)
        .setOrigin(0.5, 0.85)
        .setScale(Number(this.prop(o, 'escala') ?? 1))
        .setDepth(profundidad(y));
      if (this.prop(o, 'solido') === 'true') {
        const base = this.add.zone(x, y + 2, img.displayWidth * 0.35, 14);
        this.physics.add.existing(base, true);
        solidos.push(base);
      }
    }
    this.physics.add.collider(this.jugador, solidos);

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
        .setDepth(12);
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

    // Enemigos (name = especie de data/enemigos.ts); reaparecen al volver a entrar, como en Zelda
    for (const o of objetos) {
      if (o.type === 'enemigo' && ESPECIES[o.name]) this.crearEnemigo(o.name, o.x ?? 0, o.y ?? 0);
    }

    // Cofres (propiedad `item`); abiertos si el objeto ya está en el inventario
    const inventario = (this.registry.get('partida') as Partida).inventario;
    for (const o of objetos) {
      if (o.type !== 'cofre') continue;
      const item = this.prop(o, 'item') ?? o.name;
      const sprite = this.add.image(o.x ?? 0, o.y ?? 0, 'bq-chest').setDepth(profundidad(o.y ?? 0));
      if (inventario.includes(item)) sprite.setTint(0x777777);
      this.cofres.push({ punto: { nombre: item, tipo: 'cofre', x: o.x ?? 0, y: o.y ?? 0 }, sprite });
    }

    // Hitos: al pisarlos cuentan como «llegar» para las misiones
    for (const o of objetos) {
      if (o.type === 'hito') this.hitos.push({ nombre: o.name, tipo: 'hito', x: o.x ?? 0, y: o.y ?? 0 });
    }

    if (this.datos.mapaId === 'dunas') {
      const cabrasTiled = objetos.filter((o) => o.name === 'cabra' || o.type === 'fauna');
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
    }
  }

  private etiquetaZona(id: string): string {
    const nombres: Record<string, string> = {
      triana: 'Triana',
      vegueta: 'Vegueta',
      catedral: 'Catedral de Santa Ana',
      isleta: 'La Isleta',
      chistera: 'La Chistera',
      'roque-nublo': 'Roque Nublo',
      presa: 'Presa de los Hornos',
      'crater-timanfaya': 'Cráter de Timanfaya',
      'jameos-del-agua': 'Jameos del Agua',
      'corazon-garajonay': 'Corazón de Garajonay',
      betancuria: 'Betancuria',
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
    // Propiedad `sprite`: NPC de BrowserQuest (villager, priest, lavanpc…)
    const sprite = this.prop(o, 'sprite');
    if (sprite !== undefined && this.textures.exists(`bq-${sprite}`)) {
      const npc = new Npc(this, x, y, o.name, `bq-${sprite}`, 0);
      npc.play(`${sprite}-idle_down`);
      this.npcs.push(npc);
      return;
    }
    const npc = new Npc(this, x, y, o.name, 'hero', 1);
    npc.setDepth(10);
    this.npcs.push(npc);
  }

  private crearEnemigo(especie: string, x: number, y: number): void {
    const enemigo = new Enemigo(this, x, y, especie);
    this.physics.add.collider(enemigo, this.capasSolidas);
    this.physics.add.collider(enemigo, this.solidos);
    this.enemigos.push(enemigo);
  }

  private tieneEspada(): boolean {
    return (this.registry.get('partida') as Partida).inventario.includes('espada');
  }

  private atacar(): void {
    if (this.registry.get('dialogo-abierto') === true) return;
    if (!this.tieneEspada()) {
      this.avisoTemporal('Aún no tienes espada. Dicen que en Artenara guardan una…');
      return;
    }
    const golpe = this.jugador.atacar();
    if (golpe === null) return;
    for (const enemigo of this.enemigos) {
      if (
        !enemigo.estaMuerto &&
        Phaser.Math.Distance.Between(golpe.x, golpe.y, enemigo.x, enemigo.y) < golpe.radio + 16
      ) {
        this.sound.play('sfx-hit', { volume: 0.5 });
        if (enemigo.recibirGolpe(this.jugador.x, this.jugador.y)) {
          this.game.events.emit('derrotado', { enemigo: enemigo.especie });
          if (Math.random() < (ESPECIES[enemigo.especie]?.corazon ?? 0)) {
            this.soltarCorazon(enemigo.x, enemigo.y);
          }
        }
      }
    }
  }

  private soltarCorazon(x: number, y: number): void {
    const c = this.add.image(x, y, 'corazon').setScale(1.5).setDepth(profundidad(y));
    this.tweens.add({ targets: c, y: y - 6, duration: 400, yoyo: true, repeat: -1 });
    this.corazones.push(c);
  }

  private avisoTemporal(texto: string): void {
    this.aviso.setText(texto).setVisible(true);
    this.npcCercano = null;
    this.puertaCercana = null;
    this.cofreCercano = null;
    this.time.delayedCall(1800, () => this.aviso.setVisible(false));
  }

  private abrirCofre(cofre: (typeof this.cofres)[number]): void {
    const partida = this.registry.get('partida') as Partida;
    const item = cofre.punto.nombre;
    if (partida.inventario.includes(item)) return;
    cofre.sprite.setTint(0x777777);
    this.sound.play('sfx-chest', { volume: 0.7 });
    // Pose Zelda: el objeto sube sobre la cabeza del héroe
    const icono = this.add
      .sprite(this.jugador.x, this.jugador.y - 60, item === 'espada' ? 'bq-item-sword1' : 'corazon', 0)
      .setDepth(50);
    this.tweens.add({ targets: icono, y: icono.y - 16, duration: 400 });
    this.game.events.emit('objeto-conseguido', { item });
    this.game.events.emit('dialogo', { clave: `cofre-${item}`, alTerminar: () => icono.destroy() });
  }

  update(_time: number, delta: number): void {
    if (this.saliendo) return;
    this.jugador.bloqueado = this.registry.get('dialogo-abierto') === true;
    const pad = (this.registry.get('pad') as { x: number; y: number }) ?? { x: 0, y: 0 };
    this.jugador.padTactil.set(pad.x, pad.y);
    this.jugador.actualizar(delta);

    // Con un diálogo abierto el mundo se congela (como en Zelda)
    const pausa = this.jugador.bloqueado;
    for (const enemigo of this.enemigos) {
      if (pausa) {
        if (!enemigo.estaMuerto) enemigo.setVelocity(0, 0);
        continue;
      }
      enemigo.actualizar(this.jugador.x, this.jugador.y, this.time.now);
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

    // Orden por Y: quien está más abajo se dibuja delante (pinos, casas, personajes)
    for (const s of [this.jugador, ...this.npcs, ...this.enemigos, ...this.cabras]) {
      s.setDepth(profundidad(s.y));
    }

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

    for (const c of [...this.corazones]) {
      if (Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y - 10, c.x, c.y) < 24) {
        this.sound.play('sfx-loot', { volume: 0.6 });
        this.corazones.splice(this.corazones.indexOf(c), 1);
        c.destroy();
        this.game.events.emit('curar', { cantidad: 2 });
      }
    }

    for (const h of [...this.hitos]) {
      if (this.cercaDe(h)) {
        this.hitos.splice(this.hitos.indexOf(h), 1);
        this.game.events.emit('llegar', { poi: h.nombre });
      }
    }

    if (this.jugador.y > this.altoMapa - 12) {
      this.salirMapa();
      return;
    }

    const puerta =
      this.puertas.find((p) => this.cercaDe(p)) ?? null;
    const npc = this.npcs.find((n) => n.estaCerca(this.jugador.x, this.jugador.y)) ?? null;
    const inventario = (this.registry.get('partida') as Partida).inventario;
    const cofre =
      this.cofres.find((c) => this.cercaDe(c.punto) && !inventario.includes(c.punto.nombre)) ?? null;

    if (npc !== this.npcCercano || puerta !== this.puertaCercana || cofre !== this.cofreCercano) {
      this.npcCercano = npc;
      this.puertaCercana = puerta;
      this.cofreCercano = cofre;
      if (npc) {
        this.aviso.setText(`Hablar con ${this.nombreAmigable(npc.nombre)} — E`).setVisible(true);
      } else if (cofre) {
        this.aviso.setText('Abrir el cofre — E').setVisible(true);
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
    if (id === 'abuela') return 'la abuela';
    if (id === 'guardiana-jameos') return 'la guardiana';
    if (id === 'maestra-silbo') return 'la maestra silbadora';
    if (id === 'quesera') return 'la quesera';
    if (id === 'testigo-dunas') return 'el cabrero';
    return id;
  }

  private interactuar(): void {
    if (this.npcCercano !== null) {
      this.hablarCon(this.npcCercano);
      return;
    }
    if (this.cofreCercano !== null) {
      this.abrirCofre(this.cofreCercano);
      this.cofreCercano = null;
      this.aviso.setVisible(false);
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
