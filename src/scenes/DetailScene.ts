import Phaser from 'phaser';
import type { IslaId } from '../data/islas';
import { Jugador } from '../sistemas/Jugador';
import { Npc } from '../sistemas/Npc';
import { Enemigo } from '../sistemas/Enemigo';
import { Musica } from '../sistemas/Musica';
import type { QuestManager } from '../sistemas/QuestManager';

interface DatosDetalle {
  mapaId: string;
  retorno: { islaId: IslaId; x: number; y: number };
}

/**
 * Escena de detalle (pueblos, dunas, interiores, mazmorras) con tilemap Tiled 32 px.
 * Aquí viven NPCs, monstruos e items de misión. El overworld (Island) no los tiene.
 *
 * Capas esperadas: "Below Player", "World" (collides), "Above Player",
 * y capa de objetos "Objects" con "Spawn Point" (y opcionalmente fauna/enemigos).
 */
export class DetailScene extends Phaser.Scene {
  private datos!: DatosDetalle;
  private jugador!: Jugador;
  private npcs: Npc[] = [];
  private enemigos: Enemigo[] = [];
  private cabras: Phaser.GameObjects.Sprite[] = [];
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
    this.npcCercano = null;
    this.saliendo = false;
  }

  create(): void {
    const mapa = this.make.tilemap({ key: `map-${this.datos.mapaId}` });
    const tileset = mapa.addTilesetImage('tuxemon-sample-32px-extruded', 'tiles-pueblo')!;
    mapa.createLayer('Below Player', tileset, 0, 0);
    const mundo = mapa.createLayer('World', tileset, 0, 0)!;
    const encima = mapa.createLayer('Above Player', tileset, 0, 0)!;
    mundo.setCollisionByProperty({ collides: true });
    encima.setDepth(30);
    this.altoMapa = mapa.heightInPixels;

    const spawn = mapa.findObject('Objects', (o) => o.name === 'Spawn Point');
    this.entrada = { x: spawn?.x ?? 352, y: spawn?.y ?? 1216 };
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
      } else {
        this.jugador.irA(mundo2.x, mundo2.y);
      }
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

    // Combate solo en mapas de detalle
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

  /**
   * Contenido por mapa: NPCs en pueblo; fauna/enemigos en dunas (objetos Tiled o fallback).
   */
  private poblarContenido(mapa: Phaser.Tilemaps.Tilemap): void {
    if (this.datos.mapaId === 'pueblo') {
      const pastor = new Npc(this, 490, 1030, 'pastor', 'hero', 7);
      pastor.setScale(1.4).setDepth(10);
      this.npcs.push(pastor);
      return;
    }

    if (this.datos.mapaId === 'dunas') {
      const objetos = mapa.getObjectLayer('Objects')?.objects ?? [];
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

    // Recoger cabras (solo con la misión en el paso de recogerlas)
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

    // Salir del mapa caminando por el borde inferior
    if (this.jugador.y > this.altoMapa - 12) {
      this.volverALaIsla();
      return;
    }

    const cercano =
      this.npcs.find((n) => n.estaCerca(this.jugador.x, this.jugador.y)) ?? null;
    if (cercano !== this.npcCercano) {
      this.npcCercano = cercano;
      this.aviso
        .setText(cercano ? `Hablar con el ${cercano.nombre} — E o toca al personaje` : '')
        .setVisible(cercano !== null);
    }
  }

  private interactuar(): void {
    if (this.npcCercano !== null) this.hablarCon(this.npcCercano);
  }

  private hablarCon(npc: Npc): void {
    this.sound.play('sfx-npc', { volume: 0.6 });
    this.game.events.emit('npc-hablar', { npc: npc.nombre, escena: this.scene.key });
  }

  private volverALaIsla(): void {
    if (this.saliendo) return;
    this.saliendo = true;
    this.jugador.bloqueado = true;
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Island', {
        islaId: this.datos.retorno.islaId,
        entrada: { x: this.datos.retorno.x, y: this.datos.retorno.y },
      });
    });
  }
}
