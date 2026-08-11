import Phaser from 'phaser';
import type { IslaId } from '../data/islas';
import { Jugador } from '../sistemas/Jugador';
import { Npc } from '../sistemas/Npc';
import { Musica } from '../sistemas/Musica';

interface DatosDetalle {
  mapaId: string;
  retorno: { islaId: IslaId; x: number; y: number };
}

/**
 * Escena de detalle (pueblos, interiores, mazmorras) con tilemap Tiled 32 px.
 * Capas esperadas: "Below Player", "World" (collides), "Above Player",
 * y capa de objetos "Objects" con "Spawn Point".
 */
export class DetailScene extends Phaser.Scene {
  private datos!: DatosDetalle;
  private jugador!: Jugador;
  private npcs: Npc[] = [];
  private npcCercano: Npc | null = null;
  private aviso!: Phaser.GameObjects.Text;
  private altoMapa = 0;

  constructor() {
    super('Detail');
  }

  init(datos: DatosDetalle): void {
    this.datos = datos;
    this.npcs = [];
    this.npcCercano = null;
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
    this.jugador = new Jugador(this, spawn?.x ?? 352, spawn?.y ?? 1216);
    this.physics.add.collider(this.jugador, mundo);
    this.jugador.setDepth(10);

    // El pastor, en la plaza del pueblo
    const pastor = new Npc(this, 490, 1030, 'pastor', 'hero', 7);
    pastor.setScale(1.4).setDepth(10);
    this.npcs.push(pastor);

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

    Musica.reproducir(this, 'musica-isla');
    this.game.events.emit('escena-cambiada', { escena: 'Detail', mapaId: this.datos.mapaId });
  }

  update(_time: number, delta: number): void {
    this.jugador.bloqueado = this.registry.get('dialogo-abierto') === true;
    const pad = (this.registry.get('pad') as { x: number; y: number }) ?? { x: 0, y: 0 };
    this.jugador.padTactil.set(pad.x, pad.y);
    this.jugador.actualizar(delta);

    // Salir del pueblo caminando por el borde inferior
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
