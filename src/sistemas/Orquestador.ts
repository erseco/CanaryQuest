import Phaser from 'phaser';
import { QuestManager } from './QuestManager';
import { SaveManager, type Partida } from './SaveManager';
import type { IslaId } from '../data/islas';

/**
 * Une los eventos del juego con el QuestManager y el guardado.
 * Se inicia una sola vez al empezar/continuar partida y vive en game.events.
 */
export function iniciarOrquestador(game: Phaser.Game): void {
  if (game.registry.get('orquestador-iniciado') === true) return;
  game.registry.set('orquestador-iniciado', true);

  const partida = (): Partida => game.registry.get('partida') as Partida;
  const qm = new QuestManager(partida().misiones);

  const guardar = (): void => {
    const p = partida();
    p.misiones = qm.exportar();
    SaveManager.guardar(p);
  };

  const avanzar = (avanzadas: string[]): void => {
    if (avanzadas.length === 0) return;
    game.events.emit('mision-cambiada');
    guardar();
  };

  game.events.on('recoger', ({ item }: { item: string }) => {
    avanzar(qm.notificar({ tipo: 'recoger', objetivo: item }));
  });

  game.events.on('derrotado', ({ enemigo }: { enemigo: string }) => {
    avanzar(qm.notificar({ tipo: 'derrotar', objetivo: enemigo }));
  });

  game.events.on('llegar', ({ poi }: { poi: string }) => {
    avanzar(qm.notificar({ tipo: 'llegar', objetivo: poi }));
  });

  game.events.on('npc-hablar', ({ npc }: { npc: string }) => {
    if (npc === 'pastor') hablarConPastor();
  });

  game.events.on('escena-cambiada', (datos: { escena: string; islaId?: IslaId }) => {
    if (datos.islaId !== undefined) {
      partida().islaActual = datos.islaId;
    }
    guardar();
  });

  const ID = 'pastor-roque-nublo';

  function hablarConPastor(): void {
    if (qm.estaCompletada(ID)) {
      game.events.emit('dialogo', { clave: 'pastor-completada' });
      return;
    }
    if (!qm.estaActiva(ID)) {
      qm.activar(ID);
      qm.notificar({ tipo: 'hablar', objetivo: 'pastor' }); // paso 0: el encargo
      game.events.emit('dialogo', {
        clave: 'pastor-encargo',
        alTerminar: () => game.events.emit('mision-cambiada'),
      });
      guardar();
      return;
    }
    const paso = qm.pasoActual(ID);
    if (paso?.tipo === 'recoger') {
      game.events.emit('dialogo', { clave: 'pastor-en-curso-cabras' });
    } else if (paso?.tipo === 'derrotar') {
      game.events.emit('dialogo', { clave: 'pastor-en-curso-alimana' });
    } else if (paso?.tipo === 'hablar') {
      // Entrega de la misión
      qm.notificar({ tipo: 'hablar', objetivo: 'pastor' });
      const p = partida();
      if (!p.simbolos.includes('gran-canaria')) p.simbolos.push('gran-canaria');
      game.events.emit('dialogo', {
        clave: 'pastor-gracias',
        alTerminar: () => {
          game.sound.play('sfx-achievement', { volume: 0.7 });
          game.events.emit('mision-cambiada');
          game.events.emit('simbolo-conseguido', { isla: 'gran-canaria' });
        },
      });
      guardar();
    }
  }

  // Estado de misión consultable por las escenas (cabras, alimaña…)
  game.registry.set('quest-manager', qm);
}
