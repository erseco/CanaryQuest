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
import { camino, MUELLE, umbral } from '../src/puerto/paseo';
import { destinosDesde } from '../src/sistemas/viajes';
import { sueloInterior } from '../src/puerto/interior';
for (const pueblo of Object.keys(PUEBLOS) as (keyof typeof PUEBLOS)[]) {
  it('comunica todas las puertas, el camino y el embarcadero de ' + pueblo, () => {
    const { casas, rincones, salidas } = PUEBLOS[pueblo];
    const destinos = [...casas.map(umbral), ...rincones, ...(salidas.tierra ? [camino(pueblo)] : []), MUELLE];
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
it('Mogán llega hasta la playa y el espigón sin pisar el agua', () => {
  expect(transitable(-23, 1.6)).toBe(true); // arena
  expect(transitable(-23, 6)).toBe(false); // mar frente a la playa
  expect(transitable(24.9, 12)).toBe(true); // punta del espigón
  expect(transitable(22, 8)).toBe(false); // agua junto al espigón
  expect(transitable(16.6, -2)).toBe(false); // segundo canal
  expect(transitable(16.6, 1)).toBe(true); // su puente
  expect(alturaPaseo(16.6, 1)).toBeGreaterThan(0.3);
  expect(alturaPaseo(-23, 4)).toBeLessThan(-0.5); // la arena baja hacia la orilla
  // Agaete conserva su tamaño: nada de esto existe allí.
  expect(transitable(-23, 1.6, 'agaete')).toBe(false);
  expect(transitable(24.9, 12, 'agaete')).toBe(false);
});
it('La Restinga se recorre de la avenida al dique sin cruzar la bahía', () => {
  const pisa = (x: number, z: number) => transitable(x, z, 'la-restinga');
  expect(pisa(-10, 2)).toBe(true); // avenida
  expect(pisa(-10, 12)).toBe(false); // agua de la bahía
  expect(pisa(1.2, 15)).toBe(true); // pantalán
  expect(pisa(8, 6)).toBe(true); // playa
  expect(pisa(-18, 12)).toBe(true); // muelle viejo
  expect(pisa(0, 28)).toBe(true); // dique
  expect(pisa(0, 32)).toBe(false); // escollera, al otro lado del muro
  expect(pisa(27, 9)).toBe(false); // barcos en seco del varadero
  expect(alturaPaseo(1.2, 15, 'la-restinga')).toBeLessThan(-0.5); // el pantalán flota bajo el muelle
  expect(alturaPaseo(8, 8, 'la-restinga')).toBeLessThan(alturaPaseo(8, 5, 'la-restinga'));
  // Del arranque a la punta del dique hay que rodear por la explanada del puerto.
  const ruta = rutaPuerto(INICIO, { x: -21, z: 28 }, 'la-restinga');
  expect(ruta.at(-1)).toEqual({ x: -21, z: 28 });
  expect(ruta.some((p) => p.x >= 13)).toBe(true);
});
it('da acceso a la salida de la habitación y al ferry de regreso', () => {
  expect(sueloInterior(0, 2.7)).toBe(true);
  expect(sueloInterior(2.7, -0.6)).toBe(false);
  expect(destinosDesde('gc-agaete').some((d) => d.terminal.id === 'tf-santa-cruz')).toBe(true);
  expect(destinosDesde('tf-santa-cruz').some((d) => d.terminal.id === 'gc-agaete')).toBe(true);
});
