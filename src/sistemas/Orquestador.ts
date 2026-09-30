import Phaser from 'phaser';
import { QuestManager } from './QuestManager';
import { SaveManager, type Partida } from './SaveManager';
import type { IslaId } from '../data/islas';
import { MISIONES } from '../data/misiones';

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
    avanzadas.push(...qm.sincronizarInventario(partida().inventario));
    // Misiones que terminan con «llegar» o «recoger» (sin NPC final): recompensa aquí
    for (const id of new Set(avanzadas)) {
      if (id !== ID && qm.estaCompletada(id)) {
        darRecompensa(MISIONES[id].recompensa);
        game.events.emit('dialogo', { clave: `${id}-fin` });
      }
    }
    guardar();
    game.events.emit('mision-cambiada');
  };

  game.events.on('recoger', ({ item }: { item: string }) => {
    avanzar(qm.notificar({ tipo: 'recoger', objetivo: item }));
  });

  // Objetos permanentes (cofres): van al inventario y se guardan aunque no haya misión
  game.events.on('objeto-conseguido', ({ item }: { item: string }) => {
    const p = partida();
    if (!p.inventario.includes(item)) p.inventario.push(item);
    avanzar(qm.notificar({ tipo: 'recoger', objetivo: item }));
    game.events.emit('mision-cambiada');
    guardar();
  });

  game.events.on('derrotado', ({ enemigo }: { enemigo: string }) => {
    avanzar(qm.notificar({ tipo: 'derrotar', objetivo: enemigo }));
    game.events.emit('mision-cambiada'); // refresca el contador del HUD
  });

  game.events.on('llegar', ({ poi }: { poi: string }) => {
    avanzar(qm.notificar({ tipo: 'llegar', objetivo: poi }));
  });

  game.events.on('npc-hablar', ({ npc }: { npc: string }) => {
    if (npc === 'pastor') hablarConPastor();
    else if (npc === 'comico') game.events.emit('dialogo', { clave: 'comico-chistera' });
    else hablarConNpcDeMision(npc);
  });

  game.events.on('guardar-partida', () => guardar());

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

  /**
   * NPC genérico de misión (todas salvo la del pastor, que tiene líneas propias).
   * Diálogos: el `dialogo` de cada paso «hablar», `<mision>-en-curso` mientras
   * falta algo y `<mision>-completada` después.
   */
  function hablarConNpcDeMision(npc: string): void {
    const mision = Object.values(MISIONES).find((m) =>
      m.pasos.some((p) => p.tipo === 'hablar' && p.npc === npc),
    );
    if (mision === undefined) return;
    const id = mision.id;
    if (qm.estaCompletada(id)) {
      game.events.emit('dialogo', { clave: `${id}-completada` });
      return;
    }
    if (!qm.estaActiva(id)) qm.activar(id);
    const paso = qm.pasoActual(id);
    if (paso?.tipo !== 'hablar' || paso.npc !== npc) {
      game.events.emit('dialogo', { clave: `${id}-en-curso` });
      return;
    }
    qm.notificar({ tipo: 'hablar', objetivo: npc });
    qm.sincronizarInventario(partida().inventario);
    const completada = qm.estaCompletada(id);
    if (completada) darRecompensa(mision.recompensa);
    game.events.emit('dialogo', {
      clave: paso.dialogo,
      alTerminar: () => {
        game.events.emit('mision-cambiada');
        if (completada) game.sound.play('sfx-achievement', { volume: 0.7 });
      },
    });
    guardar();
  }

  function darRecompensa(recompensa: string): void {
    const p = partida();
    if (recompensa === 'corazon') {
      p.corazones += 1;
      game.registry.set('vida-max', p.corazones * 2);
      game.events.emit('curar');
    } else if (recompensa.startsWith('simbolo-')) {
      const isla = recompensa.slice('simbolo-'.length) as IslaId;
      if (!p.simbolos.includes(isla)) p.simbolos.push(isla);
      game.events.emit('simbolo-conseguido', { isla });
    }
  }

  // Estado de misión consultable por las escenas (cabras, alimaña…)
  game.registry.set('quest-manager', qm);
}
