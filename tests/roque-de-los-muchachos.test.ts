import laPalma from '../public/assets/maps/islas/la-palma.tmj?raw';
import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { MISIONES } from '../src/data/misiones';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const LUGAR = 'roque-de-los-muchachos';
const pisa = (x: number, z: number) => transitable(x, z, LUGAR);
const alto = (x: number, z: number) => alturaPaseo(x, z, LUGAR);

describe('Roque de los Muchachos', () => {
  it('se pisan el mirador, el sendero, el aparcamiento y las carreteras, no las cúpulas ni la Caldera', () => {
    expect(pisa(0, 0)).toBe(true); // mirador de la cumbre
    expect(pisa(3.5, -2.5)).toBe(true); // sendero
    expect(pisa(7, -5)).toBe(true); // aparcamiento
    expect(pisa(6.5, -20)).toBe(true); // carretera del oeste
    expect(pisa(8, -40)).toBe(true); // explanada del GTC
    expect(pisa(19.5, -4.5)).toBe(true); // explanada del Nordic
    expect(pisa(-8, 0)).toBe(false); // el vacío de la Caldera
    expect(pisa(19.5, -38)).toBe(false); // cúpula del GTC
    expect(pisa(12, -21)).toBe(false); // Galileo
    expect(pisa(4.9, 2.3)).toBe(false); // el roque más alto
    expect(pisa(9.4, -7.7)).toBe(false); // un coche aparcado
  });

  it('la cumbre queda arriba y las carreteras bajan sin escalones', () => {
    expect(alto(0, 0)).toBeGreaterThan(alto(7, -5) + 1); // el mirador, sobre el aparcamiento
    expect(alto(6.5, -29)).toBeLessThan(alto(6.5, -10) - 1); // la carretera baja hacia el GTC
    for (const [x, z] of [
      [2, -2.5], // mirador y sendero
      [5, -2.5], // sendero y aparcamiento
      [6.5, -9], // aparcamiento y carretera del oeste
      [6.5, -30], // carretera y explanada del GTC
      [12, -4.5], // aparcamiento y carretera del Nordic
      [18, -4.5], // carretera y explanada del Nordic
    ])
      expect(Math.abs(alto(x - 0.01, z - 0.01) - alto(x + 0.01, z + 0.01))).toBeLessThan(0.1);
  });

  it('se llega del mirador a cada rincón, y la cumbre y el GTC cierran la misión de la lente', () => {
    const { rincones } = PUEBLOS[LUGAR];
    for (const r of rincones) expect(rutaPuerto(inicio(LUGAR), r, LUGAR).at(-1)).toEqual(r);
    const final = MISIONES['lente-del-observatorio'].pasos.at(-1);
    expect(final).toEqual({ tipo: 'llegar', poi: LUGAR });
    const avisan = rincones.filter((r) => r.llegar === LUGAR).map((r) => r.nombre);
    expect(avisan).toEqual(['Roque de los Muchachos', 'Gran Telescopio Canarias']);
  });

  it('tiene su entrada en el mapa de La Palma, lejos de la Caldera', () => {
    const mapa = JSON.parse(laPalma);
    const pois = mapa.layers.find((l: { name: string }) => l.name === 'pois').objects;
    const roque = pois.find((p: { name: string }) => p.name === LUGAR);
    const caldera = pois.find((p: { name: string }) => p.name === 'caldera');
    expect(roque).toMatchObject({ id: 7, type: 'entrada' });
    expect(mapa.nextobjectid).toBeGreaterThan(7);
    // Dos radios de aviso (48 px) de distancia: no se solapan al acercarse.
    expect(Math.hypot(roque.x - caldera.x, roque.y - caldera.y)).toBeGreaterThan(96);
  });
});
