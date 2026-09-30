import Phaser from 'phaser';
import { AYUDA } from '../data/dialogos';
import { AjustesStore } from '../sistemas/Ajustes';
import { Musica } from '../sistemas/Musica';
import { SaveManager } from '../sistemas/SaveManager';

interface Opcion {
  texto: () => string;
  elegir?: () => void;
  /** Para deslizadores: -1 izquierda, +1 derecha. */
  ajustar?: (paso: number) => void;
}

type Pantalla = 'principal' | 'ayuda' | 'ajustes' | 'reiniciar' | 'salir';

const ESTILO = {
  fontFamily: 'monospace',
  fontSize: '26px',
  color: '#ffffff',
  backgroundColor: '#0a1a3aDD',
  padding: { x: 20, y: 8 },
};

/**
 * Menú de pausa (ESC o botón ☰): se superpone a la escena de juego, que queda
 * pausada. Guardar, ayuda, ajustes de audio, reiniciar y volver al título.
 */
export class PausaScene extends Phaser.Scene {
  private pausadas: string[] = [];
  private elementos: Phaser.GameObjects.GameObject[] = [];
  private botones: Phaser.GameObjects.Text[] = [];
  private opciones: Opcion[] = [];
  private seleccion = 0;
  private mensaje!: Phaser.GameObjects.Text;

  constructor() {
    super('Pausa');
  }

  init(datos: { pausadas: string[] }): void {
    this.pausadas = datos.pausadas;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setInteractive();
    this.mensaje = this.add
      .text(width / 2, height - 30, '', { fontFamily: 'monospace', fontSize: '18px', color: '#7ee787' })
      .setOrigin(0.5);

    const teclado = this.input.keyboard!;
    teclado.on('keydown-UP', () => this.mover(-1));
    teclado.on('keydown-DOWN', () => this.mover(1));
    teclado.on('keydown-LEFT', () => this.opciones[this.seleccion]?.ajustar?.(-1));
    teclado.on('keydown-RIGHT', () => this.opciones[this.seleccion]?.ajustar?.(1));
    teclado.on('keydown-ENTER', () => this.opciones[this.seleccion]?.elegir?.());
    teclado.on('keydown-SPACE', () => this.opciones[this.seleccion]?.elegir?.());

    this.mostrar('principal');
  }

  /** ESC (lo reenvía UIScene): en un submenú vuelve al principal; en el principal cierra. */
  atras(): void {
    if (this.pantalla === 'principal') this.cerrar();
    else this.mostrar('principal');
  }

  private pantalla: Pantalla = 'principal';

