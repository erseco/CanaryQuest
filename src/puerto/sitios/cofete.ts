import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa } from './terreno';

const suave = (v: number) => {
  const k = Math.min(1, Math.max(0, v));
  return k * k * (3 - 2 * k);
};
/** Orilla de la playa: la z en la que la arena se mete en el agua, que entra y sale a lo largo de x. */
const ORILLA = { z: 19.9, vaiven: 1.2, onda: 0.09 };
const orilla = (x: number) => ORILLA.z + ORILLA.vaiven * Math.sin(x * ORILLA.onda);
/** Cumbre del macizo de Jandía: el pico de la Zarza a la izquierda, la degollada de Cofete tras el caserío. */
// Licencia: la pared se queda en una fracción de sus 800 m para que, al alejar la cámara, la cresta y
// la Zarza se recorten contra el cielo pintado.
const cumbre = (x: number) =>
  (19 +
    9 * Math.exp(-(((x + 36) / 8) ** 2)) -
    6 * Math.exp(-(((x - 6) / 6) ** 2)) +
    1.6 * Math.sin(x * 0.21) +
    1.1 * Math.sin(x * 0.53 + 1)) *
  (1 - 0.45 * suave((x - 14) / 26));
/** El relieve se allana antes de llegar al horizonte pintado. */
const lejos = (x: number, z: number) => suave((80 - Math.hypot(x, z)) / 12);
/** Playa, piedemonte y pared del macizo, sin el lomo de Agua Oveja. */
function llano(x: number, z: number): number {
  let y =
    z >= 8
      ? 0.35 - (z - 8) * 0.1 + 0.12 * Math.sin(x * ORILLA.onda) * suave((z - 17.6) / 2) - Math.max(0, z - 20.5) * 0.2
      : 0.35 + Math.min(8 - z, 29) * 0.2 + 0.18 * Math.sin(x * 0.9 + z * 0.4) * suave((8 - z) / 4);
  // Dunas bajas en la trasplaya, donde agarran los balancones.
  y += 0.3 * Math.max(0, Math.sin(x * 0.55 + Math.sin(z * 0.9) * 1.8)) * suave((z - 4) / 2) * (1 - suave((z - 9.5) / 2));
  // La Montañeta: el cerrito claro entre el caserío y la playa.
  const m = 1 - ((x - 18) ** 2 + (z - 5.5) ** 2) / 16;
  if (m > 0) y += 3.2 * m ** 0.8;
  // La pared del macizo se levanta a pico detrás de la casa, surcada de barrancos rectos hacia la playa.
  const t = -24 - z;
  if (t > 0) {
    const k = Math.min(1, t / 24);
    const surcos = 2.4 * (0.5 + 0.5 * Math.sin(x * 0.45 + Math.sin(z * 0.12) * 1.6)) * suave(t / 4) * (1 - 0.7 * k);
    y += Math.max(0, cumbre(x) * k ** 1.25 - Math.max(0, t - 24) * 1.2 - surcos) * lejos(x, z);
  }
  return y;
}
/** Cresta del lomo de Agua Oveja, que baja de la cumbre hacia el mar. */
const ejeLomo = (z: number) => 47 + z * 0.08;
/**
 * Lomo de Agua Oveja: cae hacia la playa por su ladera de levante y, al otro lado, se queda en una
 * meseta que acaba en acantilado sobre el mar. La pista de Morro Jable lo cruza por la degollada.
 */
function lomo(x: number, z: number): number {
  const d = x - ejeLomo(z),
    alto = z < -6 ? 5.6 + (-6 - z) * 0.45 : z < 4 ? 5.6 + 4.4 * suave((z + 6) / 10) : 10 - 12.5 * suave((z - 9) / 11);
  return (alto - (d < 0 ? -d * 0.5 : d * 0.12) + 0.4 * Math.sin(z * 0.7 + x * 0.3)) * (z < 4 ? lejos(x, z) : 1);
}
/** Al poniente del lomo ya no hay playa: solo roca. */
const ladera = (x: number, z: number) => (x > ejeLomo(z) ? lomo(x, z) : Math.max(llano(x, z), lomo(x, z)));

/**
 * Cofete (Jandía, Fuerteventura), trazado sobre la ortofoto PNOA y OpenStreetMap y comprimido a escala
 * de maqueta. La costa corre de estnordeste a oesuroeste con el mar al nornoroeste; se gira para que el
 * mar quede delante (+z), así que la izquierda (−x) es el nordeste y la derecha (+x) el suroeste. De
 * izquierda a derecha: la Casa Winter en la ladera, bajo el pico de la Zarza; el caserío en el llano, con
 * la Montañeta y el cementerio camino de la arena; la playa hasta el Roque del Moro y, en lo alto, la
 * degollada de Agua Oveja por la que baja la pista de Morro Jable. Las zonas pisables están en
 * `PUEBLOS.cofete.plano.suelos`; si se mueve una pieza por la que se camina, hay que mover su rectángulo.
 */
