import { describe, expect, it } from 'vitest';
import { QuestManager } from '../src/sistemas/QuestManager';
import { MISIONES } from '../src/data/misiones';

const ID = 'pastor-roque-nublo';

describe('datos de misiones', () => {
  it('hay una misión por isla (8)', () => {
    const islas = new Set(Object.values(MISIONES).map((m) => m.isla));
    expect(islas.size).toBe(8);
  });

  it('la misión del pastor tiene la estructura del spec', () => {
    const pasos = MISIONES[ID].pasos;
    expect(pasos.map((p) => p.tipo)).toEqual([
      'hablar',
      'recoger',
      'derrotar',
      'hablar',
    ]);
    expect(MISIONES[ID].recompensa).toBe('simbolo-gran-canaria');
  });
});

describe('QuestManager', () => {
  it('una misión sin activar no tiene paso actual', () => {
    const qm = new QuestManager({});
    expect(qm.pasoActual(ID)).toBeNull();
  });

  it('activar la pone en el paso 0', () => {
    const qm = new QuestManager({});
    qm.activar(ID);
    expect(qm.pasoActual(ID)).toEqual({
      tipo: 'hablar',
      npc: 'pastor',
      dialogo: 'pastor-encargo',
    });
  });

  it('hablar con el NPC correcto avanza; un evento irrelevante no', () => {
    const qm = new QuestManager({});
    qm.activar(ID);
    expect(qm.notificar({ tipo: 'hablar', objetivo: 'pescador' })).toEqual([]);
    expect(qm.notificar({ tipo: 'hablar', objetivo: 'pastor' })).toEqual([ID]);
    expect(qm.pasoActual(ID)?.tipo).toBe('recoger');
  });

  it('recoger acumula progreso y solo avanza al llegar a la cantidad', () => {
    const qm = new QuestManager({});
    qm.activar(ID);
    qm.notificar({ tipo: 'hablar', objetivo: 'pastor' });
    expect(qm.notificar({ tipo: 'recoger', objetivo: 'cabra' })).toEqual([]);
    expect(qm.notificar({ tipo: 'recoger', objetivo: 'cabra' })).toEqual([]);
    expect(qm.progreso(ID)).toBe(2);
    expect(qm.notificar({ tipo: 'recoger', objetivo: 'cabra' })).toEqual([ID]);
    expect(qm.pasoActual(ID)?.tipo).toBe('derrotar');
  });

  it('completa la misión al terminar todos los pasos', () => {
    const qm = new QuestManager({});
    qm.activar(ID);
    qm.notificar({ tipo: 'hablar', objetivo: 'pastor' });
    qm.notificar({ tipo: 'recoger', objetivo: 'cabra' });
    qm.notificar({ tipo: 'recoger', objetivo: 'cabra' });
    qm.notificar({ tipo: 'recoger', objetivo: 'cabra' });
    qm.notificar({ tipo: 'derrotar', objetivo: 'alimana' });
    expect(qm.estaCompletada(ID)).toBe(false);
    qm.notificar({ tipo: 'hablar', objetivo: 'pastor' });
    expect(qm.estaCompletada(ID)).toBe(true);
    expect(qm.pasoActual(ID)).toBeNull();
  });

  it('exportar/importar conserva el estado', () => {
    const qm = new QuestManager({});
    qm.activar(ID);
    qm.notificar({ tipo: 'hablar', objetivo: 'pastor' });
    qm.notificar({ tipo: 'recoger', objetivo: 'cabra' });
    const qm2 = new QuestManager(qm.exportar());
    expect(qm2.pasoActual(ID)?.tipo).toBe('recoger');
    expect(qm2.progreso(ID)).toBe(1);
  });
});