  private mostrar(pantalla: Pantalla): void {
    this.pantalla = pantalla;
    for (const e of this.elementos) e.destroy();
    this.elementos = [];
    this.botones = [];
    this.mensaje.setText('');
    const volver: Opcion = { texto: () => 'Volver', elegir: () => this.mostrar('principal') };

    switch (pantalla) {
      case 'principal':
        this.titulo('PAUSA');
        this.lista([
          { texto: () => 'Continuar', elegir: () => this.cerrar() },
          { texto: () => 'Guardar partida', elegir: () => this.guardar() },
          { texto: () => 'Ayuda y controles', elegir: () => this.mostrar('ayuda') },
          { texto: () => 'Ajustes', elegir: () => this.mostrar('ajustes') },
          { texto: () => 'Reiniciar partida', elegir: () => this.mostrar('reiniciar') },
          { texto: () => 'Salir al título', elegir: () => this.mostrar('salir') },
        ]);
        break;
      case 'ayuda':
        this.titulo('AYUDA');
        this.elementos.push(
          this.add
            .text(this.scale.width / 2, 110, AYUDA.join('\n'), {
              fontFamily: 'monospace',
              fontSize: '17px',
              color: '#ffffff',
              backgroundColor: '#0a1a3aDD',
              padding: { x: 24, y: 16 },
              lineSpacing: 4,
            })
            .setOrigin(0.5, 0),
        );
        this.lista([volver], this.scale.height - 80);
        break;
      case 'ajustes': {
        this.titulo('AJUSTES');
        const ajustes = AjustesStore.cargar();
        const deslizador = (clave: 'volumen' | 'musica', nombre: string): Opcion => {
          const cambiar = (paso: number) => {
            ajustes[clave] = Math.round(Math.min(1, Math.max(0, ajustes[clave] + paso * 0.1)) * 10) / 10;
            AjustesStore.guardar(ajustes);
            Musica.aplicarAjustes(this.game);
            this.refrescar();
          };
          return {
            texto: () => {
              const n = Math.round(ajustes[clave] * 10);
              return `${nombre}  ◀ ${'■'.repeat(n)}${'□'.repeat(10 - n)} ▶`;
            },
            ajustar: cambiar,
            // Con ratón/táctil: cada toque sube un 10 %, y tras el máximo vuelve a 0
            elegir: () => cambiar(ajustes[clave] >= 1 ? -10 : 1),
          };
        };
        this.lista([
          deslizador('volumen', 'Volumen general'),
          deslizador('musica', 'Música         '),
          {
            texto: () => `Pantalla completa: ${this.scale.isFullscreen ? 'sí' : 'no'}`,
            elegir: () => {
              this.scale.toggleFullscreen();
              this.time.delayedCall(200, () => this.refrescar());
            },
          },
          volver,
        ]);
        this.mensaje.setText('◀ ▶ para ajustar · ESC para volver');
        break;
      }
      case 'reiniciar':
        this.titulo('¿Borrar la partida y empezar de cero?');
        this.lista([
          { texto: () => 'No, seguir jugando', elegir: () => this.mostrar('principal') },
          {
            texto: () => 'Sí, borrar y reiniciar',
            elegir: () => {
              SaveManager.borrar();
              window.location.reload();
            },
          },
        ]);
        break;
      case 'salir':
        this.titulo('¿Volver al título? (se guarda la partida)');
        this.lista([
          { texto: () => 'No', elegir: () => this.mostrar('principal') },
          {
            texto: () => 'Sí, guardar y salir',
            elegir: () => {
              this.game.events.emit('guardar-partida');
              window.location.reload();
            },
          },
        ]);
        break;
    }
  }

  private titulo(texto: string): void {
    this.elementos.push(
      this.add
        .text(this.scale.width / 2, 60, texto, {
          fontFamily: 'monospace',
          fontSize: '34px',
          fontStyle: 'bold',
          color: '#f4c542',
          stroke: '#0a1a3a',
          strokeThickness: 6,
        })
        .setOrigin(0.5),
    );
  }

  private lista(opciones: Opcion[], y0 = 140): void {
    this.opciones = opciones;
    this.botones = opciones.map((op, i) => {
      const b = this.add
        .text(this.scale.width / 2, y0 + i * 58, op.texto(), ESTILO)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.seleccionar(i))
        .on('pointerdown', () => {
          this.seleccionar(i);
          op.elegir?.();
        });
      this.elementos.push(b);
      return b;
    });
    this.seleccionar(0);
  }

  private refrescar(): void {
    this.botones.forEach((b, i) => b.setText(this.opciones[i].texto()));
  }

  private mover(paso: number): void {
    const n = this.opciones.length;
    this.seleccionar((this.seleccion + paso + n) % n);
  }

  private seleccionar(i: number): void {
    this.seleccion = i;
    this.botones.forEach((b, j) => b.setColor(j === i ? '#f4c542' : '#ffffff').setScale(j === i ? 1.06 : 1));
  }

  private guardar(): void {
    this.game.events.emit('guardar-partida');
    this.sound.play('sfx-achievement', { volume: 0.5 });
    this.mensaje.setText('✔ Partida guardada. Al continuar volverás a esta isla.');
  }

  private cerrar(): void {
    for (const clave of this.pausadas) this.scene.resume(clave);
    this.scene.stop();
  }
}
