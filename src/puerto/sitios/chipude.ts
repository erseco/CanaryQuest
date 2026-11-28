import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS, type Suelo } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa } from './terreno';

type Punto = [number, number];
type Rect = [number, number, number, number];
/** Hacia dónde mira una fachada; el fondo del encuadre es −z. */
type Frente = 'n' | 's' | 'e' | 'o';
const NORMAL: Record<Frente, Punto> = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] };

/**
 * Cornisa de la Fortaleza, desde la proa del norte, la esquina que mira al pueblo. Sacada de las
 * curvas de nivel del IGN (la de 1.240 m y las que se apiñan bajo ella), girada como el resto del
 * lugar y a escala 1:15, algo más ancha en la punta sur para que se pueda caminar hasta ella.
 */
export const MESA: Punto[] = [
  [22.5, -30],
  [17, -37],
  [13.5, -44.5],
  [15.5, -47.5],
  [23, -48],
  [31, -49],
  [38.5, -51.5],
  [45, -55.5],
  [47, -51.5],
  [43.5, -45.5],
  [37, -39],
  [31, -34],
  [26.5, -30.5],
];
/** Altura de la meseta: la plaza está a 0 y Pavón a 2,4. */
export const CIMA = 13;
/** Donde la senda de la canal corta la cornisa: ahí la pared se abre. */
const CANAL: Punto = [14.4, -42.5];

/** Distancia al borde de la meseta: negativa dentro. */
export function aLaMesa(x: number, z: number): number {
  let d = Infinity,
    dentro = false;
  for (let i = 0, j = MESA.length - 1; i < MESA.length; j = i++) {
    const [ax, az] = MESA[j],
      [bx, bz] = MESA[i];
    if (az > z !== bz > z && x < ax + ((z - az) * (bx - ax)) / (bz - az)) dentro = !dentro;
    const dx = bx - ax,
      dz = bz - az;
    const k = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    d = Math.min(d, Math.hypot(x - ax - dx * k, z - az - dz * k));
  }
  return dentro ? -d : d;
}

const suave = (v: number) => {
  const k = Math.min(1, Math.max(0, v));
  return k * k * (3 - 2 * k);
};

/**
 * Ladera sin la mesa. A la izquierda sube el monte hacia Garajonay; detrás de la cámara baja a
 * El Cercado; a la derecha cae hacia el oeste; entre el pueblo y Pavón corre un barranquillo, y
 * tras la mesa se hunde el barranco de Erque.
 */
function natural(x: number, z: number): number {
  const monte = suave((-x - 16) / 30) * (4 + 7 * suave((-z - 10) / 40));
  const cercado = -2.4 * suave((-x - 12) / 20) * suave((z + 4) / 12);
  const costado = -4 * suave((x - 9.5) / 14) * suave((z + 14) / 6);
  const oeste = -6 * suave((x - 24) / 36) * suave((z + 24) / 30);
  const cauce = -20.5 + 0.15 * x;
  const barranquillo =
    -(1.8 + 0.06 * Math.max(0, x)) * Math.exp(-(((z - cauce) / 4.5) ** 2)) * suave((x + 30) / 16);
  const subida = 2.4 * suave((-z - 20) / 12) + 2.2 * suave((-z - 34) / 14);
  const erque = -16 * suave((-z - 53) / 16) * suave((x + 12) / 20);
  const delante = 0.12 * Math.max(0, z - 28);
  const rugosidad = 0.3 * Math.sin(x * 0.37 + z * 0.21) + 0.4 * Math.sin(x * 0.13 - z * 0.41);
  return monte + cercado + costado + oeste + barranquillo + subida + erque + delante + rugosidad;
}

/** La meseta llana, la pared vertical y el pedestal de derrubios que baja hasta la ladera. */
function ladera(x: number, z: number): number {
  const d = aLaMesa(x, z);
  if (d <= 0) return CIMA;
  // Por el norte, que mira al pueblo, la pared se apoya alto; por detrás cae sobre Erque.
  const pie = 6.2 - 8 * suave((-z - 47) / 9);
  const base = natural(x, z);
  const pedestal = (e: number) =>
    base + (Math.max(pie, base) - base) * Math.exp(-e / 6) + 1.2 * Math.exp(-e / 1.6);
  return d < 0.8 ? CIMA + ((pedestal(0.8) - CIMA) * d) / 0.8 : pedestal(d);
}

/**
 * La Fortaleza de Chipude (La Gomera): la mesa de roca de 1.243 m y el pueblo a sus pies, trazados
 * sobre la ortofoto PNOA y las curvas de nivel del IGN. El conjunto gira 131° para que la mesa quede
 * al fondo del encuadre, y el pueblo 41° más para que la iglesia mire a la cámara. La distancia del
 * pueblo a la mesa se acorta a la mitad. Las sendas pisables están en `PUEBLOS.chipude.plano.suelos`.
 */
