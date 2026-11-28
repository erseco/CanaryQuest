import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'cofete');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'cofete');

describe('Cofete y la Casa Winter', () => {
  it('se pisan la playa, las pistas, la explanada y el patio, no la casa, la torre ni el mar', () => {
    expect(pisa(-14, 15.5)).toBe(true); // playa
    expect(pisa(12, -2)).toBe(true); // calle del caserío
    expect(pisa(-18, -6.4)).toBe(true); // explanada bajo la fachada
    expect(pisa(-18, -16)).toBe(true); // patio
    expect(pisa(-12.5, -17.5)).toBe(true); // zaguán
    expect(pisa(36.5, -3.5)).toBe(true); // degollada de Agua Oveja
    expect(pisa(-18, -12)).toBe(false); // ala delantera de la casa
    expect(pisa(-26.2, -10.6)).toBe(false); // torre
    expect(pisa(11, 11.75)).toBe(false); // dentro del cementerio
    expect(pisa(0, 21)).toBe(false); // el mar
  });

  it('la casa queda en alto sobre el caserío, y el caserío sobre la playa', () => {
    expect(alto(-18, -16)).toBeGreaterThan(alto(12, -2) + 3);
    expect(alto(12, -2)).toBeGreaterThan(alto(-14, 15.5) + 2);
    expect(alto(-14, 17)).toBeGreaterThan(-0.84); // la arena pisable sigue fuera del agua
    // En las juntas entre pistas el suelo no salta.
    for (const [x, z] of [
      [6, 9], // pista de la playa y arena
      [4, -2], // calle y pista de la casa
      [-6, -2], // pista y rellano
      [-8, -16], // rampa y era
      [-14.5, -17.5], // zaguán y patio
      [34, -2], // pista de Morro Jable y mirador
    ])
      expect(Math.abs(alto(x - 0.01, z - 0.01) - alto(x + 0.01, z + 0.01))).toBeLessThan(0.25);
  });

  it('desde la pista de Morro Jable se llega a la casa entrando por el arco del zaguán', () => {
    const { carretera, rincones } = PUEBLOS.cofete;
    for (const r of rincones) expect(rutaPuerto(inicio('cofete'), r, 'cofete').at(-1)).toEqual(r);
    const patio = rincones.find((r) => r.nombre === 'Patio de la casa')!;
    const ruta = rutaPuerto(carretera!, patio, 'cofete');
    expect(ruta.at(-1)).toEqual(patio);
    // Algún tramo del camino cruza el zaguán: no hay otra entrada al patio.
    const puntos = [carretera!, ...ruta];
    const cruza = puntos.slice(1).some((b, i) => {
      const a = puntos[i];
      return Array.from({ length: 51 }, (_, k) => k / 50).some((t) => {
        const x = a.x + (b.x - a.x) * t,
          z = a.z + (b.z - a.z) * t;
        return x > -14.4 && x < -10.6 && z > -18.2 && z < -16.8;
      });
    });
    expect(cruza).toBe(true);
  });
});
