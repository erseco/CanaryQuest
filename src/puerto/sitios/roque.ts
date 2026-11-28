import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa, terreno } from './terreno';

type Rect = [number, number, number, number];
type Punto = [number, number];
const LUGAR = 'roque-de-los-muchachos';
/** Altura del mar de nubes: llena la Caldera hasta media pared y tapa la ladera lejana. */
const NUBES = -13;

/**
 * Borde norte de la Caldera de Taburiente, como la x a partir de la cual se pisa cumbre: al sur
 * (−x) la pared cae a pico. Pasa junto a los roques, se arrima al Galileo y, más al oeste, tuerce
 * hacia el sur camino del Roque Chico; al este sube hacia el norte, hacia la Fuente Nueva.
 */
const borde = (z: number) =>
  -4.5 +
  0.4 * Math.max(0, z) -
  0.08 * Math.min(0, z) -
  0.05 * Math.max(0, -z - 24) ** 2 +
  0.9 * Math.sin(0.23 * z) +
  0.5 * Math.sin(0.61 * z + 1);
const suave = (a: number, b: number, v: number) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
/** La cumbre: baja al oeste y al norte, hacia las cúpulas, y en los bordes se hunde en el mar de nubes. */
function cumbre(x: number, z: number) {
  return (
    0.06 * Math.min(0, z + 8) -
    0.05 * Math.max(0, x - 10) -
    0.03 * Math.max(0, z - 6) +
    2.2 * Math.exp(-((x - 2) ** 2) / 14 - z ** 2 / 40) +
    0.35 * Math.sin(0.5 * x + 0.3 * z) +
    0.3 * Math.sin(0.21 * x - 0.47 * z) -
    // Hacia el oeste, tras el GTC, la ladera se hunde antes: así asoma el mar de nubes.
    0.07 * Math.max(0, Math.hypot(x - 12, (z + 8) * (z < -8 ? 1.05 : 0.8)) - 31) ** 2
  );
}
/** Altura natural: la cumbre hasta el borde y, pasado este, el desplome hasta el fondo de la Caldera. */
function ladera(x: number, z: number) {
  const d = borde(z) - x,
    cresta = 0.8 * Math.exp(-((d + 1.2) ** 2) / 2);
  if (d <= 0) return cumbre(x, z) + cresta;
  // Costillas de roca en la pared, más marcadas a media caída.
  const costillas = 3.5 * Math.sin(1.1 * z + 0.4 * x) * Math.sin(Math.PI * Math.min(1, d / 6));
  return cumbre(x, z) + cresta - 44 * suave(0, 6, d) + costillas;
}

/**
 * La cumbre de La Palma: el Roque de los Muchachos sobre el borde norte de la Caldera de
 * Taburiente y el Observatorio del Roque de los Muchachos por la ladera. Trazado sobre la ortofoto
 * PNOA y las posiciones de OpenStreetMap, girado para que la cámara mire al oeste a lo largo del
 * borde (el oeste es −z y el norte, +x) y comprimido: en planta, una unidad son unos 18 m; los
 * edificios van a escala de maqueta, de unos 3 m. Del mirador de la cumbre baja el sendero al
 * aparcamiento; de allí la carretera del oeste pasa junto al Galileo hasta la explanada del GTC, y
 * la del norte baja al Nordic, desde donde se ven el William Herschel, el telescopio solar sueco y
 * el Isaac Newton. Los MAGIC quedan al norte del GTC. Las zonas pisables están en
 * `PUEBLOS['roque-de-los-muchachos'].plano.suelos`: si se mueve un camino, hay que moverlo allí.
 */
