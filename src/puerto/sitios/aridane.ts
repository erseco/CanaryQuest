import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS } from '../../data/pueblos';
import type { Sitio, Taller } from '../maqueta';

type Rect = [number, number, number, number];

/**
 * Nivel del mar. El casco está a unos 330 m, comprimidos a escala de maqueta; el mar queda
 * dentro de la franja de mar del horizonte pintado (`cuesta.desnivel`), para que siga en él.
 */
const MAR = -4;
/** Cono de Tajogaite, al sureste. En este trazado x apunta al norte y z al este. */
const VOLCAN = { x: -50, z: 43 };
/** Eje de las coladas de 2021: del cono al mar, pasando al sur del casco. */
const COLADA: [number, number][] = [
  [-50, 43],
  [-50, 28],
  [-47, 12],
  [-47, -6],
  [-51, -26],
  [-57, -46],
  [-62, -62],
];
/** Casco llano: lo que queda dentro no lo toca el paisaje. */
const CASCO: Rect[] = [
  [-30, -40, 28, 30],
  [-20, 30, 28, 44],
];
/**
 * Anfiteatro del valle, por rumbos (grados desde el norte, hacia el este): altura y distancia de
 * la cresta. Cierra de noroeste a sureste la pared de la Caldera, el Bejenado y las cumbres; al
 * suroeste y al oeste la ladera baja hasta el mar.
 */
const PERFIL: [number, number, number][] = [
  [0, 12, 74], // la boca de la Caldera, por donde sale el barranco de las Angustias
  [25, 20, 72],
  [55, 22, 68], // Bejenado
  [90, 16, 70], // Cumbre Nueva
  [120, 8, 70],
  [140, 3, 70], // ladera de la Cumbre Vieja
  [165, 0, 72],
  [190, -1.5, 74],
  [210, -3, 75],
  [228, MAR, 76], // costa de Tazacorte
  [255, MAR, 76],
  [285, MAR, 76],
  [305, 2, 72],
  [330, 10, 70], // El Time
  [360, 12, 74],
];

const fuera = (x: number, z: number) =>
  Math.min(...CASCO.map(([a, b, c, d]) => Math.hypot(Math.max(a - x, 0, x - c), Math.max(b - z, 0, z - d))));
function perfil(rumbo: number): [number, number] {
  for (let i = 1; i < PERFIL.length; i++) {
    const [b1, h1, r1] = PERFIL[i];
    if (rumbo > b1) continue;
    const [b0, h0, r0] = PERFIL[i - 1],
      k = (rumbo - b0) / (b1 - b0);
    return [h0 + (h1 - h0) * k, r0 + (r1 - r0) * k];
  }
  return [PERFIL[0][1], PERFIL[0][2]];
}
function aColada(x: number, z: number) {
  let menor = Infinity;
  for (let i = 1; i < COLADA.length; i++) {
    const [ax, az] = COLADA[i - 1],
      [bx, bz] = COLADA[i];
    const k = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
    menor = Math.min(menor, Math.hypot(x - ax - k * (bx - ax), z - az - k * (bz - az)));
  }
  return menor;
}
const ondas = (x: number, z: number) =>
  Math.sin(x * 0.9 + z * 0.4) + Math.sin(z * 1.1 - x * 0.3) + 0.6 * Math.sin(x * 2.3 - z * 1.7);
const azarFijo = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** Altura del paisaje: llano en el casco, sube hacia las cumbres y baja hacia el mar. */
function campo(x: number, z: number): number {
  const f = fuera(x, z);
  if (f <= 0) return -0.06;
  const r = Math.hypot(x, z),
    rumbo = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;
  const [H, R] = perfil(rumbo);
  const t = Math.min(1, f / Math.max(4, R - r + f));
  let h: number;
  if (H > 0) {
    // Fondo de valle casi llano y, al final, la pared: las cumbres se levantan de golpe.
    const s = t ** 2.4;
    h = H * s + Math.max(0, r - R) * 0.7 + s * H * 0.09 * ondas(x, z);
  } else {
    h = H * t ** 1.2 + 0.25 * t * ondas(x * 0.5, z * 0.5);
    if (H <= MAR + 0.5) h -= Math.max(0, r - R) * 1.5;
  }
  h += 10 * Math.exp(-((x - 36) ** 2 + (z - 48) ** 2) / 120); // el Bejenado
  if (aColada(x, z) < 5.5) h += 0.45 + 0.2 * ondas(x * 2, z * 2);
  const dv = Math.hypot(x - VOLCAN.x, z - VOLCAN.z);
  if (dv < 9) h += 9 - dv - (dv < 2.4 ? (2.4 - dv) * 1.7 : 0); // cono y cráter
  return h;
}

/**
 * Los Llanos de Aridane (La Palma), en el centro del valle de Aridane, trazado sobre la ortofoto
 * PNOA y OpenStreetMap y girado 90°: x apunta al norte y z al este, para que la cámara mire de
 * entrada valle abajo, hacia el mar. La plaza de España, con sus once laureles de Indias; al norte
 * la iglesia de Nuestra Señora de los Remedios, de tres naves y torre de cantería oscura; al sur el
 * Ayuntamiento regionalista; la calle Real cruza de oeste a este. Más allá, comprimido como en una
 * maqueta: las plataneras hasta Tazacorte y el mar, la pared de la Caldera, el Bejenado, la Cumbre
 * Nueva con El Paso y, al sureste, el cono de Tajogaite con sus coladas de 2021.
 * Las calles pisables están en `PUEBLOS.aridane.plano.suelos`.
 */