export function trazarChipude(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, basalto, teja } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const suelos = PUEBLOS.chipude.plano.suelos!;
  const paseo = (x: number, z: number) => alturaPaseo(x, z, 'chipude');

  // --- Terreno: se amolda a las sendas, salvo en la cima, que ya está a su altura ---
  const esquinas = ({ r }: Suelo): Punto[] => [
    [r[0], r[1]],
    [r[2], r[1]],
    [r[0], r[3]],
    [r[2], r[3]],
  ];
  const caminos = suelos.filter((s) => !esquinas(s).every(([x, z]) => aLaMesa(x, z) < 0));
  function cercania(x: number, z: number): [number, number] {
    let cerca = Infinity,
      camino = 0;
    for (const { r } of caminos) {
      const cx = Math.min(Math.max(x, r[0]), r[2]),
        cz = Math.min(Math.max(z, r[1]), r[3]),
        d = Math.hypot(x - cx, z - cz);
      if (d < cerca) {
        cerca = d;
        camino = paseo(cx, cz);
      }
    }
    return [cerca, camino];
  }
  function altura(x: number, z: number): number {
    const [cerca, camino] = cercania(x, z);
    const k = Math.min(1, Math.max(0, cerca - 0.9) / 3.5),
      s = k * k * (3 - 2 * k);
    return (camino - 0.1) * (1 - s) + ladera(x, z) * s;
  }
  /** Color de cada faceta: matorral en la cima, roca en lo empinado y bancales en las laderas. */
  function tono(x: number, y: number, z: number, llano: number): string {
    const ruido = Math.sin(x * 0.23 + z * 0.17) + Math.sin(x * 0.071 - z * 0.13 + 1.3);
    const mesa = aLaMesa(x, z);
    if (mesa < -0.3) return ruido > 0.5 ? '#8a8652' : ruido > -0.6 ? '#7b7d4d' : '#9a8d5e';
    // Roca viva solo en la pared; el pedestal de derrubios está cubierto de matorral y pasto seco.
    if (llano < 0.6 && (mesa < 1.6 || y < -4)) return y > 8 ? '#9a7766' : '#86705f';
    if (llano < 0.75) {
      const mancha = Math.sin(x * 1.3 + z * 0.7) + Math.sin(x * 0.5 - z * 1.1);
      return mancha > 0.6 ? '#5f6f3e' : mancha > -0.4 ? '#8b8256' : '#9a8a64';
    }
    if (y < -5) return '#7d6d5b';
    if (cercania(x, z)[0] < 1.6) return '#ab9a7b';
    if (x < -20 || ruido > 0.8) return ruido > 0 ? '#5f6f3e' : '#6b7745';
    // Franjas que siguen las curvas de nivel: un bancal sembrado y otro en barbecho.
    const banda = Math.floor(y / 0.62) % 2;
    return banda ? (ruido > 0 ? '#a7945f' : '#9c8b59') : ruido > 0 ? '#93955d' : '#a39a66';
  }
  {
    const paso = 1.4,
      [x0, z0, x1, z1] = [-76, -80, 76, 64];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const malla: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.5) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.5) * paso;
        malla.push(new T.Vector3(x, altura(x, z), z));
      }
    const posiciones: number[] = [],
      colores: number[] = [];
    const color = new T.Color(),
      normal = new T.Vector3(),
      lado = new T.Vector3();
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i,
          b = a + 1,
          c = a + nx + 1,
          d = c + 1;
        for (const tri of (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]]) {
          const [u, v, w] = tri.map((n) => malla[n]);
          // Lo que quedaría detrás del horizonte pintado no se dibuja.
          if (Math.min(Math.hypot(u.x, u.z), Math.hypot(v.x, v.z), Math.hypot(w.x, w.z)) > 79) continue;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          color.set(tono((u.x + v.x + w.x) / 3, (u.y + v.y + w.y) / 3, (u.z + v.z + w.z) / 3, Math.abs(normal.y)));
          for (const q of [u, v, w]) {
            posiciones.push(q.x, q.y, q.z);
            colores.push(color.r, color.g, color.b);
          }
        }
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(posiciones, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(colores, 3));
    geo.computeVertexNormals();
    const tierra = cal.clone();
    tierra.vertexColors = true;
    tierra.color.setRGB(1.06, 1.06, 1.1);
    superficie(geo, tierra, 0, 0, 0, 1, 1, 1, 6);
    geo.dispose();
  }

  // Muros, tejados y roca se juntan en una malla por material; el color de cada pieza va por vértice.
  const muros: T.BufferGeometry[] = [],
    tejados: T.BufferGeometry[] = [],
    rocas: T.BufferGeometry[] = [];
  function pintar(g: T.BufferGeometry, tinte: string) {
    const c = new T.Color(tinte),
      lista = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < lista.length; i += 3) c.toArray(lista, i);
    g.setAttribute('color', new T.BufferAttribute(lista, 3));
    return g;
  }
  const bloque = (x: number, y: number, z: number, w: number, h: number, d: number, tinte = '#ffffff') =>
    muros.push(pintar(new T.BoxGeometry(w, h, d).translate(x, y, z), tinte));
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
      muros.push(pintar(geo(testeros), '#ffffff'));
    }
  }

  // --- Firme de las sendas: losas en la plaza, asfalto en la carretera, tierra y roca en la subida ---
  const losas = tenido(adoquin, '#b4b6bc'); // losas grises, como las de la plaza
  for (const [x0, z0, x1, z1] of [
    [-8.2, 14, 9, 19],
    [2.2, -1, 9, 14],
    [-8.2, -11, 16, 1.2],
    [-8.2, 1.2, -7, 14],
  ])
    superficie(caja, losas, (x0 + x1) / 2, -0.09, (z0 + z1) / 2, x1 - x0, 0.18, z1 - z0, 2.6);
  for (const s of caminos) {
    const [x0, z0, x1] = s.r;
    if ((s.y ?? 0) === 0 && s.y2 === undefined && z0 > -12 && x0 > -9) continue; // la plaza ya va enlosada
    const color = x0 === -12.5 ? '#6d6964' : x0 >= 3 && z0 < -40 ? '#7e7064' : x1 <= 3 && z0 < -30 ? '#a38d6c' : '#b0a07f';
    losa(t, s, color, 0.02);
  }
  // Rayas de la carretera.
  for (let z = -12; z < 25; z += 2.4) pieza(caja, '#e8e4da', -10.35, 0.02, z, 0.1, 0.02, 1.2);
  // Bandas de ladrillo en arco sobre el enlosado, como ante la fachada de la iglesia.
  for (const [cx, cz, radio] of [
    [1, 20.5, 6],
    [1, 20.5, 4.6],
    [4, -5, 5.5],
    [4, -5, 3],
  ])
    for (let a = 0; a < Math.PI * 2; a += 0.09) {
      const x = cx + Math.cos(a) * radio,
        z = cz + Math.sin(a) * radio;
      const enlosado = (x > -8.2 && x < 9 && z > 14 && z < 19) || (x > -8.2 && x < 16 && z > -11 && z < 1.2);
      if (enlosado) pieza(caja, '#9a5643', x, 0.005, z, radio * 0.095, 0.012, 0.16, 0, -a + Math.PI / 2);
    }

  // --- Iglesia de Nuestra Señora de Candelaria: dos naves, capilla mayor más alta y campanario ---
  const cornisa = '#eee7da',
    oscura = '#4d4642',
    puerta = '#6b4528';
  bloque(-5, 1.45, 9.5, 4, 5.9, 9); // nave del norte
  tejado(-5, 4.4, 9.5, 4.5, 9, 1.5, 2);
  bloque(-0.4, 1.65, 9.5, 5.2, 6.3, 9); // nave del sur, más ancha
  tejado(-0.4, 4.8, 9.5, 5.7, 9, 1.8, 2);
  bloque(-2.4, 2.35, 3.1, 9.2, 7.7, 3.8); // capilla mayor
  tejado(-2.4, 6.28, 3.1, 9.8, 4.4, 1.5);
  bloque(3.4, 0.95, 2.9, 2.4, 4.9, 2.8); // sacristía
  tejado(3.4, 3.48, 2.9, 2.9, 3.3, 0.9);
  for (const [x, y, z, w, d] of [
    [-5, 4.42, 9.5, 4.2, 9.1],
    [-0.4, 4.82, 9.5, 5.4, 9.1],
    [-2.4, 6.22, 3.1, 9.4, 4],
    [3.4, 3.42, 2.9, 2.6, 3],
  ])
    pieza(caja, cornisa, x, y, z, w, 0.12, d);
  // Contrafuertes con su talud encalado, a los dos costados.
  for (const [x, s, zs] of [
    [2.2, 1, [13.1, 10.2, 6]],
    [-7, -1, [13.1, 9.5, 6]],
  ] as [number, number, number[]][])
    for (const z of zs) {
      bloque(x + s * 0.5, 0.55, z, 1, 3.1, 0.8);
      pieza(caja, '#f7f3eb', x + s * 0.45, 2.55, z, 1.3, 0.5, 0.8, 0, 0, -0.75 * s);
      pieza(caja, '#a95b3f', x + s * 0.43, 2.82, z, 1.34, 0.06, 0.86, 0, 0, -0.75 * s);
    }
  // Adarajas: piedras que asoman en las esquinas de la capilla mayor.
  for (const [x, z] of [
    [2.24, 1.2],
    [-7.04, 1.2],
  ])
    for (let y = 0.8; y < 6; y += 0.75) pieza(caja, '#6a615a', x, y + azar() * 0.2, z, 0.18, 0.22, 0.26);
  const arco = new T.TorusGeometry(1, 0.17, 5, 12, Math.PI);
  /** Portada de arco de medio punto en cantería oscura; `giro` 0 mira a +z y π/2 a +x. */
  function portada(x: number, z: number, giro: number, ancho: number, alto: number) {
    const [ux, uz] = [Math.cos(giro), -Math.sin(giro)];
    for (const s of [-1, 1])
      pieza(caja, oscura, x + (ux * s * ancho) / 2, alto / 2, z + (uz * s * ancho) / 2, giro ? 0.14 : 0.24, alto, giro ? 0.24 : 0.14);
    pieza(arco, oscura, x, alto, z, ancho / 2, ancho / 2, 1, 0, giro, 0);
    pieza(caja, puerta, x, alto / 2, z, giro ? 0.06 : ancho - 0.1, alto, giro ? ancho - 0.1 : 0.06);
    pieza(poste, '#4a3122', x, alto, z, ancho - 0.1, 0.05, ancho - 0.1, giro ? 0 : Math.PI / 2, 0, giro ? Math.PI / 2 : 0);
  }
  portada(-5.4, 14.03, 0, 1.25, 2.05); // en la fachada, bajo el hastial del norte
  portada(2.23, 8.3, Math.PI / 2, 1.2, 2); // en el costado sur
  // Óculos de los hastiales: aro de cantería y reja en aspa.
  const aro = new T.TorusGeometry(1, 0.2, 5, 16);
  for (const [x, y] of [
    [-5.2, 4.75],
    [-0.4, 5.15],
  ]) {
    pieza(aro, oscura, x, y, 14.04, 0.44, 0.44, 0.5);
    pieza(poste, '#2c2a2c', x, y, 14.02, 0.72, 0.04, 0.72, Math.PI / 2);
    ventanas.push([x, y, 14.05, 0.45, 0.45, 0.02]);
    for (const g of [Math.PI / 4, -Math.PI / 4]) pieza(caja, '#d8d2c8', x, y, 14.07, 0.8, 0.05, 0.03, 0, 0, g);
  }
  // Ventana de la capilla mayor sobre el costado sur.
  pieza(caja, '#5b3a24', 2.23, 4.7, 3.6, 0.08, 1.05, 0.7);
  ventanas.push([2.27, 4.7, 3.6, 0.04, 0.8, 0.5]);
  // Campanario de sillería oscura entre los dos hastiales, con su remate de bola.
  const tx = -3,
    tz = 14.4;
  pieza(caja, '#958d83', tx, 3.55, tz, 1.8, 7.7, 1.6);
  const sillares = ['#4b4541', '#57504a', '#433e3b', '#5f5751', '#4f4844'];
  for (let k = 0, y = 0.21; y < 7.4; k++, y += 0.42)
    for (const [cara, ancho] of [
      ['frente', 1.8],
      ['izquierda', 1.6],
      ['derecha', 1.6],
    ] as [string, number][]) {
      let u = -ancho / 2 + 0.03 + (k % 2 ? 0.25 : 0);
      if (k % 2) {
        const p = cara === 'frente' ? [tx - ancho / 2 + 0.14, tz + 0.83] : [cara === 'izquierda' ? tx - 0.93 : tx + 0.93, tz - ancho / 2 + 0.14];
        pieza(caja, sillares[(k * 3) % 5], p[0], y, p[1], cara === 'frente' ? 0.22 : 0.06, 0.37, cara === 'frente' ? 0.06 : 0.22);
      }
      while (u < ancho / 2 - 0.1) {
        const largo = Math.min(0.42 + azar() * 0.2, ancho / 2 - 0.03 - u);
        const m = u + largo / 2;
        const color = sillares[Math.floor(azar() * sillares.length)];
        if (cara === 'frente') pieza(caja, color, tx + m, y, tz + 0.83, largo - 0.05, 0.37, 0.06);
        else pieza(caja, color, cara === 'izquierda' ? tx - 0.93 : tx + 0.93, y, tz + m, 0.06, 0.37, largo - 0.05);
        u += largo;
      }
    }
  // Huecos de las campanas, al frente y a los lados.
  for (const [x, z, w, d] of [
    [tx, tz + 0.86, 0.62, 0.04],
    [tx - 0.96, tz, 0.04, 0.56],
    [tx + 0.96, tz, 0.04, 0.56],
  ]) {
    pieza(caja, '#1f1b19', x, 6.55, z, w, 0.95, d);
    pieza(esfera, '#1f1b19', x, 7.02, z, Math.max(w, 0.04) / 2, 0.28, Math.max(d, 0.04) / 2);
  }
  pieza(esfera, '#8a6a33', tx, 6.45, tz + 0.92, 0.2, 0.24, 0.1); // la campana, colgada en el hueco
  pieza(caja, '#3f3a37', tx, 7.62, tz, 2.0, 0.2, 1.8);
  pieza(caja, '#4f4844', tx, 7.95, tz, 1.4, 0.45, 1.25);
  pieza(piramide, '#4b4541', tx, 8.5, tz, 0.95, 0.7, 0.85, 0, Math.PI / 4);
  pieza(esfera, '#5a524c', tx, 8.98, tz, 0.15, 0.15, 0.15);
  arco.dispose();
  aro.dispose();

  // --- Plaza: laureles, palmeras de las fichas del plano, bancos y el pretil sobre la ladera ---
  for (const [x, z] of [
    [-6, -7.8],
    [7, -7.8],
  ]) {
    pieza(poste, '#e9e3d8', x, 0.25, z, 1.1, 0.5, 1.1);
    pieza(poste, '#6e5a48', x, 1.3, z, 0.26, 2.1, 0.26);
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9;
      pieza(esfera, k % 2 ? '#3b5d36' : '#4a6d3c', x + Math.cos(a) * 0.7, 2.7 + (k % 3) * 0.25, z + Math.sin(a) * 0.7, 1.1, 0.8, 1.1);
    }
  }
  for (const [x, z, giro] of [
    [-3.5, -11.45, 0],
    [4.5, -11.45, 0],
    [10.5, -11.45, 0],
    [16.45, -6, Math.PI / 2],
    [9.45, 6, Math.PI / 2],
    [9.45, 11, Math.PI / 2],
  ]) {
    pieza(caja, '#f2ede4', x, 0.22, z, 1.5, 0.44, 0.45, 0, giro);
    pieza(caja, madera, x, 0.47, z, 1.5, 0.06, 0.45, 0, giro);
  }
  for (const [x0, z0, x1, z1] of [
    [9.2, 1.2, 9.2, 19.2],
    [9.2, 19.2, -8.2, 19.2],
  ]) {
    const largo = Math.hypot(x1 - x0, z1 - z0),
      porX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    pieza(caja, '#f4f0e8', (x0 + x1) / 2, 0.4, (z0 + z1) / 2, porX ? largo : 0.24, 0.8, porX ? 0.24 : largo);
    pieza(caja, '#bdb5a9', (x0 + x1) / 2, 0.83, (z0 + z1) / 2, porX ? largo + 0.1 : 0.32, 0.08, porX ? 0.32 : largo + 0.1);
  }
  // Huerto cercado al oeste de la iglesia, con sus árboles.
  pieza(caja, '#7b6a50', 2.5, 0.03, 23, 11, 0.06, 6.4);
  for (let i = 0; i < 5; i++) {
    const x = -1.5 + i * 2.2 + azar() * 0.5,
      z = 22.6 + (i % 2) * 1.6 + azar() * 0.4;
    pieza(poste, '#6e5a48', x, 0.55, z, 0.14, 1.1, 0.14);
    pieza(esfera, i % 2 ? '#4d6b3a' : '#5b7840', x, 1.35, z, 0.75, 0.6, 0.75);
  }
  for (const [x0, z0, x1, z1] of [
    [-3, 26.2, 8, 26.2],
    [8, 19.6, 8, 26.2],
    [-3, 19.6, -3, 26.2],
  ]) {
    const porX = z0 === z1;
    pieza(caja, '#f1ece2', (x0 + x1) / 2, 0.5, (z0 + z1) / 2, porX ? x1 - x0 : 0.24, 1, porX ? 0.24 : z1 - z0);
  }

  // --- Casas: encaladas, de teja a cuatro aguas, con carpintería verde o de madera ---
  const ocupado: Rect[] = suelos.map(({ r }) => [r[0] - 0.4, r[1] - 0.4, r[2] + 0.4, r[3] + 0.4]);
  ocupado.push([-8, 0.8, 5, 14.5], [-3.5, 19.4, 8.5, 26.5]);
  const libre = ([a, b, c, d]: Rect) => !ocupado.some(([e, f, g, h]) => a < g && c > e && b < h && d > f);
  const encalados = ['#ffffff', '#fbf2e2', '#f2e2c6', '#ffffff', '#ede4d6', '#f7e9d2', '#e9d3b0'];
  const carpinterias = ['#2f6b45', '#6b4528', '#3d7a4f', '#7a5232', '#5b3a24', '#2f5f6b'];
  let cuenta = 0;
  function casa(x: number, z: number, w: number, d: number, h: number, frente: Frente, base?: number) {
    const i = cuenta++;
    const [nx, nz] = NORMAL[frente];
    const sx = nx ? d : w,
      sz = nx ? w : d;
    const b =
      base ??
      Math.min(
        altura(x - sx / 2, z - sz / 2),
        altura(x + sx / 2, z + sz / 2),
        altura(x - sx / 2, z + sz / 2),
        altura(x + sx / 2, z - sz / 2),
      );
    ocupado.push([x - sx / 2, z - sz / 2, x + sx / 2, z + sz / 2]);
    bloque(x, b + (h - 3) / 2, z, sx, h + 3, sz, encalados[i % encalados.length]);
    pieza(caja, i % 4 === 1 ? '#7d756c' : '#b3aa9c', x, b + 0.3, z, sx + 0.06, 0.6, sz + 0.06);
    pieza(caja, cornisa, x, b + h + 0.05, z, sx + 0.18, 0.1, sz + 0.18);
    if (i % 9 === 4) {
      // Azotea con su pretil, como en las casas nuevas del pueblo.
      for (const s of [-1, 1]) {
        pieza(caja, cornisa, x, b + h + 0.3, z + (s * sz) / 2, sx + 0.1, 0.4, 0.12);
        pieza(caja, cornisa, x + (s * sx) / 2, b + h + 0.3, z, 0.12, 0.4, sz + 0.1);
      }
    } else tejado(x, b + h + 0.08, z, sx + 0.45, sz + 0.45, Math.min(sx, sz) * 0.3);
    const tinte = carpinterias[(i * 5) % carpinterias.length];
    const sobre = (u: number, n: number): Punto => [x + nx * (d / 2 + n) + nz * u, z + nz * (d / 2 + n) - nx * u];
    const hueco = (color: string, u: number, y: number, a: number, alto: number, n: number) => {
      const [px, pz] = sobre(u, n);
      pieza(caja, color, px, b + y, pz, nx ? 0.08 : a, alto, nx ? a : 0.08);
    };
    const luz = (u: number, y: number, a: number, alto: number) => {
      const [px, pz] = sobre(u, 0.07);
      ventanas.push([px, b + y, pz, nx ? 0.04 : a, alto, nx ? a : 0.04]);
    };
    const entrada = w >= 3.4 ? 0 : -w * 0.22;
    hueco('#d9d1c4', entrada, 0.98, 1.0, 1.96, 0.02);
    hueco(tinte, entrada, 0.9, 0.78, 1.78, 0.05);
    const filas = h > 4.4 ? [1.45, h - 1.25] : [1.45];
    for (const y of filas)
      for (const u of w >= 3.4 ? [-w * 0.3, w * 0.3] : y > 2 ? [-w * 0.24, w * 0.24] : [w * 0.24]) {
        if (y < 2 && Math.abs(u - entrada) < 0.9) continue;
        hueco('#e9e2d6', u, y, 0.9, 1.06, 0.02);
        hueco(tinte, u, y, 0.66, 0.84, 0.05);
        luz(u, y, 0.5, 0.64);
      }
  }
  /** Hilera de casas con la fachada en la línea `fijo`, de `desde` a `hasta`. */
  /** Hilera de casas con la fachada en la línea `fijo`, de `desde` a `hasta`; las de la plaza, a su nivel. */
  function hilera(frente: Frente, fijo: number, desde: number, hasta: number, alta = false, base?: number) {
    const [nx, nz] = NORMAL[frente],
      d = 3.4;
    for (let a = desde; ; ) {
      const w = Math.min([3.4, 2.9, 3.8, 3.1, 3.6][cuenta % 5], hasta - a);
      if (w < 2.6) break;
      const u = a + w / 2;
      const x = nx ? fijo - (nx * d) / 2 : u,
        z = nx ? u : fijo - (nz * d) / 2;
      casa(x, z, w, d, alta ? [5.2, 3.2, 4.8][cuenta % 3] : [3, 3.4, 2.8, 4.8, 3.2][cuenta % 5], frente, base);
      a += w + 0.06;
    }
  }
  hilera('e', -12.9, -12.5, 5.4, false, 0); // carretera, acera de enfrente
  hilera('e', -12.9, 9.2, 26, false, 0);
  hilera('n', 19.6, -8, -3.4, false, 0); // cara al atrio
  hilera('s', -11.5, -8.2, 0.1, true, 0); // al fondo de la plaza
  hilera('s', -11.5, 3.4, 16, true, 0);
  casa(19.8, -7.2, 7.2, 6.8, 5.4, 'o', 0); // casa grande con bar, al costado de la plaza
  casa(19.3, -1, 4, 5.8, 4.6, 'o', 0);
  hilera('n', 19.6, 9.6, 16);
  // Pavón: unas pocas casas junto a la explanada.
  casa(-14.6, -32.6, 3.4, 3.4, 3, 'e');
  casa(-14.4, -37.2, 3.2, 3.2, 2.8, 'e');
  casa(6.2, -33.4, 3.6, 3.4, 3.2, 'o');
  casa(6, -28.6, 3, 3.2, 2.8, 'o');
  // Casas sueltas por la ladera, lejos de la mesa.
  for (let i = 0, puestas = 0; i < 500 && puestas < 34; i++) {
    const x = -52 + azar() * 100,
      z = -40 + azar() * 80;
    if (Math.hypot(x, z) > 66 || aLaMesa(x, z) < 9 || z < -38) continue;
    const frente: Frente = azar() > 0.3 ? 's' : azar() > 0.5 ? 'e' : 'o',
      w = 3 + azar() * 0.8,
      d = 3 + azar() * 0.5;
    const [nx] = NORMAL[frente],
      sx = nx ? d : w,
      sz = nx ? w : d;
    if (!libre([x - sx / 2 - 0.8, z - sz / 2 - 0.8, x + sx / 2 + 0.8, z + sz / 2 + 0.8])) continue;
    const alturas = [altura(x - sx / 2, z - sz / 2), altura(x + sx / 2, z + sz / 2), altura(x - sx / 2, z + sz / 2), altura(x + sx / 2, z - sz / 2)];
    if (Math.max(...alturas) - Math.min(...alturas) > 1.6) continue; // demasiado empinado para una casa
    casa(x, z, w, d, [2.8, 3.2, 3][i % 3], frente);
    puestas++;
  }

  // --- Bancales: muros de piedra seca a lo largo de las curvas de nivel ---
  {
    const lamina = new T.PlaneGeometry(1, 1);
    const paso = 1.25,
      salto = 0.62,
      [x0, z0, x1, z1] = [-46, -48, 58, 38];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const h: number[] = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) h.push(altura(x0 + i * paso, z0 + j * paso));
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const x = x0 + i * paso,
          z = z0 + j * paso;
        const c: [number, number, number][] = [
          [x, z, h[j * (nx + 1) + i]],
          [x + paso, z, h[j * (nx + 1) + i + 1]],
          [x + paso, z + paso, h[(j + 1) * (nx + 1) + i + 1]],
          [x, z + paso, h[(j + 1) * (nx + 1) + i]],
        ];
        const bajo = Math.min(...c.map((p) => p[2])),
          alto = Math.max(...c.map((p) => p[2]));
        // Ni en el llano, ni en el risco, ni junto a sendas y casas, ni al pie de la pared.
        if (alto - bajo < 0.12 || alto - bajo > 1.5 || bajo < -5 || alto > 9.5) continue;
        if (Math.hypot(x, z) > 68 || aLaMesa(x, z) < 2.2 || !libre([x - 0.3, z - 0.3, x + paso + 0.3, z + paso + 0.3])) continue;
        for (let k = Math.ceil(bajo / salto); k * salto < alto; k++) {
          const nivel = k * salto,
            cortes: Punto[] = [];
          for (let e = 0; e < 4; e++) {
            const [px, pz, ph] = c[e],
              [qx, qz, qh] = c[(e + 1) % 4];
            if (ph < nivel !== qh < nivel) {
              const f = (nivel - ph) / (qh - ph);
              cortes.push([px + (qx - px) * f, pz + (qz - pz) * f]);
            }
          }
          for (let m = 0; m + 1 < cortes.length; m += 2) {
            const [[ax, az], [bx, bz]] = [cortes[m], cortes[m + 1]];
            const largo = Math.hypot(bx - ax, bz - az);
            if (largo < 0.05) continue;
            pieza(lamina, (i + k) % 3 ? '#8f8170' : '#9e907c', (ax + bx) / 2, nivel + 0.04, (az + bz) / 2, largo + 0.12, 0.46, 1, 0, Math.atan2(-(bz - az), bx - ax));
          }
        }
      }
    lamina.dispose();
  }

  // --- La Fortaleza: corona de columnas de roca, derrubios al pie y matorral en lo alto ---
  {
    const prisma = new T.CylinderGeometry(1, 1, 1, 6);
    const tintes = ['#ffffff', '#efe6e0', '#ddd2cc', '#cdbfb8', '#f4e8dc', '#e2d0c4', '#c9cbd6', '#d8dbe6'];
    for (let i = 0; i < MESA.length; i++) {
      const [ax, az] = MESA[i],
        [bx, bz] = MESA[(i + 1) % MESA.length];
      const largo = Math.hypot(bx - ax, bz - az),
        n = Math.ceil(largo / 0.85);
      // Normal hacia fuera de la meseta.
      let ox = (bz - az) / largo,
        oz = -(bx - ax) / largo;
      if (aLaMesa((ax + bx) / 2 + ox, (az + bz) / 2 + oz) < 0) [ox, oz] = [-ox, -oz];
      for (let k = 0; k < n; k++) {
        const f = (k + 0.2 + azar() * 0.6) / n,
          x = ax + (bx - ax) * f,
          z = az + (bz - az) * f;
        const hueco = Math.hypot(x - CANAL[0], z - CANAL[1]);
        if (hueco < 2.2) continue;
        const pie = altura(x + ox * 1.6, z + oz * 1.6) - 0.6;
        // La arista nordeste, junto a la canal, está rota; en el resto asoma alguna almena suelta.
        const mella = hueco < 5.5 ? 1.2 + azar() * 1.8 : azar() < 0.14 ? 0.5 + azar() * 1.1 : azar() * 0.3;
        const tinte = tintes[Math.floor(azar() * tintes.length)];
        const r = 0.48 + azar() * 0.3;
        if (CIMA - mella - pie < 0.5) continue;
        rocas.push(
          pintar(
            prisma
              .clone()
              .scale(r, CIMA - mella - pie, r * (0.8 + azar() * 0.4))
              .rotateY(azar() * Math.PI)
              .translate(x - ox * 0.15, (CIMA - mella + pie) / 2, z - oz * 0.15),
            tinte,
          ),
        );
        if (azar() < 0.45)
          rocas.push(
            pintar(
              prisma
                .clone()
                .scale(0.6, 3, 0.6)
                .rotateY(azar() * Math.PI)
                .translate(x - ox * 0.85, CIMA - 1.52 - azar() * 0.08, z - oz * 0.85),
              tinte,
            ),
          );
        // Derrubios y bloques caídos al pie.
        if (azar() < 0.7) {
          const e = 1.6 + azar() * 3,
            px = x + ox * e,
            pz = z + oz * e,
            rr = 0.25 + azar() * 0.55;
          if (cercania(px, pz)[0] > 1)
            pieza(esfera, ['#7d6a5e', '#8b776a', '#6f6058'][k % 3], px, altura(px, pz) + rr * 0.3, pz, rr, rr * 0.7, rr);
        }
      }
    }
    prisma.dispose();
    const pared = basalto.clone();
    pared.vertexColors = true;
    pared.color.setRGB(0.95, 1.05, 1.45); // la roca naranja de la textura vira al rosa grisáceo de la traquita
    cocer(rocas, pared, 2.4);
  }
  // Matorral: brezo y faya en el pedestal y en las laderas, retama y hierba en la cima.
  for (let i = 0; i < 1300; i++) {
    const x = -64 + azar() * 124,
      z = -66 + azar() * 118;
    if (Math.hypot(x, z) > 74) continue;
    const d = aLaMesa(x, z),
      y = altura(x, z);
    if (!libre([x - 0.5, z - 0.5, x + 0.5, z + 0.5]) && d > 0) continue;
    if (d < -0.6) {
      if (azar() < 0.55) {
        const r = 0.25 + azar() * 0.35;
        pieza(esfera, azar() > 0.5 ? '#6f7442' : '#82804c', x, y + r * 0.35, z, r * 1.3, r * 0.6, r);
      }
    } else if (d > 1.4 && (x < -18 || (d < 14 && azar() < 0.8) || azar() < 0.22)) {
      const r = 0.4 + azar() * 0.6;
      pieza(esfera, ['#4f6a3e', '#5d7646', '#66784a'][i % 3], x, y + r * 0.4, z, r * 1.2, r * 0.75, r);
    }
  }
  // Pinos canarios sueltos en el monte de la izquierda.
  for (let i = 0; i < 26; i++) {
    const x = -62 + azar() * 40,
      z = -50 + azar() * 80;
    if (Math.hypot(x, z) > 72 || !libre([x - 1, z - 1, x + 1, z + 1])) continue;
    const y = altura(x, z),
      h = 4 + azar() * 3;
    pieza(poste, '#5e4535', x, y + h / 2, z, 0.3, h, 0.3);
    for (let k = 0; k < 4; k++)
      pieza(esfera, k % 2 ? '#35502f' : '#41603a', x + (azar() - 0.5) * 1.2, y + h - 0.6 + k * 0.5, z + (azar() - 0.5) * 1.2, 1.2 - k * 0.2, 0.7, 1.2 - k * 0.2);
  }
  // Pitas con su vara florida en candelabro, y alguna tunera junto a las casas.
  for (const [x, z] of [
    [-16.5, -28],
    [7.6, -24],
    [12, 21],
    [-19.5, 3.5],
    [-1.5, -37.5],
    [10.6, -38.5],
  ]) {
    const y = altura(x, z);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      pieza(piramide, '#7f9a8a', x + Math.cos(a) * 0.35, y + 0.35, z + Math.sin(a) * 0.35, 0.12, 1.1, 0.05, Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    }
    const vara = 4.6 + azar();
    pieza(poste, '#8a7a4a', x, y + vara / 2, z, 0.12, vara, 0.12);
    for (let k = 0; k < 6; k++) {
      const yy = y + vara * (0.45 + k * 0.1),
        a = k * 2.3,
        brazo = 0.55 - k * 0.06;
      pieza(caja, '#8a7a4a', x + Math.cos(a) * brazo * 0.5, yy, z + Math.sin(a) * brazo * 0.5, brazo, 0.05, 0.05, 0, -a);
      pieza(esfera, '#d4ae4c', x + Math.cos(a) * brazo, yy + 0.12, z + Math.sin(a) * brazo, 0.2, 0.15, 0.2);
    }
  }
  for (let i = 0; i < 30; i++) {
    const x = -30 + azar() * 56,
      z = -38 + azar() * 66;
    if (!libre([x - 0.6, z - 0.6, x + 0.6, z + 0.6]) || aLaMesa(x, z) < 4) continue;
    const y = altura(x, z);
    for (let k = 0; k < 5; k++)
      pieza(esfera, '#6f8a4a', x + (azar() - 0.5) * 0.8, y + 0.4 + k * 0.26, z + (azar() - 0.5) * 0.5, 0.34, 0.4, 0.1, 0, azar() * 3);
  }

  // --- La subida: pretiles del paso del barranquillo, era y cartel de Pavón, peldaños de la canal ---
  for (const x of [0.32, 3.18]) {
    pieza(caja, '#8f857a', x, -1.2 + 0.3, -20.75, 0.3, 0.8, 2.6);
    pieza(caja, '#a69b8d', x, -1.2 + 0.74, -20.75, 0.38, 0.1, 2.7);
  }
  // Era de trillar: piedra en el suelo y un anillo de lajas.
  {
    const ex = -9,
      ez = -39.6,
      ey = altura(ex, ez);
    pieza(poste, '#b7ab95', ex, ey + 0.05, ez, 4.8, 0.14, 4.8);
    for (let a = 0; a < Math.PI * 2; a += 0.24)
      pieza(caja, '#8d8478', ex + Math.cos(a) * 2.45, ey + 0.2, ez + Math.sin(a) * 2.45, 0.55, 0.32, 0.22, 0, -a + Math.PI / 2);
    for (let a = 0; a < Math.PI; a += Math.PI / 4)
      pieza(caja, '#a69a85', ex, ey + 0.13, ez, 4.6, 0.02, 0.08, 0, a);
  }
  // Cartel del sendero en Pavón y otro en el collado.
  for (const [x, z, y] of [
    [-1.6, -35.6, 2.4],
    [3.4, -45.6, 4.2],
  ]) {
    for (const dx of [-0.45, 0.45]) pieza(caja, '#6b4f36', x + dx, y + 0.7, z, 0.1, 1.4, 0.1);
    pieza(caja, '#7a5a3c', x, y + 1.25, z, 1.2, 0.7, 0.08);
    pieza(caja, '#efe3c8', x, y + 1.25, z + 0.05, 1.0, 0.5, 0.02);
  }
  // Mojones de piedra que marcan la senda, y peldaños naturales en la canal.
  for (const [x, z] of [
    [-5.4, -42],
    [3.2, -49],
    [9.6, -47.8],
    [13, -44.2],
  ]) {
    const y = paseo(Math.min(Math.max(x, -5), 12.7), Math.min(Math.max(z, -50.5), -41.4));
    for (let k = 0; k < 4; k++) pieza(esfera, '#867b70', x, y + 0.12 + k * 0.17, z, 0.28 - k * 0.05, 0.12, 0.26 - k * 0.05);
  }
  const enSenda = (x: number, z: number) => suelos.some(({ r }) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]);
  const canal = suelos.filter(({ r }) => r[0] >= 3 && r[1] < -40 && r[0] < 19);
  for (const s of canal) {
    const [x0, z0, x1, z1] = s.r;
    const porX = s.eje === 'x';
    // Peldaños de roca desiguales donde la canal empina.
    if (s.y2 !== undefined)
      for (let a = (porX ? x0 : z0) + 0.3; a < (porX ? x1 : z1) - 0.2; a += 0.42 + azar() * 0.35) {
        const ancho = (porX ? z1 - z0 : x1 - x0) * (0.55 + azar() * 0.4),
          desvio = (azar() - 0.5) * 0.5;
        const x = porX ? a : (x0 + x1) / 2 + desvio,
          z = porX ? (z0 + z1) / 2 + desvio : a;
        pieza(caja, ['#6f645b', '#7d7166', '#685d55'][Math.floor(azar() * 3)], x, paseo(x, z) + 0.04, z, porX ? 0.22 : ancho, 0.1, porX ? ancho : 0.22, 0, azar() * 0.3 - 0.15);
      }
    // Bloques de roca a los lados: la canal va encajada entre peñascos.
    for (const lado of [0, 1])
      for (let a = porX ? x0 : z0; a < (porX ? x1 : z1); a += 0.7 + azar() * 0.5) {
        const fuera = 0.45 + azar() * 0.6,
          x = porX ? a : lado ? x1 + fuera : x0 - fuera,
          z = porX ? (lado ? z1 + fuera : z0 - fuera) : a,
          r = 0.3 + azar() * 0.45;
        if (enSenda(x, z)) continue;
        pieza(esfera, ['#7d6a5e', '#8b776a', '#6f6058', '#94796b'][Math.floor(azar() * 4)], x, altura(x, z) + r * 0.45, z, r * 1.1, r * 0.9, r);
      }
  }

  // --- En lo alto: recintos de piedra seca, aras y un mojón en la punta ---
  const lajas = ['#8d8780', '#7e7870', '#99928a', '#857c72'];
  for (const [x, z, r] of [
    [32.5, -45.6, 1.3],
    [34.6, -41.6, 1],
    [27, -44.6, 1.1],
    [37.6, -47.3, 0.9],
    [24.6, -34.8, 0.85],
    [29.4, -38.6, 1.2],
    [21.6, -43.8, 0.8],
  ]) {
    const n = Math.round(r * 13);
    for (let k = 0; k < n; k++) {
      if (k === 1) continue; // la entrada del recinto
      const a = (k / n) * Math.PI * 2,
        q = 0.16 + azar() * 0.1;
      pieza(esfera, lajas[k % 4], x + Math.cos(a) * r, CIMA + q * 0.5, z + Math.sin(a) * r, q * 1.4, q, q * 1.1);
    }
  }
  for (const [x, z] of [
    [31, -42.2],
    [36.2, -45.2],
  ]) {
    for (let k = 0; k < 3; k++) pieza(caja, lajas[k], x, CIMA + 0.1 + k * 0.16, z, 0.9 - k * 0.2, 0.16, 0.7 - k * 0.15, 0, azar());
  }
  for (let k = 0; k < 5; k++) pieza(esfera, lajas[k % 4], 43.6, CIMA + 0.15 + k * 0.2, -50.6, 0.36 - k * 0.05, 0.14, 0.34 - k * 0.05);

  // --- Loza de El Cercado al final de su camino: ollas, tallas y un bernegal sobre un muro ---
  pieza(caja, '#8d8478', -23.4, -1.1, 5.25, 5, 0.7, 0.6);
  for (let k = 0; k < 7; k++) {
    const x = -25.4 + k * 0.68,
      y = -1.1 + 0.35,
      r = 0.2 + (k % 3) * 0.05;
    const almagre = k % 2 ? '#9c4a32' : '#8a3f2c';
    pieza(esfera, almagre, x, y + r, 5.25, r, r * (k % 3 === 2 ? 0.6 : 1.1), r);
    if (k % 3 !== 2) pieza(poste, almagre, x, y + r * 2, 5.25, r * 0.9, r * 0.5, r * 0.9);
    else pieza(poste, '#a65438', x, y + r * 1.3, 5.25, r * 2, 0.08, r * 2); // boca ancha del bernegal
  }

  // --- Bruma: jirones de nube que suben del barranco de Erque y del oeste ---
  {
    const nubes: T.BufferGeometry[] = [];
    for (let i = 0; i < 20; i++) {
      const g = new T.IcosahedronGeometry(1, 2);
      g.setAttribute('normal', g.attributes.position.clone()); // esfera suave: la normal es la posición
      g.scale(5 + azar() * 6, 1 + azar() * 0.9, 4 + azar() * 4);
      g.translate(-4 + azar() * 40, -9 + azar() * 6, -56 - azar() * 12);
      nubes.push(g);
    }
    const nube = new T.MeshStandardMaterial({ color: '#fff6ea', transparent: true, opacity: 0.42, depthWrite: false, roughness: 1 });
    const merged = mergeGeometries(nubes);
    superficie(merged, nube, 0, 0, 0, 1, 1, 1, 8).castShadow = false;
    for (const g of [...nubes, merged]) g.dispose();
  }

  const encalado = cal.clone();
  encalado.vertexColors = true;
  encalado.color.setRGB(1.5, 1.56, 1.7); // por encima de 1: la cal tira a blanco
  cocer(muros, encalado, 2.6);
  cocer(tejados, teja, 1.85);

  // En la cumbre no hay barcos: los de la maqueta quedan fondeados lejos de la vista.
  return {
    amarres: [
      [0, 0, -400],
      [1, 0, -400],
      [2, 0, -400],
    ],
    enSeco: [],
  };
}
