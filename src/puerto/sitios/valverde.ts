import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa, terreno } from './terreno';
import type { Suelo } from '../../data/pueblos';

/** Hacia dónde mira una fachada; el norte es −z. */
type Frente = 'n' | 's' | 'e' | 'o';
type Rect = [number, number, number, number];
const NORMAL: Record<Frente, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] };

interface Vivienda {
  x: number;
  z: number;
  /** Ancho de la fachada y fondo de la casa. */
  w: number;
  d: number;
  h: number;
  /** Altura del suelo ante la puerta. */
  base: number;
  frente: Frente;
  /** Color de la carpintería: verde o madera. */
  tinte: string;
  piedra?: boolean;
  azotea?: boolean;
  balcon?: boolean;
  farol?: boolean;
}

/**
 * Valverde (El Hierro), la capital de interior, trazada sobre la ortofoto PNOA y OpenStreetMap y
 * comprimida a escala de maqueta. La ladera sube hacia el suroeste y cae al nordeste, hacia el mar
 * lejano: la calle principal sube de norte a sur, la iglesia de la Concepción y su plaza se asoman
 * al barranco por el este, frente al Ayuntamiento, y la calle de las Quinteras trepa hacia el oeste.
 * Las calles pisables y sus cuestas están en `PUEBLOS.valverde.plano.suelos`; si se mueve una calle,
 * hay que mover allí su rectángulo.
 */
