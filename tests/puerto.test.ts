import { describe, expect, it } from 'vitest';
import { INICIO, PASTOR, alturaPaseo, rutaPuerto, transitable } from '../src/puerto/paseo';

describe('paseo de Mogán', () => {
  it('se puede llegar al pastor desde el muelle sin pisar el canal', () => {
    let anterior = INICIO;
    const ruta = rutaPuerto(INICIO, PASTOR);
    expect(ruta.at(-1)).toEqual(PASTOR);
    for (const punto of ruta) {
      for (let i = 0; i <= 20; i++) {
        expect(
          transitable(
            anterior.x + ((punto.x - anterior.x) * i) / 20,
            anterior.z + ((punto.z - anterior.z) * i) / 20,
          ),
        ).toBe(true);
      }
      anterior = punto;
    }
    expect(alturaPaseo(0, 1)).toBeGreaterThan(alturaPaseo(2.2, 1));
    expect(rutaPuerto(INICIO, { x: 0, z: 3 })).toEqual([]);
  });
});

import { PUEBLOS } from '../src/data/pueblos';
import { CAMINO, MUELLE, umbral } from '../src/puerto/paseo';
import { destinosDesde } from '../src/sistemas/viajes';
import { sueloInterior } from '../src/puerto/interior';
for (const pueblo of ['mogan', 'agaete'] as const) {
  it('comunica todas las puertas, el camino y el embarcadero de ' + pueblo, () => {
    const destinos = [...PUEBLOS[pueblo].casas.map(umbral), CAMINO, MUELLE];
    let origen = INICIO;
    for (const destino of destinos) {
      const ruta = rutaPuerto(origen, destino, pueblo);
      expect(ruta.at(-1)).toEqual(destino);
      for (const p of ruta) {
        for (let i = 0; i <= 100; i++)
          expect(
            transitable(
              origen.x + ((p.x - origen.x) * i) / 100,
              origen.z + ((p.z - origen.z) * i) / 100,
              pueblo,
            ),
          ).toBe(true);
        origen = p;
      }
    }
    expect(PUEBLOS[pueblo].casas.every((c) => !transitable(c.x, c.z, pueblo))).toBe(true);
  });
}
it('da acceso a la salida de la habitación y al ferry de regreso', () => {
  expect(sueloInterior(0, 2.7)).toBe(true);
  expect(sueloInterior(2.7, -0.6)).toBe(false);
  expect(destinosDesde('gc-agaete').some((d) => d.terminal.id === 'tf-santa-cruz')).toBe(true);
  expect(destinosDesde('tf-santa-cruz').some((d) => d.terminal.id === 'gc-agaete')).toBe(true);
});
