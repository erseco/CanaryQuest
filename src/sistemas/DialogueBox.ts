import Phaser from 'phaser';

const CPS = 30; // caracteres por segundo del efecto máquina de escribir

/**
 * Caja de diálogo inferior con efecto máquina de escribir.
 * Vive en la UIScene. Mientras está abierta, `enCurso` es true y la
 * UIScene marca `dialogo-abierto` en el registry para bloquear al jugador.
 */
export class DialogueBox {
  private escena: Phaser.Scene;
  private fondo: Phaser.GameObjects.Rectangle;
  private texto: Phaser.GameObjects.Text;
  private indicador: Phaser.GameObjects.Text;
  private lineas: string[] = [];
  private lineaActual = 0;
  private caracteres = 0;
  private temporizador: Phaser.Time.TimerEvent | null = null;
  private alTerminar: (() => void) | null = null;

  constructor(escena: Phaser.Scene) {
    this.escena = escena;
    const { width, height } = escena.scale;
    this.fondo = escena.add
      .rectangle(width / 2, height - 70, width - 80, 110, 0x0a1a3a, 0.92)
      .setStrokeStyle(3, 0xf4c542)
      .setDepth(200)
      .setVisible(false)
      .setInteractive();
    this.texto = escena.add
      .text(60, height - 116, '', {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#ffffff',
        wordWrap: { width: width - 140 },
      })
      .setDepth(201)
      .setVisible(false);
    this.indicador = escena.add
      .text(width - 60, height - 36, '▼', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f4c542',
      })
      .setOrigin(1)
      .setDepth(201)
      .setVisible(false);
    escena.tweens.add({
      targets: this.indicador,
      y: height - 30,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
    this.fondo.on('pointerdown', () => this.avanzar());
  }

  get enCurso(): boolean {
    return this.fondo.visible;
  }

  abrir(lineas: string[], alTerminar?: () => void): void {
    this.lineas = lineas;
    this.lineaActual = 0;
    this.alTerminar = alTerminar ?? null;
    this.fondo.setVisible(true);
    this.texto.setVisible(true);
    this.mostrarLinea();
  }

  avanzar(): void {
    if (!this.enCurso) return;
    const linea = this.lineas[this.lineaActual];
    if (this.caracteres < linea.length) {
      // Saltar el typewriter y mostrar la línea completa
      this.caracteres = linea.length;
      this.texto.setText(linea);
      this.indicador.setVisible(true);
      this.temporizador?.remove();
      return;
    }
    this.lineaActual += 1;
    if (this.lineaActual >= this.lineas.length) {
      this.cerrar();
    } else {
      this.mostrarLinea();
    }
  }

  private mostrarLinea(): void {
    this.caracteres = 0;
    this.texto.setText('');
    this.indicador.setVisible(false);
    this.temporizador?.remove();
    const linea = this.lineas[this.lineaActual];
    this.temporizador = this.escena.time.addEvent({
      delay: 1000 / CPS,
      repeat: linea.length - 1,
      callback: () => {
        this.caracteres += 1;
        this.texto.setText(linea.slice(0, this.caracteres));
        if (this.caracteres >= linea.length) this.indicador.setVisible(true);
      },
    });
  }

  private cerrar(): void {
    this.fondo.setVisible(false);
    this.texto.setVisible(false);
    this.indicador.setVisible(false);
    this.temporizador?.remove();
    const cb = this.alTerminar;
    this.alTerminar = null;
    cb?.();
  }
}