export function trazarValverde(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, basalto, teja } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const encalado = cal.clone();
  encalado.color.setRGB(1.4, 1.44, 1.52); // por encima de 1: la cal tira a blanco
  const mamposteria = tenido(adoquin, '#8e8984'),
    losas = tenido(adoquin, '#cfc8be'),
    tierra = tenido(basalto, '#8f8466');
  const suelos = PUEBLOS.valverde.plano.suelos!;
  const calle = (x: number, z: number) => alturaPaseo(x, z, 'valverde');
  const canteria = '#77716b',
    cornisa = '#eeeae0',
    blanco = '#f4f1ea';

  // Los muros encalados, los de piedra y los tejados se juntan en tres mallas, una por material.
  const muros: T.BufferGeometry[] = [],
    piedra: T.BufferGeometry[] = [],
    tejados: T.BufferGeometry[] = [];
  const bloque = (lista: T.BufferGeometry[], x: number, y: number, z: number, w: number, h: number, d: number) =>
    lista.push(new T.BoxGeometry(w, h, d).translate(x, y, z));
  /** Tejado a cuatro aguas, o a dos con los hastiales encalados. */
  function tejado(x: number, y: number, z: number, w: number, d: number, alto: number, aguas: 2 | 4 = 4) {
    const largo = w >= d,
      L = Math.max(w, d) / 2,
      S = Math.min(w, d) / 2,
      r = aguas === 2 ? L : L - S;
    const p = (l: number, h: number, s: number) => (largo ? [x + l, y + h, z + s] : [x + s, y + h, z + l]);
    const faldon = [
      ...[p(-L, 0, S), p(L, 0, S), p(r, alto, 0), p(-L, 0, S), p(r, alto, 0), p(-r, alto, 0)],
      ...[p(L, 0, -S), p(-L, 0, -S), p(-r, alto, 0), p(L, 0, -S), p(-r, alto, 0), p(r, alto, 0)],
    ];
    const testeros = [p(L, 0, S), p(L, 0, -S), p(r, alto, 0), p(-L, 0, -S), p(-L, 0, S), p(-r, alto, 0)];
    const geo = (puntos: number[][]) => {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(puntos.flat(), 3));
      g.computeVertexNormals();
      return g;
    };
    if (aguas === 4) tejados.push(geo([...faldon, ...testeros]));
    else {
      tejados.push(geo(faldon));
      muros.push(geo(testeros));
    }
  }
  function cocer(lista: T.BufferGeometry[], material: T.MeshStandardMaterial, escala: number) {
    const planas = lista.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      n.deleteAttribute('uv');
      if (n !== g) g.dispose();
      return n;
    });
    const geo = mergeGeometries(planas);
    superficie(geo, material, 0, 0, 0, 1, 1, 1, escala);
    for (const g of [...planas, geo]) g.dispose();
  }

  /** Piezas sobre una fachada: u corre a lo largo de ella, n hacia fuera, y desde el suelo. */
  function fachada(x: number, z: number, fondo: number, base: number, frente: Frente) {
    const [nx, nz] = NORMAL[frente];
    const donde = (u: number, n: number) => [x + nx * (fondo + n) + nz * u, z + nz * (fondo + n) - nx * u];
    return {
      giro: nx ? Math.PI / 2 : 0,
      donde,
      pieza(color: string, u: number, y: number, n: number, a: number, alto: number, b: number) {
        const [px, pz] = donde(u, n);
        pieza(caja, color, px, base + y, pz, nx ? b : a, alto, nx ? a : b);
      },
      luz(u: number, y: number, n: number, a: number, alto: number, b: number) {
        const [px, pz] = donde(u, n);
        ventanas.push([px, base + y, pz, nx ? b : a, alto, nx ? a : b]);
      },
      base,
    };
  }
  type Fachada = ReturnType<typeof fachada>;
  function ventana(f: Fachada, u: number, y: number, tinte: string, marco = cornisa) {
    f.pieza(marco, u, y, 0.02, 0.86, 1.12, 0.08);
    f.pieza(tinte, u, y, 0.05, 0.62, 0.9, 0.06);
    f.luz(u, y + 0.03, 0.09, 0.46, 0.72, 0.04);
    f.pieza(tinte, u, y + 0.03, 0.12, 0.04, 0.72, 0.02);
    // Postigos abiertos contra la pared, la estampa de la carpintería canaria.
    for (const s of [-1, 1]) f.pieza(tinte, u + s * 0.56, y + 0.02, 0.05, 0.26, 0.86, 0.05);
    f.pieza('#d6d0c4', u, y - 0.6, 0.1, 0.94, 0.09, 0.24);
  }
  function puerta(f: Fachada, u: number, tinte: string, marco = '#8a8178') {
    f.pieza(marco, u, 0.97, 0.02, 1.08, 1.98, 0.08);
    f.pieza(tinte, u, 0.88, 0.06, 0.8, 1.76, 0.06);
    f.pieza('#c9a85a', u + 0.26, 0.92, 0.1, 0.05, 0.05, 0.05);
  }
  /** Balcón canario de madera: piso volado, balaustres torneados, pies derechos y tejaroz. */
  function balcon(f: Fachada, u: number, y: number, ancho: number, tinte: string) {
    f.pieza(tinte, u, y + 1, 0.04, 0.8, 1.95, 0.06);
    f.luz(u, y + 1.15, 0.08, 0.52, 1.15, 0.04);
    f.pieza(madera, u, y, 0.4, ancho, 0.1, 0.8);
    f.pieza(madera, u, y + 0.9, 0.78, ancho, 0.07, 0.08);
    for (let a = -ancho / 2 + 0.12; a < ancho / 2 - 0.05; a += 0.19)
      f.pieza(madera, u + a, y + 0.46, 0.78, 0.05, 0.8, 0.05);
    for (const s of [-1, 1]) {
      f.pieza(madera, u + (s * ancho) / 2, y + 0.9, 0.4, 0.07, 0.07, 0.8);
      for (const n of [0.12, 0.42]) f.pieza(madera, u + (s * ancho) / 2, y + 0.46, n + 0.2, 0.05, 0.8, 0.05);
      f.pieza(madera, u + (s * (ancho - 0.06)) / 2, y + 1.05, 0.78, 0.08, 2.1, 0.08);
    }
    f.pieza('#5b3a24', u, y + 2.12, 0.44, ancho + 0.24, 0.09, 0.96);
  }
  function farol(f: Fachada, u: number) {
    f.pieza('#2b2b2b', u, 2.35, 0.16, 0.04, 0.04, 0.32);
    f.pieza('#2b2b2b', u, 2.32, 0.32, 0.22, 0.05, 0.22);
    f.luz(u, 2.16, 0.32, 0.15, 0.26, 0.15);
    f.pieza('#2b2b2b', u, 2.0, 0.32, 0.2, 0.04, 0.2);
  }
  /** Sillares de cantería en las esquinas, a soga y tizón. */
  function esquinas(x0: number, z0: number, x1: number, z1: number, y0: number, y1: number) {
    for (const [x, z, sx, sz] of [
      [x0, z0, 1, 1],
      [x1, z0, -1, 1],
      [x0, z1, 1, -1],
      [x1, z1, -1, -1],
    ])
      for (let k = 0, y = y0 + 0.17; y < y1 - 0.12; k++, y += 0.34) {
        const a = k % 2 ? 0.58 : 0.34,
          b = k % 2 ? 0.34 : 0.58;
        pieza(caja, canteria, x + sx * (a / 2 - 0.04), y, z + sz * (b / 2 - 0.04), a, 0.3, b);
      }
  }

  // --- Casas: encaladas, de teja, con carpintería verde o de madera y algún balcón ---
  const ocupado: Rect[] = suelos.map(({ r }) => [r[0] - 0.4, r[1] - 0.4, r[2] + 0.4, r[3] + 0.4]);
  const libre = ([a, b, c, d]: Rect) => !ocupado.some(([e, f, g, h]) => a < g && c > e && b < h && d > f);
  function vivienda(c: Vivienda) {
    const [nx] = NORMAL[c.frente];
    const sx = nx ? c.d : c.w,
      sz = nx ? c.w : c.d;
    ocupado.push([c.x - sx / 2, c.z - sz / 2, c.x + sx / 2, c.z + sz / 2]);
    bloque(c.piedra ? piedra : muros, c.x, c.base + (c.h - 3) / 2, c.z, sx, c.h + 3, sz);
    pieza(caja, '#867d73', c.x, c.base - 0.12, c.z, sx + 0.06, 0.84, sz + 0.06);
    pieza(caja, cornisa, c.x, c.base + c.h + 0.04, c.z, sx + 0.16, 0.12, sz + 0.16);
    if (c.azotea) {
      for (const s of [-1, 1]) {
        pieza(caja, cornisa, c.x, c.base + c.h + 0.3, c.z + (s * sz) / 2, sx + 0.1, 0.4, 0.12);
        pieza(caja, cornisa, c.x + (s * sx) / 2, c.base + c.h + 0.3, c.z, 0.12, 0.4, sz + 0.1);
      }
      pieza(caja, '#c9c0b2', c.x, c.base + c.h + 0.12, c.z, sx - 0.1, 0.06, sz - 0.1);
    } else tejado(c.x, c.base + c.h + 0.1, c.z, sx + 0.36, sz + 0.36, Math.min(sx, sz) * 0.3);
    const f = fachada(c.x, c.z, c.d / 2, c.base, c.frente);
    const ancha = c.w >= 3.4,
      huecos = ancha ? [-1.05, 1.05] : [0.7],
      entrada = ancha ? 0 : -0.7;
    puerta(f, entrada, c.tinte, c.piedra ? canteria : '#8a8178');
    for (const u of huecos) ventana(f, u, 1.2, c.tinte, c.piedra ? canteria : cornisa);
    if (c.farol) farol(f, entrada + (ancha ? 0.75 : -0.62));
    if (c.h >= 3.6) {
      const y = c.h - 1.25;
      if (c.balcon) balcon(f, ancha ? 0 : -0.55, y - 0.95, ancha ? 1.5 : 1.3, c.tinte);
      const altas = c.balcon ? (ancha ? [-1.2, 1.2] : [0.8]) : ancha ? [-1.05, 1.05] : [-0.7, 0.7];
      for (const u of altas) ventana(f, u, y, c.tinte);
    }
  }
  const tintes = ['#2f6b45', '#6b4528', '#3d7a4f', '#7a5232', '#24573a', '#2f6f6a'];
  let cuenta = 0;
  const ficha = (frente: Frente, x: number, z: number, w: number, d: number, base: number, baja = false): Vivienda => {
    const i = cuenta++;
    const h = baja ? [2.7, 3.0, 2.8][i % 3] : [2.8, 4.2, 3.0, 4.4, 2.7, 4.0, 3.1][i % 7];
    return {
      x,
      z,
      w,
      d,
      h,
      base,
      frente,
      tinte: tintes[(i * 5) % tintes.length],
      piedra: i % 6 === 4,
      azotea: i % 9 === 7,
      balcon: h >= 3.6 && i % 3 === 0,
      farol: i % 3 === 1,
    };
  };
  /**
   * Hilera de casas con la fachada en la línea `fijo`, de `desde` a `hasta`, sobre la calle de enfrente.
   * Las hileras `bajas`, de una planta, quedan entre la cámara y la calle y dejan ver al viajero.
   */
  function hilera(frente: Frente, fijo: number, desde: number, hasta: number, d = 3.6, base?: number, bajas = false) {
    const [nx, nz] = NORMAL[frente];
    for (let a = desde; ; ) {
      const w = Math.min([3.4, 2.9, 3.8, 3.1, 3.6][cuenta % 5], hasta - a);
      if (w < 2.6) break;
      const u = a + w / 2,
        x = nx ? fijo - (nx * d) / 2 : u,
        z = nx ? u : fijo - (nz * d) / 2;
      const suelo = base ?? (nx ? calle(fijo + nx * 1.5, u) : calle(u, fijo + nz * 1.5));
      vivienda(ficha(frente, x, z, w, d, suelo, bajas));
      a += w + 0.04;
    }
  }
  hilera('e', -16.4, -24, 9.8, 3.6, undefined, true); // calle principal, acera de poniente
  hilera('s', 13.6, -28, -16.4, 3.4); // calle de las Quinteras, lado norte
  hilera('n', 17.9, -35.6, -12.4, 3.4, undefined, true); // calle de las Quinteras y cruce alto, lado sur
  hilera('o', -12.1, -17.1, -11.2); // calle principal, acera de la iglesia, bajando del Cabildo
  hilera('e', -3.4, -17.1, -9.4, 3.4, undefined, true); // callejón, lado oeste
  hilera('o', -12.1, -0.6, 2.7, 4.2); // esquina de la calle de la iglesia
  hilera('o', -12.1, 10.4, 13.9, 2.7); // junto al Ayuntamiento
  hilera('o', -12.1, 14.2, 17.6, 3.4); // cruce alto
  hilera('o', -0.1, -17.1, -9.4); // callejón, lado este
  hilera('n', -10.4, 3.8, 14.2, 3.4, -0.7); // tras la iglesia, ladera abajo
  hilera('n', 10.4, -0.6, 3.0, 3.4); // plaza, junto al Ayuntamiento
  hilera('o', 1.4, 3.4, 9.8, 3.4); // plaza, lado este
  hilera('n', 3.4, 5.2, 12.2, 3.4); // paseo del mirador

  // --- Ladera: sube al suroeste, cae al barranco por el este y al mar por el nordeste ---
  const altura = terreno(
    t,
    'valverde',
    [-66, -56, 60, 46],
    (x, z) =>
      0.15 * z -
      0.07 * (x - 2) -
      (x > 18 && x < 46 ? 10 * Math.sin((Math.PI * (x - 18)) / 28) : 0) -
      Math.max(0, -z - 26) * 0.45 -
      Math.max(0, x - 40) * 0.4 +
      Math.max(0, z - 30) * 0.45 +
      Math.max(0, -x - 46) * 0.4 +
      Math.sin(x * 0.37 + z * 0.21) * 0.35 +
      Math.sin(x * 0.13 - z * 0.41) * 0.45,
    tierra,
    1.4,
  );

  // --- Firme: losas en el atrio y la plaza, asfalto en la calle principal, piedra en los callejones ---
  superficie(caja, losas, -2, -0.09, -3, 8, 0.18, 12, 2.6);
  superficie(caja, losas, -4.5, -0.09, 6.5, 11, 0.18, 7, 2.6);
  superficie(caja, losas, 9.5, -0.09, 1.8, 15, 0.18, 2.4, 2.6);
  suelos.forEach((s, i) => {
    if (i < 3 || i === 7) return; // atrio, plaza y mirador van enlosados; la escalinata, en peldaños
    const principal = s.r[0] === -16;
    losa(t, s, principal ? '#6d6964' : '#9c948a', 0.02);
    if (!principal) return;
    // Aceras a los dos lados, un dedo por encima del asfalto.
    for (const a of [s.r[0], s.r[2] - 0.6]) {
      const acera: Suelo = { ...s, r: [a, s.r[1], a + 0.6, s.r[3]], y: (s.y ?? 0) + 0.05 };
      if (s.y2 !== undefined) acera.y2 = s.y2 + 0.05;
      losa(t, acera, '#b9b2a7');
    }
  });
  // Escalinata de la plaza: de la calle principal baja en peldaños hasta las losas.
  for (let k = 0; k < 6; k++) {
    const x = -12.3 + k * 0.42,
      y = 1.28 * (1 - (k + 0.5) / 6);
    pieza(caja, k % 2 ? '#b3aca1' : '#c4bdb2', x, y / 2 - 0.05, 7, 0.44, y + 0.1, 2);
  }
  for (const z of [5.9, 8.1]) pieza(caja, blanco, -11.25, 0.75, z, 2.6, 1.5, 0.2);
  // Peldaños de piedra cruzando el callejón, que es la cuesta más empinada del pueblo.
  for (let z = -16.9; z < -9.3; z += 0.8) pieza(caja, '#7f776e', -1.75, calle(-1.75, z) + 0.02, z, 2.5, 0.06, 0.12);
  // Pretiles encalados: el atrio sobre el callejón y el paseo sobre el barranco.
  for (const [x0, z0, x1, z1] of [
    [-6, -9.1, -3, -9.1],
    [-0.5, -9.1, 2, -9.1],
    [12.4, 3.1, 17.1, 3.1],
    [17.1, 0.5, 17.1, 3.1],
  ]) {
    const largo = Math.hypot(x1 - x0, z1 - z0),
      porX = x1 - x0 > z1 - z0;
    pieza(caja, blanco, (x0 + x1) / 2, 0.35, (z0 + z1) / 2, porX ? largo : 0.24, 0.7, porX ? 0.24 : largo);
    pieza(caja, canteria, (x0 + x1) / 2, 0.74, (z0 + z1) / 2, porX ? largo + 0.1 : 0.32, 0.08, porX ? 0.32 : largo + 0.1);
  }

  // --- Iglesia de Santa María de la Concepción: cal, cantería, torre con galería y campanario ---
  bloque(muros, 8, 1.2, -3, 12, 8.4, 6.2);
  esquinas(2, -6.1, 14, 0.1, 0, 5.4);
  pieza(caja, cornisa, 8, 5.46, -3, 12.3, 0.16, 6.5);
  tejado(8, 5.52, -3, 12.4, 6.6, 1.9, 2);
  bloque(muros, 15.3, 0.8, -3, 2.6, 7.6, 4);
  esquinas(14, -5, 16.6, -1, 0, 4.6);
  pieza(caja, cornisa, 15.3, 4.64, -3, 2.8, 0.14, 4.2);
  tejado(15.35, 4.7, -3, 2.9, 4.4, 1.1);
  // Ventanas altas de la nave, enmarcadas en cantería, y portada lateral sobre el paseo.
  for (const x of [5.6, 11.4])
    for (const z of [-6.13, 0.13]) {
      pieza(caja, canteria, x, 3.9, z, 0.78, 1.3, 0.1);
      ventanas.push([x, 3.9, z + Math.sign(z + 3) * 0.04, 0.48, 1, 0.06]);
    }
  const arco = new T.TorusGeometry(1, 0.14, 5, 12, Math.PI);
  function portada(f: Fachada, u: number, ancho: number, alto: number) {
    for (const s of [-1, 1]) f.pieza(canteria, u + (s * ancho) / 2, alto / 2, 0.03, 0.26, alto, 0.14);
    f.pieza('#4a3122', u, alto / 2, 0.02, ancho, alto, 0.06);
    const [x, z] = f.donde(u, 0.03);
    pieza(arco, canteria, x, f.base + alto, z, ancho / 2, ancho / 2, 1, 0, f.giro);
    pieza(poste, '#4a3122', x, f.base + alto, z, ancho * 0.9, 0.05, ancho * 0.9, f.giro ? 0 : Math.PI / 2, 0, f.giro);
  }
  portada(fachada(9, -3, 3.1, 0, 's'), 0, 1.3, 1.9);
  // Fachada a poniente: portadas menores a los lados de la torre.
  const oeste = fachada(8, -3, 6, 0, 'o');
  for (const u of [-2.3, 2.3]) {
    portada(oeste, u, 0.9, 1.5);
    oeste.pieza(canteria, u, 3.5, 0.02, 0.6, 0.6, 0.08);
    oeste.luz(u, 3.5, 0.05, 0.36, 0.36, 0.04);
  }
  // Torre: cuerpo cuadrado sobre el gran arco de medio punto, galería mirador y campanario octogonal.
  const tx = 2.95,
    tz = -3;
  bloque(muros, tx, 4.3, tz, 2.7, 10.6, 2.7);
  esquinas(tx - 1.35, tz - 1.35, tx + 1.35, tz + 1.35, 0, 9.6);
  const torre = fachada(tx, tz, 1.35, 0, 'o');
  portada(torre, 0, 1.4, 2.3);
  torre.pieza(canteria, 0, 3.32, 0.05, 2.1, 0.14, 0.16);
  torre.pieza(canteria, 0, 4.7, 0.03, 0.72, 0.72, 0.08);
  torre.luz(0, 4.7, 0.06, 0.44, 0.44, 0.04);
  for (const frente of ['o', 'n', 's'] as Frente[]) {
    const cara = fachada(tx, tz, 1.35, 0, frente);
    cara.pieza(canteria, 0, 7.6, 0.02, 0.6, 1.2, 0.08);
    cara.luz(0, 7.6, 0.05, 0.34, 0.9, 0.04);
  }
  pieza(caja, cornisa, tx, 9.66, tz, 3.1, 0.18, 3.1);
  // La galería: balcón corrido en lo alto de la torre, desde donde se oteaba el mar.
  pieza(caja, '#cfc8bc', tx, 9.8, tz, 3.5, 0.12, 3.5);
  for (const s of [-1, 1]) {
    for (const [px, pz, w, d] of [
      [tx, tz + s * 1.7, 3.5, 0.07],
      [tx + s * 1.7, tz, 0.07, 3.5],
    ]) {
      pieza(caja, '#2f5a3d', px, 10.66, pz, w, 0.08, d);
      pieza(caja, '#2f5a3d', px, 10.0, pz, w, 0.06, d);
      for (let a = -1.6; a <= 1.6; a += 0.27)
        pieza(caja, '#2f5a3d', w > d ? px + a : px, 10.33, w > d ? pz : pz + a, 0.04, 0.62, 0.04);
    }
    for (const s2 of [-1, 1]) pieza(caja, blanco, tx + s * 1.68, 10.3, tz + s2 * 1.68, 0.2, 1, 0.2);
  }
  const ocho = new T.CylinderGeometry(1, 1, 1, 8);
  pieza(ocho, blanco, tx, 10.85, tz, 1.1, 2.1, 1.1, 0, Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4,
      b = a + Math.PI / 8;
    pieza(caja, '#bdb5aa', tx + Math.sin(b) * 1.1, 10.85, tz + Math.cos(b) * 1.1, 0.13, 2.1, 0.13, 0, b);
    if (k % 2) continue;
    // Huecos de las campanas en las cuatro caras principales.
    const x = tx + Math.sin(a) * 1.02,
      z = tz + Math.cos(a) * 1.02;
    pieza(caja, '#2a2522', x, 10.75, z, 0.5, 1.2, 0.06, 0, a);
    pieza(esfera, '#2a2522', x, 11.35, z, 0.25, 0.25, 0.05, 0, a);
    pieza(poste, '#8a6a33', tx + Math.sin(a) * 1.05, 10.7, tz + Math.cos(a) * 1.05, 0.34, 0.42, 0.1, 0, a);
  }
  pieza(ocho, '#cfc8bc', tx, 11.98, tz, 1.24, 0.16, 1.24, 0, Math.PI / 8);
  const cupula = new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  pieza(cupula, '#ece5d6', tx, 12.05, tz, 0.98, 0.9, 0.98);
  // La Virgen que corona la cúpula.
  pieza(poste, canteria, tx, 13.02, tz, 0.2, 0.2, 0.2);
  pieza(poste, blanco, tx, 13.36, tz, 0.16, 0.5, 0.16);
  pieza(esfera, blanco, tx, 13.68, tz, 0.08, 0.1, 0.08);
  ocho.dispose();
  cupula.dispose();

  // --- Casa consistorial de piedra, con balcón de madera y banderas, frente a la iglesia ---
  bloque(piedra, -5, 1.1, 12.7, 8, 8.2, 4.6);
  esquinas(-9, 10.4, -1, 15, 0, 5.2);
  pieza(caja, '#867d73', -5, -0.1, 12.7, 8.06, 0.8, 4.66);
  pieza(caja, cornisa, -5, 5.24, 12.7, 8.2, 0.14, 4.8);
  tejado(-5, 5.3, 12.7, 8.5, 5.1, 1.35);
  const ayto = fachada(-5, 12.7, 2.3, 0, 'n');
  portada(ayto, 0, 1.2, 1.9);
  for (const u of [-3, -1.6, 1.6, 3]) ventana(ayto, u, 1.25, '#5b3a24', canteria);
  for (const u of [-3, 3]) ventana(ayto, u, 3.75, '#5b3a24', canteria);
  balcon(ayto, 0, 2.75, 3.6, '#5b3a24');
  for (const u of [-0.9, 0.9]) ayto.luz(u, 3.9, 0.08, 0.5, 1.1, 0.04);
  // Ventanas también al costado y a la espalda, que es lo que se ve al llegar desde la iglesia.
  for (const [frente, fondo, huecos] of [
    ['o', 4, [-1.1, 1.1]],
    ['s', 2.3, [-3, -1, 1, 3]],
  ] as [Frente, number, number[]][]) {
    const cara = fachada(-5, 12.7, fondo, 0, frente);
    for (const u of huecos) for (const y of [1.25, 3.75]) ventana(cara, u, y, '#5b3a24', canteria);
  }
  // Banderas de España y de Canarias, en astas inclinadas desde la baranda.
  const asta = (x: number, t: number) => [x, 3.65 + 0.825 * t, 9.62 - 0.565 * t] as const;
  for (const x of [-6.7, -3.3]) {
    const [px, py, pz] = asta(x, 0.9);
    pieza(poste, '#d8d2c6', px, py, pz, 0.05, 1.8, 0.05, -0.6);
  }
  for (const [color, t, alto] of [
    ['#c60b1e', 1.09, 0.18],
    ['#ffc400', 1.35, 0.35],
    ['#c60b1e', 1.61, 0.18],
  ] as [string, number, number][]) {
    const [px, py, pz] = asta(-7.2, t);
    pieza(caja, color, px, py, pz, 1, alto, 0.02, -0.6);
  }
  ['#f4f1ea', '#0768a9', '#ffcc00'].forEach((color, k) => {
    const [px, py, pz] = asta(-3.13 + k * 0.33, 1.35);
    pieza(caja, color, px, py, pz, 0.33, 0.7, 0.02, -0.6);
  });

  // --- Cabildo Insular, en la calle principal junto al atrio: zócalo de piedra, balcones y escudo ---
  const cy = -0.45;
  bloque(muros, -9.55, cy + 1.6, -7.6, 5.1, 9.2, 6.4);
  bloque(piedra, -9.55, cy - 0.6, -7.6, 5.2, 3.2, 6.5);
  esquinas(-12.1, -10.8, -7, -4.4, cy + 1, cy + 6.2);
  pieza(caja, cornisa, -9.55, cy + 6.26, -7.6, 5.3, 0.16, 6.6);
  tejado(-9.55, cy + 6.34, -7.6, 5.5, 6.8, 1.4);
  const cabildo = fachada(-9.55, -7.6, 2.55, cy, 'o');
  portada(cabildo, 0, 1.3, 2.1);
  for (const u of [-2.3, -1.3, 1.3, 2.3]) ventana(cabildo, u, 1.4, '#2f6b45', canteria);
  for (const u of [-1.6, 1.6]) balcon(cabildo, u, 3.3, 1.8, '#5b3a24');
  ventana(cabildo, 0, 4.4, '#2f6b45');
  cabildo.pieza(canteria, 0, 3.05, 0.04, 0.6, 0.7, 0.08);
  cabildo.pieza('#c9a85a', 0, 3.05, 0.08, 0.36, 0.44, 0.04);
  // Fachada lateral sobre la calle de la iglesia.
  const lateral = fachada(-9.55, -7.6, 3.2, cy, 's');
  for (const u of [-1.4, 1.4]) {
    ventana(lateral, u, 1.65, '#2f6b45', canteria);
    ventana(lateral, u, 4.4, '#2f6b45');
  }
  farol(lateral, 0);

  // --- Casa de las Quinteras: casa de piedra con escalera de fuera, y el pajero de techo de paja ---
  const qy = 4.4;
  bloque(piedra, -32, qy + 0.6, 9.2, 6, 7.2, 4.2);
  tejado(-32, qy + 4.25, 9.2, 6.4, 4.6, 1.2);
  pieza(caja, '#8a8178', -32, qy + 4.18, 9.2, 6.2, 0.12, 4.4);
  const quinteras = fachada(-32, 9.2, 2.1, qy, 's');
  puerta(quinteras, -1, '#6b4528', canteria);
  ventana(quinteras, -2.3, 1.25, '#6b4528', canteria);
  for (const u of [-2.3, -0.9]) ventana(quinteras, u, 3.05, '#6b4528', canteria);
  // Escalera de piedra adosada a la fachada, que sube al sobrado.
  quinteras.pieza('#7d766e', 0.9, 1, 0.35, 1, 2, 0.7);
  for (let k = 1; k < 6; k++) quinteras.pieza('#7d766e', 1.4 + (k - 0.5) * 0.3, 1 - k / 6, 0.35, 0.3, 2 - k / 3, 0.7);
  quinteras.pieza('#6b4528', 0.9, 2.9, 0.05, 0.8, 1.7, 0.06);
  for (const u of [-3.2, -1.75]) {
    const [x, z] = quinteras.donde(u, 0.4);
    pieza(esfera, '#9b5b3a', x, qy + 0.32, z, 0.28, 0.34, 0.28);
  }
  // Pajero: chozo de piedra seca con cubierta de paja, como los del campo herreño.
  bloque(piedra, -37.6, qy - 0.2, 14.5, 2.4, 3.2, 2.6);
  pieza(piramide, '#b8995a', -37.6, qy + 2.05, 14.5, 1.95, 1.5, 1.95, 0, Math.PI / 4);
  pieza(caja, '#4a3b30', -36.38, qy + 0.65, 14.5, 0.06, 1.2, 0.6);
  // Letrero del centro etnográfico, junto a la puerta.
  quinteras.pieza('#6b4528', -2.2, 2.05, 0.04, 1.2, 0.42, 0.05);
  quinteras.pieza('#e8dcc0', -2.2, 2.05, 0.07, 1, 0.26, 0.02);
  ocupado.push([-35, 7.1, -29, 11.3], [-38.8, 13.2, -36.4, 15.8], [-12.2, -10.9, -6.9, -4.3], [-9.1, 10.3, -0.9, 15.1], [1.5, -6.2, 16.7, 0.2]);
  arco.dispose();

  // --- Plaza: laureles de Indias, bancos y el círculo del empedrado ---
  for (const [x, z] of [
    [-4.5, -7.4],
    [0.6, -7.4],
    [-8.4, 4],
    [-0.6, 4],
  ]) {
    pieza(caja, blanco, x, 0.2, z, 1.1, 0.4, 1.1);
    pieza(poste, '#6e5a48', x, 1.1, z, 0.28, 1.8, 0.28);
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9;
      pieza(esfera, k % 2 ? '#3b5d36' : '#4a6d3c', x + Math.cos(a) * 0.7, 2.5 + (k % 3) * 0.25, z + Math.sin(a) * 0.7, 1.1, 0.8, 1.1);
    }
  }
  [2.2, 1.7, 1.15, 0.6].forEach((r, k) =>
    pieza(poste, k % 2 ? '#d9d3c8' : '#8f877d', -4.5, 0.005 + k * 0.004, 6.4, r * 2, 0.012, r * 2),
  );
  for (const [x, z, giro] of [
    [-2.2, -8.4, 0],
    [-5.6, -6, Math.PI / 2],
    [-7, 9.6, 0],
    [-2, 9.6, 0],
  ]) {
    pieza(caja, blanco, x, 0.22, z, 1.5, 0.44, 0.45, 0, giro);
    pieza(caja, madera, x, 0.47, z, 1.5, 0.06, 0.45, 0, giro);
  }

  // --- Barrios alrededor: casas sueltas por la ladera, pinos, tuneras y matorral ---
  for (let i = 0, puestas = 0; i < 400 && puestas < 46; i++) {
    const x = -46 + azar() * 70,
      z = -40 + azar() * 74;
    if (x > 16 && z > -30) continue; // el barranco
    const frente: Frente = azar() > 0.35 ? 'n' : azar() > 0.5 ? 'e' : 's',
      w = 3 + azar(),
      d = 3 + azar() * 0.6;
    const [nx] = NORMAL[frente],
      sx = nx ? d : w,
      sz = nx ? w : d;
    if (!libre([x - sx / 2 - 0.5, z - sz / 2 - 0.5, x + sx / 2 + 0.5, z + sz / 2 + 0.5])) continue;
    const base = Math.min(altura(x - sx / 2, z - sz / 2), altura(x + sx / 2, z + sz / 2), altura(x, z));
    vivienda(ficha(frente, x, z, w, d, base));
    puestas++;
  }
  for (let i = 0; i < 90; i++) {
    const x = -62 + azar() * 116,
      z = -52 + azar() * 94;
    if (!libre([x - 0.8, z - 0.8, x + 0.8, z + 0.8])) continue;
    const y = altura(x, z);
    if (i % 3 === 0) {
      // Pino canario: tronco alto y copas a manojos.
      const h = 4 + azar() * 3;
      pieza(poste, '#5e4535', x, y + h / 2, z, 0.3, h, 0.3);
      for (let k = 0; k < 4; k++)
        pieza(esfera, k % 2 ? '#35502f' : '#41603a', x + (azar() - 0.5) * 1.2, y + h - 0.6 + k * 0.5, z + (azar() - 0.5) * 1.2, 1.2 - k * 0.2, 0.7, 1.2 - k * 0.2);
    } else if (i % 3 === 1) {
      // Tunera: palas verdes apiladas.
      for (let k = 0; k < 5; k++)
        pieza(esfera, '#6f8a4a', x + (azar() - 0.5) * 0.8, y + 0.4 + k * 0.28, z + (azar() - 0.5) * 0.5, 0.36, 0.42, 0.1, 0, azar() * 3);
    } else pieza(esfera, i % 2 ? '#7d8a55' : '#68794a', x, y + 0.25, z, 0.6 + azar() * 0.5, 0.45, 0.6 + azar() * 0.4);
  }

  // --- Mar de nubes al nordeste, por debajo del pueblo: la bruma de las medianías ---
  const nubes: T.BufferGeometry[] = [];
  for (let i = 0; i < 26; i++) {
    const g = new T.IcosahedronGeometry(1, 2);
    g.setAttribute('normal', g.attributes.position.clone()); // esfera suave: la normal es la posición
    g.scale(5 + azar() * 6, 1 + azar() * 0.8, 4 + azar() * 4);
    g.translate(10 + azar() * 60, -15 + azar() * 4, -58 + azar() * 52);
    nubes.push(g);
  }
  const nube = new T.MeshStandardMaterial({ color: '#fff6ea', transparent: true, opacity: 0.42, depthWrite: false, roughness: 1 });
  const merged = mergeGeometries(nubes);
  superficie(merged, nube, 0, 0, 0, 1, 1, 1, 8).castShadow = false;
  for (const g of [...nubes, merged]) g.dispose();

  cocer(muros, encalado, 2.6);
  cocer(piedra, mamposteria, 1.6);
  cocer(tejados, teja, 1.85);

  // Un pueblo de interior no tiene barcos: los de la maqueta quedan fondeados lejos de la vista.
  return {
    amarres: [
      [0, 0, -400],
      [1, 0, -400],
      [2, 0, -400],
    ],
    enSeco: [],
  };
}
