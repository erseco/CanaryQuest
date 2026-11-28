import { describe, expect, it } from 'vitest';
import { PUEBLOS } from '../src/data/pueblos';
import { alturaPaseo, inicio, rutaPuerto, transitable } from '../src/puerto/paseo';
import {
  ARENA,
  CASTILLO,
  COFRADIA,
  KIOSCOS,
  KIOSCO,
  LARGO,
  ORILLA,
  ROMPEOLAS,
  enBorde,
  enMuelle,
  enPlaya,
  muestrear,
} from '../src/puerto/sitios/teresitas-plano';

const pueblo = 'las-teresitas';
const pisa = (x: number, z: number) => transitable(x, z, pueblo);
const alto = (x: number, z: number) => alturaPaseo(x, z, pueblo);
const playa = (s: number, d: number) => pisa(...enPlaya(s, d));

describe('Playa de Las Teresitas', () => {
  it('se pisan el paseo, la arena, el muelle y San Andrés; no el agua, los kioscos ni el castillo', () => {
    for (const s of [2, 10, 20, 31, 45, 55, LARGO - 1]) {
      expect(playa(s, -1.5), `paseo en ${s}`).toBe(true);
      expect(playa(s, 4.5), `arena en ${s}`).toBe(true);
      expect(playa(s, ORILLA + 1), `agua en ${s}`).toBe(false);
      expect(playa(s, -6), `carretera en ${s}`).toBe(false);
    }
    for (const s of KIOSCOS) expect(playa(s, KIOSCO.d)).toBe(false);
    expect(pisa(...enMuelle(8))).toBe(true);
    expect(pisa(-35.3, 14.5)).toBe(true); // pasarela sobre la boca del barranco
    expect(pisa(-35.3, 8)).toBe(false); // el cauce
    expect(pisa(-56, 15.2)).toBe(true); // avenida de San Andrés
    expect(pisa(-59.7, -10)).toBe(true); // calle que sube
    expect(pisa(CASTILLO.x, CASTILLO.z)).toBe(false);
    expect(pisa((COFRADIA[0] + COFRADIA[2]) / 2, (COFRADIA[1] + COFRADIA[3]) / 2)).toBe(false);
    expect(pisa(-56.9, 4.6)).toBe(false); // una casa de la segunda fila
    expect(pisa(-55, 19)).toBe(false); // el mar frente a la avenida
  });

  it('la arena baja hacia la orilla y las calles del pueblo suben hacia la montaña', () => {
    for (const s of [8, 30, 52]) {
      expect(alto(...enPlaya(s, 0.5))).toBeGreaterThan(alto(...enPlaya(s, ARENA - 0.3)) + 0.4);
      expect(alto(...enPlaya(s, -1.5))).toBe(0);
    }
    expect(alto(-50.5, -12)).toBeGreaterThan(1.5);
    expect(alto(-50.5, 5)).toBe(0);
    // Entre las columnas de arena el suelo no da saltos.
    for (let s = 1; s < LARGO - 1; s += 0.7) {
      const [x, z] = enPlaya(s, 3);
      expect(Math.abs(alto(x - 0.05, z) - alto(x + 0.05, z)), `s = ${s}`).toBeLessThan(0.12);
    }
  });

  it('el rompeolas corre por el agua, paralelo a la orilla, con una boca abierta en cada punta', () => {
    for (const p of muestrear(ROMPEOLAS, 1)) {
      const [d] = enBorde(p.x, p.z);
      expect(d).toBeGreaterThan(ORILLA + 4);
      expect(d).toBeLessThan(ORILLA + 12);
    }
    const [sw] = ROMPEOLAS,
      ne = ROMPEOLAS[ROMPEOLAS.length - 1];
    expect(Math.hypot(sw[0] - enMuelle(9.8)[0], sw[1] - enMuelle(9.8)[1])).toBeGreaterThan(2.5);
    expect(Math.hypot(ne[0] - 24.7, ne[1] - 17.4)).toBeGreaterThan(2.5); // punta del espigón de los Órganos
  });

  it('del inicio se llega al castillo cruzando la pasarela del barranco', () => {
    const castillo = PUEBLOS[pueblo].rincones.find((r) => r.nombre === 'Castillo de San Andrés')!;
    const ruta = [inicio(pueblo), ...rutaPuerto(inicio(pueblo), castillo, pueblo)];
    expect(ruta.at(-1)).toEqual(castillo);
    // Algún tramo pasa del lado de la playa (x > −33) al del pueblo (x < −37) por la pasarela.
    const cruce = ruta.findIndex((p, i) => i > 0 && ruta[i - 1].x > -33.2 && p.x < -33.2);
    expect(cruce).toBeGreaterThan(0);
    for (let k = 0; k <= 20; k++) {
      const a = ruta[cruce - 1],
        b = ruta[cruce],
        t = k / 20;
      const x = a.x + (b.x - a.x) * t,
        z = a.z + (b.z - a.z) * t;
      if (x < -33.2 && x > -37.4) expect(z).toBeGreaterThanOrEqual(13.5);
    }
  });
});