export function trazarAridane(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, teja } = t.materiales;
  const suelos = PUEBLOS.aridane.plano.suelos!;
  const tintes = new Map<string, T.MeshStandardMaterial>();
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const clave = base.uuid + color;
    if (!tintes.has(clave)) {
      const m = base.clone();
      m.color.set(color);
      tintes.set(clave, m);
    }
    return tintes.get(clave)!;
  };
  const encalado = cal.clone();
  encalado.color.setRGB(1.55, 1.6, 1.7); // por encima de 1: la cal tira a blanco
  const arco = new T.CylinderGeometry(0.5, 0.5, 1, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  const disco = new T.CylinderGeometry(0.5, 0.5, 1, 16).rotateX(Math.PI / 2);
  const aro = new T.TorusGeometry(0.5, 0.06, 4, 14, Math.PI);
  const cono = new T.ConeGeometry(1, 1, 7);

  /**
   * Plano de una fachada: `u` corre a lo largo de ella, `v` sale hacia fuera e `y` sube.
   * `giro` 0 mira a +z (al este), π a −z (al oeste), π/2 a +x (al norte) y −π/2 a −x (al sur).
   */
  const euler = new T.Euler(),
    local = new T.Euler(),
    cuaternion = new T.Quaternion();
  function frente(cx: number, cz: number, giro: number) {
    const c = Math.cos(giro),
      s = Math.sin(giro),
      deLado = Math.abs(s) > 0.5;
    const en = (u: number, v: number) => [cx + u * c + v * s, cz - u * s + v * c];
    return {
      d(forma: T.BufferGeometry, color: string, u: number, y: number, v: number, w: number, h: number, f: number, rx = 0, rz = 0) {
        const [x, z] = en(u, v);
        euler.setFromQuaternion(cuaternion.setFromEuler(local.set(rx, giro, rz, 'YXZ')), 'XYZ');
        pieza(forma, color, x, y, z, w, h, f, euler.x, euler.y, euler.z);
      },
      /** Cristal que se enciende de noche. */
      luz(u: number, y: number, v: number, w: number, h: number, f = 0.05) {
        const [x, z] = en(u, v);
        ventanas.push(deLado ? [x, y, z, f, h, w] : [x, y, z, w, h, f]);
      },
    };
  }
  type Frente = ReturnType<typeof frente>;

  // Tejados de teja y hastiales encalados: se juntan por material en dos mallas.
  const tejas: T.BufferGeometry[] = [],
    hastiales: T.BufferGeometry[] = [];
  /** Tejado a cuatro aguas, o a dos con los hastiales encalados; la cumbrera va a lo largo. */
  function tejado(x: number, y: number, z: number, w: number, d: number, alto: number, aguas: 2 | 4 = 4) {
    const largo = w >= d,
      L = Math.max(w, d) / 2,
      S = Math.min(w, d) / 2,
      r = aguas === 2 ? L : L - S;
    const p = (l: number, h: number, s: number) => (largo ? [x + l, y + h, z + s] : [x + s, y + h, z + l]);
    const geo = (puntos: number[][]) => {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(puntos.flat(), 3));
      g.computeVertexNormals();
      return g;
    };
    const faldon = [
      ...[p(-L, 0, S), p(L, 0, S), p(r, alto, 0), p(-L, 0, S), p(r, alto, 0), p(-r, alto, 0)],
      ...[p(L, 0, -S), p(-L, 0, -S), p(-r, alto, 0), p(L, 0, -S), p(-r, alto, 0), p(r, alto, 0)],
    ];
    const testeros = [p(L, 0, S), p(L, 0, -S), p(r, alto, 0), p(-L, 0, -S), p(-L, 0, S), p(-r, alto, 0)];
    if (aguas === 4) tejas.push(geo([...faldon, ...testeros]));
    else {
      tejas.push(geo(faldon));
      hastiales.push(geo(testeros));
    }
  }
  function cocer(lista: T.BufferGeometry[], material: T.MeshStandardMaterial, escala: number) {
    const geo = mergeGeometries(lista);
    superficie(geo, material, 0, 0, 0, 1, 1, 1, escala);
    for (const g of [...lista, geo]) g.dispose();
  }

  const tea = '#5b3a24',
    canteria = '#57524c',
    hierro = '#2a2b2b',
    blanco = '#f4f1ea';
  const paleta = ['#f3eee3', '#e7c16c', '#efe0bf', '#cfdcc0', '#e8b9a0', '#f6f2ea', '#dcc9a3', '#bfd4d8', '#e3ad78'];
  const postigos = ['#3e6b4d', '#6b4632', '#2f5f6a', '#7a2f2a'];
  const puertas = ['#4a3122', '#2f4d3a', '#6b2f24', '#3b4f66'];
  const elige = <C,>(lista: C[]) => lista[Math.floor(azar() * lista.length)];
  const ocupado: Rect[] = suelos.map(({ r }) => r);

  // --- Piezas de las casas canarias del casco ---
  /** Zócalo, esquinas de sillares alternos y cornisa. */
  function lienzo(p: Frente, ancho: number, alto: number) {
    p.d(caja, canteria, 0, 0.21, 0.03, ancho + 0.04, 0.42, 0.07);
    for (const s of [-1, 1])
      for (let k = 0, y = 0.42; y < alto - 0.3; k++, y += 0.38) {
        const w = k % 2 ? 0.22 : 0.34;
        p.d(caja, canteria, s * (ancho / 2 - w / 2 + 0.01), y + 0.18, 0.04, w, 0.36, 0.08);
      }
    p.d(caja, blanco, 0, alto - 0.08, 0.07, ancho + 0.14, 0.18, 0.16);
  }
  /** Ventana de guillotina con los postigos abiertos y el poyo de piedra. */
  function ventana(p: Frente, u: number, y: number, w: number, h: number, postigo: string) {
    p.d(caja, blanco, u, y, 0.03, w + 0.16, h + 0.16, 0.07);
    p.luz(u, y, 0.07, w, h);
    p.d(caja, blanco, u, y, 0.1, 0.035, h, 0.02);
    for (const s of [-1, 1]) p.d(caja, postigo, u + s * (w * 0.75 + 0.1), y, 0.06, w / 2, h, 0.035);
    p.d(caja, '#8c8378', u, y - h / 2 - 0.1, 0.1, w + 0.32, 0.07, 0.2);
  }
  /** Balcón canario de tea: suelo sobre canes, balaustres torneados y tejadillo. */
  function balcon(p: Frente, u: number, y0: number, ancho: number) {
    p.d(caja, '#3a2a1f', u, y0 + 0.85, 0.03, ancho * 0.5, 1.6, 0.05);
    p.luz(u, y0 + 0.9, 0.06, ancho * 0.38, 1.3);
    p.d(caja, tea, u, y0, 0.35, ancho + 0.1, 0.1, 0.7);
    for (let i = 0; i <= 4; i++) p.d(caja, tea, u - ancho / 2 + (i * ancho) / 4, y0 - 0.13, 0.3, 0.08, 0.16, 0.55);
    const n = Math.max(6, Math.round(ancho / 0.15));
    for (let i = 0; i <= n; i++) p.d(poste, tea, u - ancho / 2 + (i * ancho) / n, y0 + 0.36, 0.66, 0.05, 0.56, 0.05);
    for (const s of [-1, 1]) {
      for (let i = 1; i < 4; i++) p.d(poste, tea, u + (s * ancho) / 2, y0 + 0.36, 0.05 + (i * 0.6) / 4, 0.05, 0.56, 0.05);
      p.d(caja, tea, u + (s * ancho) / 2, y0 + 1.2, 0.66, 0.07, 1.0, 0.07);
    }
    p.d(caja, tea, u, y0 + 0.68, 0.66, ancho + 0.1, 0.08, 0.1);
    p.d(caja, tea, u, y0 + 1.72, 0.66, ancho + 0.12, 0.09, 0.09);
    p.d(caja, '#9a4c34', u, y0 + 1.84, 0.38, ancho + 0.36, 0.07, 0.92, 0.3);
  }
  /** Puerta de madera con marco y dintel de cantería. */
  function puerta(p: Frente, u: number, h: number, color = elige(puertas)) {
    p.d(caja, canteria, u, h / 2, 0.04, 1.1, h + 0.1, 0.08);
    p.d(caja, color, u, h / 2 - 0.02, 0.08, 0.78, h - 0.1, 0.04);
    p.d(caja, canteria, u, h + 0.1, 0.06, 1.25, 0.14, 0.12);
  }
  /** Portada de medio punto: hoja de madera, jambas y rosca de cantería. */
  function portada(p: Frente, u: number, ancho: number, alto: number, piedra = canteria) {
    p.d(caja, '#3f2b1f', u, alto / 2, 0.02, ancho, alto, 0.06);
    p.d(arco, '#3f2b1f', u, alto, 0.02, ancho, ancho, 0.06);
    for (const s of [-1, 1]) p.d(caja, piedra, u + s * (ancho / 2 + 0.14), alto / 2, 0.05, 0.28, alto, 0.14);
    p.d(aro, piedra, u, alto, 0.05, ancho + 0.28, ancho + 0.28, 2.2);
  }
  /** Ventana alta de medio punto, sin marco, como las de la iglesia. */
  function vano(p: Frente, u: number, y: number, w: number, h: number) {
    p.d(caja, '#34343a', u, y, 0.02, w, h, 0.05);
    p.d(arco, '#34343a', u, y + h / 2, 0.02, w, w, 0.05);
    p.luz(u, y, 0.05, w * 0.7, h * 0.9);
  }
  /** Azotea con pretil y, a veces, el depósito del agua. */
  function azotea(x: number, z: number, w: number, d: number, h: number) {
    for (const s of [-1, 1]) {
      pieza(caja, blanco, x, h + 0.16, z + (s * d) / 2, w, 0.32, 0.12);
      pieza(caja, blanco, x + (s * w) / 2, h + 0.16, z, 0.12, 0.32, d);
    }
    pieza(caja, '#d8d2c6', x, h + 0.04, z, w - 0.1, 0.06, d - 0.1);
    if (azar() > 0.5) pieza(poste, '#ece8df', x - w * 0.22, h + 0.45, z - d * 0.2, 0.7, 0.8, 0.7);
  }
  /**
   * Casa canaria del casco, de una o dos plantas: muros encalados o de color, cantería en zócalo y
   * esquinas, ventanas con postigos y, a menudo, un balcón de tea en la planta alta.
   */
  function casona(r: Rect, alto: number, giro: number, color = elige(paleta), conBalcon = azar() > 0.4) {
    const [x0, z0, x1, z1] = r,
      cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    ocupado.push(r);
    superficie(caja, color === blanco ? encalado : tenido(cal, color), cx, (alto - 0.3) / 2, cz, x1 - x0, alto + 0.3, z1 - z0, 2.6);
    const deLado = Math.abs(Math.sin(giro)) > 0.5;
    const ancho = deLado ? z1 - z0 : x1 - x0,
      fondo = deLado ? x1 - x0 : z1 - z0;
    const p = frente(cx + (Math.sin(giro) * fondo) / 2, cz + (Math.cos(giro) * fondo) / 2, giro);
    const postigo = elige(postigos);
    lienzo(p, ancho, alto);
    const lado = azar() > 0.5 ? 1 : -1,
      pu = ancho < 3.3 ? 0 : lado * ancho * 0.24;
    puerta(p, pu, Math.min(2.05, alto * 0.62));
    if (ancho >= 3.3) ventana(p, -lado * ancho * 0.24, 1.25, 0.56, 0.86, postigo);
    if (alto > 3.6) {
      if (conBalcon && ancho >= 3) balcon(p, 0, 2.3, Math.min(2.4, ancho * 0.55));
      else for (const s of ancho >= 3.3 ? [-1, 1] : [0]) ventana(p, s * ancho * 0.24, 2.3 + (alto - 2.3) * 0.45, 0.56, 0.9, postigo);
    }
    if (azar() > 0.3) tejado(cx, alto, cz, x1 - x0 + 0.3, z1 - z0 + 0.3, Math.min(x1 - x0, z1 - z0) * 0.3);
    else azotea(cx, cz, x1 - x0, z1 - z0, alto);
  }
  /**
   * Hilera de casas a lo largo de una calle, de `desde` a `hasta`, con la fachada en la línea `fijo`
   * y mirando hacia `giro`. Las bajas quedan entre la cámara y la calle y dejan ver al viajero.
   */
  function hilera(giro: number, fijo: number, desde: number, hasta: number, fondo: number, altos: number[]) {
    const nx = Math.round(Math.sin(giro)),
      nz = Math.round(Math.cos(giro));
    for (let a = desde, i = 0; ; i++) {
      const w = Math.min([3.4, 2.9, 3.8, 3.1, 3.6][i % 5], hasta - a);
      if (w < 2.6) break;
      const r: Rect = nx
        ? [nx > 0 ? fijo - fondo : fijo, a, nx > 0 ? fijo : fijo + fondo, a + w]
        : [a, nz > 0 ? fijo - fondo : fijo, a + w, nz > 0 ? fijo : fijo + fondo];
      casona(r, altos[i % altos.length], giro);
      a += w + 0.04;
    }
  }
  function banco(x: number, z: number, giro: number) {
    const p = frente(x, z, giro);
    p.d(caja, '#7a5a3f', 0, 0.48, 0, 1.6, 0.07, 0.42);
    p.d(caja, '#7a5a3f', 0, 0.76, -0.2, 1.6, 0.3, 0.06);
    for (const u of [-0.66, 0.66]) p.d(caja, hierro, u, 0.4, 0, 0.07, 0.8, 0.46);
  }
  /** Farola de fundición negra con su farol. */
  function farola(x: number, z: number) {
    pieza(poste, hierro, x, 0.2, z, 0.3, 0.4, 0.3);
    pieza(poste, hierro, x, 1.6, z, 0.1, 2.9, 0.1);
    pieza(caja, hierro, x, 3.07, z, 0.36, 0.06, 0.36);
    ventanas.push([x, 3.32, z, 0.26, 0.44, 0.26]);
    pieza(piramide, hierro, x, 3.66, z, 0.36, 0.26, 0.36, 0, Math.PI / 4);
  }
  /** Laurel de Indias: tronco gris de raíces soldadas, ramas en abanico y copa podada en manojos. */
  function laurel(x: number, z: number, alto = 4.2, radio = 2.4) {
    pieza(poste, '#8a8276', x, alto / 2 - 0.2, z, 1.15, alto + 0.4, 1.05);
    for (let k = 0; k < 6; k++) {
      const a = k * 1.1 + azar() * 0.4;
      pieza(poste, '#776f64', x + Math.cos(a) * 0.5, alto * 0.42, z + Math.sin(a) * 0.5, 0.32, alto * 0.84, 0.32, Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08);
    }
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05 + 0.4;
      pieza(poste, '#776f64', x + Math.cos(a) * 0.75, alto + 0.5, z + Math.sin(a) * 0.75, 0.26, 1.9, 0.26, Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75);
    }
    for (let k = 0; k < 17; k++) {
      const a = k * 2.4,
        d = k ? radio * (0.3 + 0.62 * (((k * 7) % 5) / 5)) : 0;
      pieza(
        esfera,
        ['#2f5a2e', '#3b6a35', '#467639', '#345f31'][k % 4],
        x + Math.cos(a) * d,
        alto + 1.2 + (1 - d / radio) * 0.8 + azar() * 0.25,
        z + Math.sin(a) * d,
        1.15,
        0.75,
        1.15,
      );
    }
  }
  /** Platanera: el falso tronco y un penacho de hojas anchas que se doblan. */
  function platanera(x: number, y: number, z: number) {
    const h = 1.1 + azar() * 0.4;
    pieza(poste, '#7f8c4c', x, y + h / 2, z, 0.22, h, 0.22);
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05 + azar() * 0.5,
        largo = 1.1 + azar() * 0.4;
      pieza(caja, k % 2 ? '#6fa548' : '#5c9340', x + Math.cos(a) * largo * 0.42, y + h + 0.1 - largo * 0.12, z + Math.sin(a) * largo * 0.42, largo, 0.05, 0.4, 0, -a, -0.32);
    }
  }
  /** Pino canario: tronco recto y la copa en pisos. */
  function pino(x: number, y: number, z: number, h: number) {
    pieza(poste, '#5b4636', x, y + h * 0.3, z, 0.24, h * 0.6, 0.24);
    for (let k = 0; k < 3; k++)
      pieza(cono, k % 2 ? '#35502f' : '#3f5e37', x, y + h * (0.5 + k * 0.2), z, h * (0.32 - k * 0.07), h * 0.36, h * (0.32 - k * 0.07));
  }
  /** Casita blanca de los pagos: un cubo encalado con azotea, sin más detalle a esa distancia. */
  function casita(x: number, z: number, w: number, d: number, h: number, color = blanco) {
    const y = Math.min(campo(x - w / 2, z - d / 2), campo(x + w / 2, z + d / 2), campo(x, z));
    pieza(caja, color, x, y + h / 2 - 0.3, z, w, h + 0.6, d);
    pieza(caja, '#d9d3c7', x, y + h + 0.05, z, w + 0.1, 0.1, d + 0.1);
    pieza(caja, '#3c4246', x - w / 2 - 0.01, y + h * 0.55, z, 0.02, h * 0.3, w * 0.25);
  }

  // --- Firme: losas grises en la plaza y en las calles peatonales, con juntas de basalto ---
  const losas = tenido(cal, '#a9a49c');
  for (const { r } of suelos) {
    const [x0, z0, x1, z1] = r;
    superficie(caja, losas, (x0 + x1) / 2, -0.05, (z0 + z1) / 2, x1 - x0, 0.1, z1 - z0, 2.2);
  }
  for (let z = -10.8; z < 13.6; z += 2.4) pieza(caja, '#77736d', -1.4, 0.004, z, 15.2, 0.01, 0.07);
  for (let x = -7.8; x < 6.2; x += 2.4) pieza(caja, '#77736d', x, 0.004, 0.8, 0.07, 0.01, 25.6);
  for (let z = -31; z < 34; z += 2.4) pieza(caja, '#77736d', -10.5, 0.004, z, 3, 0.01, 0.07);

  // --- Iglesia de Nuestra Señora de los Remedios: tres naves encaladas con su tejado cada una,
  // contrafuertes con esquinas de cantería y la torre de piedra oscura a levante ---
  superficie(caja, encalado, 11.5, 2.15, -0.5, 10, 4.9, 18, 2.6);
  ocupado.push([6.2, -9.8, 16.8, 8.8]);
  for (let i = 0; i < 3; i++) tejado(6.5 + 3.333 * (i + 0.5), 4.6, -0.5, 3.43, 18.3, 1.5, 2);
  for (const x of [6.45, 16.55]) pieza(caja, blanco, x, 4.62, -0.5, 0.2, 0.14, 18.2);
  pieza(caja, '#c9c3b8', 6.48, 0.12, -0.5, 0.08, 0.24, 18);
  /** Contrafuerte encalado con sillares de cantería en las aristas. */
  function contrafuerte(p: Frente, u: number, alto: number, saliente = 0.6, ancho = 0.8) {
    p.d(caja, blanco, u, alto / 2, saliente / 2, ancho, alto, saliente);
    p.d(caja, '#cfc9bf', u, alto + 0.08, saliente / 2 - 0.05, ancho + 0.06, 0.16, saliente + 0.06);
    for (let k = 0, y = 0.2; y < alto - 0.15; k++, y += 0.36)
      for (const s of [-1, 1]) {
        const w = k % 2 ? 0.2 : 0.34;
        p.d(caja, '#3c3834', u + s * (ancho / 2 - w / 2 + 0.01), y, saliente + 0.005, w, 0.3, 0.02);
        p.d(caja, '#3c3834', u + s * (ancho / 2 + 0.005), y, saliente - (k % 2 ? 0.2 : 0.12), 0.02, 0.3, k % 2 ? 0.4 : 0.24);
      }
  }
  // Fachada del mediodía, a la plaza: portada de cantería, ventanas altas, contrafuerte y escudo.
  const sur = frente(6.5, -0.5, -Math.PI / 2);
  portada(sur, -4.5, 1.4, 2.3);
  sur.d(caja, '#8e877c', -4.5, 3.75, 0.05, 0.5, 0.6, 0.08);
  sur.d(esfera, '#8e877c', -4.5, 4.15, 0.06, 0.22, 0.2, 0.08);
  for (const u of [-0.2, 5.4]) vano(sur, u, 3.1, 0.6, 1.2);
  vano(sur, -7.6, 3.2, 0.42, 0.7);
  contrafuerte(sur, 2.5, 3.2);
  for (const u of [-8.65, 8.6]) contrafuerte(sur, u, 4.4, 0.45, 0.7);
  // Cruz de madera sobre su pedestal, delante de la iglesia.
  pieza(caja, '#8e877c', 5.3, 0.25, 5, 0.8, 0.5, 0.8);
  pieza(caja, '#4a3324', 5.3, 1.55, 5, 0.12, 2.2, 0.12);
  pieza(caja, '#4a3324', 5.3, 2.1, 5, 0.12, 0.12, 0.9);
  // Fachada de poniente: tres hastiales con su óculo, ventanas de medio punto y contrafuertes.
  const oeste = frente(11.5, -9.5, Math.PI);
  for (const u of [-3.333, 0, 3.333]) {
    oeste.d(disco, '#34343a', u, 5.2, 0.02, 0.62, 0.62, 0.05);
    oeste.luz(u, 5.2, 0.05, 0.4, 0.4);
    if (u) vano(oeste, u, 2.9, 0.55, 1.1);
  }
  portada(oeste, 0, 1.2, 2.1);
  for (const u of [-5, 5]) contrafuerte(oeste, u, 4.4, 0.5, 0.8);
  for (const u of [-1.667, 1.667]) contrafuerte(oeste, u, 2.6, 0.5, 0.7);
  // Costado norte, a la calle Fernández Taño, con su puerta lateral.
  const norte = frente(16.5, -0.5, Math.PI / 2);
  portada(norte, 4, 1.1, 2);
  for (const u of [-6, -1, 2]) vano(norte, u, 3.1, 0.5, 1.0);
  // Torre: tres cuerpos de cantería oscura, campanario con su reloj y la espadaña de remate.
  const tx = 9.6,
    tz = 10;
  // Sillares de basalto en hiladas, cada uno de su tono de gris, sobre el núcleo de mortero.
  pieza(caja, '#3a3836', tx, 4.55, tz, 2.76, 9.7, 2.76);
  for (let k = 0, y = 0.21; y < 9.4; k++, y += 0.42)
    for (const giro of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const cara = frente(tx + Math.sin(giro) * 1.4, tz + Math.cos(giro) * 1.4, giro);
      for (let u = -1.4 + (k % 2) * 0.3; u < 1.39; ) {
        const w = Math.min(0.5 + azar() * 0.45, 1.4 - u);
        cara.d(caja, ['#4b4946', '#56534f', '#615d58', '#4f4c4a'][Math.floor(azar() * 4)], u + w / 2, y, -0.03, w - 0.04, 0.38, 0.06);
        u += w;
      }
    }
  for (const y of [4.6, 7.0, 9.4]) pieza(caja, '#3f3c39', tx, y, tz, 3.05, 0.18, 3.05);
  for (const [giro, huecos] of [
    [-Math.PI / 2, [0]],
    [0, [-0.6, 0.6]],
    [Math.PI, [-0.6, 0.6]],
    [Math.PI / 2, [0]],
  ] as [number, number[]][]) {
    const cara = frente(tx + Math.sin(giro) * 1.4, tz + Math.cos(giro) * 1.4, giro);
    for (const u of huecos) {
      cara.d(caja, '#1f1c1a', u, 8.0, 0.01, 0.5, 1.0, 0.04);
      cara.d(arco, '#1f1c1a', u, 8.5, 0.01, 0.5, 0.5, 0.04);
      cara.d(esfera, '#6f5a2e', u, 8.05, -0.1, 0.32, 0.36, 0.3);
    }
    if (giro === -Math.PI / 2) {
      for (const y of [2.6, 5.6]) {
        cara.d(caja, '#2a2624', 0, y, 0.01, 0.4, 0.7, 0.04);
        cara.luz(0, y, 0.03, 0.26, 0.5);
      }
    }
  }
  // Remate: pináculos en las esquinas y la espadaña curva con su campana, su reloj y la cruz.
  for (const dx of [-1.35, 1.35])
    for (const dz of [-1.35, 1.35]) {
      pieza(caja, '#4a4541', tx + dx, 9.7, tz + dz, 0.26, 0.4, 0.26);
      pieza(esfera, '#4a4541', tx + dx, 10.0, tz + dz, 0.13, 0.15, 0.13);
    }
  const espadana = frente(tx - 0.25, tz, -Math.PI / 2);
  espadana.d(caja, '#625c56', 0, 10.15, 0, 2.0, 1.3, 0.45);
  espadana.d(arco, '#625c56', 0, 10.8, 0, 2.0, 1.7, 0.45);
  espadana.d(caja, '#1f1c1a', 0, 10.75, 0.23, 0.46, 0.6, 0.02);
  espadana.d(arco, '#1f1c1a', 0, 11.05, 0.23, 0.46, 0.46, 0.02);
  espadana.d(esfera, '#6f5a2e', 0, 10.75, 0, 0.28, 0.32, 0.26);
  espadana.d(disco, '#2a2624', 0, 9.95, 0.235, 0.7, 0.7, 0.02);
  espadana.d(disco, '#f2eee4', 0, 9.95, 0.25, 0.62, 0.62, 0.02);
  espadana.d(caja, '#2a2624', 0.06, 10.0, 0.27, 0.04, 0.22, 0.01, 0, -0.5);
  espadana.d(caja, '#2a2624', -0.05, 9.93, 0.27, 0.16, 0.03, 0.01);
  pieza(caja, '#d9c38a', tx - 0.25, 12.05, tz, 0.06, 0.7, 0.06);
  pieza(caja, '#d9c38a', tx - 0.25, 12.15, tz, 0.06, 0.06, 0.4);
  // Sacristía y dependencias, encaladas, detrás de la torre.
  superficie(caja, encalado, 12.1, 1.85, 11, 7.2, 4.3, 5.2, 2.6);
  tejado(12.1, 4.0, 11, 7.5, 5.5, 1.2);
  ocupado.push([8.2, 8.4, 15.9, 13.6]);
  const sacristia = frente(12.1, 13.6, 0);
  for (const u of [-2.4, 0, 2.4]) {
    sacristia.d(caja, '#34343a', u, 2.6, 0.02, 0.5, 0.8, 0.05);
    sacristia.luz(u, 2.6, 0.05, 0.36, 0.6);
  }
  puerta(sacristia, 1.2, 2, '#4a3122');

  // --- Casas consistoriales: blancas, cantería oscura, soportal de tres arcos, balcón corrido de
  // tea y, en la esquina, la torre con su balconcillo, el ajimez de celosía y tres óculos ---
  superficie(caja, encalado, -19, 2.35, -1.15, 6, 5.3, 8.7, 2.6);
  superficie(caja, encalado, -18.5, 3.65, 4.8, 5.8, 7.9, 3.2, 2.6);
  ocupado.push([-22, -5.6, -12.1, 6.5]);
  const ay = frente(-16, -1.15, Math.PI / 2);
  for (const u of [-4.35, -1.45, 1.45, 4.35]) ay.d(caja, canteria, u, 2.5, 0.06, 0.38, 5, 0.12);
  ay.d(caja, canteria, 0, 2.55, 0.08, 8.8, 0.16, 0.18);
  ay.d(caja, canteria, 0, 5.0, 0.1, 8.9, 0.22, 0.22);
  ay.d(caja, blanco, 0, 5.35, 0, 8.7, 0.5, 0.2);
  ay.d(caja, canteria, 0, 5.62, 0.02, 8.8, 0.08, 0.26);
  // Soportal: tres arcos sobre pilares de piedra.
  for (const u of [-1.9, 0, 1.9]) {
    ay.d(caja, '#3a3532', u, 0.8, 0.01, 1.3, 1.6, 0.04);
    ay.d(arco, '#3a3532', u, 1.6, 0.01, 1.3, 1.3, 0.04);
  }
  for (const u of [-2.85, -0.95, 0.95, 2.85]) ay.d(caja, canteria, u, 0.85, 0.06, 0.3, 1.7, 0.3);
  for (const u of [-3.6, 3.6]) ventana(ay, u, 1.2, 0.5, 0.9, '#4a3122');
  // Balcón corrido del salón de plenos, con tres puertas vidrieras detrás.
  for (const u of [-2.4, 0, 2.4]) {
    ay.d(caja, '#3a2a1f', u, 3.45, 0.03, 0.8, 1.5, 0.05);
    ay.luz(u, 3.5, 0.06, 0.6, 1.2);
  }
  ay.d(caja, tea, 0, 2.7, 0.4, 7.2, 0.14, 0.8);
  for (let i = 0; i <= 36; i++) ay.d(poste, tea, -3.6 + i * 0.2, 3.05, 0.76, 0.05, 0.56, 0.05);
  ay.d(caja, tea, 0, 3.36, 0.76, 7.3, 0.08, 0.1);
  for (const s of [-1, 1]) ay.d(caja, tea, s * 3.6, 3.05, 0.4, 0.08, 0.6, 0.8);
  ay.d(caja, '#7b746a', 0, 5.95, 0.12, 0.7, 0.8, 0.1); // escudo
  // Torre de la esquina.
  const torre = frente(-15.6, 4.8, Math.PI / 2);
  for (const u of [-1.55, 1.55]) torre.d(caja, canteria, u, 3.8, 0.04, 0.32, 7.6, 0.1);
  torre.d(caja, canteria, 0, 7.5, 0.05, 3.3, 0.2, 0.14);
  ventana(torre, 0, 1.3, 0.6, 0.9, '#4a3122');
  // Balconcillo con su tejadillo en la primera planta.
  torre.d(caja, '#3a2a1f', 0, 3.45, 0.03, 0.8, 1.5, 0.05);
  torre.luz(0, 3.5, 0.06, 0.6, 1.2);
  torre.d(caja, tea, 0, 2.7, 0.35, 2.4, 0.12, 0.7);
  for (let i = 0; i <= 12; i++) torre.d(poste, tea, -1.2 + i * 0.2, 3.02, 0.66, 0.05, 0.52, 0.05);
  torre.d(caja, tea, 0, 3.3, 0.66, 2.5, 0.08, 0.1);
  for (const s of [-1, 1]) torre.d(caja, tea, s * 1.15, 3.7, 0.66, 0.08, 1.6, 0.08);
  torre.d(caja, '#a4553a', 0, 4.55, 0.4, 2.8, 0.08, 1.0, 0.3);
  // Ajimez: balcón cerrado de celosía.
  torre.d(caja, tea, 0, 5.75, 0.3, 1.6, 1.3, 0.55);
  for (let i = -3; i <= 3; i++) torre.d(caja, '#7a5236', i * 0.2, 5.75, 0.58, 0.04, 1.2, 0.02);
  for (let k = -2; k <= 2; k++) torre.d(caja, '#7a5236', 0, 5.75 + k * 0.22, 0.585, 1.5, 0.03, 0.02);
  torre.luz(0, 5.75, 0.56, 1.3, 1.0, 0.01);
  torre.d(caja, '#a4553a', 0, 6.48, 0.32, 1.8, 0.08, 0.7, 0.2);
  for (const u of [-0.8, 0, 0.8]) {
    torre.d(disco, '#2a2624', u, 7.05, 0.02, 0.36, 0.36, 0.04);
    torre.luz(u, 7.05, 0.04, 0.22, 0.22);
  }
  tejado(-18.5, 7.6, 4.8, 6.4, 3.9, 1.3);
  for (let k = -6; k <= 6; k++) pieza(caja, tea, -15.45, 7.5, 4.8 + k * 0.28, 0.4, 0.08, 0.06); // canecillos del alero
  // Banderas de España y de Canarias en la azotea.
  for (const z of [-3.5, -1.5]) pieza(poste, '#d8d2c6', -17.8, 7.0, z, 0.06, 3, 0.06);
  ['#c60b1e', '#ffc400', '#ffc400', '#c60b1e'].forEach((color, k) => pieza(caja, color, -17.8, 8.21 - k * 0.18, -2.95, 0.02, 0.18, 1.0));
  ['#f4f1ea', '#0768a9', '#ffcc00'].forEach((color, k) => pieza(caja, color, -17.8, 7.94, -1.33 + k * 0.33, 0.02, 0.72, 0.33));
  // Jardín delantero tras el murete blanco de pilares con remate de piedra.
  for (let z = -5.4; z <= 6.4; z += 1.8) {
    pieza(caja, blanco, -12.3, 0.4, z, 0.4, 0.8, 0.4);
    pieza(piramide, canteria, -12.3, 0.92, z, 0.34, 0.24, 0.34, 0, Math.PI / 4);
  }
  pieza(caja, blanco, -12.3, 0.25, 0.5, 0.22, 0.5, 11.8);
  for (let i = 0; i < 18; i++)
    pieza(esfera, ['#3d6b3a', '#5a8a45', '#a8442e', '#c87a3a'][i % 4], -12.9 - azar() * 2.8, 0.45 + azar() * 0.3, -5.2 + i * 0.66, 0.5, 0.6, 0.5);

  // --- Plaza de España: los once laureles de Indias, bancos, farolas y la terraza del café ---
  for (const [x0, z0, x1, z1] of PUEBLOS.aridane.plano.vallas!.slice(0, 11)) laurel((x0 + x1) / 2, (z0 + z1) / 2);
  for (const [x, z, giro] of [
    [-5.4, -3.4, Math.PI / 2],
    [-5.4, 4.4, Math.PI / 2],
    [-5.4, 8.8, Math.PI / 2],
    [2.6, -6.6, -Math.PI / 2],
    [-2.8, -10.6, 0],
    [-8.1, 17.6, Math.PI],
    [-8.1, 30.4, Math.PI],
  ])
    banco(x, z, giro);
  for (const [x, z] of [
    [-8.6, -6.8],
    [-8.6, 9.6],
    [5.6, -11.6],
    [5.6, 13.2],
    [-11.6, -20],
    [-11.6, -28],
    [-6.9, 24],
    [-11.6, 15],
    [-11.6, 30],
    [-13.6, -37.6],
    [-2.4, -37.6],
    [-19.6, 39.6],
  ])
    farola(x, z);
  for (const [i, [x, z]] of [
    [1.6, 11],
    [3.6, 11.2],
    [1.7, 12.6],
    [3.6, 12.5],
  ].entries()) {
    pieza(poste, hierro, x, 0.38, z, 0.06, 0.76, 0.06);
    pieza(poste, '#e9e3d6', x, 0.78, z, 0.7, 0.05, 0.7);
    pieza(poste, '#f2efe6', x, 1.2, z, 0.05, 2.4, 0.05);
    pieza(cono, ['#2f6f74', '#c9543a'][i % 2], x, 2.35, z, 1.15, 0.4, 1.15);
    for (const dx of [-0.5, 0.5]) pieza(caja, '#7a5a3f', x + dx, 0.45, z, 0.36, 0.9, 0.4);
  }

  // --- Calles del casco: hileras de casas canarias ---
  hilera(Math.PI / 2, -12, -32, -6, 3.6, [3.0, 2.8, 4.2, 3.2]); // calle Real, acera sur, hacia poniente
  hilera(Math.PI / 2, -12, 6.6, 30, 3.6, [2.9, 3.2, 4.2, 3.0]); // calle Real, acera sur, hacia levante
  hilera(-Math.PI / 2, -9, -32, -12, 3.8, [3.2, 2.9, 4.2, 3.4]); // calle Real, acera norte, hacia poniente
  hilera(0, -12, -5, 20, 3.8, [4.6, 4.2, 3.6, 4.8]); // calle de la Iglesia
  hilera(Math.PI, 16.4, -6.5, 8, 3.6, [2.8, 2.6, 3.0]); // calle del Paseo, bajas delante de la cámara
  hilera(-Math.PI / 2, -6.5, 25.6, 34, 3.8, [3.6, 4.4]); // calle Real hacia levante, acera norte
  hilera(Math.PI, 34, -12, -2.4, 3.6, [3.0, 4.2, 3.4]); // remate de la calle Real

  // --- La Ciudad en el Museo: un mural en la medianera y cuadros colgados en las fachadas ---
  function lamina(ancho: number, alto: number, pintar: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = Math.round((512 * alto) / ancho);
    pintar(lienzo.getContext('2d')!, lienzo.width, lienzo.height);
    const mapa = new T.CanvasTexture(lienzo);
    mapa.colorSpace = T.SRGBColorSpace;
    return new T.MeshStandardMaterial({ map: mapa, roughness: 0.9 });
  }
  /** Lámina pegada a una pared que mira a −x, con la imagen entera. */
  function colgar(material: T.MeshStandardMaterial, x: number, y: number, z: number, ancho: number, alto: number) {
    const plano = new T.PlaneGeometry(ancho, alto).rotateY(-Math.PI / 2).toNonIndexed();
    const uv = plano.getAttribute('uv').clone();
    const m = superficie(plano, material, x, y, z, 1, 1, 1, 1);
    m.geometry.setAttribute('uv', uv);
    m.castShadow = false;
    plano.dispose();
  }
  // El mural: el valle de cumbre a mar, con el sol, el volcán, las plataneras y el océano.
  const mural = lamina(3.8, 5.8, (c, w, h) => {
    const cielo = c.createLinearGradient(0, 0, 0, h * 0.55);
    cielo.addColorStop(0, '#2d6fb0');
    cielo.addColorStop(1, '#f2a65a');
    c.fillStyle = cielo;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd34d';
    c.beginPath();
    c.arc(w * 0.7, h * 0.2, w * 0.13, 0, Math.PI * 2);
    c.fill();
    const monte = (color: string, puntos: number[]) => {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, h);
      for (let i = 0; i < puntos.length; i++) c.lineTo((w * i) / (puntos.length - 1), h * puntos[i]);
      c.lineTo(w, h);
      c.fill();
    };
    monte('#3c4f8a', [0.3, 0.24, 0.32, 0.27, 0.36, 0.3]);
    monte('#2f6b4a', [0.42, 0.36, 0.44, 0.4, 0.47, 0.42]);
    c.fillStyle = '#231f20';
    c.beginPath();
    c.moveTo(w * 0.05, h * 0.52);
    c.lineTo(w * 0.22, h * 0.38);
    c.lineTo(w * 0.3, h * 0.38);
    c.lineTo(w * 0.48, h * 0.52);
    c.fill();
    c.strokeStyle = '#ff6a1f';
    c.lineWidth = w * 0.02;
    for (const dx of [-0.04, 0, 0.05]) {
      c.beginPath();
      c.moveTo(w * (0.26 + dx), h * 0.39);
      c.quadraticCurveTo(w * (0.2 + dx * 2), h * 0.46, w * (0.24 + dx * 3), h * 0.53);
      c.stroke();
    }
    c.fillStyle = '#1f7f9a';
    c.fillRect(0, h * 0.52, w, h * 0.1);
    c.fillStyle = '#e8f3f2';
    for (let i = 0; i < 6; i++) c.fillRect(w * (0.08 + i * 0.16), h * 0.56, w * 0.07, h * 0.006);
    // Hojas de platanera en primer plano, con su nervio.
    for (let i = 0; i < 7; i++) {
      const x = w * (i / 6),
        y = h * (0.72 + (i % 2) * 0.08),
        a = -0.9 + (i % 3) * 0.6;
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.fillStyle = ['#3f8f3a', '#5fae45', '#2f7a34'][i % 3];
      c.beginPath();
      c.ellipse(0, -h * 0.12, w * 0.12, h * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#c9e07a';
      c.lineWidth = w * 0.012;
      c.beginPath();
      c.moveTo(0, h * 0.06);
      c.lineTo(0, -h * 0.31);
      c.stroke();
      c.restore();
    }
    c.fillStyle = '#5a3c2a';
    c.fillRect(0, h * 0.94, w, h * 0.06);
  });
  ocupado.push([-6.5, 21.2, -2.4, 25.4]);
  superficie(caja, tenido(cal, '#e9dfcf'), -4.45, 3.1, 23.3, 4.1, 6.8, 4.2, 2.6);
  azotea(-4.45, 23.3, 4.1, 4.2, 6.5);
  colgar(mural, -6.52, 3.35, 23.3, 3.8, 5.8);
  // Cuadros con marco en las fachadas de la calle Real que miran al sur.
  const cuadro = (semilla: number) =>
    lamina(1.2, 0.9, (c, w, h) => {
      let s = semilla;
      const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
      c.fillStyle = ['#f1e4c8', '#1d3557', '#e9c46a'][semilla % 3];
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        c.fillStyle = ['#e63946', '#2a9d8f', '#f4a261', '#264653', '#8ab17d', '#f1faee'][Math.floor(r() * 6)];
        if (r() > 0.5) c.fillRect(r() * w, r() * h, r() * w * 0.5, r() * h * 0.5);
        else {
          c.beginPath();
          c.arc(r() * w, r() * h, r() * w * 0.25, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.strokeStyle = '#2b2623';
      c.lineWidth = w * 0.06;
      c.strokeRect(0, 0, w, h);
    });
  for (const [i, z] of [27.4, 30.6].entries()) colgar(cuadro(17 + i * 31), -6.53, 3.3, z, 1.2, 0.9);
  for (const [i, z] of [-28.5, -21].entries()) colgar(cuadro(101 + i * 13), -9.03 + 0.0, 3.4, z, 1.2, 0.9);

  // --- Miradores: pretil encalado con albardilla de piedra ---
  function pretil(x0: number, z0: number, x1: number, z1: number) {
    const largo = Math.hypot(x1 - x0, z1 - z0),
      porX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    pieza(caja, blanco, (x0 + x1) / 2, 0.42, (z0 + z1) / 2, porX ? largo : 0.3, 0.84, porX ? 0.3 : largo);
    pieza(caja, '#8e877c', (x0 + x1) / 2, 0.88, (z0 + z1) / 2, porX ? largo + 0.1 : 0.42, 0.1, porX ? 0.42 : largo + 0.1);
  }
  pretil(-14, -38.1, -2, -38.1);
  pretil(-14.1, -38, -14.1, -34);
  pretil(-2, -38, -2, -32);
  pretil(-20.1, 30, -20.1, 40);
  pretil(-20, 40.1, -12, 40.1);
  banco(-10, -33, Math.PI);
  banco(-5, -33, Math.PI);
  banco(-16, 31, -Math.PI / 2);

  // --- Más casas del casco, sencillas, hasta el borde del valle ---
  const libre = ([a, b, c, d]: Rect) => !ocupado.some(([x0, z0, x1, z1]) => a < x1 + 0.4 && c > x0 - 0.4 && b < z1 + 0.4 && d > z0 - 0.4);
  for (let x = -30; x < 27; x += 4.6)
    for (let z = -40; z < 43; z += 4.8) {
      const r: Rect = [x, z, x + 4.2, z + 4.4];
      if (fuera(x, z) > 0 || fuera(x + 4.2, z + 4.4) > 0 || !libre(r)) continue;
      ocupado.push(r);
      const h = 2.6 + azar() * 2.2,
        cx = x + 2.1,
        cz = z + 2.2;
      pieza(caja, elige(paleta), cx, h / 2 - 0.2, cz, 4.2, h + 0.4, 4.4);
      if (azar() > 0.4) for (const lado of [-1, 1]) pieza(caja, lado > 0 ? '#a95a3e' : '#9a4f37', cx, h + 0.3, cz + lado * 1.1, 4.4, 0.12, 2.5, lado * 0.26);
      else azotea(cx, cz, 4.2, 4.4, h);
      for (const s of [-1, 1])
        for (const y of h > 3.4 ? [1.2, h - 1.1] : [1.2]) {
          pieza(caja, '#efe7d6', cx + s * 1.1, y, cz + 2.21, 0.62, 0.84, 0.06);
          pieza(caja, '#efe7d6', cx - 2.11, y, cz + s * 1.1, 0.06, 0.84, 0.62);
          if (azar() > 0.55) ventanas.push([cx + s * 1.1, y, cz + 2.25, 0.44, 0.66, 0.04]);
          else pieza(caja, '#3a4448', cx + s * 1.1, y, cz + 2.24, 0.44, 0.66, 0.03);
        }
    }

  // --- El valle: terreno facetado, coloreado por parcelas, cumbres, coladas y el cono ---
  const PX = 6,
    PZ = 5;
  function tono(x: number, z: number, y: number, ny: number) {
    if (y < MAR + 0.25) return '#4b4643';
    const dv = Math.hypot(x - VOLCAN.x, z - VOLCAN.z);
    // El cono, negro y rojizo, con el azufre amarillo en el borde del cráter; alrededor, el manto de ceniza.
    if (dv < 9.2) return dv < 3 ? (azarFijo(Math.floor(x * 2), Math.floor(z * 2)) > 0.55 ? '#c4a24e' : '#8a4a2c') : dv < 5 ? '#5e3b2b' : '#33292a';
    if (aColada(x, z) < 5.5 || dv < 15) return azarFijo(Math.floor(x), Math.floor(z)) > 0.5 ? '#2c2826' : '#37322f';
    if (fuera(x, z) < 1) return '#8d8574';
    if (y > 17) return ny < 0.75 ? '#7d6049' : '#6e5c4c';
    // Paredes de roca en estratos de basalto y almagre.
    if (ny < 0.62) return ['#7b5b45', '#8a6a50', '#6a605a'][Math.abs(Math.floor(y / 1.6)) % 3];
    if (y > 6) return azarFijo(Math.floor(x / 3), Math.floor(z / 3)) > 0.4 ? '#3f5a37' : '#4b6a40';
    // Plataneras por parcelas: hojas de varios verdes, alguna malla gris y algún erial.
    const k = azarFijo(Math.floor(x / PX), Math.floor(z / PZ));
    return k < 0.1 ? '#c9cec8' : k < 0.18 ? '#8f8a62' : k < 0.6 ? '#5e8d3c' : '#6f9b46';
  }
  {
    const paso = 2,
      n = 80;
    const px: number[] = [],
      py: number[] = [],
      pz: number[] = [];
    for (let j = 0; j <= n; j++)
      for (let i = 0; i <= n; i++) {
        const borde = i === 0 || j === 0 || i === n || j === n;
        const x = -80 + (i + (borde ? 0 : (azar() - 0.5) * 0.5)) * paso,
          z = -80 + (j + (borde ? 0 : (azar() - 0.5) * 0.5)) * paso;
        px.push(x);
        pz.push(z);
        py.push(campo(x, z));
      }
    const capas = new Map<string, number[]>();
    const a = new T.Vector3(),
      b = new T.Vector3(),
      c = new T.Vector3();
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const v00 = j * (n + 1) + i,
          v10 = v00 + 1,
          v01 = v00 + n + 1,
          v11 = v01 + 1;
        if (Math.hypot(px[v00] + paso / 2, pz[v00] + paso / 2) > 82) continue;
        for (const tri of (i + j) % 2 ? [[v00, v01, v10], [v10, v01, v11]] : [[v00, v01, v11], [v00, v11, v10]]) {
          a.set(px[tri[0]], py[tri[0]], pz[tri[0]]);
          b.set(px[tri[1]], py[tri[1]], pz[tri[1]]);
          c.set(px[tri[2]], py[tri[2]], pz[tri[2]]);
          if (Math.max(a.y, b.y, c.y) < MAR - 0.3) continue; // bajo el mar no se ve

          const ny = b.clone().sub(a).cross(c.clone().sub(a)).normalize().y;
          const color = tono((a.x + b.x + c.x) / 3, (a.z + b.z + c.z) / 3, (a.y + b.y + c.y) / 3, Math.abs(ny));
          if (!capas.has(color)) capas.set(color, []);
          capas.get(color)!.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
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
  // Mar al fondo, a la altura del horizonte pintado.
  const marMaterial = new T.MeshStandardMaterial({ color: '#2d5b8c', roughness: 0.35 });
  const agua = new T.CircleGeometry(84, 48).rotateX(-Math.PI / 2);
  superficie(agua, marMaterial, 0, MAR, 0, 1, 1, 1, 12).castShadow = false;
  agua.dispose();

  // Parcelas de plataneras alrededor del casco: muros de piedra, mallas y las matas más cercanas.
  for (let i = -14; i < 14; i++)
    for (let j = -17; j < 17; j++) {
      const x0 = i * PX,
        z0 = j * PZ,
        cx = x0 + PX / 2,
        cz = z0 + PZ / 2;
      const f = fuera(cx, cz);
      if (f < 1.5 || f > 24 || aColada(cx, cz) < 7 || Math.hypot(cx - VOLCAN.x, cz - VOLCAN.z) < 16) continue;
      const h = campo(cx, cz);
      if (h < MAR + 0.6 || h > 6) continue;
      const esquinas = [campo(x0, z0), campo(x0 + PX, z0), campo(x0, z0 + PZ)];
      if (Math.max(...esquinas) - Math.min(...esquinas) > 3.5) continue;
      const [h00, h10, h01] = esquinas;
      pieza(caja, '#8a7f72', cx, (h00 + h10) / 2 + 0.3, z0, PX, 1.1, 0.3, 0, 0, Math.atan2(h10 - h00, PX));
      pieza(caja, '#8a7f72', x0, (h00 + h01) / 2 + 0.3, cz, 0.3, 1.1, PZ, -Math.atan2(h01 - h00, PZ));
      const k = azarFijo(i, j);
      if (k < 0.1) {
        // Invernadero de malla: techo claro sobre postes.
        const techo = Math.max(...esquinas, h) + 1.9;
        pieza(caja, '#dfe3df', cx, techo, cz, PX - 0.4, 0.05, PZ - 0.4);
        for (const dx of [-1, 1]) for (const dz of [-1, 1]) pieza(poste, '#8d8f8c', cx + dx * 2.7, techo - 1.2, cz + dz * 2.2, 0.08, 2.4, 0.08);
      } else if (k >= 0.18 && f < 13)
        for (const dx of [-1.4, 1.4])
          for (const dz of [-1.2, 1.2]) {
            const x = cx + dx + (azar() - 0.5) * 0.5,
              z = cz + dz + (azar() - 0.5) * 0.5;
            platanera(x, campo(x, z) - 0.05, z);
          }
    }
  // Pinar en las laderas de las cumbres.
  for (let i = 0, puestos = 0; i < 900 && puestos < 190; i++) {
    const a = azar() * Math.PI * 2,
      r = 40 + azar() * 38,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    const y = campo(x, z);
    if (y < 6 || y > 26 || aColada(x, z) < 7 || Math.hypot(x - VOLCAN.x, z - VOLCAN.z) < 16) continue;
    pino(x, y - 0.1, z, 2 + azar() * 1.6);
    puestos++;
  }
  // Tazacorte, abajo junto al mar, con su iglesia; El Paso, ladera arriba; y casas sueltas por el valle.
  for (const [cx, cz, cuantas, radio] of [
    [-33, -57, 26, 6],
    [2, 50, 22, 7],
  ])
    for (let k = 0; k < cuantas; k++) {
      const a = azar() * Math.PI * 2,
        d = Math.sqrt(azar()) * radio;
      casita(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 1.4 + azar() * 1, 1.4 + azar() * 1, 1.1 + azar() * 0.9, azar() > 0.75 ? elige(paleta) : blanco);
    }
  {
    const y = campo(-32, -56);
    pieza(caja, blanco, -32, y + 0.9, -56, 1.6, 2.4, 3.2);
    tejado(-32, y + 2.1, -56, 1.8, 3.4, 0.6, 2);
    pieza(caja, blanco, -32, y + 1.8, -54.1, 1, 4, 1);
    pieza(piramide, '#a4553a', -32, y + 4.1, -54.1, 0.8, 0.6, 0.8, 0, Math.PI / 4);
  }
  for (let i = 0, puestas = 0; i < 400 && puestas < 45; i++) {
    const x = (azar() - 0.5) * 130,
      z = (azar() - 0.5) * 130;
    const f = fuera(x, z),
      y = campo(x, z);
    if (f < 3 || f > 30 || y < MAR + 1 || y > 6 || aColada(x, z) < 7 || Math.hypot(x - VOLCAN.x, z - VOLCAN.z) < 16) continue;
    casita(x, z, 1.4 + azar(), 1.4 + azar(), 1.2 + azar() * 0.8);
    puestas++;
  }
  // Puerto de Tazacorte: el dique en la desembocadura del barranco.
  pieza(caja, '#6d665e', -21, MAR + 0.3, -76, 1, 0.9, 7, 0, 0.5);
  pieza(caja, '#6d665e', -18.6, MAR + 0.3, -79, 4.5, 0.9, 1, 0, 0.5);

  cocer(tejas, teja, 1.85);
  cocer(hastiales, encalado, 2.6);
  for (const g of [arco, disco, aro, cono]) g.dispose();
  return { amarres: [], enSeco: [] };
}
