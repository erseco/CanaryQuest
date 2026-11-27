import Phaser from 'phaser';
import { DIALOGOS, PUERTO } from '../data/dialogos';
import type { QuestManager } from '../sistemas/QuestManager';
import type { abrirPuerto } from '../puerto/vista';
import type { Partida } from '../sistemas/SaveManager';
import type { Pueblo } from '../data/pueblos';
import { camino, MUELLE, type PuntoPuerto } from '../puerto/paseo';
import type { Punto } from '../data/islas';

export class PuertoScene extends Phaser.Scene {
  constructor() {
    super('Puerto');
  }

  async create(datos: { entrada?: Punto; pueblo?: Pueblo; llegada?: PuntoPuerto }): Promise<void> {
    const islaId = 'gran-canaria';
    const qm = this.registry.get('quest-manager') as QuestManager;
    const pueblo = datos.pueblo ?? 'mogan';
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
    let vista: Awaited<ReturnType<typeof abrirPuerto>>;
    try {
      const modulo = await import('../puerto/vista');
      vista = await modulo.abrirPuerto(
        () => this.game.events.emit('npc-hablar', { npc: 'pastor' }),
        () => {
          iniciarUI();
          this.scene.start('Island', {islaId, lugar: pueblo === 'agaete' ? 'gc-agaete' : 'pueblo'});
        },
        objetivo,
        pueblo,
        (destino, porMar = false) => {
          if (destino === 'ferry') {
            iniciarUI();
            this.scene.start('TravelMap', { origen: islaId, terminal: 'gc-agaete', desdePueblo: true });
            return;
          }
          this.scene.restart({ pueblo: destino, llegada: porMar ? MUELLE : camino(destino) });
        },
        datos.llegada,
      );
    } catch (error) {
      console.warn('Puerto de Mogán utilizará su mapa de detalle.', error);
      if (pueblo === 'agaete') {
        iniciarUI();
        this.scene.start('TravelMap', { origen: islaId, terminal: 'gc-agaete' });
        return;
      }
      iniciarUI();
      const puntoPueblo = this.make
        .tilemap({ key: 'map-gran-canaria' })
        .getObjectLayer('pois')
        ?.objects.find((o) => o.name === 'pueblo');
      const entrada = datos.entrada ?? { x: puntoPueblo!.x!, y: puntoPueblo!.y! };
      this.scene.start('Detail', { mapaId: 'pueblo', retorno: { islaId, ...entrada } });
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
