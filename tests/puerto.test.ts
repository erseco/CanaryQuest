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
import { VASOS } from '../src/puerto/sitios/caleta-plano';
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
});
it('Agaete lleva del paseo al Dedo de Dios y al ferry sin pisar el agua', () => {
  const pisa = (x: number, z: number) => transitable(x, z, 'agaete');
  expect(pisa(-9, 6)).toBe(true); // paseo de la playa
  expect(pisa(-20, 15)).toBe(true); // dique
  expect(pisa(28, 15)).toBe(true); // morro del dique
  expect(pisa(8.8, 8)).toBe(true); // contradique de la dársena
  expect(pisa(5, 0.75)).toBe(true); // muelle viejo
  expect(pisa(10, -5)).toBe(true); // playa de las Nieves
  expect(pisa(-34, 2)).toBe(true); // las Salinas
  expect(pisa(-43, 3.5)).toBe(false); // una de sus piscinas
  expect(pisa(4, 8)).toBe(false); // agua de la dársena
  expect(pisa(18, 11)).toBe(false); // el ferry amarrado
  expect(pisa(22.6, -1.6)).toBe(false); // el Dedo de Dios, en el agua
  expect(pisa(0, 20)).toBe(false); // mar abierto tras el dique
  expect(alturaPaseo(10, -4, 'agaete')).toBeLessThan(alturaPaseo(10, -6.5, 'agaete')); // los callaos bajan al mar
  const { inicio, embarcadero, rincones } = PUEBLOS.agaete;
  const dedo = rincones.find((r) => r.nombre === 'Dedo de Dios')!;
  // Al Dedo de Dios se llega rodeando la bahía por la plaza de la ermita y la playa.
  const alDedo = rutaPuerto(inicio!, dedo, 'agaete');
  expect(alDedo.at(-1)).toEqual(dedo);
  expect(alDedo.some((p) => p.z < -3.5)).toBe(true);
  expect(rutaPuerto(inicio!, embarcadero!, 'agaete').at(-1)).toEqual(embarcadero);
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
it('La Caleta se pasea por los bordes de los vasos y sus caminos sin meterse en el agua', () => {
  const pisa = (x: number, z: number) => transitable(x, z, 'la-caleta');
  // Bordes de los tres vasos, del lado de la plataforma.
  for (const [x, z] of [
    [0.5, 4.4], // vaso alto, por el oeste
    [9.1, 8.5], // y por el este, bajo el mirador
    [-4.1, 17.5], // vaso grande de abajo
    [-1.5, 19.6],
    [5.9, 12.3], // vaso pequeño
  ])
    expect(pisa(x, z)).toBe(true);
  // El agua de cada vaso y el mar no se pisan.
  for (const vaso of VASOS) {
    const cx = vaso.reduce((s, [x]) => s + x, 0) / vaso.length,
      cz = vaso.reduce((s, [, z]) => s + z, 0) / vaso.length;
    expect(pisa(cx, cz)).toBe(false);
  }
  expect(pisa(0, 30)).toBe(false);
  expect(pisa(20, 14)).toBe(false);
  // Caminos: aparcamiento, carretera, mirador, paseo de la orilla, barandilla y escalera al mar.
  for (const [x, z] of [
    [-19, 9.5],
    [0, -9.8],
    [11.6, 4],
    [14.5, 4.5],
    [22, 10.4],
    [33.4, 7],
    [-6.6, 22.2],
  ])
    expect(pisa(x, z)).toBe(true);
  expect(pisa(-9.7, 8.5)).toBe(false); // jardinera
  expect(alturaPaseo(0.5, 4.4, 'la-caleta')).toBeGreaterThan(alturaPaseo(-1.5, 19.6, 'la-caleta'));
  expect(alturaPaseo(11.6, 4, 'la-caleta')).toBeGreaterThan(1.5); // azotea del mirador
  // Desde el inicio se llega a cada rincón sin salirse de lo pisable.
  for (const rincon of PUEBLOS['la-caleta'].rincones) {
    let desde = inicio('la-caleta');
    const ruta = rutaPuerto(desde, rincon, 'la-caleta');
    expect(ruta.at(-1)).toEqual(rincon);
    for (const p of ruta) {
      for (let i = 0; i <= 50; i++)
        expect(pisa(desde.x + ((p.x - desde.x) * i) / 50, desde.z + ((p.z - desde.z) * i) / 50)).toBe(true);
      desde = p;
    }
  }
});
it('da acceso a la salida de la habitación y al ferry de regreso', () => {
  expect(sueloInterior(0, 2.7)).toBe(true);
  expect(sueloInterior(2.7, -0.6)).toBe(false);
  expect(destinosDesde('gc-agaete').some((d) => d.terminal.id === 'tf-santa-cruz')).toBe(true);
  expect(destinosDesde('tf-santa-cruz').some((d) => d.terminal.id === 'gc-agaete')).toBe(true);
});
