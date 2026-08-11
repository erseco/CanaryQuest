import Phaser from 'phaser';
import { DialogueBox } from '../sistemas/DialogueBox';
import { DIALOGOS } from '../data/dialogos';
import { MISIONES } from '../data/misiones';
import type { Partida } from '../sistemas/SaveManager';

const CLAVE_MUTE = 'canaryquest-mute';

/**
 * Overlay permanente tras el título: corazones, misión activa,
 * caja de diálogo, botón de mute y controles táctiles.
 * La vida se mide en medios corazones (vida = 6 → 3 corazones).
 */
export class UIScene extends Phaser.Scene {
  private corazones!: Phaser.GameObjects.Text;
  private mision!: Phaser.GameObjects.Text;
  private dialogo!: DialogueBox;

  constructor() {
    super('UI');
  }

  create(): void {
    const partida = this.registry.get('partida') as Partida;
    this.registry.set('vida-max', partida.corazones * 2);
    this.registry.set('vida', partida.corazones * 2);
    this.registry.set('pad', { x: 0, y: 0 });

    this.corazones = this.add
      .text(14, 10, '', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#e63946',
        stroke: '#0a1a3a',
        strokeThickness: 4,
      })
      .setDepth(100);
    this.mision = this.add
      .text(14, 44, '', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#f4c542',
        stroke: '#0a1a3a',
        strokeThickness: 3,
      })
      .setDepth(100);
    this.pintarCorazones();

    this.dialogo = new DialogueBox(this);
    this.crearBotonMute();
    if (this.sys.game.device.input.touch) this.crearControlesTactiles();

    // Eventos globales del juego
    const eventos = this.game.events;
    const alDialogo = ({ clave, alTerminar }: { clave: string; alTerminar?: () => void }) =>
      this.abrirDialogo(clave, alTerminar);
    const alDano = () => this.recibirDano();
    const alCurar = () => {
      this.registry.set('vida', this.registry.get('vida-max'));
      this.pintarCorazones();
    };
    const alMision = () => this.pintarMision();
    const alSimbolo = ({ isla }: { isla: string }) => this.mostrarSimbolo(isla);
    eventos.on('dialogo', alDialogo);
    eventos.on('dano', alDano);
    eventos.on('curar', alCurar);
    eventos.on('mision-cambiada', alMision);
    eventos.on('simbolo-conseguido', alSimbolo);
    this.events.once('shutdown', () => {
      eventos.off('dialogo', alDialogo);
      eventos.off('dano', alDano);
      eventos.off('curar', alCurar);
      eventos.off('mision-cambiada', alMision);
      eventos.off('simbolo-conseguido', alSimbolo);
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.dialogo.enCurso) this.dialogo.avanzar();
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.dialogo.enCurso) this.dialogo.avanzar();
    });

    this.pintarMision();
  }

  private abrirDialogo(clave: string, alTerminar?: () => void): void {
    const lineas = DIALOGOS[clave];
    if (lineas === undefined) return;
    this.registry.set('dialogo-abierto', true);
    this.dialogo.abrir(lineas, () => {
      this.registry.set('dialogo-abierto', false);
      alTerminar?.();
    });
  }

  private recibirDano(): void {
    const vida = Math.max(0, (this.registry.get('vida') as number) - 1);
    this.registry.set('vida', vida);
    this.pintarCorazones();
    this.cameras.main.flash(120, 230, 57, 70);
    if (vida <= 0) {
      this.registry.set('vida', this.registry.get('vida-max'));
      this.time.delayedCall(400, () => {
        this.pintarCorazones();
        this.game.events.emit('jugador-muerto');
      });
    }
  }

  private pintarCorazones(): void {
    const max = (this.registry.get('vida-max') as number) ?? 6;
    const vida = (this.registry.get('vida') as number) ?? max;
    let s = '';
    for (let i = 0; i < max / 2; i++) {
      const restante = vida - i * 2;
      s += restante >= 2 ? '♥' : restante === 1 ? '❥' : '♡';
    }
    this.corazones.setText(s);
  }

  /** Toast celebratorio al conseguir el símbolo guanche de una isla. */
  private mostrarSimbolo(_isla: string): void {
    const { width, height } = this.scale;
    const icono = this.add.image(width / 2, height / 2 - 40, 'simbolo').setScale(3).setDepth(400);
    const texto = this.add
      .text(width / 2, height / 2 + 10, '¡Símbolo guanche conseguido!', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#f4c542',
        stroke: '#0a1a3a',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(400);
    this.tweens.add({
      targets: [icono, texto],
      y: '-=30',
      alpha: { from: 1, to: 0 },
      delay: 1600,
      duration: 700,
      onComplete: () => {
        icono.destroy();
        texto.destroy();
      },
    });
  }

  private pintarMision(): void {
    const partida = this.registry.get('partida') as Partida;
    const activa = Object.entries(partida.misiones).find(([, e]) => e.estado === 'activa');
    if (activa === undefined) {
      const simbolos = partida.simbolos.length;
      this.mision.setText(simbolos > 0 ? `Símbolos guanches: ${simbolos}/8` : '');
      return;
    }
    this.mision.setText(`Misión: ${MISIONES[activa[0]].titulo}`);
  }

  private crearBotonMute(): void {
    const muted = localStorage.getItem(CLAVE_MUTE) === '1';
    this.game.sound.mute = muted;
    const boton = this.add
      .text(this.scale.width - 12, 12, muted ? '🔇' : '🔊', { fontSize: '26px' })
      .setOrigin(1, 0)
      .setDepth(300)
      .setInteractive({ useHandCursor: true });
    boton.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        const nuevo = !this.game.sound.mute;
        this.game.sound.mute = nuevo;
        localStorage.setItem(CLAVE_MUTE, nuevo ? '1' : '0');
        boton.setText(nuevo ? '🔇' : '🔊');
      },
    );
  }

  /** Pad direccional + botón de ataque para pantallas táctiles. */
  private crearControlesTactiles(): void {
    const { height } = this.scale;
    const centro = { x: 96, y: height - 96 };
    const pad = this.registry.get('pad') as { x: number; y: number };

    this.add.circle(centro.x, centro.y, 62, 0x0a1a3a, 0.35).setDepth(250);
    const stick = this.add.circle(centro.x, centro.y, 28, 0xffffff, 0.45).setDepth(251);
    const zona = this.add
      .circle(centro.x, centro.y, 92, 0xffffff, 0.001)
      .setDepth(252)
      .setInteractive();

    const mover = (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.x - centro.x;
      const dy = pointer.y - centro.y;
      const v = new Phaser.Math.Vector2(dx, dy);
      if (v.length() > 60) v.setLength(60);
      stick.setPosition(centro.x + v.x, centro.y + v.y);
      pad.x = Math.abs(v.x) > 14 ? Math.sign(v.x) : 0;
      pad.y = Math.abs(v.y) > 14 ? Math.sign(v.y) : 0;
    };
    const soltar = () => {
      stick.setPosition(centro.x, centro.y);
      pad.x = 0;
      pad.y = 0;
    };
    zona.on('pointerdown', mover);
    zona.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) mover(p);
    });
    zona.on('pointerup', soltar);
    zona.on('pointerout', soltar);

    const botonB = this.add
      .circle(this.scale.width - 80, height - 96, 40, 0xd7263d, 0.55)
      .setDepth(251)
      .setInteractive();
    this.add
      .text(this.scale.width - 80, height - 96, '⚔', { fontSize: '30px' })
      .setOrigin(0.5)
      .setDepth(252);
    botonB.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (this.dialogo.enCurso) {
        this.dialogo.avanzar();
      } else {
        this.game.events.emit('atacar');
      }
    });
  }
}
