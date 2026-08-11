import { describe, expect, it } from 'vitest';
import { ISLAS, type IslaId } from '../src/data/islas';
import { destinosDesde } from '../src/sistemas/viajes';

describe('datos de islas', () => {
  it('define las 8 islas', () => {
    expect(Object.keys(ISLAS)).toHaveLength(8);
  });

  it('posiciona todas las islas dentro del mapa-mundo (2752×1536)', () => {
    for (const isla of Object.values(ISLAS)) {
      expect(isla.mapaMundo.x).toBeGreaterThan(0);
      expect(isla.mapaMundo.x).toBeLessThan(2752);
      expect(isla.mapaMundo.y).toBeGreaterThan(0);
      expect(isla.mapaMundo.y).toBeLessThan(1536);
    }
  });

  it('solo La Graciosa carece de aeropuerto', () => {
    const sinAeropuerto = Object.values(ISLAS)
      .filter((i) => i.aeropuerto === null)
      .map((i) => i.id);
    expect(sinAeropuerto).toEqual(['la-graciosa']);
  });
});

describe('destinosDesde', () => {
  it('en avión conecta aeropuertos entre sí, sin incluir el origen', () => {
    const destinos = destinosDesde('gran-canaria', 'avion');
    expect(destinos).toContain('tenerife');
    expect(destinos).toContain('la-gomera');
    expect(destinos).not.toContain('gran-canaria');
    expect(destinos).not.toContain('la-graciosa');
  });

  it('La Graciosa no tiene vuelos', () => {
    expect(destinosDesde('la-graciosa', 'avion')).toEqual([]);
  });

  it('a La Graciosa solo se llega en barco desde Lanzarote', () => {
    expect(destinosDesde('la-graciosa', 'barco')).toEqual(['lanzarote']);
  });

  it('las rutas de barco son simétricas', () => {
    const idas: Array<[IslaId, IslaId]> = [];
    for (const isla of Object.values(ISLAS)) {
      for (const destino of destinosDesde(isla.id, 'barco')) {
        idas.push([isla.id, destino]);
      }
    }
    for (const [a, b] of idas) {
      expect(destinosDesde(b, 'barco')).toContain(a);
    }
  });

  it('Tenerife tiene ferry a Gran Canaria y La Gomera pero no a Lanzarote', () => {
    const destinos = destinosDesde('tenerife', 'barco');
    expect(destinos).toContain('gran-canaria');
    expect(destinos).toContain('la-gomera');
    expect(destinos).not.toContain('lanzarote');
  });
});
