import Phaser from 'phaser';
import { DIALOGOS, PUERTO } from '../data/dialogos';
import type { QuestManager } from '../sistemas/QuestManager';
import type { abrirPuerto } from '../puerto/vista';
import type { Punto } from '../data/islas';

export class PuertoScene extends Phaser.Scene {
  constructor() {
    super('Puerto');
  }

  async create(datos: { entrada?: Punto }): Promise<void> {
    const islaId = 'gran-canaria';
    const qm = this.registry.get('quest-manager') as QuestManager;
    const mision = 'pastor-roque-nublo';
    if (this.scene.isActive('UI')) this.scene.sleep('UI');

    const iniciarUI = () => {
      if (this.scene.isSleeping('UI')) this.scene.wake('UI');
      else this.scene.launch('UI');
    };
    const salir = () => {
      iniciarUI();
      this.scene.start('Island', { islaId, entrada: datos.entrada });
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
        salir,
        objetivo,
      );
    } catch (error) {
      console.warn('Puerto de Mogán utilizará su mapa de detalle.', error);
      iniciarUI();
      const pueblo = this.make
        .tilemap({ key: 'map-gran-canaria' })
        .getObjectLayer('pois')
        ?.objects.find((o) => o.name === 'pueblo');
      const entrada = datos.entrada ?? { x: pueblo?.x ?? 250, y: (pueblo?.y ?? 940) + 50 };
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