export function trazarCofete(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, teja } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const encalado = cal.clone();
  encalado.color.setRGB(1.42, 1.44, 1.5); // por encima de 1: la cal tira a blanco
  const basaltoVilla = tenido(adoquin, '#57544f'),
    piedraCasas = tenido(adoquin, '#85786b');
  const suelos = PUEBLOS.cofete.plano.suelos!;
  const blanco = '#f4f1ea',
    gris = '#9b958c',
    verde = '#2f4a3a';

  // --- Terreno: la ladera natural, amoldada a pistas y explanadas (la playa ya es la propia arena) ---
  const caminos = suelos.slice(1);
  const altura = (x: number, z: number) => {
    let cerca = Infinity,
      y = 0;
    for (const { r } of caminos) {
      const cx = Math.min(Math.max(x, r[0]), r[2]),
        cz = Math.min(Math.max(z, r[1]), r[3]),
        d = Math.hypot(x - cx, z - cz);
      if (d < cerca) {
        cerca = d;
        y = alturaPaseo(cx, cz, 'cofete');
      }
    }
    const k = suave((cerca - 0.9) / 3.5);
    return (y - 0.08) * (1 - k) + ladera(x, z) * k;
  };
  {
    const paso = 1.2,
      [x0, z0, x1, z1] = [-80, -80, 80, 34];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.35) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.35) * paso;
        p.push(new T.Vector3(x, altura(x, z), z));
      }
    /**
     * Color de cada faceta: arena, callaos de la trasplaya, abanicos claros, barrancos y lomos del macizo.
     * Las manchas siguen campos suaves; cada faceta solo alterna entre dos tonos casi iguales.
     */
    function tono(x: number, y: number, z: number, ny: number, n: number): string {
      const par = (a: string, b: string) => (n % 2 ? a : b);
      const campo = Math.sin(x * 0.21 + z * 0.13) + 0.8 * Math.sin(x * 0.07 - z * 0.19);
      const roca = x > ejeLomo(z) || lomo(x, z) > llano(x, z) + 0.02;
      // Arena, trasplaya y piedemonte se mezclan faceta a faceta en una franja de transición.
      z += ((n % 7) - 3) * 0.3;
      if (!roca && z > 7.2) return z > orilla(x) - 1.6 ? par('#bda57c', '#b9a178') : campo > 0.6 ? par('#e6d3a6', '#e2cfa2') : par('#dfcb9c', '#dbc798');
      if ((x - 18) ** 2 + (z - 5.5) ** 2 < 17) return par('#a8916f', '#a28b6a');
      if (!roca && z > 3.5) return z > 5.4 ? par('#c4af88', '#c0ab84') : campo > 0 ? par('#a8957a', '#a49176') : par('#857664', '#817260');
      if (roca) return ny < 0.55 ? par('#3f3833', '#3c3530') : campo > 0.9 ? par('#665a4e', '#62564b') : par('#4f4640', '#4c433d');
      if (z > -24 && y < 9) {
        if (Math.sin(x * 0.16 + 1.3) > 0.72 && z > -18) return par('#8a7963', '#86755f');
        return campo > 0.7 ? par('#5f5449', '#5b5046') : campo < -0.7 ? par('#4a423c', '#473f39') : par('#544a42', '#51473f');
      }
      const vena = Math.sin(x * 0.45 + Math.sin(z * 0.12) * 1.6);
      if (Math.sin(x * 0.23 + z * 0.05) > 0.82) return par('#6a5243', '#664e40');
      if (y > 22) return par('#5c524b', '#584e47');
      if (vena > 0.55) return par('#3f3832', '#3c3530');
      if (vena < -0.4) return campo > 0 ? par('#695a4c', '#655649') : par('#5f5247', '#5b4e44');
      return ny > 0.86 && y < 16 ? par('#5d5a44', '#595641') : par('#544a43', '#504640');
    }
    const capas = new Map<string, number[]>();
    const normal = new T.Vector3(),
      lado = new T.Vector3();
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i,
          b = a + 1,
          c = a + nx + 1,
          d = c + 1;
        for (const tri of (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]]) {
          const [u, v, w] = tri.map((n) => p[n]);
          // Ni el fondo del mar ni lo que asomaría por detrás del horizonte pintado.
          if (Math.max(u.y, v.y, w.y) < -1.2) continue;
          const cx = (u.x + v.x + w.x) / 3,
            cz = (u.z + v.z + w.z) / 3;
          if (Math.hypot(cx, cz) > 76) continue;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          const color = tono(cx, (u.y + v.y + w.y) / 3, cz, Math.abs(normal.y), Math.floor(azar() * 60));
          if (!capas.has(color)) capas.set(color, []);
          for (const q of [u, v, w]) capas.get(color)!.push(q.x, q.y, q.z);
        }
      }
    for (const [color, vertices] of capas) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      pieza(geo, color, 0, 0, 0, 1, 1, 1);
      geo.dispose();
    }
  }
  // Firme: tierra apisonada en las pistas, grava en las explanadas de la casa. Zaguán y patio van con la casa.
  suelos.forEach((s, i) => {
    if (i === 0 || i === 8 || i === 9) return;
    losa(t, s, i >= 5 && i <= 7 ? '#8f7b65' : '#9d8a70', 0.3);
  });
  /** Pista que no se pisa: una cinta que sigue el terreno a lo largo de una línea. */
  function cinta(puntos: [number, number][], ancho: number, color: string) {
    const bordes: [number, number, number][][] = [];
    for (let i = 1; i < puntos.length; i++) {
      const [ax, az] = puntos[i - 1],
        [bx, bz] = puntos[i],
        largo = Math.hypot(bx - ax, bz - az),
        [nx, nz] = [((bz - az) / largo) * (ancho / 2), (-(bx - ax) / largo) * (ancho / 2)];
      const pasos = Math.ceil(largo / 0.4);
      for (let k = i === 1 ? 0 : 1; k <= pasos; k++) {
        const x = ax + ((bx - ax) * k) / pasos,
          z = az + ((bz - az) * k) / pasos;
        bordes.push([1, -1].map((s) => [x + s * nx, altura(x + s * nx, z + s * nz) + 0.16, z + s * nz]));
      }
    }
    const vertices: number[] = [];
    for (let k = 1; k < bordes.length; k++) {
      const [a, b] = bordes[k - 1],
        [c, d] = bordes[k];
      vertices.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    pieza(geo, color, 0, 0, 0, 1, 1, 1);
    geo.dispose();
  }
  // La pista sigue por la degollada y baja por el otro lado, hacia Morro Jable.
  cinta(
    [
      [38.5, -3.5],
      [42, -4.4],
      [46.6, -5.6],
      [49.5, -7.4],
      [53, -10],
      [56, -13],
    ],
    2.2,
    '#9d8a70',
  );
  /** Pared de piedra seca a lo largo de una línea, posada en el terreno. */
  function pared(puntos: [number, number][], alto = 0.5) {
    for (let i = 1; i < puntos.length; i++) {
      const [ax, az] = puntos[i - 1],
        [bx, bz] = puntos[i];
      const pasos = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.34);
      for (let k = 0; k < pasos; k++) {
        const x = ax + ((bx - ax) * k) / pasos,
          z = az + ((bz - az) * k) / pasos,
          y = altura(x, z);
        for (let fila = 0; fila < 2; fila++) {
          const s = (0.26 + azar() * 0.12) * (fila ? 0.85 : 1);
          pieza(
            caja,
            ['#5b524b', '#6d6157', '#4b4440', '#7a6c5f'][Math.floor(azar() * 4)],
            x + (azar() - 0.5) * 0.08,
            y + (fila + 0.5) * alto * 0.5,
            z + (azar() - 0.5) * 0.08,
            s,
            alto * 0.55,
            s * 0.9,
            azar() * 0.3,
            azar() * 3,
            azar() * 0.3,
          );
        }
      }
    }
  }

  // --- Materiales que se hornean aparte: cal, basalto de la casa, piedra del caserío y tejas ---
  const muros: T.BufferGeometry[] = [],
    zocalo: T.BufferGeometry[] = [],
    mamposteria: T.BufferGeometry[] = [],
    tejas: T.BufferGeometry[] = [];
  const bloque = (lista: T.BufferGeometry[], x: number, y: number, z: number, w: number, h: number, d: number) =>
    lista.push(new T.BoxGeometry(w, h, d).translate(x, y, z));
  const cilindro = (lista: T.BufferGeometry[], x: number, y: number, z: number, r: number, h: number) =>
    lista.push(new T.CylinderGeometry(r, r, h, 20, 1, true).translate(x, y, z));
  const triangulos = (puntos: number[][]) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(puntos.flat(), 3));
    g.computeVertexNormals();
    return g;
  };
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
  /** Tejado de teja a dos aguas con alero; los hastiales de los extremos van encalados. */
  function tejado(x0: number, z0: number, x1: number, z1: number, y: number, alto: number, largoX: boolean) {
    const v = 0.35;
    const [a0, a1, b0, b1] = largoX ? [x0 - v, x1 + v, z0 - v, z1 + v] : [z0 - v, z1 + v, x0 - v, x1 + v];
    const bm = (b0 + b1) / 2,
      cima = y + alto,
      borde = y - 0.05;
    const p = (a: number, h: number, b: number) => (largoX ? [a, h, b] : [b, h, a]);
    tejas.push(
      triangulos([
        ...[p(a0, borde, b0), p(a1, borde, b0), p(a1, cima, bm), p(a0, borde, b0), p(a1, cima, bm), p(a0, cima, bm)],
        ...[p(a0, borde, b1), p(a0, cima, bm), p(a1, cima, bm), p(a0, borde, b1), p(a1, cima, bm), p(a1, borde, b1)],
      ]),
    );
    for (const a of largoX ? [x0, x1] : [z0, z1])
      muros.push(triangulos([p(a, y + 0.1, b0 + v), p(a, y + 0.1, b1 - v), p(a, cima - 0.12, bm)]));
  }
  /** Hueco en arco sobre una fachada que mira a `eje` en sentido `s`: rectángulo y medio punto. */
  function arco(x: number, y: number, z: number, eje: 'x' | 'z', s: number, ancho: number, alto: number, color: string) {
    const ox = eje === 'x' ? s * 0.03 : 0,
      oz = eje === 'z' ? s * 0.03 : 0;
    pieza(caja, color, x + ox, y + alto / 2, z + oz, eje === 'z' ? ancho : 0.05, alto, eje === 'z' ? 0.05 : ancho);
    pieza(poste, color, x + ox, y + alto, z + oz, ancho * 0.94, 0.05, ancho * 0.94, eje === 'z' ? Math.PI / 2 : 0, 0, eje === 'x' ? Math.PI / 2 : 0);
  }
  /** Ventana de la casa: marco claro, postigos verdes en arco y alféizar. */
  function ventana(x: number, y: number, z: number, eje: 'x' | 'z', s: number, cristal = false) {
    arco(x, y, z, eje, s, 0.78, 0.8, '#e6e1d6');
    arco(x + (eje === 'x' ? s * 0.02 : 0), y + 0.04, z + (eje === 'z' ? s * 0.02 : 0), eje, s, 0.6, 0.74, verde);
    if (cristal) ventanas.push([x + (eje === 'x' ? s * 0.07 : 0), y + 0.45, z + (eje === 'z' ? s * 0.07 : 0), eje === 'z' ? 0.36 : 0.03, 0.5, eje === 'z' ? 0.03 : 0.36]);
    pieza(caja, '#d6d0c4', x + (eje === 'x' ? s * 0.08 : 0), y - 0.04, z + (eje === 'z' ? s * 0.08 : 0), eje === 'z' ? 0.9 : 0.18, 0.08, eje === 'z' ? 0.18 : 0.9);
  }

  // --- Casa Winter: patio rodeado de cuatro alas, zócalo de basalto, torre redonda y galería al mar ---
  const X0 = -26,
    X1 = -10.5,
    Z0 = -22,
    Z1 = -10.5,
    PISO = 6,
    ALERO = 8.6,
    BASE = 3.2;
  const PX0 = -22,
    PX1 = -14.5,
    PZ0 = -19,
    PZ1 = -13.5;
  // El zócalo de piedra corre bajo toda la planta; asoma por delante, donde la ladera cae hacia el mar.
  bloque(zocalo, (X0 + X1) / 2, (BASE + PISO) / 2, (Z0 + Z1) / 2, X1 - X0, PISO - BASE, Z1 - Z0);
  // Terraza volada ante la galería, sobre su propio muro de piedra.
  const GX0 = -24.4,
    GX1 = -18.4;
  bloque(zocalo, (GX0 + GX1) / 2, (BASE + PISO) / 2, -9.85, GX1 - GX0, PISO - BASE, 1.3);
  pieza(caja, '#b9afa1', (GX0 + GX1) / 2, PISO + 0.03, -10.35, GX1 - GX0 + 0.1, 0.08, 2.4);
  pieza(caja, '#e9e4da', (X0 + X1) / 2, PISO + 0.02, Z1 + 0.04, X1 - X0, 0.12, 0.1);
  // Alas encaladas, con el muro un palmo por encima del alero para que no quede rendija bajo la teja.
  const tope = ALERO + 0.12,
    planta = tope - PISO;
  const ala = (x0: number, z0: number, x1: number, z1: number) =>
    bloque(muros, (x0 + x1) / 2, PISO + planta / 2, (z0 + z1) / 2, x1 - x0, planta, z1 - z0);
  ala(X0, PZ1, GX0, Z1); // esquina de la torre
  ala(GX0, PZ1, GX1, -11.5); // fondo de la galería
  ala(GX1, PZ1, PX1, Z1); // tramo del balcón
  ala(X0, Z0, PX1, PZ0); // ala trasera
  ala(X0, PZ0, PX0, PZ1); // ala izquierda
  ala(PX1, Z0, X1, -18.3); // ala derecha, a los lados del zaguán
  ala(PX1, -16.7, X1, Z1);
  bloque(muros, (PX1 + X1) / 2, (8 + tope) / 2, -17.5, X1 - PX1, tope - 8, 1.6); // dintel del zaguán
  // Galería: cinco arcos sobre pilares, con el fondo en sombra.
  pieza(caja, '#5a4e46', (GX0 + GX1) / 2, PISO + 0.95, -11.48, GX1 - GX0 - 0.2, 1.9, 0.02);
  const luzArco = (GX1 - GX0 - 0.26) / 5;
  for (let i = 0; i <= 5; i++) bloque(muros, GX0 + 0.13 + i * luzArco, PISO + 0.62, -10.65, 0.26, 1.24, 0.3);
  bloque(muros, (GX0 + GX1) / 2, (PISO + 1.24 + tope) / 2, -10.65, GX1 - GX0, tope - PISO - 1.24, 0.3);
  // Medio punto de cada arco: un semicírculo en sombra sobre la línea de los pilares.
  const semicirculo = new T.CylinderGeometry(1, 1, 1, 12, 1, false, -Math.PI / 2, Math.PI);
  for (let i = 0; i < 5; i++)
    pieza(semicirculo, '#4a3f38', GX0 + 0.13 + (i + 0.5) * luzArco, PISO + 1.22, -10.49, (luzArco - 0.26) / 2, 0.03, (luzArco - 0.26) / 2, -Math.PI / 2);
  semicirculo.dispose();
  // Balaustrada de piedra gris con bolas en los pilares, como la de la terraza.
  for (const [x0, z0, x1, z1] of [
    [GX0, -9.25, GX1, -9.25],
    [GX1, -10.5, GX1, -9.25],
  ]) {
    const largo = Math.hypot(x1 - x0, z1 - z0),
      enX = x1 !== x0;
    pieza(caja, gris, (x0 + x1) / 2, PISO + 0.12, (z0 + z1) / 2, enX ? largo : 0.2, 0.1, enX ? 0.2 : largo);
    pieza(caja, gris, (x0 + x1) / 2, PISO + 0.72, (z0 + z1) / 2, enX ? largo : 0.2, 0.09, enX ? 0.2 : largo);
    for (let k = 0.15; k < largo; k += 0.24)
      pieza(poste, '#a7a198', enX ? x0 + k : x0, PISO + 0.42, enX ? z0 : z0 + k, 0.1, 0.52, 0.1);
  }
  for (const [x, z] of [
    [GX0, -9.25],
    [(GX0 + GX1) / 2, -9.25],
    [GX1, -9.25],
    [GX1, -10.45],
  ]) {
    pieza(caja, '#8f8981', x, PISO + 0.42, z, 0.24, 0.84, 0.24);
    pieza(esfera, '#a7a198', x, PISO + 1, z, 0.13, 0.13, 0.13);
  }
  // Mástil con la bandera hecha jirones por el viento del nordeste.
  pieza(poste, '#6b6258', GX1 - 0.5, PISO + 1.7, -9.6, 0.05, 3.4, 0.05);
  pieza(caja, '#efece4', GX1 - 0.05, PISO + 3.15, -9.6, 0.8, 0.32, 0.02, 0, 0.15, -0.12);
  // Tramo del balcón: puerta verde y barandilla de hierro.
  pieza(caja, '#e6e1d6', -16.5, PISO + 0.95, Z1 + 0.03, 1, 1.95, 0.05);
  pieza(caja, verde, -16.5, PISO + 0.92, Z1 + 0.05, 0.78, 1.82, 0.05);
  pieza(caja, '#cfc9bd', -16.5, PISO + 0.03, Z1 + 0.35, 2.4, 0.08, 0.7);
  pieza(caja, '#2d2f2f', -16.5, PISO + 0.85, Z1 + 0.68, 2.4, 0.05, 0.04);
  for (let k = 0; k <= 12; k++) pieza(caja, '#2d2f2f', -17.7 + k * 0.2, PISO + 0.45, Z1 + 0.68, 0.03, 0.8, 0.03);
  // Ala derecha: hastial al mar con dos ventanas y un ojo de buey; puerta en arco en el zócalo.
  for (const x of [-13.5, -11.5]) ventana(x, PISO + 0.6, Z1, 'z', 1);
  pieza(poste, '#4a3f38', -12.5, ALERO + 0.55, Z1 + 0.03, 0.36, 0.04, 0.36, Math.PI / 2);
  arco(-12.5, 3.8, Z1, 'z', 1, 1, 1.15, '#e6e1d6');
  arco(-12.5, 3.8, Z1 + 0.02, 'z', 1, 0.8, 1.1, '#5a3b2a');
  for (const x of [-15.6, -20.3, -23.2]) arco(x, 4.45, x < GX1 ? -9.2 : Z1, 'z', 1, 0.5, 0.55, '#3b3430');
  // Costado derecho: ventanas en arco y la gran portada del zaguán, encalada con piedras a la vista.
  for (const z of [-20.6, -14.8, -12.4]) ventana(X1, PISO + 0.6, z, 'x', 1);
  for (const xf of [X1, PX1])
    for (const s of [-1, 1]) pieza(caja, blanco, xf, 7.85, -17.5 + s * 0.75, 0.3, 0.5, 0.5, Math.PI / 4);
  for (let k = 0; k <= 8; k++) {
    const a = (Math.PI * k) / 8;
    pieza(esfera, '#8a8580', X1 + 0.05, 7.25 + Math.sin(a) * 1.05, -17.5 + Math.cos(a) * 1.05, 0.06, 0.12, 0.17);
  }
  for (const [y, z] of [
    [6.6, -19.4],
    [7.5, -19.7],
    [6.9, -15.6],
    [7.9, -15.2],
  ])
    pieza(esfera, '#8a8580', X1 + 0.05, y, z, 0.06, 0.13, 0.19);
  pieza(caja, '#d8572f', X1 + 0.04, 7, -15.8, 0.03, 0.45, 0.7); // cartel del museo
  pieza(caja, '#f1e9da', X1 + 0.06, 7, -15.8, 0.02, 0.1, 0.55);
  // Fachada trasera y costado izquierdo, más cerrados.
  for (const x of [-24, -20.5, -17, -13]) ventana(x, PISO + 0.6, Z0, 'z', -1);
  for (const z of [-20.2, -16.2, -13]) ventana(X0, PISO + 0.6, z, 'x', -1);
  // Canecillos de madera bajo el alero, a la vista en la fachada y el costado.
  for (let x = X0 + 0.3; x < X1; x += 0.62) pieza(caja, '#4a3528', x, ALERO - 0.06, Z1 + 0.22, 0.08, 0.1, 0.4);
  for (let z = Z0 + 0.3; z < Z1; z += 0.62) pieza(caja, '#4a3528', X1 + 0.22, ALERO - 0.06, z, 0.4, 0.1, 0.08);
  // Cubiertas de teja: el ala derecha a dos aguas con su hastial al mar; las demás, alrededor del patio.
  tejado(PX1, Z0, X1, Z1, ALERO, 1.35, false);
  tejado(X0, PZ1, PX1, Z1, ALERO, 1.05, true);
  tejado(X0, Z0, PX1, PZ0, ALERO, 1.05, true);
  tejado(X0, PZ0, PX0, PZ1, ALERO, 1.15, false);
  bloque(muros, -19.5, ALERO + 1.2, -20.4, 0.55, 1.5, 0.55); // chimenea
  pieza(caja, '#a65d43', -19.5, ALERO + 2, -20.4, 0.75, 0.1, 0.75);
  // Torre: fuste encalado sobre basa de piedra, mirador con arcos, cornisa ocre y el farol de las leyendas.
  const TX = -26.2,
    TZ = -10.6,
    TR = 1.6,
    CIMA = 12.9;
  const disco = new T.CylinderGeometry(1, 1, 1, 20);
  cilindro(zocalo, TX, (BASE + PISO) / 2, TZ, TR + 0.08, PISO - BASE);
  cilindro(muros, TX, (PISO + CIMA) / 2, TZ, TR, CIMA - PISO);
  pieza(disco, '#d9d3c7', TX, CIMA - 0.2, TZ, TR - 0.05, 0.4, TR - 0.05); // azotea bajo el pretil
  for (const [y, r, color] of [
    [PISO + 0.05, TR + 0.1, '#e9e4da'],
    [ALERO + 0.2, TR + 0.08, '#e9e4da'],
    [CIMA, TR + 0.17, '#cf9f74'],
  ] as const)
    pieza(disco, color, TX, y, TZ, r, 0.16, r);
  // Pretil ocre, hueco por dentro: un anillo de almenas bajas.
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    pieza(caja, '#dcb28a', TX + Math.cos(a) * (TR + 0.05), CIMA + 0.3, TZ + Math.sin(a) * (TR + 0.05), 0.66, 0.44, 0.16, 0, Math.PI / 2 - a);
  }
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8,
      x = TX + Math.cos(a) * (TR + 0.01),
      z = TZ + Math.sin(a) * (TR + 0.01);
    pieza(caja, '#3f3732', x, 11.55, z, 0.4, 0.75, 0.06, 0, Math.PI / 2 - a);
    pieza(esfera, '#3f3732', x, 11.93, z, 0.2, 0.2, 0.05, 0, Math.PI / 2 - a);
    if (k % 2) pieza(caja, '#3f3732', x, 9.5, z, 0.22, 0.55, 0.06, 0, Math.PI / 2 - a);
  }
  pieza(poste, '#3a3a3a', TX, CIMA + 0.85, TZ, 0.06, 0.8, 0.06);
  ventanas.push([TX, CIMA + 1.35, TZ, 0.24, 0.3, 0.24]);
  pieza(piramide, '#3a3a3a', TX, CIMA + 1.62, TZ, 0.24, 0.22, 0.24, 0, Math.PI / 4);
  disco.dispose();
  // Patio: suelo de tierra, galerías de arcos, muretes ocres, la bomba azul y una rueda de carro.
  pieza(caja, '#a98d6c', (PX0 + PX1) / 2, PISO + 0.02, (PZ0 + PZ1) / 2, PX1 - PX0, 0.06, PZ1 - PZ0);
  pieza(caja, '#a98d6c', (PX1 + X1) / 2, PISO + 0.02, -17.5, X1 - PX1, 0.06, 1.6);
  for (const x of [-20.6, -18.25, -15.9]) {
    arco(x, PISO, PZ1, 'z', -1, 1.4, 1.3, '#4f453e');
    arco(x, PISO, PZ0, 'z', 1, 1.4, 1.3, '#4f453e');
  }
  for (const z of [-17.6, -14.9]) arco(PX0, PISO, z, 'x', 1, 1.4, 1.3, '#4f453e');
  for (const [x, z, w, d] of [
    [-18.25, PZ1 - 0.15, 6, 0.18],
    [-18.25, PZ0 + 0.15, 6, 0.18],
  ])
    pieza(caja, '#c98e5e', x, PISO + 0.25, z, w, 0.5, d);
  pieza(poste, '#4fa3c7', -21.2, PISO + 0.6, -18.2, 0.26, 1.2, 0.26);
  pieza(caja, '#4fa3c7', -21, PISO + 1.05, -18.2, 0.4, 0.08, 0.08);
  pieza(poste, '#3b8fb3', -21.2, PISO + 0.12, -18.2, 0.5, 0.24, 0.5);
  const rueda = new T.TorusGeometry(0.5, 0.05, 5, 14);
  pieza(rueda, '#5b4636', -15.3, PISO + 0.52, -18.85, 1, 1, 1);
  for (let k = 0; k < 4; k++) pieza(caja, '#5b4636', -15.3, PISO + 0.52, -18.85, 0.04, 0.95, 0.04, 0, 0, (k * Math.PI) / 4);
  rueda.dispose();
  for (const [x, z] of [
    [-21.3, -14.2],
    [-15, -14.2],
  ])
    for (let k = 0; k < 7; k++)
      pieza(piramide, k % 2 ? '#5d7f5a' : '#6f9065', x, PISO + 0.35, z, 0.07, 0.75, 0.07, Math.cos(k * 0.9) * 0.6, 0, Math.sin(k * 0.9) * 0.6);
  // Bancales de piedra seca que bajan de la casa hacia el llano, y la pared que acompaña la pista.
  pared([
    [-27.6, -5],
    [-19, -5.2],
    [-10.8, -5],
  ]);
  pared([
    [-28.5, -3],
    [-20, -3.3],
    [-11, -3],
  ]);
  pared([
    [-28, -1],
    [-19, -1.3],
    [-12, -0.9],
  ]);
  pared([
    [-10.6, 0.4],
    [-0.5, 0.4],
  ]);
  pared([
    [-5.6, -23.5],
    [-5.6, -16],
  ]);
  pared([
    [-5.5, -10.6],
    [5, -11.4],
    [16, -11.8],
  ]);
  pared([
    [22, -5.8],
    [30, -7.4],
  ]);
  pared([
    [20, -10.2],
    [32, -12.4],
  ]);
  // Una higuera y un tarajal junto a la casa, doblados por el viento.
  for (const [x, z, h] of [
    [-28.4, -7.2, 1.6],
    [-8.4, -24.4, 1.3],
    [2.6, -6.2, 1.4],
  ]) {
    const y = altura(x, z);
    pieza(poste, '#5a4636', x, y + h / 2, z, 0.16, h, 0.16, 0, 0, -0.18);
    for (let k = 0; k < 5; k++)
      pieza(esfera, k % 2 ? '#5f7348' : '#728653', x + 0.35 + (azar() - 0.3) * 0.9, y + h + (azar() - 0.4) * 0.5, z + (azar() - 0.5) * 0.9, 0.55, 0.38, 0.5);
  }

  // --- El caserío: casas bajas de piedra o de cal, de azotea o con tejadillo de chapa ---
  const carpinteria = ['#3f6b4f', '#3a6489', '#7a4f33', '#4f7f8f'];
  function casita(x: number, z: number, w: number, d: number, h: number, frente: number, piedra: boolean, techo?: string) {
    const fz = z + (frente * d) / 2,
      base = altura(x, fz + frente * 0.6) - 0.04;
    bloque(piedra ? mamposteria : muros, x, base + (h - 0.8) / 2, z, w, h + 0.8, d);
    const tono = carpinteria[Math.abs(Math.round(x * 7 + z)) % 4];
    if (techo) pieza(caja, techo, x, base + h + 0.14, z, w + 0.3, 0.07, d + 0.3, frente * 0.12);
    else {
      pieza(caja, piedra ? '#8f8173' : '#ebe6da', x, base + h + 0.03, z, w + 0.06, 0.08, d + 0.06);
      for (const s of [-1, 1]) {
        pieza(caja, piedra ? '#7d7064' : blanco, x, base + h + 0.17, z + (s * d) / 2, w + 0.06, 0.28, 0.12);
        pieza(caja, piedra ? '#7d7064' : blanco, x + (s * w) / 2, base + h + 0.17, z, 0.12, 0.28, d);
      }
    }
    pieza(caja, tono, x - w * 0.2, base + 0.72, fz + frente * 0.03, 0.62, 1.44, 0.05);
    pieza(caja, piedra ? '#c9bfae' : '#d9d2c4', x + w * 0.22, base + 1.25, fz + frente * 0.03, 0.66, 0.7, 0.05);
    pieza(caja, tono, x + w * 0.22, base + 1.25, fz + frente * 0.05, 0.5, 0.56, 0.05);
    ventanas.push([x + w * 0.22, base + 1.25, fz + frente * 0.07, 0.34, 0.4, 0.03]);
    // Ventanuco con postigo en la fachada de atrás y en un costado.
    const tz = z - (frente * d) / 2;
    pieza(caja, tono, x - w * 0.15, base + 1.35, tz - frente * 0.03, 0.46, 0.5, 0.05);
    pieza(caja, tono, x + w / 2 + 0.03, base + 1.35, z, 0.05, 0.5, 0.46);
  }
  casita(5.6, -6.2, 3.2, 3, 2.3, 1, false);
  casita(9.4, -6.4, 3.6, 3.2, 2.5, 1, true);
  casita(13.4, -6.1, 3.4, 2.8, 2.3, 1, false, '#9c4a3a');
  casita(18.6, -6.6, 3, 3, 2.2, 1, true);
  casita(1.8, 1.9, 3.2, 2.8, 2.3, -1, true, '#4f7a5a');
  casita(10.6, 1.9, 3.4, 2.8, 2.4, -1, false);
  casita(-1.4, -7.8, 2.6, 2.4, 2, 1, true);
  casita(22.6, 2.4, 2.8, 2.6, 2.1, -1, false);
  // El bar del caserío: emparrado de madera junto a la casa del tejadillo rojo, con sus mesas.
  for (const [x, z] of [
    [15.4, -4.5],
    [17.2, -4.5],
    [15.4, -7.2],
    [17.2, -7.2],
  ])
    pieza(poste, madera, x, altura(x, z) + 1.05, z, 0.07, 2.1, 0.07);
  for (let k = 0; k < 6; k++) pieza(caja, madera, 16.3, altura(16.3, -5.8) + 2.12, -4.6 - k * 0.5, 2, 0.06, 0.08);
  for (const [x, z] of [
    [15.9, -5.4],
    [16.8, -6.5],
  ]) {
    const y = altura(x, z);
    pieza(poste, '#d8d2c4', x, y + 0.66, z, 0.6, 0.05, 0.6);
    pieza(poste, '#6b5a4a', x, y + 0.33, z, 0.06, 0.66, 0.06);
  }
  // Una casa vieja sin techo, solo con sus muros de piedra.
  {
    const x = 26,
      z = -8.6,
      y = altura(x, z);
    for (const [dx, dz, w, d] of [
      [0, -1.2, 3, 0.3],
      [-1.35, 0, 0.3, 2.4],
      [1.35, 0, 0.3, 2.4],
      [0.9, 1.2, 1.2, 0.3],
    ])
      bloque(mamposteria, x + dx, y + 0.5, z + dz, w, 1.6 - Math.abs(dx) * 0.25, d);
  }
  // Gambuesa redonda para encerrar las cabras.
  {
    const puntos: [number, number][] = [];
    for (let k = 0; k <= 22; k++) puntos.push([26.5 + Math.cos(k * 0.27) * 2.4, 4.2 + Math.sin(k * 0.27) * 2.4]);
    pared(puntos, 0.7);
  }

  // --- Cementerio de Cofete: muro bajo encalado entre la arena, tumbas de piedras y cruces de madera ---
  const [c0x, c0z, c1x, c1z] = [8.5, 10, 14, 13.5];
  for (let x = c0x; x < c1x; x += 0.5)
    for (const z of [c0z, c1z]) pieza(caja, azar() > 0.25 ? '#e2dbcb' : '#8b7d6c', x + 0.25, altura(x + 0.25, z) + 0.18, z, 0.52, 0.45, 0.22);
  for (let z = c0z; z < c1z; z += 0.5)
    for (const x of [c0x, c1x]) {
      if (x === c0x && z > 11 && z < 12.4) continue; // la entrada
      pieza(caja, azar() > 0.25 ? '#e2dbcb' : '#8b7d6c', x, altura(x, z + 0.25) + 0.18, z + 0.25, 0.22, 0.45, 0.52);
    }
  for (const z of [11.05, 12.45]) {
    const y = altura(c0x, z);
    pieza(caja, blanco, c0x, y + 0.45, z, 0.32, 0.9, 0.32);
    pieza(caja, '#5b4636', c0x, y + 1.02, z, 0.05, 0.3, 0.05);
    pieza(caja, '#5b4636', c0x, y + 1.08, z, 0.05, 0.05, 0.2);
  }
  pieza(caja, '#2f2b28', c0x + 0.1, altura(c0x, 11.75) + 0.35, 12.1, 0.04, 0.6, 0.6, 0, 0.5); // cancela abierta
  pieza(caja, '#4a4540', c0x - 0.05, altura(c0x, 10.6) + 0.55, 10.6, 0.04, 0.3, 0.4); // placa con los nombres
  // La arena se amontona contra el muro y se cuela por encima.
  for (let i = 0; i < 16; i++) {
    const enZ = i % 2 === 0,
      k = azar();
    const x = enZ ? c0x + k * (c1x - c0x) : i % 4 === 1 ? c1x + 0.3 : c0x - 0.3,
      z = enZ ? (i % 4 === 0 ? c0z - 0.35 : c1z + 0.35) : c0z + k * (c1z - c0z);
    if (!enZ && x < c1x && z > 10.8 && z < 12.6) continue;
    pieza(esfera, '#d9c69e', x, altura(x, z) - 0.05, z, 0.8 + azar() * 0.6, 0.28, 0.6 + azar() * 0.4);
  }
  // Tumbas en filas: un túmulo de piedras, su cruz de madera y, alguna, una lápida blanca.
  for (let i = 0; i < 12; i++) {
    const gx = 9.6 + (i % 4) * 1.2 + (azar() - 0.5) * 0.2,
      gz = 10.7 + Math.floor(i / 4) * 1.05,
      y = altura(gx, gz);
    pieza(esfera, '#d2be97', gx, y + 0.02, gz, 0.55, 0.14, 0.32);
    for (let k = 0; k < 6; k++)
      pieza(esfera, ['#5a524c', '#7a6e62', '#4a4440'][k % 3], gx - 0.4 + k * 0.16, y + 0.1, gz + (k % 2 ? 0.22 : -0.22), 0.1, 0.08, 0.1);
    if (i % 5 === 2) pieza(caja, '#ece7dc', gx - 0.5, y + 0.3, gz, 0.08, 0.55, 0.38);
    else {
      pieza(caja, i % 3 ? '#6b4f3a' : '#4a3a2e', gx - 0.5, y + 0.36, gz, 0.05, 0.7, 0.05, 0, 0, (azar() - 0.5) * 0.25);
      pieza(caja, i % 3 ? '#6b4f3a' : '#4a3a2e', gx - 0.5, y + 0.52, gz, 0.05, 0.05, 0.32);
    }
  }
  // Nichos encalados al fondo.
  {
    const y = altura(13.4, 11.75);
    pieza(caja, '#efebe2', 13.5, y + 0.5, 11.75, 0.7, 1.05, 2.2);
    for (const z of [11.15, 11.75, 12.35]) pieza(caja, '#cfc6b4', 13.14, y + 0.55, z, 0.03, 0.42, 0.5);
    pieza(caja, '#c9c2b4', 13.5, y + 1.06, 11.75, 0.85, 0.08, 2.35);
  }
  // Cartel de peligro a la entrada de la playa: corrientes y resaca.
  {
    const x = 4.4,
      z = 9.4,
      y = altura(x, z);
    pieza(poste, '#6b6258', x, y + 0.8, z, 0.06, 1.6, 0.06);
    pieza(caja, '#c8402f', x, y + 1.5, z, 0.7, 0.45, 0.04);
    pieza(caja, '#f1e9da', x, y + 1.5, z + 0.025, 0.5, 0.08, 0.02);
  }

  // --- El Roque del Moro, al final de la arena, y la rasa de roca bajo la sierra ---
  const prisma = new T.CylinderGeometry(0.62, 1, 1, 6);
  {
    const rx = 41.5,
      rz = 18.9;
    pieza(prisma, '#2f2927', rx, 0.5, rz, 2.7, 3, 1.9, 0, 0.4);
    pieza(prisma, '#3a322e', rx + 0.3, 2.9, rz - 0.1, 2, 2.2, 1.5, 0.05, 1.1, -0.04);
    pieza(prisma, '#2b2523', rx - 0.2, 4.5, rz + 0.05, 1.3, 1.5, 1.05, 0, 0.5, 0.07);
    pieza(prisma, '#352e2b', rx + 1.9, 0.2, rz + 0.6, 1.3, 1.8, 1.1, 0, 0.9, 0.1);
    // Rasa: lajas de roca apenas fuera del agua, y espuma blanca donde rompen contra ellas.
    for (let i = 0; i < 26; i++) {
      const x = 40 + azar() * 12,
        z = 17.5 + azar() * 5;
      pieza(esfera, i % 2 ? '#3d3532' : '#4a413c', x, -0.86, z, 0.8 + azar() * 1.1, 0.1 + azar() * 0.1, 0.6 + azar() * 0.7, 0, azar() * 3);
    }
  }
  // La cumbre de la Zarza, con su remate de roca.
  {
    const x = -36,
      z = -52,
      y = altura(x, z);
    pieza(prisma, '#4f4741', x, y + 0.6, z, 3.4, 2.6, 3, 0, 0.3);
    pieza(prisma, '#5a5049', x + 0.6, y + 2, z + 0.3, 1.8, 1.6, 1.6, 0.06, 1, -0.05);
  }
  prisma.dispose();
  // Poste indicador en la degollada.
  {
    const x = 38.6,
      z = -0.6,
      y = altura(x, z);
    pieza(poste, madera, x, y + 0.65, z, 0.1, 1.3, 0.1);
    pieza(caja, madera, x + 0.25, y + 1.12, z, 0.9, 0.22, 0.05, 0, 0.3);
    pieza(piramide, '#5f4532', x + 0.75, y + 1.12, z - 0.15, 0.14, 0.2, 0.05, 0, 0.3, -Math.PI / 2);
  }

  // --- Matorral, piedras sueltas y cabras majoreras por las laderas ---
  const libre = (x: number, z: number, margen: number) =>
    !suelos.some(({ r }) => x > r[0] - margen && x < r[2] + margen && z > r[1] - margen && z < r[3] + margen) &&
    !(x > X0 - 2 && x < X1 + 0.5 && z > Z0 - 1 && z < Z1 + 1.5) &&
    !(x > 0 && x < 24 && z > -8.5 && z < 3.5) &&
    !(x > c0x - 1 && x < c1x + 1 && z > c0z - 1 && z < c1z + 1);
  for (let i = 0; i < 520; i++) {
    const x = -70 + azar() * 116,
      z = -34 + azar() * 43,
      y = altura(x, z);
    if (Math.hypot(x, z) > 72 || !libre(x, z, 0.7) || (z > 9.5 && y < 0.5) || (y > 10 && i % 4)) continue;
    if (i % 3) {
      // Balancones y aulagas, grises y redondos, más espesos en la trasplaya; en la montaña, ralos.
      const r = 0.14 + azar() * (z > 3 ? 0.36 : 0.2);
      pieza(esfera, ['#8b8f63', '#9c9a6a', '#787f58', '#a5a07a'][i % 4], x, y + r * 0.45, z, r * 1.2, r * 0.75, r);
    } else {
      const r = 0.12 + azar() * 0.22;
      pieza(esfera, azar() > 0.5 ? '#3f3a37' : '#5a504a', x, y + r * 0.3, z, r * 1.2, r * 0.8, r);
    }
  }
  /** Cabra majorera: cuerpo, cabeza, patas y cuernos, mirando hacia `giro`. */
  function cabra(x: number, z: number, giro: number, pelo: string, cara: string) {
    const y = altura(x, z),
      s = Math.sin(giro),
      c = Math.cos(giro);
    const en = (a: number, b: number): [number, number] => [x + a * s + b * c, z + a * c - b * s];
    pieza(esfera, pelo, x, y + 0.43, z, 0.19, 0.17, 0.33, 0, giro);
    for (const [a, b] of [
      [0.19, 0.09],
      [0.19, -0.09],
      [-0.19, 0.09],
      [-0.19, -0.09],
    ]) {
      const [px, pz] = en(a, b);
      pieza(caja, '#3a2e28', px, y + 0.15, pz, 0.05, 0.3, 0.05);
    }
    const [hx, hz] = en(0.36, 0);
    pieza(esfera, cara, hx, y + 0.6, hz, 0.08, 0.1, 0.15, 0, giro);
    for (const b of [-0.04, 0.04]) {
      const [kx, kz] = en(0.3, b);
      pieza(caja, '#d8cbb0', kx, y + 0.74, kz, 0.025, 0.15, 0.025, 0, giro, b * 8);
    }
    const [cx, cz] = en(-0.33, 0);
    pieza(caja, pelo, cx, y + 0.52, cz, 0.04, 0.12, 0.04);
  }
  const pelajes: [string, string][] = [
    ['#2e2622', '#2e2622'],
    ['#e9e2d3', '#d9cfbd'],
    ['#8c5a3b', '#e9e2d3'],
    ['#4a3a30', '#8c5a3b'],
    ['#d8c8a8', '#2e2622'],
  ];
  [
    [-24, -3.9],
    [-21.4, -2.2],
    [-29, -1.8],
    [2, -9.6],
    [4.6, -12.6],
    [-1.6, -13],
    [25.6, 3.6],
    [27.2, 4.6],
    [26.2, 5.2],
    [28.4, -9.4],
    [30.8, -10.6],
    [-6.4, 6.2],
    [-9, 5.4],
    [-4, -27],
    [10, -28.5],
    [-31, -15],
  ].forEach(([x, z], i) => cabra(x, z, azar() * Math.PI * 2, ...pelajes[i % pelajes.length]));

  cocer(muros, encalado, 2.6);
  cocer(zocalo, basaltoVilla, 1.5);
  cocer(mamposteria, piedraCasas, 1.5);
  cocer(tejas, teja, 1.85);

  // --- Rompientes: trenes de olas que avanzan hacia la orilla y se deshacen en espuma ---
  const tiempo = { value: 0 };
  const espuma = new T.MeshStandardMaterial({ color: '#f6f8f6', transparent: true, depthWrite: false, roughness: 0.7 });
  espuma.onBeforeCompile = (s) => {
    s.uniforms.tiempo = tiempo;
    s.vertexShader =
      'varying vec2 vMar;\n' +
      s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMar = (modelMatrix * vec4(transformed, 1.0)).xz;');
    s.fragmentShader =
      `uniform float tiempo;
varying vec2 vMar;
float espuma(vec2 p) {
  float d = p.y - (${ORILLA.z.toFixed(2)} + ${ORILLA.vaiven.toFixed(2)} * sin(p.x * ${ORILLA.onda.toFixed(3)}));
  // Las crestas rompen a trozos: un ruido a lo largo de la costa que también deriva con el tiempo.
  float ruido = 0.5 + 0.5 * sin(p.x * 0.21 + sin(p.x * 0.067 + tiempo * 0.12) * 3.0 + d * 0.25);
  float grumos = 0.5 + 0.5 * sin(p.x * 0.53 - d * 0.7 + tiempo * 0.3) * sin(p.x * 0.17 + d * 1.3);
  float trozos = smoothstep(0.12, 0.6, ruido);
  float fase = d * 0.9 + tiempo * 1.25 + sin(p.x * 0.05) * 1.6;
  float rotura = smoothstep(0.82, 0.99, sin(fase)) * trozos * (0.6 + 0.4 * grumos);
  float estela = smoothstep(0.1, 1.0, sin(fase - 1.0)) * 0.55 * trozos * smoothstep(0.35, 0.85, grumos);
  float franja = smoothstep(15.0, 3.0, d) * smoothstep(-0.8, 0.4, d);
  float orillaBlanca = smoothstep(2.6, 0.0, d) * (0.55 + 0.3 * sin(tiempo * 0.9 + p.x * 0.08));
  float playa = clamp((rotura + estela) * franja + orillaBlanca, 0.0, 0.95) * smoothstep(41.0, 37.0, p.x);
  // En el roque y en la rasa el mar revienta en borbotones que van y vienen.
  float r = length((p - vec2(41.5, 18.9)) * vec2(0.8, 1.0));
  float roque = smoothstep(4.6, 2.2, r) * (0.55 + 0.45 * sin(tiempo * 1.4 - r * 1.6)) * trozos;
  float rasa = smoothstep(39.0, 43.0, p.x) * smoothstep(17.0, 19.5, p.y) * smoothstep(25.0, 22.0, p.y)
    * smoothstep(0.55, 0.95, sin(p.x * 0.9 + sin(p.y * 1.3) * 2.0 + tiempo * 0.8) * 0.5 + 0.5 * sin(p.y * 1.7 - tiempo));
  return max(playa, clamp(roque + rasa * 0.8, 0.0, 0.85));
}
// Bajo la espuma, el agua de la rompiente se vuelve turquesa y menos espejo.
float turquesa(vec2 p) {
  float d = p.y - (${ORILLA.z.toFixed(2)} + ${ORILLA.vaiven.toFixed(2)} * sin(p.x * ${ORILLA.onda.toFixed(3)}));
  return 0.7 * smoothstep(20.0, 3.0, d) * smoothstep(-0.8, 0.5, d) * smoothstep(43.0, 37.0, p.x);
}
` +
      s.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  float blanco = espuma(vMar), tinte = turquesa(vMar);
  float cubre = blanco + tinte * (1.0 - blanco);
  diffuseColor.rgb = mix(vec3(0.0, 0.26, 0.27), diffuseColor.rgb, blanco / max(cubre, 0.001));
  diffuseColor.a *= cubre;`,
      );
  };
  const plano = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const rompiente = superficie(plano, espuma, -12, -0.8, 26, 136, 1, 24, 8);
  plano.dispose();
  rompiente.castShadow = rompiente.receiveShadow = false;
  rompiente.renderOrder = 1;
  rompiente.onBeforeRender = () => {
    tiempo.value = performance.now() / 1000;
  };

  // Mar adentro, un pesquero y un velero; el bote queda tras el horizonte.
  return {
    amarres: [
      [0, -40, 58, 0.4],
      [1, 24, 62, -0.3],
      [2, 0, 140],
    ],
    enSeco: [],
  };
}
