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
import { camino, inicio, muelle, umbral } from '../src/puerto/paseo';
import { destinosDesde } from '../src/sistemas/viajes';
import { sueloInterior } from '../src/puerto/interior';
for (const pueblo of Object.keys(PUEBLOS) as (keyof typeof PUEBLOS)[]) {
  it('comunica todas las puertas, el camino y el embarcadero de ' + pueblo, () => {
    const { casas, rincones, salidas } = PUEBLOS[pueblo];
    const destinos = [
      ...casas.map(umbral),
      ...rincones,
      ...(salidas.tierra ? [camino(pueblo)] : []),
      ...(salidas.mar ? [muelle(pueblo)] : []),
    ];
    let origen = inicio(pueblo);
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
it('Las Palmas: la plaza y las calles de Vegueta se pisan, los edificios no, y se llega a cada rincón', () => {
  const pueblo = 'las-palmas';
  const pisa = (x: number, z: number) => transitable(x, z, pueblo);
  expect(pisa(0, 6)).toBe(true); // plaza de Santa Ana
  expect(pisa(16, 0)).toBe(true); // calle Obispo Codina, ante la catedral
  expect(pisa(-20, 12.5)).toBe(true); // calle del Castillo
  expect(pisa(-17.8, 6)).toBe(true); // soportal de las Casas Consistoriales
  expect(pisa(25, 16)).toBe(true); // calle del Espíritu Santo
  expect(pisa(40, 5)).toBe(false); // pilar del Pilar Nuevo
  expect(pisa(26, 6)).toBe(false); // naves de la catedral
  expect(pisa(-22, 6)).toBe(false); // Casas Consistoriales
  expect(pisa(6, -4)).toBe(false); // Palacio Episcopal
  expect(pisa(40, -2)).toBe(false); // Casa de Colón
  expect(pisa(13, 3)).toBe(false); // pedestales de los perros
  expect(alturaPaseo(0, 6, pueblo)).toBeGreaterThan(0.1); // la plaza está un escalón por encima
  // Se camina como en la vista: paso a paso, primero en x y luego en z, dando por alcanzado
  // cada punto de la ruta a menos de 8 mm. Con varios largos de paso, como a distintos fotogramas
  // por segundo, alguno se detiene justo antes de una esquina entre dos suelos.
  const caminar = (desde: { x: number; z: number }, hasta: { x: number; z: number }, zancada: number) => {
    const pos = { ...desde },
      ruta = rutaPuerto(desde, hasta, pueblo);
    for (let i = 0; i < 20000 && ruta.length; i++) {
      const dx = ruta[0].x - pos.x,
        dz = ruta[0].z - pos.z,
        largo = Math.hypot(dx, dz);
      if (largo < 0.008) {
        ruta.shift();
        continue;
      }
      const paso = Math.min(largo, zancada);
      if (transitable(pos.x + (dx / largo) * paso, pos.z, pueblo)) pos.x += (dx / largo) * paso;
      if (transitable(pos.x, pos.z + (dz / largo) * paso, pueblo)) pos.z += (dz / largo) * paso;
    }
    return Math.hypot(pos.x - hasta.x, pos.z - hasta.z);
  };
  const { rincones } = PUEBLOS[pueblo];
  for (const zancada of [0.031, 0.047, 0.059, 0.067, 0.083, 0.097, 0.113]) {
    for (const r of rincones) expect(caminar(inicio(pueblo), r, zancada), r.nombre).toBeLessThan(0.01);
    // También de un extremo a otro: de la Casa de Colón a la plazoleta del Espíritu Santo.
    expect(caminar(rincones.at(-1)!, rincones.at(-2)!, zancada)).toBeLessThan(0.01);
  }
});
it('da acceso a la salida de la habitación y al ferry de regreso', () => {
  expect(sueloInterior(0, 2.7)).toBe(true);
  expect(sueloInterior(2.7, -0.6)).toBe(false);
  expect(destinosDesde('gc-agaete').some((d) => d.terminal.id === 'tf-santa-cruz')).toBe(true);
  expect(destinosDesde('tf-santa-cruz').some((d) => d.terminal.id === 'gc-agaete')).toBe(true);
});
