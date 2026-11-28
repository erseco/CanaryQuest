import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'yaiza');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'yaiza');

describe('Yaiza', () => {
  it('se pisan la plaza, las calles y el patio, no los edificios ni los parterres', () => {
    expect(pisa(0, 4)).toBe(true); // plaza de los Remedios
    expect(pisa(-20, -2.6)).toBe(true); // calle Vista de Yaiza
    expect(pisa(14, 4)).toBe(true); // calle ante la iglesia
    expect(pisa(-19.7, 9)).toBe(true); // patio de la casa natal
    expect(pisa(44, -2.2)).toBe(true); // cruce de la carretera de Timanfaya
    expect(pisa(44, -10)).toBe(false); // que sigue al norte entre las casas, sin pisarse
    expect(pisa(20.7, 4.3)).toBe(false); // iglesia
    expect(pisa(-15.1, 6.8)).toBe(false); // Casa de la Cultura
    expect(pisa(38.9, 4.5)).toBe(false); // Ayuntamiento
    expect(pisa(0, 6.7)).toBe(false); // parterre central
    expect(pisa(31.7, 2)).toBe(false); // palmera del jardín del Ayuntamiento
    expect(pisa(0, -8)).toBe(false); // casas de la acera norte
    expect(pisa(2, 21)).toBe(false); // jardín de picón
  });

  it('a la plaza, más alta que la calle, solo se sube por sus escalones', () => {
    expect(alto(0, 4)).toBeCloseTo(0.4);
    expect(alto(-20, -2.6)).toBe(0);
    expect(pisa(-8, 0)).toBe(false); // entre la calle y la plaza hay murete
    expect(pisa(0, 0)).toBe(true); // salvo en los escalones
    const ruta = rutaPuerto({ x: -8, z: -2.6 }, { x: -8, z: 5 }, 'yaiza');
    expect(ruta.at(-1)).toEqual({ x: -8, z: 5 });
    expect(ruta.some((p) => Math.abs(p.x) <= 1.9)).toBe(true); // rodea hasta los escalones
  });

  it('se llega del inicio a cada rincón', () => {
    for (const r of PUEBLOS.yaiza.rincones) expect(rutaPuerto(inicio('yaiza'), r, 'yaiza').at(-1)).toEqual(r);
  });
});