export function trazarRoque(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, madera } = t;
  const { caja, esfera, poste } = t.formas;
  const { adoquin, basalto } = t.materiales;
  const suelos = PUEBLOS[LUGAR].plano.suelos!;
  const paseo = (x: number, z: number) => alturaPaseo(x, z, LUGAR);
  const disco = new T.CylinderGeometry(1, 1, 1, 28),
    octogono = new T.CylinderGeometry(1, 1, 1, 8),
    tronco = new T.CylinderGeometry(0.72, 1, 1, 8),
    media = new T.SphereGeometry(1, 22, 9, 0, Math.PI * 2, 0, Math.PI / 2),
    // Cúpula en forma de cebolla: la esfera sigue por debajo del ecuador y se recoge sobre el tambor.
    cebolla = new T.SphereGeometry(1, 20, 11, 0, Math.PI * 2, 0, 0.68 * Math.PI),
    // Gajo de la compuerta, mirando a +z antes de girarlo.
    gajo = new T.SphereGeometry(1, 3, 10, Math.PI / 2 - 0.14, 0.28, 0, Math.PI / 2),
    aro = new T.TorusGeometry(1, 0.02, 3, 40),
    via = new T.TorusGeometry(1, 0.04, 3, 36);
  // Orientar una pieza con sus ejes locales x, y, z sobre los vectores dados.
  const giro = new T.Euler(),
    q = new T.Quaternion(),
    base = new T.Matrix4();
  const orientar = (u: T.Vector3, v: T.Vector3, n: T.Vector3) =>
    giro.setFromQuaternion(q.setFromRotationMatrix(base.makeBasis(u, v, n)));
  const arriba = new T.Vector3(0, 1, 0);
  function barra(a: T.Vector3, b: T.Vector3, grosor: number, tono: string) {
    const d = b.clone().sub(a),
      largo = d.length();
    giro.setFromQuaternion(q.setFromUnitVectors(arriba, d.normalize()));
    pieza(caja, tono, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, grosor, largo, grosor, giro.x, giro.y, giro.z);
  }

  // --- Ladera: tierra parda con manchas de almagre y codesar; en la pared, coladas a franjas ---
  const tierra = basalto.clone();
  tierra.color.set('#ffffff');
  tierra.vertexColors = true;
  const color = new T.Color();
  const altura = terreno(
    t,
    LUGAR,
    [-60, -64, 62, 52],
    ladera,
    tierra,
    1.5,
    (x, y, z) => {
      if (x < borde(z) && y < -2)
        return color.set(['#7c5244', '#575049', '#8b7360', '#635750'][Math.abs(Math.floor(y / 2.4 + 0.4 * Math.sin(z * 0.4))) % 4]);
      const mancha = Math.sin(x * 0.31 + z * 0.17) + Math.sin(x * 0.13 - z * 0.37);
      if (Math.hypot(x - 2, z) < 8) return color.set(mancha > 0 ? '#6f6560' : '#7b6c62'); // la cumbre, pedregosa
      return color.set(mancha > 1.1 ? '#8e735f' : mancha < -1.1 ? '#7a7d5e' : '#877d6b');
    },
  );

  // --- Firmes: losas en el mirador, tierra en el sendero, asfalto y hormigón abajo ---
  const losas = adoquin.clone();
  losas.color.set('#9d968e');
  superficie(caja, losas, -0.5, 1.41, 0, 5, 0.18, 6, 2.2);
  suelos.forEach((s, i) => {
    if (i === 0) return;
    losa(t, s, i === 1 ? '#8b6a54' : i === 4 || i === 6 ? '#c4c0b7' : '#4c4c52', 0.02);
  });
  // Raya discontinua de la carretera del oeste, que sube hacia el aparcamiento.
  const pendiente = -Math.atan2(1.2, 21);
  for (let z = -29.2; z < -9.5; z += 1.6) pieza(caja, '#ecebe4', 6.5, paseo(6.5, z) + 0.02, z, 0.1, 0.03, 0.75, pendiente);
  // Balizas blancas con su reflectante en el arcén del lado de la Caldera.
  for (let z = -29; z < -9; z += 2.4) {
    const y = paseo(5.2, z);
    pieza(caja, '#f2f1ec', 4.8, y + 0.3, z, 0.12, 0.6, 0.12);
    pieza(caja, '#c8342c', 4.73, y + 0.5, z, 0.02, 0.1, 0.13);
  }
  for (const x of [8.65, 10.3]) pieza(caja, '#e8e6df', x, 0.01, -7.7, 0.08, 0.02, 2.2);

  // --- Los «muchachos»: roques de lava oscura con cuerpo y cabeza, de pie sobre la cumbre ---
  function muchacho(x: number, z: number, alto: number, ancho: number) {
    const y0 = altura(x, z) - 0.35;
    const tono = () => ['#463833', '#55433b', '#5b4038', '#3d3431', '#4d4540'][Math.floor(azar() * 5)];
    const vaiven = () => (azar() - 0.5) * 0.22;
    pieza(esfera, tono(), x, y0 + alto * 0.14, z, ancho * 1.15, alto * 0.24, ancho * 1.05, 0, azar() * 3);
    pieza(esfera, tono(), x + vaiven(), y0 + alto * 0.4, z + vaiven(), ancho * 0.75, alto * 0.3, ancho * 0.7, vaiven(), azar() * 3, vaiven());
    pieza(esfera, tono(), x + vaiven(), y0 + alto * 0.66, z + vaiven(), ancho * 0.62, alto * 0.22, ancho * 0.55, vaiven(), azar() * 3, vaiven());
    pieza(esfera, tono(), x + vaiven(), y0 + alto * 0.88, z + vaiven(), ancho * 0.42, alto * 0.13, ancho * 0.4, 0, azar() * 3);
    // Líquenes amarillos en la cara del sol, que da del sureste.
    for (let k = 0; k < 3; k++)
      pieza(esfera, '#8f8a5a', x - ancho * 0.4 + vaiven(), y0 + alto * (0.25 + azar() * 0.45), z + ancho * 0.45, 0.16, 0.1, 0.05);
  }
  for (const [x, z, alto, ancho] of [
    // El corro de la cumbre, al norte del mirador.
    [3.6, 0.8, 4.4, 0.85],
    [4.9, 2.3, 5.4, 1],
    [3.4, 3.5, 3.8, 0.8],
    [6, 0.3, 4.2, 0.85],
    [6.3, 3.3, 4.6, 0.9],
    [7.4, 1.8, 3.6, 0.8],
    [4.8, 4.8, 3.1, 0.75],
    // Otros, más bajos, asomados al borde.
    [-4.4, -1.6, 3, 0.8],
    [-5.1, 0.4, 3.6, 0.9],
    [-4.5, 2.4, 2.6, 0.75],
    [-5.4, -3.4, 2.4, 0.7],
    [-1.8, 4.6, 2.2, 0.7],
  ])
    muchacho(x, z, alto, ancho);

  // --- Mirador: pretil de piedra seca, sendero orillado, atriles y coches en el aparcamiento ---
  function pretil(x0: number, z0: number, x1: number, z1: number) {
    const largo = Math.hypot(x1 - x0, z1 - z0),
      n = Math.ceil(largo / 0.55);
    for (let k = 0; k < n; k++) {
      const x = x0 + ((x1 - x0) * (k + 0.5)) / n,
        z = z0 + ((z1 - z0) * (k + 0.5)) / n,
        h = 0.55 + azar() * 0.2;
      pieza(caja, azar() > 0.5 ? '#5d524c' : '#6f625a', x, 1.5 + h / 2 - 0.05, z, 0.5, h, 0.58, 0, azar() * 0.3);
    }
  }
  pretil(-3.15, -3.1, -3.15, 3.1);
  pretil(-3.1, 3.15, 2, 3.15);
  for (let x = 2.2; x < 5; x += 0.45)
    for (const z of [-3.65, -1.35]) {
      const r = 0.12 + azar() * 0.1;
      pieza(esfera, azar() > 0.5 ? '#5b504a' : '#73655b', x, paseo(x, -2.5) + 0.06, z, r, r * 0.7, r);
    }
  // Atriles a los lados del sendero, inclinados hacia él.
  for (const [x, z, s] of [
    [3.2, -4.3, 1],
    [3.4, -0.6, -1],
  ]) {
    const y = altura(x, z);
    pieza(poste, madera, x, y + 0.45, z, 0.12, 0.9, 0.12);
    pieza(caja, '#5b3f2c', x, y + 0.95, z, 0.9, 0.06, 0.6, s * 0.6);
    pieza(caja, '#ddd2b4', x, y + 0.98, z + s * 0.02, 0.78, 0.02, 0.5, s * 0.6);
  }
  for (const [x, z, tinte] of [
    [9.4, -7.7, '#f1f1ee'],
    [11.2, -7.7, '#b8322c'],
    [8.6, -3.4, '#7d8a96'],
  ] as [number, number, string][]) {
    pieza(caja, tinte, x, 0.42, z, 1.2, 0.48, 2.5);
    pieza(caja, '#3a4754', x, 0.85, z + 0.1, 1.06, 0.4, 1.3);
    pieza(caja, tinte, x, 1.07, z + 0.1, 1.08, 0.06, 1.2);
    for (const dx of [-0.56, 0.56]) for (const dz of [-0.8, 0.8]) pieza(poste, '#25272b', x + dx, 0.24, z + dz, 0.46, 0.18, 0.46, 0, 0, Math.PI / 2);
  }

  // --- Cúpulas ---
  /** Franja de la compuerta, de la falda a lo alto, mirando hacia `rumbo` (0 es +z). */
  function compuerta(x: number, y: number, z: number, r: number, alto: number, falda: number, rumbo: number, tono: string) {
    pieza(gajo, tono, x, y, z, r * 1.025, alto * 1.02, r * 1.025, 0, rumbo);
    pieza(caja, tono, x + Math.sin(rumbo) * r, y - falda / 2, z + Math.cos(rumbo) * r, r * 0.5, falda, 0.18, 0, rumbo);
  }
  /** Tambor con pilastras, falda y cúpula: semiesfera o cebolla. */
  function observatorio(x: number, z: number, y: number, r: number, tambor: number, tonos: [string, string, string], forma: 'media' | 'cebolla', rumbo: number) {
    const [muro, falda, cupula] = tonos;
    pieza(disco, muro, x, y + (tambor - 3) / 2, z, r, tambor + 3, r);
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      pieza(caja, '#d3d0c8', x + Math.sin(a) * r, y + (tambor - 3) / 2, z + Math.cos(a) * r, 0.2, tambor + 3, 0.2, 0, a);
    }
    pieza(disco, falda, x, y + tambor + 0.4, z, r * 1.01, 0.8, r * 1.01);
    const arranque = y + tambor + 0.8;
    if (forma === 'media') {
      pieza(media, cupula, x, arranque, z, r, r * 0.95, r);
      compuerta(x, arranque, z, r, r * 0.95, 0.8, rumbo, '#959ea8');
      for (const a of [0.5, 0.9, 1.25]) pieza(aro, '#a8b0b9', x, arranque + r * 0.95 * Math.cos(a), z, r * Math.sin(a) + 0.03, r * Math.sin(a) + 0.03, r, Math.PI / 2);
    } else {
      // El anillo inferior de la cebolla, de radio 0,84 R, queda 0,54 R por debajo de su centro.
      const R = r / 0.844,
        centro = arranque + 0.536 * R;
      pieza(cebolla, cupula, x, centro, z, R, R, R);
      pieza(gajo, '#cfd1d0', x, centro, z, R * 1.02, R * 1.02, R * 1.02, 0, rumbo);
    }
  }
  // Gran Telescopio Canarias: la mayor cúpula, plateada, con el edificio de control al sur.
  const gy = -1.2;
  observatorio(19.5, -38, gy, 5.5, 4.6, ['#e3e1db', '#b5bcc4', '#cdd3da'], 'media', -1.1);
  pieza(caja, '#ecebe6', 12.85, gy + 1, -38, 2.7, 5, 9);
  pieza(caja, '#d6d4cd', 12.85, gy + 3.55, -38, 2.85, 0.12, 9.15);
  for (const z of [-41, -38, -35]) pieza(caja, '#2b4677', 12.75, gy + 3.8, z, 1.7, 0.06, 2.6, 0, 0, 0.35);
  for (const z of [-41.2, -39.8, -36.2, -34.8]) pieza(caja, '#3b4a5a', 11.48, gy + 1.5, z, 0.05, 0.8, 1.1);
  pieza(caja, '#4a5560', 11.47, gy + 1, -38, 0.06, 2, 1.2);
  ventanas.push([11.43, gy + 2.3, -38, 0.04, 0.16, 0.36]);
  // Telescopio Nazionale Galileo: tambor octogonal y, encima, la casa angulosa que gira entera.
  const ty = altura(12, -21) - 0.2;
  pieza(octogono, '#e6e4de', 12, ty, -21, 2.4, 4, 2.4, 0, Math.PI / 8);
  for (const dy of [0.7, 1.6]) pieza(octogono, '#cfcdc6', 12, ty + dy, -21, 2.45, 0.1, 2.45, 0, Math.PI / 8);
  pieza(tronco, '#bfc4ca', 12, ty + 3.3, -21, 2.5, 2.6, 2.5, 0, Math.PI / 8);
  pieza(octogono, '#d7dadd', 12, ty + 4.65, -21, 1.8, 0.1, 1.8, 0, Math.PI / 8);
  pieza(caja, '#7c838b', 12 - 1.99, ty + 3.3, -21, 0.08, 2.65, 1.1, 0, 0, -0.25);
  // Nordic Optical Telescope: torre blanca con su cúpula poligonal.
  const ny = altura(24, -4.5) - 0.2;
  pieza(octogono, '#eceae4', 24, ny + 1, -4.5, 1.7, 6, 1.7, 0, Math.PI / 8);
  pieza(tronco, '#c8cdd3', 24, ny + 4.8, -4.5, 1.8, 1.6, 1.8, 0, Math.PI / 8);
  pieza(caja, '#8a929b', 24 - 1.5, ny + 4.8, -4.5, 0.08, 1.6, 0.75, 0, 0, -0.3);
  // William Herschel: la cúpula de cebolla, con su nave al este.
  const wy = altura(34, 11) - 0.2;
  observatorio(34, 11, wy, 2.9, 3.2, ['#ecebe6', '#dcdcd8', '#f4f3ef'], 'cebolla', -1.2);
  pieza(caja, '#e3e1da', 34, wy + 0.5, 16, 4, 4, 3);
  // Telescopio Solar Sueco: torre esbelta con la torreta arriba; al lado, la torre abierta del holandés.
  const sy = altura(26.5, 18.5) - 0.2;
  pieza(caja, '#f1f0ec', 26.5, sy + 3, 18.5, 1.4, 10, 1.4);
  pieza(disco, '#e8e8e4', 26.5, sy + 8.4, 18.5, 1, 0.9, 1);
  pieza(media, '#dfe2e5', 26.5, sy + 8.85, 18.5, 1, 0.7, 1);
  const hy = altura(25.5, 15.5) - 0.2;
  for (const [dx, dz] of [
    [-0.55, -0.55],
    [0.55, -0.55],
    [-0.55, 0.55],
    [0.55, 0.55],
  ])
    pieza(caja, '#c9ccce', 25.5 + dx, hy + 3, 15.5 + dz, 0.1, 6, 0.1);
  pieza(caja, '#d9dbdc', 25.5, hy + 6.05, 15.5, 1.5, 0.12, 1.5);
  pieza(poste, '#f0f0ee', 25.5, hy + 6.8, 15.5, 0.45, 1.4, 0.45, 0, 0, 0.6);
  // Isaac Newton, y las cúpulas pequeñas del Liverpool y el Mercator.
  const iy = altura(40, 23) - 0.2;
  observatorio(40, 23, iy, 2.6, 3.2, ['#ecebe6', '#d9d9d6', '#f2f1ee'], 'media', -1.3);
  pieza(caja, '#e3e1da', 36.6, iy + 0.4, 23, 1.8, 3.4, 3.8);
  for (const [x, z] of [
    [38, 28],
    [40.6, 29.8],
  ])
    observatorio(x, z, altura(x, z) - 0.2, 1.2, 1.6, ['#e9e8e3', '#d5d6d6', '#eef1f4'], 'media', -1.2);

  // --- MAGIC: dos platos de 17 m, de espejos cuadrados sobre bastidor de carbono, en su vía circular ---
  function magic(cx: number, cz: number, rumbo: number) {
    const y0 = altura(cx, cz) - 0.1,
      R = 3,
      e = 0.75,
      foco = 5.4;
    // Ejes del plato: u, horizontal; v, hacia lo alto del plato; n, hacia donde mira el espejo.
    const n = new T.Vector3(Math.sin(rumbo) * Math.cos(e), Math.sin(e), Math.cos(rumbo) * Math.cos(e)),
      u = new T.Vector3(Math.cos(rumbo), 0, -Math.sin(rumbo)),
      v = n.clone().cross(u),
      llano = new T.Vector3(Math.sin(rumbo), 0, Math.cos(rumbo));
    pieza(via, '#55575c', cx, y0 + 0.05, cz, 4.2, 4.2, 4.2, Math.PI / 2);
    orientar(u, arriba, llano);
    pieza(caja, '#c9c3b5', cx, y0 + 0.25, cz, 2 * R + 1.2, 0.3, 1.3, giro.x, giro.y, giro.z);
    const C = new T.Vector3(cx, y0 + 3.3, cz);
    // Torres en A a los lados, que sostienen el eje de elevación.
    for (const s of [-1, 1]) {
      const eje = C.clone().addScaledVector(u, s * (R + 0.35));
      for (const k of [-1.7, 1.7]) barra(eje.clone().addScaledVector(llano, k).setY(y0 + 0.3), eje, 0.22, '#d8d2c3');
    }
    barra(C.clone().addScaledVector(u, -R - 0.35), C.clone().addScaledVector(u, R + 0.35), 0.16, '#2f3237');
    // Bastidor de carbono y espejos cuadrados en paraboloide.
    const fondo = C.clone().addScaledVector(n, -0.12);
    orientar(u, n, v.clone().negate());
    pieza(disco, '#2f3237', fondo.x, fondo.y, fondo.z, R * 1.03, 0.14, R * 1.03, giro.x, giro.y, giro.z);
    orientar(u, v, n);
    for (let a = -R + 0.2; a < R; a += 0.4)
      for (let b = -R + 0.2; b < R; b += 0.4) {
        if (a * a + b * b > R * R) continue;
        const p = C.clone()
          .addScaledVector(u, a)
          .addScaledVector(v, b)
          .addScaledVector(n, (a * a + b * b) / (4 * foco));
        pieza(caja, ['#a9bfd2', '#c3d3e0', '#91a9bf'][Math.floor(azar() * 3)], p.x, p.y, p.z, 0.36, 0.36, 0.05, giro.x, giro.y, giro.z);
      }
    // La cámara, en el foco, colgada de cuatro brazos desde el borde.
    const F = C.clone().addScaledVector(n, foco);
    pieza(caja, '#2a2c30', F.x, F.y, F.z, 0.75, 0.75, 0.9, giro.x, giro.y, giro.z);
    for (const [a, b] of [
      [R, 0],
      [-R, 0],
      [0, R],
      [0, -R],
    ])
      barra(C.clone().addScaledVector(u, a * 0.95).addScaledVector(v, b * 0.95), F, 0.07, '#3a3d42');
  }
  magic(38, -27, -1);
  magic(32, -33, -1);

  // --- Carreteras que bajan por la ladera: al este, la LP-4 hacia Santa Cruz; al norte, hacia Garafía ---
  const ramales: Punto[][] = [
    [
      [21, -2],
      [25, 1],
      [28.5, 5],
      [28.6, 12],
      [30, 17],
      [33.5, 21.5],
      [34, 27],
      [38, 34],
      [46, 46],
    ],
    [
      [21, -6.5],
      [26, -14],
      [33, -19.5],
      [40, -20],
      [46, -28],
      [45, -40],
      [54, -48],
    ],
    [
      [8, -44],
      [14, -50],
      [27, -49],
      [45, -40],
    ],
  ];
  for (const ramal of ramales)
    for (let i = 1; i < ramal.length; i++) {
      const [x0, z0] = ramal[i - 1],
        [x1, z1] = ramal[i];
      const largo = Math.hypot(x1 - x0, z1 - z0),
        n = Math.ceil(largo / 1.1);
      for (let k = 0; k < n; k++) {
        const x = x0 + ((x1 - x0) * (k + 0.5)) / n,
          z = z0 + ((z1 - z0) * (k + 0.5)) / n;
        pieza(caja, '#4c4c52', x, altura(x, z) + 0.04, z, 2.1, 0.35, largo / n + 0.2, 0, Math.atan2(x1 - x0, z1 - z0));
      }
    }
  const cerca = (x: number, z: number, margen: number) =>
    ramales.some((ramal) =>
      ramal.some(([x1, z1], i) => {
        if (!i) return false;
        const [x0, z0] = ramal[i - 1],
          dx = x1 - x0,
          dz = z1 - z0,
          k = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz)));
        return Math.hypot(x - x0 - k * dx, z - z0 - k * dz) < margen;
      }),
    );

  // --- Codesos, piedras sueltas y el mar de nubes ---
  const ocupado: Rect[] = [
    ...suelos.map(({ r }): Rect => [r[0] - 0.8, r[1] - 0.8, r[2] + 0.8, r[3] + 0.8]),
    [11, -44.5, 26, -31.5], // GTC
    [8.5, -24.5, 15.5, -17.5], // Galileo
    [21, -7, 27, -2], // Nordic
    [30, 7, 38.5, 18], // William Herschel
    [24, 13.5, 28, 20.5], // torres solares
    [35, 19.5, 43.5, 32], // Isaac Newton, Liverpool y Mercator
    [27, -38, 43, -22], // MAGIC
    [-6.5, -4.5, -3.2, 3.5], // roques del borde
    [2.4, -0.8, 8.4, 6], // corro de la cumbre
  ];
  const libre = (x: number, z: number) => !ocupado.some(([a, b, c, d]) => x > a && x < c && z > b && z < d) && !cerca(x, z, 1.6);
  for (let i = 0, puestos = 0; i < 3000 && puestos < 560; i++) {
    const x = -10 + azar() * 62,
      z = -54 + azar() * 100;
    const y = altura(x, z);
    if (x < borde(z) + 0.8 || y < -9 || !libre(x, z)) continue;
    puestos++;
    if (i % 4 === 0) {
      const r = 0.22 + azar() * 0.4;
      pieza(esfera, azar() > 0.4 ? '#4a403c' : '#6a5246', x, y + 0.05, z, r, r * 0.7, r * 0.85, 0, azar() * 3);
    } else {
      // Codeso de cumbre: mata redonda y gris verdosa que tapiza la ladera.
      const r = 0.3 + azar() * 0.42;
      pieza(esfera, ['#76805a', '#868a62', '#69734f', '#8d8b68'][i % 4], x, y + 0.12, z, r, r * 0.6, r * 0.9, 0, azar() * 3);
    }
  }
  const nubes: T.BufferGeometry[] = [];
  nubes.push(new T.CylinderGeometry(79.5, 79.5, 0.6, 72, 1).toNonIndexed().translate(0, NUBES - 0.3, 0));
  for (let i = 0, puestas = 0; i < 900 && puestas < 170; i++) {
    const a = azar() * Math.PI * 2,
      r = 8 + azar() * 68;
    const x = Math.sin(a) * r,
      z = Math.cos(a) * r;
    if (ladera(x, z) > NUBES - 3) continue;
    puestas++;
    const g = new T.IcosahedronGeometry(1, 2);
    g.setAttribute('normal', g.attributes.position.clone()); // esfera suave: la normal es la posición
    g.scale(2.5 + azar() * 6, 0.5 + azar() * 1.1, 2 + azar() * 5);
    g.translate(x, NUBES + azar() * 0.8, z);
    nubes.push(g);
  }
  const algodon = new T.MeshStandardMaterial({ color: '#f1f4f8', roughness: 1 });
  const mar = mergeGeometries(nubes);
  superficie(mar, algodon, 0, 0, 0, 1, 1, 1, 8).castShadow = false;
  for (const g of [...nubes, mar, disco, octogono, tronco, media, cebolla, gajo, aro, via]) g.dispose();

  // En la cumbre no hay barcos: los de la maqueta quedan lejos de la vista.
  return {
    amarres: [
      [0, 0, -400],
      [1, 0, -400],
      [2, 0, -400],
    ],
    enSeco: [],
  };
}
