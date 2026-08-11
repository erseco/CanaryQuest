import Phaser from 'phaser';

export const VELOCIDAD = 120;

/**
 * Héroe controlable con teclado (flechas/WASD) y tap-to-move.
 * La escena puede pasar `puedeEstar` para restringir el movimiento
 * (p. ej. polígono de costa en las islas). En escenas con tilemap,
 * basta el collider de arcade y `puedeEstar` se omite.
 */
export class Jugador extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclas: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private objetivo: Phaser.Math.Vector2 | null = null;
  private puedeEstar: (x: number, y: number) => boolean;
  /** Dirección virtual del pad táctil (-1..1 en cada eje). */
  public padTactil = new Phaser.Math.Vector2(0, 0);
  public bloqueado = false;

  constructor(
    escena: Phaser.Scene,
    x: number,
    y: number,
    puedeEstar?: (x: number, y: number) => boolean,
  ) {
    super(escena, x, y, 'atlas', 'misa-front');
    escena.add.existing(this);
    escena.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body!.setSize(20, 14);
    (this.body as Phaser.Physics.Arcade.Body).setOffset(6, 50);
    this.puedeEstar = puedeEstar ?? (() => true);
    this.cursors = escena.input.keyboard!.createCursorKeys();
    this.teclas = escena.input.keyboard!.addKeys('W,A,S,D') as Jugador['teclas'];
  }

  irA(x: number, y: number): void {
    if (this.bloqueado) return;
    this.objetivo = new Phaser.Math.Vector2(x, y);
  }

  pararObjetivo(): void {
    this.objetivo = null;
  }

  actualizar(delta: number): void {
    if (this.bloqueado) {
      this.setVelocity(0, 0);
      this.pararAnimacion();
      return;
    }

    let dx =
      (this.cursors.left.isDown || this.teclas.A.isDown ? -1 : 0) +
      (this.cursors.right.isDown || this.teclas.D.isDown ? 1 : 0) +
      this.padTactil.x;
    let dy =
      (this.cursors.up.isDown || this.teclas.W.isDown ? -1 : 0) +
      (this.cursors.down.isDown || this.teclas.S.isDown ? 1 : 0) +
      this.padTactil.y;
    dx = Phaser.Math.Clamp(dx, -1, 1);
    dy = Phaser.Math.Clamp(dy, -1, 1);

    if (dx !== 0 || dy !== 0) {
      this.objetivo = null; // el teclado/pad manda
    } else if (this.objetivo !== null) {
      const distancia = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.objetivo.x,
        this.objetivo.y,
      );
      if (distancia < 6) {
        this.objetivo = null;
      } else {
        dx = (this.objetivo.x - this.x) / distancia;
        dy = (this.objetivo.y - this.y) / distancia;
      }
    }

    const vector = new Phaser.Math.Vector2(dx, dy);
    if (vector.length() > 1) vector.normalize();

    // Validar contra el terreno andable, con deslizamiento por ejes.
    const paso = (VELOCIDAD * delta) / 1000;
    let vx = vector.x;
    let vy = vector.y;
    if (vx !== 0 && !this.puedeEstar(this.x + vx * paso * 3, this.y)) {
      vx = 0;
      if (this.objetivo) this.objetivo = null;
    }
    if (vy !== 0 && !this.puedeEstar(this.x, this.y + vy * paso * 3)) {
      vy = 0;
      if (this.objetivo) this.objetivo = null;
    }

    this.setVelocity(vx * VELOCIDAD, vy * VELOCIDAD);

    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.anims.play(vx < 0 ? 'misa-left-walk' : 'misa-right-walk', true);
      } else {
        this.anims.play(vy < 0 ? 'misa-back-walk' : 'misa-front-walk', true);
      }
    } else {
      this.pararAnimacion();
    }
  }

  private pararAnimacion(): void {
    const actual = this.anims.currentAnim?.key;
    if (actual !== undefined) {
      this.anims.stop();
      this.setFrame(
        actual.includes('left')
          ? 'misa-left'
          : actual.includes('right')
            ? 'misa-right'
            : actual.includes('back')
              ? 'misa-back'
              : 'misa-front',
      );
    }
  }
}
