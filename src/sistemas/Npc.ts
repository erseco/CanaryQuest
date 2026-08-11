import Phaser from 'phaser';

/**
 * NPC estático con indicador de exclamación y radio de interacción.
 * La escena decide qué hacer al interactuar (normalmente abrir diálogo).
 */
export class Npc extends Phaser.GameObjects.Sprite {
  readonly nombre: string;
  private indicador: Phaser.GameObjects.Text;

  constructor(
    escena: Phaser.Scene,
    x: number,
    y: number,
    nombre: string,
    textura: string,
    frame?: string | number,
  ) {
    super(escena, x, y, textura, frame);
    this.nombre = nombre;
    escena.add.existing(this);
    this.setOrigin(0.5, 1);
    this.indicador = escena.add
      .text(x, y - this.displayHeight - 6, '!', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#f4c542',
        stroke: '#0a1a3a',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(20);
    escena.tweens.add({
      targets: this.indicador,
      y: this.indicador.y - 6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  mostrarIndicador(visible: boolean): void {
    this.indicador.setVisible(visible);
  }

  estaCerca(x: number, y: number, radio = 48): boolean {
    return Phaser.Math.Distance.Between(this.x, this.y, x, y) < radio;
  }

  destroy(fromScene?: boolean): void {
    this.indicador.destroy();
    super.destroy(fromScene);
  }
}
