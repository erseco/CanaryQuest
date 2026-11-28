import { expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, rutaPuerto, transitable, umbral } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'isleta');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'isleta');

it('La Isleta sube del puerto a la calle alta sin pisar el agua ni el castillo', () => {
  expect(pisa(3, 25)).toBe(true); // muelle de los pesqueros
  expect(pisa(-10, 10)).toBe(true); // avenida
  expect(pisa(-7.5, 0)).toBe(true); // jardín del castillo
  expect(pisa(-18, 3)).toBe(true); // plaza de la iglesia
  expect(pisa(-20, -9.25)).toBe(true); // Juan Rejón
  expect(pisa(-10, -19.25)).toBe(true); // La Naval
  expect(pisa(-10, -29.75)).toBe(true); // calle alta
  expect(pisa(-39, -30)).toBe(true); // mirador de El Confital
  expect(pisa(0, -1)).toBe(false); // el castillo
  expect(pisa(11, -2)).toBe(false); // el edificio de la fundación
  expect(pisa(10, 20)).toBe(false); // agua de la dársena
  expect(pisa(-10, -14)).toBe(false); // una manzana de casas
  expect(pisa(-45, -20)).toBe(false); // el mar de poniente
  // Las calles suben por plantas: Juan Rejón, La Naval y la calle alta.
  expect(alto(-10, -9.25)).toBe(0);
  expect(alto(-10, -19.25)).toBeCloseTo(2.2);
  expect(alto(-10, -29.75)).toBeCloseTo(5.4);
  expect(alto(-1.25, -14)).toBeGreaterThan(0.5); // la cuesta de la calle del medio
  expect(alto(-1.25, -24)).toBeGreaterThan(alto(-1.25, -21)); // y su escalera
});

it('Desde el puerto se llega al mirador de El Confital subiendo por el barrio', () => {
  const { inicio, rincones } = PUEBLOS.isleta;
  const mirador = rincones.find((r) => r.nombre === 'Mirador de El Confital')!;
  const ruta = rutaPuerto(inicio!, mirador, 'isleta');
  expect(ruta.at(-1)).toEqual(mirador);
  expect(ruta.some((p) => alto(p.x, p.z) > 5)).toBe(true);
});

it('La Chistera abre a Juan Rejón y dentro espera el cómico', () => {
  const chistera = PUEBLOS.isleta.casas.find((c) => c.nombre === 'La Chistera')!;
  expect(chistera.anfitrion?.npc).toBe('comico');
  const puerta = umbral(chistera);
  expect(pisa(puerta.x, puerta.z)).toBe(true);
  expect(alto(puerta.x, puerta.z)).toBe(0);
});
