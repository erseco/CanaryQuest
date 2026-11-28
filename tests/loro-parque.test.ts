import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'loro-parque');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'loro-parque');

describe('Loro Parque', () => {
  it('se pisan la explanada, el pabellón y los paseos, no los estanques ni las gradas', () => {
    expect(pisa(43.5, 5.5)).toBe(true); // explanada
    expect(pisa(34, 5)).toBe(true); // paso del pabellón
    expect(pisa(0, 11.5)).toBe(true); // paseo norte
    expect(pisa(-25.5, -3.5)).toBe(true); // paseo sur, ante las gradas de las orcas
    expect(pisa(44, 9.8)).toBe(false); // fuente
    expect(pisa(34, 2.2)).toBe(false); // taquillas
    expect(pisa(-25.5, 4)).toBe(false); // Orca Ocean
    expect(pisa(-11.3, 4)).toBe(false); // delfinario
    expect(pisa(5.5, 4)).toBe(false); // Isla del Tigre y su foso
    expect(pisa(17, 4.2)).toBe(false); // estanque de las carpas
    expect(pisa(-25.5, -8)).toBe(false); // gradas
    expect(pisa(6.5, -12.8)).toBe(false); // Planet Penguin
    expect(pisa(34, -10)).toBe(false); // gorilas
    expect(pisa(40, -1)).toBe(false); // tapia entre la explanada y el paseo sur
  });

  it('el pabellón queda sobre su podio y se sube y baja por escalinatas suaves', () => {
    expect(alto(34, 5)).toBeCloseTo(0.4);
    expect(alto(43.5, 5.5)).toBe(0);
    expect(alto(26, 5)).toBe(0);
    for (const x of [38, 39.6, 28.4, 30])
      expect(Math.abs(alto(x - 0.01, 5) - alto(x + 0.01, 5))).toBeLessThan(0.05);
  });

  it('desde la explanada se entra al parque cruzando el pabellón', () => {
    const { rincones } = PUEBLOS['loro-parque'];
    const orcas = rincones.find((r) => r.nombre === 'Orca Ocean')!;
    const ruta = [inicio('loro-parque'), ...rutaPuerto(inicio('loro-parque'), orcas, 'loro-parque')];
    expect(ruta.at(-1)).toEqual(orcas);
    // Algún tramo pasa por el podio del pabellón: no hay otra puerta.
    const pasa = ruta.some((p, i) => {
      if (!i) return false;
      const a = ruta[i - 1];
      return [0.25, 0.5, 0.75].some((t) => alto(a.x + (p.x - a.x) * t, a.z + (p.z - a.z) * t) > 0.3);
    });
    expect(pasa).toBe(true);
  });
});
