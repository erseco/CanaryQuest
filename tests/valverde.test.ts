import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'valverde');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'valverde');

describe('Valverde', () => {
  it('se pisan las calles y las plazas, no las casas ni el barranco', () => {
    expect(pisa(-2, -3)).toBe(true); // atrio de la iglesia
    expect(pisa(-4.5, 6.5)).toBe(true); // plaza del Ayuntamiento
    expect(pisa(16, 1.8)).toBe(true); // paseo del mirador
    expect(pisa(-14.2, -20)).toBe(true); // calle principal, abajo
    expect(pisa(-1.75, -14)).toBe(true); // callejón
    expect(pisa(-22, 15.7)).toBe(true); // calle de las Quinteras
    expect(pisa(8, -3)).toBe(false); // iglesia
    expect(pisa(2.95, -3)).toBe(false); // su torre
    expect(pisa(-5, 12.7)).toBe(false); // Ayuntamiento
    expect(pisa(-9.55, -7.6)).toBe(false); // Cabildo
    expect(pisa(-32, 9.2)).toBe(false); // Casa de las Quinteras
    expect(pisa(-18.2, 0)).toBe(false); // casas de la calle principal
    expect(pisa(-4.5, -7.4)).toBe(false); // laurel del atrio
    expect(pisa(25, 0)).toBe(false); // el barranco
  });

  it('las calles suben al sur y al oeste, en cuesta y sin escalones bruscos', () => {
    expect(alto(-14.2, -20)).toBeLessThan(alto(-14.2, -4) - 2); // la calle principal baja hacia El Cabo
    expect(alto(-14.2, 13)).toBeGreaterThan(2); // y sube hacia el sur
    expect(alto(-32, 14)).toBeGreaterThan(alto(-17, 15.7) + 1.5); // las Quinteras quedan arriba
    expect(alto(-1.75, -16)).toBeLessThan(alto(-1.75, -10) - 1.5); // el callejón baja de la plaza
    // En los cruces entre calles el suelo casi no salta.
    for (const [x, z] of [
      [-12.5, -18.75], // calle baja y calle principal
      [-12.5, 7], // escalinata y calle principal
      [-16, 15.75], // cruce alto y calle de las Quinteras
      [-1.75, -9], // callejón y atrio
    ])
      expect(Math.abs(alto(x - 0.01, z - 0.01) - alto(x + 0.01, z + 0.01))).toBeLessThan(0.25);
  });

  it('se llega del inicio a cada rincón, y de la calle baja a las Quinteras subiendo', () => {
    const { rincones } = PUEBLOS.valverde;
    for (const r of rincones) expect(rutaPuerto(inicio('valverde'), r, 'valverde').at(-1)).toEqual(r);
    const quinteras = rincones.find((r) => r.nombre === 'Casa de las Quinteras')!;
    const ruta = [{ x: -14.2, z: -22 }, ...rutaPuerto({ x: -14.2, z: -22 }, quinteras, 'valverde')];
    expect(ruta.at(-1)).toEqual(quinteras);
    expect(ruta.some((p) => p.z >= 14 && p.x >= -16)).toBe(true); // tuerce en el cruce alto
    // Cada tramo gana altura: no hay atajo por el que se baje para volver a subir.
    for (let i = 1; i < ruta.length; i++)
      expect(alto(ruta[i].x, ruta[i].z)).toBeGreaterThanOrEqual(alto(ruta[i - 1].x, ruta[i - 1].z) - 0.05);
    expect(alto(quinteras.x, quinteras.z) - alto(-14.2, -22)).toBeGreaterThan(7);
  });
});
