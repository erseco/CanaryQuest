import Phaser from 'phaser';
import { DIALOGOS, PUERTO } from '../data/dialogos';
import type { QuestManager } from '../sistemas/QuestManager';
import type { abrirPuerto } from '../puerto/vista';
import type { Partida } from '../sistemas/SaveManager';
import { PUEBLOS, type Pueblo } from '../data/pueblos';
import { camino, muelle, type PuntoPuerto } from '../puerto/paseo';
import type { Punto } from '../data/islas';

export class PuertoScene extends Phaser.Scene {
  /** Cuenta las aperturas: una vista que termina de cargar tarde sabe que ya no es la vigente. */
  private turno = 0;
  constructor() {
    super('Puerto');
  }

  async create(datos: { entrada?: Punto; pueblo?: Pueblo; llegada?: PuntoPuerto }): Promise<void> {
    const qm = this.registry.get('quest-manager') as QuestManager;
    const pueblo = datos.pueblo ?? 'mogan';
    const { isla: islaId, poi } = PUEBLOS[pueblo];
    const partida = this.registry.get('partida') as Partida;
    partida.pueblo = pueblo;
    partida.islaActual = islaId;
    this.game.events.emit('guardar-partida');
    const mision = 'pastor-roque-nublo';
    if (this.scene.isActive('UI')) this.scene.sleep('UI');

    const iniciarUI = () => {
      if (this.scene.isSleeping('UI')) this.scene.wake('UI');
      else this.scene.launch('UI');
    };
    const objetivo = () => {
      if (qm.estaCompletada(mision)) return PUERTO.completada;
      const paso = qm.pasoActual(mision);
      if (paso?.tipo === 'recoger') return PUERTO.objetivo;
      if (paso?.tipo === 'derrotar') return PUERTO.alimana;
      if (paso?.tipo === 'hablar') return PUERTO.entrega;
      return '';
    };
    // Mientras el pastor espera sus cabras, el rastro lleva al mapa de tiles de las dunas, y se vuelve
    // de él a la isla por el mismo punto por el que se entró al lugar.
    const tras = qm.pasoActual(mision)?.tipo;
    const seguirRastro =
      PUEBLOS[pueblo].rastro && (tras === 'recoger' || tras === 'derrotar')
        ? () => {
            const punto = this.make
              .tilemap({ key: 'map-' + islaId })
              .getObjectLayer('pois')!
              .objects.find((o) => o.name === poi)!;
            iniciarUI();
            this.scene.start('Detail', { mapaId: 'dunas', retorno: { islaId, x: punto.x!, y: punto.y! } });
          }
        : undefined;
    let vista: Awaited<ReturnType<typeof abrirPuerto>>;
    const turno = ++this.turno;
    this.events.once('shutdown', () => this.turno++);
    try {
      const modulo = await import('../puerto/vista');
      vista = await modulo.abrirPuerto(
        (npc = 'pastor') => this.game.events.emit('npc-hablar', { npc }),
        () => {
          iniciarUI();
          this.scene.start('Island', { islaId, lugar: poi });
        },
        objetivo,
        pueblo,
        (destino, porMar = false) => {
          if (destino === 'ferry') {
            iniciarUI();
            this.scene.start('TravelMap', { origen: islaId, terminal: poi, desdePueblo: true });
            return;
          }
          this.scene.restart({ pueblo: destino, llegada: porMar ? muelle(destino) : camino(destino) });
        },
        datos.llegada,
        seguirRastro,
        (evento, carga) => this.game.events.emit(evento, carga),
      );
    } catch (error) {
      console.warn('Puerto de Mogán utilizará su mapa de detalle.', error);
      // Sin 3D, la misión de las cabras sigue en su mapa de tiles.
      if (seguirRastro) {
        seguirRastro();
        return;
      }
      if (PUEBLOS[pueblo].salidas.mar === 'ferry') {
        iniciarUI();
        this.scene.start('TravelMap', { origen: islaId, terminal: poi });
        return;
      }
      iniciarUI();
      if (pueblo !== 'mogan') {
        this.scene.start('Island', { islaId, lugar: poi });
        return;
      }
      const puntoPueblo = this.make
        .tilemap({ key: 'map-gran-canaria' })
        .getObjectLayer('pois')
        ?.objects.find((o) => o.name === 'pueblo');
      const entrada = datos.entrada ?? { x: puntoPueblo!.x!, y: puntoPueblo!.y! };
      this.scene.start('Detail', { mapaId: 'pueblo', retorno: { islaId, ...entrada } });
      return;
    }
    if (turno !== this.turno) {
      vista.destruir();
      return;
    }
    const dialogo = (evento: { clave: string; alTerminar?: () => void }) => {
      vista.mostrar(DIALOGOS[evento.clave], evento.alTerminar);
    };
    this.game.events.on('dialogo', dialogo);
    this.events.once('shutdown', () => {
      this.game.events.off('dialogo', dialogo);
      vista.destruir();
    });
  }
}
