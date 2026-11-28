import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';
import { TERRAZA } from '../src/puerto/sitios/dunas-plano';

const pisa = (x: number, z: number) => transitable(x, z, 'dunas');
const alto = (x: number, z: number) => alturaPaseo(x, z, 'dunas');

describe('Dunas de Maspalomas', () => {
  it('se pisan las calles, el paseo, las dunas y la playa; no el mar, la Charca ni las manzanas', () => {
    for (const [x, z] of [
      [7.6, -30], // avenida de Tirajana
      [15, -37.5], // avenida de Francia, ante el CITA
      [21, -30], // avenida de Alemania
      [7.6, -11], // pasaje del Riu
      [8, -5], // Mirador de las Dunas
      [21.6, -22.6], // Paseo Costa Canaria
      [14, 8], // dunas
      [5, 25.6], // playa de Maspalomas
      [44.5, -14], // playa del Inglés
      [-24.6, 19.5], // orilla de la Charca
      [-41, 14], // palmeral
      [-50, 25], // plaza del faro
    ])
      expect(pisa(x, z), `${x}, ${z}`).toBe(true);
    for (const [x, z] of [
      [0, 34], // mar, frente a la playa de Maspalomas
      [53, -10], // mar, frente a la playa del Inglés
      [-30.5, 17], // agua de la Charca
      [-43, 28], // torre del faro
      [7.6, -37.6], // isleta de la rotonda
      [15, -43], // dentro del CITA
      [2, -28], // manzana al oeste de Tirajana
      [-20, -30], // campo de golf
    ])
      expect(pisa(x, z), `${x}, ${z}`).toBe(false);
  });

  it('la terraza queda por encima de las dunas, y la escalera del mirador baja sin saltos', () => {
    expect(alto(7.6, -30)).toBeCloseTo(TERRAZA);
    expect(alto(8, -5)).toBeCloseTo(TERRAZA);
    expect(alto(8, 3)).toBeLessThan(TERRAZA - 1);
    for (let z = -6; z < 2; z += 0.1) expect(Math.abs(alto(8, z + 0.1) - alto(8, z))).toBeLessThan(0.35);
    expect(alto(5, 27)).toBeLessThan(0); // la arena baja al mar
    // Las dunas suben y bajan: entre el mirador y la playa hay crestas de más de dos unidades.
    const perfil = Array.from({ length: 60 }, (_, i) => alto(14, -2 + i * 0.4));
    expect(Math.max(...perfil) - Math.min(...perfil)).toBeGreaterThan(2);
  });

  it('se llega a cada rincón y al rastro de las cabras desde el mirador', () => {
    const { rincones, rastro } = PUEBLOS.dunas;
    for (const destino of [...rincones, rastro!]) {
      let desde = inicio('dunas');
      const ruta = rutaPuerto(desde, destino, 'dunas');
      expect(ruta.at(-1), destino.nombre).toEqual(destino);
      for (const p of ruta) {
        for (let i = 0; i <= 50; i++)
          expect(pisa(desde.x + ((p.x - desde.x) * i) / 50, desde.z + ((p.z - desde.z) * i) / 50)).toBe(true);
        desde = p;
      }
    }
  }, 60_000);
});
