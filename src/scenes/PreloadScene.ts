import Phaser from 'phaser';
import { ISLAS } from '../data/islas';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const { width, height } = this.scale;
    const barraFondo = this.add
      .rectangle(width / 2, height / 2, 404, 24, 0x14294f)
      .setStrokeStyle(2, 0xffffff);
    const barra = this.add.rectangle(width / 2 - 200, height / 2, 0, 16, 0xf4c542);
    barra.setOrigin(0, 0.5);
    const texto = this.add
      .text(width / 2, height / 2 - 40, 'Cargando CanaryQuest…', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v: number) => barra.setSize(400 * v, 16));
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      texto.setText(`Error cargando: ${file.key}`).setColor('#ff6b6b');
      barraFondo.setStrokeStyle(2, 0xff6b6b);
    });

    // Ilustraciones de islas y mapas
    for (const isla of Object.values(ISLAS)) {
      if (isla.ilustracion !== null) {
        this.load.image(`isla-${isla.id}`, isla.ilustracion);
      }
    }
    this.load.image('mapa-mundo', 'assets/islas/mapa-mundo.jpg');
    this.load.image('titulo-fondo', 'assets/titulo/archipielago-aereo.jpg');

    // Mapas de detalle (tilemap Tiled + tilesets) e islas
    this.load.tilemapTiledJSON('map-pueblo', 'assets/maps/pueblo.tmj');
    this.load.tilemapTiledJSON('map-dunas', 'assets/maps/dunas.tmj');
    this.load.image('tiles-pueblo', 'assets/tilesets/tuxemon-32px-extruido.png');
    this.load.image('tiles-dunas', 'assets/tilesets/pixellab-dunas-32.png');
    this.load.image('tiles-plaza', 'assets/tilesets/pixellab-pueblo-32.png');
    this.load.tilemapTiledJSON('map-gran-canaria', 'assets/maps/islas/gran-canaria.tmj');

    // Personajes
    this.load.atlas('atlas', 'assets/sprites/atlas.png', 'assets/sprites/atlas.json');
    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('crab', 'assets/sprites/crab.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    // Decor PixelLab (props de mapa)
    this.load.image('decor-palmera', 'assets/sprites/pixellab-palmera.png');
    this.load.image('decor-roca-duna', 'assets/sprites/pixellab-roca-duna.png');
    this.load.image('decor-casa-canaria', 'assets/sprites/pixellab-casa-canaria.png');

    // Audio
    this.load.audio('musica-titulo', 'assets/audio/title-music.ogg');
    this.load.audio('musica-mapa', 'assets/audio/overworld-music.ogg');
    this.load.audio('musica-isla', 'assets/audio/island-music.ogg');
    this.load.audio('sfx-npc', 'assets/audio/npc.mp3');
    this.load.audio('sfx-chest', 'assets/audio/chest.mp3');
    this.load.audio('sfx-loot', 'assets/audio/loot.mp3');
    this.load.audio('sfx-teleport', 'assets/audio/teleport.mp3');
    this.load.audio('sfx-achievement', 'assets/audio/achievement.mp3');
    this.load.audio('sfx-hit', 'assets/audio/hit1.mp3');
    this.load.audio('sfx-hurt', 'assets/audio/hurt.mp3');
  }

  create(): void {
    this.crearAnimaciones();
    this.crearTexturasGeneradas();
    this.scene.start('Title');
  }

  private crearAnimaciones(): void {
    const dirs = ['front', 'back', 'left', 'right'] as const;
    for (const dir of dirs) {
      this.anims.create({
        key: `misa-${dir}-walk`,
        frames: this.anims.generateFrameNames('atlas', {
          prefix: `misa-${dir}-walk.`,
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
    // Cangrejo (BrowserQuest): hoja de 8 columnas; walk_down fila 8, walk_right fila 2, walk_up fila 6.
    this.anims.create({
      key: 'crab-walk',
      frames: this.anims.generateFrameNumbers('crab', { start: 8 * 8, end: 8 * 8 + 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'crab-die',
      frames: this.anims.generateFrameNumbers('crab', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: 0,
    });
  }

  /** Texturas simples generadas en runtime para lo que aún no tiene sprite. */
  private crearTexturasGeneradas(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Cabra: cuerpo blanco, cabeza con cuernos (24×24)
    g.clear();
    g.fillStyle(0xf5f0e6).fillRoundedRect(2, 8, 16, 11, 4); // cuerpo
    g.fillStyle(0xf5f0e6).fillRect(14, 3, 8, 8); // cabeza
    g.fillStyle(0x8a6d3b).fillRect(14, 1, 2, 3).fillRect(20, 1, 2, 3); // cuernos
    g.fillStyle(0x333333).fillRect(19, 5, 2, 2); // ojo
    g.fillStyle(0xd9cfc0).fillRect(4, 18, 3, 5).fillRect(12, 18, 3, 5); // patas
    g.generateTexture('cabra', 24, 24);

    // Ferry (estilo Fred Olsen: casco azul, franja roja, superestructura blanca)
    g.clear();
    g.fillStyle(0x1c3f94).fillRect(0, 20, 48, 10);
    g.fillStyle(0xd7263d).fillRect(0, 18, 48, 3);
    g.fillStyle(0xffffff).fillRect(8, 8, 30, 10);
    g.fillStyle(0x9fd8ff).fillRect(11, 10, 5, 4).fillRect(19, 10, 5, 4).fillRect(27, 10, 5, 4);
    g.generateTexture('ferry', 48, 30);

    // Avión (ATR Binter: fuselaje blanco, cola turquesa)
    g.clear();
    g.fillStyle(0xffffff).fillRect(4, 12, 40, 8); // fuselaje
    g.fillStyle(0xffffff).fillRect(18, 2, 8, 28); // alas
    g.fillStyle(0x00a9a5).fillRect(0, 10, 6, 12); // cola turquesa
    g.generateTexture('avion', 48, 32);

    // Tajo de espada (arco blanco)
    g.clear();
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(0, 0, 30, 10, 5);
    g.generateTexture('slash', 30, 10);

    // Símbolo guanche (espiral dorada simplificada)
    g.clear();
    g.lineStyle(3, 0xf4c542);
    g.strokeCircle(12, 12, 9);
    g.strokeCircle(12, 12, 4);
    g.generateTexture('simbolo', 24, 24);

    g.destroy();
  }
}
