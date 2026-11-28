import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'aridane');

describe('Valle de Aridane', () => {
  it('se pisan la plaza, las calles y los miradores; no la iglesia, el Ayuntamiento ni los laureles', () => {
    expect(pisa(-2, 0)).toBe(true); // plaza de España
    expect(pisa(-10.5, -25)).toBe(true); // calle Real hacia poniente
    expect(pisa(-7.5, 30)).toBe(true); // calle Real hacia levante
    expect(pisa(-8, -36)).toBe(true); // mirador del valle
    expect(pisa(-18, 36)).toBe(true); // mirador de Tajogaite
    expect(pisa(18, -11)).toBe(true); // calle de la Iglesia
    expect(pisa(11, 0)).toBe(false); // iglesia
    expect(pisa(9.6, 10)).toBe(false); // su torre
    expect(pisa(-16, 0)).toBe(false); // Ayuntamiento
    expect(pisa(-6.6, -1.2)).toBe(false); // tronco de un laurel
    expect(pisa(-8, -45)).toBe(false); // más allá del pretil, las plataneras
  });

  it('se llega del inicio a cada rincón', () => {
    for (const r of PUEBLOS.aridane.rincones) expect(rutaPuerto(inicio('aridane'), r, 'aridane').at(-1)).toEqual(r);
  });
});
