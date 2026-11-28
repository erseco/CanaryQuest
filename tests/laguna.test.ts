import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { inicio, rutaPuerto, transitable } from '../src/puerto/paseo';

const pisa = (x: number, z: number) => transitable(x, z, 'la-laguna');

describe('San Cristóbal de La Laguna', () => {
  it('se pisan las calles y las plazas, no los edificios', () => {
    expect(pisa(0, 20)).toBe(true); // La Carrera
    expect(pisa(4.7, 58)).toBe(true); // plaza del Adelantado
    expect(pisa(20, 0)).toBe(true); // calle San Agustín
    expect(pisa(-13.4, 10)).toBe(true); // calle Herradores
    expect(pisa(-13.7, -32)).toBe(true); // plaza del Doctor Olivera
    expect(pisa(4.7, 53)).toBe(false); // la fuente
    expect(pisa(8, 12)).toBe(false); // catedral
    expect(pisa(-6, -36)).toBe(false); // iglesia de la Concepción
    expect(pisa(-1.9, -45.1)).toBe(false); // su torre
    expect(pisa(5.5, 35)).toBe(false); // convento de Santa Catalina
    expect(pisa(-6.7, 39.5)).toBe(false); // Ayuntamiento
  });

  it('La Carrera lleva de la plaza del Adelantado a la torre de la Concepción', () => {
    const { rincones } = PUEBLOS['la-laguna'];
    const torre = rincones.find((r) => r.nombre === 'Torre de la Concepción')!;
    const ruta = rutaPuerto(inicio('la-laguna'), torre, 'la-laguna');
    expect(ruta.at(-1)).toEqual(torre);
    // Va derecha por la calle: no se desvía a las paralelas.
    expect(ruta.every((p) => p.x > -1.5 && p.x < 8)).toBe(true);
  });
});
