import Phaser from 'phaser';
import { ESPECIES } from '../data/enemigos';

const RADIO_PERSECUCION = 150;
const ATURDIDO_MS = 350;

/**
 * Enemigo estilo Zelda: patrulla alrededor de su origen, persigue al jugador
 * cuando se acerca, parpadea y retrocede al recibir un golpe y muere al
 * quedarse sin vida. Especies y sprites en `data/enemigos.ts`.
 */
export class Enemigo extends Phaser.Physics.Arcade.Sprite {
  readonly especie: string;
  private origen: Phaser.Math.Vector2;
  private direccion = 1;
  private vida: number;
  private velocidad: number;
  private sprite: string;
  private aturdidoHasta = 0;
  private muerto = false;

  constructor(escena: Phaser.Scene, x: number, y: number, especie: string) {
    const datos = ESPECIES[especie] ?? ESPECIES.alimana;
    super(escena, x, y, `bq-${datos.sprite}`);
    this.especie = especie;
    this.sprite = datos.sprite;
    this.vida = datos.vida;
    this.velocidad = datos.velocidad;
    this.origen = new Phaser.Math.Vector2(x, y);
    escena.add.existing(this);
    escena.physics.add.existing(this);
    this.setOrigin(0.5, 0.7);
    const cuerpo = this.body as Phaser.Physics.Arcade.Body;
    cuerpo.setSize(26, 20).setOffset((this.width - 26) / 2, this.height * 0.7 - 14);
    this.animar('walk', 'down');
  }

  get estaMuerto(): boolean {
    return this.muerto;
  }

  private animar(accion: 'walk' | 'idle', dir: 'down' | 'up' | 'right' | 'left'): void {
    const clave = `${this.sprite}-${accion}_${dir === 'left' ? 'right' : dir}`;
    this.setFlipX(dir === 'left');
    if (this.anims.currentAnim?.key !== clave) this.play(clave);
  }

  actualizar(jugadorX: number, jugadorY: number, ahora: number): void {
    if (this.muerto || ahora < this.aturdidoHasta) return;
    const distancia = Phaser.Math.Distance.Between(this.x, this.y, jugadorX, jugadorY);
    let vx: number;
    let vy: number;
    if (distancia < RADIO_PERSECUCION) {
      const angulo = Math.atan2(jugadorY - this.y, jugadorX - this.x);
      vx = Math.cos(angulo) * this.velocidad;
      vy = Math.sin(angulo) * this.velocidad;
    } else {
      // Patrulla: ida y vuelta ±80 px; si choca con algo, se da la vuelta
      const cuerpo = this.body as Phaser.Physics.Arcade.Body;
      if (this.x > this.origen.x + 80 || cuerpo.blocked.right) this.direccion = -1;
      if (this.x < this.origen.x - 80 || cuerpo.blocked.left) this.direccion = 1;
      vx = this.direccion * this.velocidad * 0.5;
      vy = 0;
    }
    this.setVelocity(vx, vy);
    if (Math.abs(vx) > Math.abs(vy)) this.animar('walk', vx < 0 ? 'left' : 'right');
    else this.animar('walk', vy < 0 ? 'up' : 'down');
  }

  /** Devuelve true si el golpe lo ha matado. */
  recibirGolpe(desdeX: number, desdeY: number): boolean {
    if (this.muerto || this.scene.time.now < this.aturdidoHasta) return false;
    this.vida -= 1;
    const angulo = Math.atan2(this.y - desdeY, this.x - desdeX);
    this.setVelocity(Math.cos(angulo) * 260, Math.sin(angulo) * 260);
    this.aturdidoHasta = this.scene.time.now + ATURDIDO_MS;
    this.setTint(0xff5555);
    this.scene.time.delayedCall(90, () => this.clearTint());
    if (this.vida > 0) return false;

    this.muerto = true;
    this.disableBody(false, false);
    this.scene.time.delayedCall(ATURDIDO_MS, () => {
      const puf = this.scene.add.sprite(this.x, this.y, 'bq-death').setDepth(this.depth);
      puf.play('death-death');
      puf.once('animationcomplete', () => puf.destroy());
      this.destroy();
    });
    return true;
  }
}
