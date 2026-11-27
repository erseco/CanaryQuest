import * as T from 'three';
import { PUEBLOS, type Pueblo, type Suelo } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Taller } from '../maqueta';

/**
 * Terreno facetado que se amolda a los suelos pisables de un lugar: junto a una pista o una
 * explanada toma su altura y, al alejarse, vuelve a la ladera natural. Así los caminos quedan
 * encajados en la lava, en desmonte o en terraplén, sin modelar cada talud a mano.
 * Devuelve la altura resultante, para apoyar rocas y matorral.
 */
export function terreno(
  t: Taller,
  pueblo: Pueblo,
  [x0, z0, x1, z1]: [number, number, number, number],
  ladera: (x: number, z: number) => number,
  material: T.MeshStandardMaterial,
  paso = 1.3,
): (x: number, z: number) => number {
  const suelos = PUEBLOS[pueblo].plano.suelos ?? [];
  const altura = (x: number, z: number): number => {
    let cerca = Infinity,
      camino = 0;
    for (const { r } of suelos) {
      const cx = Math.min(Math.max(x, r[0]), r[2]),
        cz = Math.min(Math.max(z, r[1]), r[3]),
        d = Math.hypot(x - cx, z - cz);
      if (d < cerca) {
        cerca = d;
        camino = alturaPaseo(cx, cz, pueblo);
      }
    }
    // Llano hasta casi un metro del borde, para que la lava no asome sobre la pista.
    const k = Math.min(1, Math.max(0, cerca - 0.9) / 3.5),
      suave = k * k * (3 - 2 * k);
    return (camino - 0.1) * (1 - suave) + ladera(x, z) * suave;
  };
  const nx = Math.ceil((x1 - x0) / paso),
    nz = Math.ceil((z1 - z0) / paso),
    fila = nx + 1;
  const px: number[] = [],
    py: number[] = [],
    pz: number[] = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (i + (t.azar() - 0.5) * 0.6) * paso,
        z = z0 + (j + (t.azar() - 0.5) * 0.6) * paso;
      px.push(x);
      pz.push(z);
      py.push(altura(x, z));
    }
  const vertices: number[] = [];
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * fila + i,
        b = a + 1,
        c = a + fila,
        d = c + 1;
      for (const n of (i + j) % 2 ? [a, c, b, b, c, d] : [a, c, d, a, d, b])
        vertices.push(px[n], py[n], pz[n]);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  t.superficie(geo, material, 0, 0, 0, 1, 1, 1, 6);
  geo.dispose();
  return altura;
}

/** Firme de un suelo pisable: una losa plana o inclinada según su rampa. */
export function losa(t: Taller, s: Suelo, color: string, margen = 0): void {
  const [x0, z0, x1, z1] = s.r,
    y0 = s.y ?? 0,
    y1 = s.y2 ?? y0;
  const x = (x0 + x1) / 2,
    y = (y0 + y1) / 2 - 0.06,
    z = (z0 + z1) / 2;
  if (s.eje === 'x')
    t.pieza(t.formas.caja, color, x, y, z, Math.hypot(x1 - x0, y1 - y0) + margen, 0.12, z1 - z0 + margen, 0, 0, Math.atan2(y1 - y0, x1 - x0));
  else
    t.pieza(t.formas.caja, color, x, y, z, x1 - x0 + margen, 0.12, Math.hypot(z1 - z0, y1 - y0) + margen, Math.atan2(y0 - y1, z1 - z0));
}
