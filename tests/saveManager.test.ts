import { beforeEach, describe, expect, it } from 'vitest';
import { SaveManager, type Partida } from '../src/sistemas/SaveManager';

// Stub mínimo de localStorage para entorno Node.
const almacen = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => almacen.get(k) ?? null,
  setItem: (k: string, v: string) => void almacen.set(k, String(v)),
  removeItem: (k: string) => void almacen.delete(k),
  clear: () => almacen.clear(),
};

beforeEach(() => almacen.clear());

describe('SaveManager', () => {
  it('sin partida guardada devuelve null', () => {
    expect(SaveManager.cargar()).toBeNull();
  });

  it('nueva() empieza en Gran Canaria con 3 corazones', () => {
    const p = SaveManager.nueva();
    expect(p.islaActual).toBe('gran-canaria');
    expect(p.corazones).toBe(3);
    expect(p.simbolos).toEqual([]);
  });

  it('guardar y cargar hace roundtrip completo', () => {
    const p: Partida = SaveManager.nueva();
    p.simbolos.push('gran-canaria');
    p.misiones['pastor-roque-nublo'] = { estado: 'activa', paso: 1, progreso: 2 };
    p.inventario.push('cabra');
    SaveManager.guardar(p);
    expect(SaveManager.cargar()).toEqual(p);
  });

  it('JSON corrupto devuelve null', () => {
    almacen.set('canaryquest-partida', '{esto no es json');
    expect(SaveManager.cargar()).toBeNull();
  });

  it('versión desconocida devuelve null', () => {
    almacen.set(
      'canaryquest-partida',
      JSON.stringify({ ...SaveManager.nueva(), version: 99 }),
    );
    expect(SaveManager.cargar()).toBeNull();
  });

  it('borrar() elimina la partida', () => {
    SaveManager.guardar(SaveManager.nueva());
    SaveManager.borrar();
    expect(SaveManager.cargar()).toBeNull();
  });
});
