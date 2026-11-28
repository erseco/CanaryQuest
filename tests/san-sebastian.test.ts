import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, muelle, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'san-sebastian');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'san-sebastian');

describe('San Sebastián de La Gomera', () => {
  it('se pisan las plazas, la calle Real, la playa y los muelles, no el agua ni los monumentos', () => {
    expect(pisa(0, 0)).toBe(true); // plaza de las Américas
    expect(pisa(0.7, -10.5)).toBe(true); // plaza de la Constitución
    expect(pisa(-8.25, -20)).toBe(true); // calle Real
    expect(pisa(-20, 2)).toBe(true); // parque de la Torre del Conde
    expect(pisa(-10, 11)).toBe(true); // arena de la playa
    expect(pisa(30, 6)).toBe(true); // explanada del puerto
    expect(pisa(24, 40)).toBe(true); // dique del ferry
    expect(pisa(-17.5, -3.4)).toBe(false); // la Torre del Conde
    expect(pisa(-1.4, -9.2)).toBe(false); // un laurel
    expect(pisa(-5, -9.4)).toBe(false); // la Casa de la Aduana
    expect(pisa(0, -18)).toBe(false); // la iglesia
    expect(pisa(10, 12)).toBe(false); // agua de la marina
    expect(pisa(19.4, 32)).toBe(false); // el ferry amarrado
    expect(pisa(-10, 16)).toBe(false); // la bahía
    expect(pisa(31, 14)).toBe(false); // la estación marítima
    expect(pisa(1.6, 10)).toBe(false); // el muro entre la playa y la marina
  });

  it('la arena baja hacia el agua', () => {
    expect(alto(-10, 13)).toBeLessThan(alto(-10, 7) - 0.5);
    expect(alto(-10, 13)).toBeGreaterThan(-0.84); // sin meterse bajo el agua
  });

  it('del inicio se llega a pie a cada rincón y al ferry, rodeando la marina', () => {
    const { rincones } = PUEBLOS['san-sebastian'];
    for (const r of rincones) expect(rutaPuerto(inicio('san-sebastian'), r, 'san-sebastian').at(-1)).toEqual(r);
    const alFerry = rutaPuerto(inicio('san-sebastian'), muelle('san-sebastian'), 'san-sebastian');
    expect(alFerry.at(-1)).toEqual(muelle('san-sebastian'));
    // De la plaza al dique se va por el paseo, a lo largo del borde norte de la marina.
    expect(alFerry.every((p) => p.x < 3.4 || p.x > 21 || p.z < 6.6)).toBe(true);
  });
});
