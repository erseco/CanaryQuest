import Phaser from 'phaser';

const VELOCIDAD_PATRULLA = 50;
const VELOCIDAD_PERSECUCION = 85;
const RADIO_PERSECUCION = 130;

/**
 * Enemigo simple: patrulla horizontal alrededor de su origen y persigue
 * al jugador cuando se acerca. Solo se usa en mapas Detail (no en Island).
 * `puedeEstar` puede restringir el área de movimiento si hace falta.
 */
export class Enemigo extends Phaser.Physics.Arcade.Sprite {
  readonly especie: string;
  private origen: Phaser.Math.Vector2;
  private direccion = 1;
  private puedeEstar: (x: number, y: number) => boolean;
  private muerto = false;

  constructor(
    escena: Phaser.Scene,
    x: number,
    y: number,
    especie: string,
    textura: string,
    puedeEstar?: (x: number, y: number) => boolean,
  ) {
    super(escena, x, y, textura);
    this.especie = especie;
    this.origen = new Phaser.Math.Vector2(x, y);
    this.puedeEstar = puedeEstar ?? (() => true);
    escena.add.existing(this);
    escena.physics.add.existing(this);
    this.body!.setSize(24, 20);
    this.play('crab-walk');
  }

  get estaMuerto(): boolean {
    return this.muerto;
  }

  actualizar(jugadorX: number, jugadorY: number): void {
    if (this.muerto) return;
    const distancia = Phaser.Math.Distance.Between(this.x, this.y, jugadorX, jugadorY);
    let vx: number;
    let vy: number;
    if (distancia < RADIO_PERSECUCION) {
      const angulo = Math.atan2(jugadorY - this.y, jugadorX - this.x);
      vx = Math.cos(angulo) * VELOCIDAD_PERSECUCION;
      vy = Math.sin(angulo) * VELOCIDAD_PERSECUCION;
    } else {
      // Patrulla: ida y vuelta ±80 px alrededor del origen
      if (this.x > this.origen.x + 80) this.direccion = -1;
      if (this.x < this.origen.x - 80) this.direccion = 1;
      vx = this.direccion * VELOCIDAD_PATRULLA;
      vy = 0;
    }
    if (!this.puedeEstar(this.x + Math.sign(vx) * 12, this.y)) {
      vx = -vx;
      this.direccion = -this.direccion;
    }
    if (!this.puedeEstar(this.x, this.y + Math.sign(vy) * 12)) vy = 0;
    this.setVelocity(vx, vy);
    this.setFlipX(vx < 0);
  }

  recibirGolpe(desdeX: number, desdeY: number): void {
    if (this.muerto) return;
    this.muerto = true;
    const angulo = Math.atan2(this.y - desdeY, this.x - desdeX);
    this.setVelocity(Math.cos(angulo) * 180, Math.sin(angulo) * 180);
    this.play('crab-die');
    this.scene.time.delayedCall(600, () => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 300,
        onComplete: () => this.destroy(),
      });
    });
  }
}
