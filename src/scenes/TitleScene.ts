import Phaser from 'phaser';
import { SaveManager } from '../sistemas/SaveManager';
import { PUEBLOS, type Pueblo } from '../data/pueblos';
import { ISLAS } from '../data/islas';
import { PORTADA as t } from '../data/dialogos';
import { Musica } from '../sistemas/Musica';
import { iniciarOrquestador } from '../sistemas/Orquestador';
import './portada.css';

/** Lugares que lucen de fondo en la portada: cada visita, uno al azar. */
const ESCAPARATE: Pueblo[] = [
  'mogan',
  'agaete',
  'las-canteras',
  'playa-blanca',
  'dunas',
  'la-laguna',
  'garajonay',
  'roque-de-los-muchachos',
  'las-teresitas',
  'san-sebastian',
  'la-restinga',
  'loro-parque',
];

export class TitleScene extends Phaser.Scene {
  private botones: HTMLButtonElement[] = [];
  private seleccion = 0;
  /** Cuenta las aperturas: un fondo 3D que termina de cargar tarde sabe que ya no hace falta. */
  private turno = 0;
  private eligiendo = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.eligiendo = false;
    const { width, height } = this.scale;
    // La ilustración queda debajo mientras llega el lugar 3D, o si el navegador no tiene WebGL.
    const fondo = this.add.image(width / 2, height / 2, 'titulo-fondo');
    fondo.setScale(Math.max(width / fondo.width, height / fondo.height));

    const hayPartida = SaveManager.cargar() !== null;
    const opciones = hayPartida ? [t.continuar, t.nueva] : [t.nueva];
    const pueblo = ESCAPARATE[Math.floor(Math.random() * ESCAPARATE.length)];
    const lugar = PUEBLOS[pueblo];

    const portada = document.createElement('section');
    portada.className = 'portada';
    portada.innerHTML = `<div class="portada-centro">
        <p class="portada-islas">${t.islas(Object.keys(PUEBLOS).length)}</p>
        <h1><span class="rosa" aria-hidden="true">✥</span>${t.marca}</h1>
        <p class="portada-lema">${t.lema}</p>
        <nav>${opciones.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</nav>
      </div>
      <footer>
        <p class="portada-lugar" hidden>${t.desde}: <b>${lugar.nombre}</b> · ${ISLAS[lugar.isla].nombre}</p>
        <p class="portada-controles">${t.controles}</p>
        <button class="portada-sonido" aria-pressed="false"></button>
      </footer>`;
    document.body.append(portada);
    document.getElementById('carga')?.classList.add('fuera');
    setTimeout(() => document.getElementById('carga')?.remove(), 600);

    this.botones = [...portada.querySelectorAll<HTMLButtonElement>('nav button')];
    this.botones.forEach((b, i) => {
      b.addEventListener('pointerenter', () => this.seleccionar(i));
      b.addEventListener('focus', () => this.seleccionar(i));
      b.addEventListener('click', () => this.elegir(i));
    });
    this.seleccionar(0);

    const sonido = portada.querySelector<HTMLButtonElement>('.portada-sonido')!;
    const pintarSonido = () => {
      const mudo = this.game.sound.mute;
      sonido.textContent = mudo ? '🔇' : '🔊';
      sonido.setAttribute('aria-label', mudo ? t.sonido : t.silencio);
      sonido.setAttribute('aria-pressed', String(mudo));
    };
    Musica.reproducir(this, 'musica-titulo');
    pintarSonido();
    sonido.addEventListener('click', () => {
      Musica.alternarMute(this.game);
      pintarSonido();
    });

    this.input.keyboard?.on('keydown-UP', () =>
      this.seleccionar((this.seleccion + this.botones.length - 1) % this.botones.length),
    );
    this.input.keyboard?.on('keydown-DOWN', () =>
      this.seleccionar((this.seleccion + 1) % this.botones.length),
    );
    this.input.keyboard?.on('keydown-ENTER', () => this.elegir(this.seleccion));
    this.input.keyboard?.on('keydown-SPACE', () => this.elegir(this.seleccion));

    // El lugar 3D de fondo, sin interfaz, con la cámara girando despacio.
    const turno = ++this.turno;
    let vista: { destruir(): void } | undefined;
    const nada = () => {};
    void import('../puerto/vista')
      .then((m) => m.abrirPuerto(nada, nada, () => '', pueblo, nada, undefined, undefined, undefined, true))
      .then((v) => {
        if (turno !== this.turno) return v.destruir();
        vista = v;
        portada.querySelector<HTMLElement>('.portada-lugar')!.hidden = false;
      })
      .catch((error) => console.warn('Portada sin fondo 3D', error));

    this.events.once('shutdown', () => {
      this.turno++;
      vista?.destruir();
      portada.remove();
    });
  }

  private seleccionar(i: number): void {
    this.seleccion = i;
    this.botones.forEach((b, j) => b.classList.toggle('activa', j === i));
  }

  private elegir(i: number): void {
    if (this.eligiendo) return;
    this.eligiendo = true;
    const texto = this.botones[i].textContent;
    const partida = texto === t.continuar ? (SaveManager.cargar() ?? SaveManager.nueva()) : SaveManager.nueva();
    if (texto === t.nueva) SaveManager.guardar(partida);
    this.registry.set('partida', partida);
    iniciarOrquestador(this.game);
    document.querySelector('.portada')?.classList.add('fuera');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (partida.pueblo && PUEBLOS[partida.pueblo]?.isla === partida.islaActual) {
        this.scene.start('Puerto', { pueblo: partida.pueblo });
        return;
      }
      this.scene.launch('UI');
      this.scene.start('Island', { islaId: partida.islaActual });
    });
  }
}
