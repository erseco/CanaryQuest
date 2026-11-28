import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa } from './terreno';

/** Hacia dónde mira una fachada; el norte es −z. */
type Frente = 'n' | 's' | 'e' | 'o';
type Rect = [number, number, number, number];
const NORMAL: Record<Frente, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] };

/**
 * Yaiza (Lanzarote), el pueblo blanco del sur, trazado sobre la ortofoto PNOA y OpenStreetMap y
 * comprimido a escala de maqueta. La calle Vista de Yaiza cruza de oeste a este; al sur, la plaza
 * de los Remedios queda entre la casa natal de Benito Pérez Armas, a poniente, y la iglesia, a
 * levante; detrás de la iglesia, el jardín y el Ayuntamiento. Al norte asoman las Montañas del
 * Fuego y al sur, Los Ajaches. Las calles pisables están en `PUEBLOS.yaiza.plano.suelos`; si se
 * mueve una, hay que mover allí su rectángulo.
 */
export function trazarYaiza(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, teja } = t.materiales;
  const suelos = PUEBLOS.yaiza.plano.suelos!;
  const calle = (x: number, z: number) => alturaPaseo(x, z, 'yaiza');
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const encalado = cal.clone();
  encalado.color.setRGB(1.24, 1.56, 2.1); // compensa el tono crema de la textura: cal blanca
  const blanco = '#f7f4ee',
    remate = '#e6d6b8', // albardillas de piedra clara sobre los muros bajos
    picon = '#2c2827',
    oscuro = '#2f2a28',
    hierro = '#2e3a33',
    farolaVerde = '#2c5a3c',
    tea = '#4f3424',
    canteria = '#7a5444'; // la piedra rojiza de las portadas de la iglesia
  const verdes = ['#2f6b45', '#3d7d52', '#26593b', '#467f57'];

  // Muros encalados y tejados de teja se juntan en una malla por material.
  const muros: T.BufferGeometry[] = [],
    tejados: T.BufferGeometry[] = [];
  const bloque = (x: number, y: number, z: number, w: number, h: number, d: number) =>
    muros.push(new T.BoxGeometry(w, h, d).translate(x, y, z));
  /** Tejado a cuatro aguas, o a dos con los hastiales encalados; la cumbrera, por el lado largo. */
  function tejado(lista: T.BufferGeometry[], x: number, y: number, z: number, w: number, d: number, alto: number, aguas: 2 | 4 = 4) {
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
    if (aguas === 4) lista.push(geo([...faldon, ...testeros]));
    else {
      lista.push(geo(faldon));
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
  // Formas propias: medio punto macizo (tímpano, remate de espadaña) y aro de arco.
  const arco = new T.CylinderGeometry(0.5, 0.5, 1, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  const aro = new T.TorusGeometry(0.5, 0.06, 4, 14, Math.PI);

  /** Piezas sobre una fachada: u corre a lo largo de ella, n sale hacia la calle, y sube desde `base`. */
  function fachada(x: number, z: number, fondo: number, base: number, frente: Frente) {
    const [nx, nz] = NORMAL[frente];
    const giro = nx ? Math.PI / 2 : 0;
    const donde = (u: number, n: number) => [x + nx * (fondo + n) + nz * u, z + nz * (fondo + n) - nx * u];
    return {
      donde,
      pieza(color: string, u: number, y: number, n: number, a: number, alto: number, b: number, forma = caja) {
        const [px, pz] = donde(u, n);
        pieza(forma, color, px, base + y, pz, a, alto, b, 0, giro);
      },
      luz(u: number, y: number, n: number, a: number, alto: number, b: number) {
        const [px, pz] = donde(u, n);
        ventanas.push([px, base + y, pz, nx ? b : a, alto, nx ? a : b]);
      },
    };
  }
  type Fachada = ReturnType<typeof fachada>;
  /** Puerta de dos hojas, con su marco blanco y la junta entre las hojas. */
  function puerta(f: Fachada, u: number, tinte: string, alto = 1.95) {
    f.pieza('#ebe6dc', u, alto / 2 + 0.03, 0.02, 1.08, alto + 0.12, 0.07);
    f.pieza(tinte, u, alto / 2, 0.05, 0.88, alto, 0.06);
    f.pieza('#1d2a22', u, alto / 2, 0.085, 0.03, alto - 0.1, 0.02);
    for (const y of [alto * 0.3, alto * 0.72]) f.pieza('#1d2a22', u, y, 0.085, 0.8, 0.03, 0.02);
  }
  /** Ventana de guillotina: cristal arriba con su cruceta blanca y cuarterones abajo. */
  function ventana(f: Fachada, u: number, y: number, tinte: string, ancho = 0.72) {
    f.pieza(tinte, u, y, 0.03, ancho + 0.14, 1.06, 0.07);
    f.luz(u, y + 0.2, 0.07, ancho - 0.1, 0.5, 0.04);
    f.pieza(blanco, u, y + 0.2, 0.095, 0.035, 0.5, 0.02);
    f.pieza(blanco, u, y + 0.2, 0.095, ancho - 0.1, 0.035, 0.02);
    f.pieza('#1d2a22', u, y - 0.25, 0.075, 0.03, 0.36, 0.02);
    f.pieza('#ddd7cc', u, y - 0.57, 0.08, ancho + 0.3, 0.07, 0.2);
  }
  /** Portada de arco de medio punto: hoja de madera, jambas y rosca de piedra. */
  function portada(f: Fachada, u: number, ancho: number, alto: number, piedra = canteria) {
    f.pieza(tea, u, alto / 2, 0.03, ancho, alto, 0.06);
    f.pieza(tea, u, alto, 0.03, ancho, ancho, 0.06, arco);
    for (const s of [-1, 1]) f.pieza(piedra, u + s * (ancho / 2 + 0.11), alto / 2, 0.05, 0.22, alto, 0.12);
    f.pieza(piedra, u, alto, 0.05, ancho + 0.22, ancho + 0.22, 2, aro);
  }
  function farolPared(f: Fachada, u: number, y: number) {
    f.pieza(hierro, u, y + 0.22, 0.13, 0.04, 0.04, 0.26);
    f.pieza(hierro, u, y + 0.08, 0.27, 0.2, 0.04, 0.2);
    f.luz(u, y - 0.08, 0.27, 0.15, 0.24, 0.15);
    f.pieza(hierro, u, y + 0.17, 0.27, 0.17, 0.14, 0.17, piramide);
  }
  /** Farola verde de la plaza: basa, fuste y farol de cuatro cristales. */
  function farola(x: number, z: number, y = 0) {
    pieza(poste, farolaVerde, x, y + 0.2, z, 0.3, 0.4, 0.3);
    pieza(poste, farolaVerde, x, y + 1.6, z, 0.11, 2.8, 0.11);
    pieza(caja, farolaVerde, x, y + 3.05, z, 0.34, 0.06, 0.34);
    ventanas.push([x, y + 3.3, z, 0.26, 0.42, 0.26]);
    pieza(piramide, farolaVerde, x, y + 3.62, z, 0.3, 0.24, 0.3, 0, Math.PI / 4);
  }
  function banco(x: number, z: number, s: number, y = 0, giro = 0) {
    const g = (dx: number, dz: number) => [x + dx * Math.cos(giro) + dz * Math.sin(giro), z - dx * Math.sin(giro) + dz * Math.cos(giro)];
    for (const [k, dz, h, f] of [
      [0, 0, 0.46, 0.42],
      [1, -s * 0.2, 0.72, 0.06],
    ]) {
      const [px, pz] = g(0, dz);
      pieza(caja, '#8a5a3a', px, y + h, pz, 1.5, k ? 0.32 : 0.07, f, 0, giro);
    }
    for (const dx of [-0.6, 0.6]) {
      const [px, pz] = g(dx, 0);
      pieza(caja, hierro, px, y + 0.24, pz, 0.06, 0.48, 0.44, 0, giro);
    }
  }
  /** Laurel de Indias: tronco claro y grueso, raíces al aire y copa redonda y tupida. */
  function laurel(x: number, z: number, y = 0, r = 1.8) {
    pieza(poste, '#b8b0a3', x, y + 1.2, z, 0.42, 2.4, 0.42);
    for (let k = 0; k < 4; k++) {
      const a = k * 1.6 + azar();
      pieza(poste, '#a9a094', x + Math.cos(a) * 0.32, y + 0.2, z + Math.sin(a) * 0.32, 0.14, 0.45, 0.14, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    }
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        d = i ? r * 0.6 : 0;
      pieza(esfera, ['#3d6b3a', '#4a7a42', '#58884a'][i % 3], x + Math.cos(a) * d, y + 2.9 + (i % 3) * 0.3, z + Math.sin(a) * d, r * 0.55, r * 0.42, r * 0.55);
    }
  }
  /** Parterre de muro bajo encalado con albardilla y picón dentro. */
  function parterre([x0, z0, x1, z1]: Rect, y = 0, alto = 0.5) {
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    for (const s of [-1, 1]) {
      pieza(caja, blanco, cx, y + alto / 2, cz + (s * (z1 - z0)) / 2, x1 - x0, alto, 0.24);
      pieza(caja, blanco, cx + (s * (x1 - x0)) / 2, y + alto / 2, cz, 0.24, alto, z1 - z0);
      pieza(caja, remate, cx, y + alto + 0.04, cz + (s * (z1 - z0)) / 2, x1 - x0 + 0.1, 0.08, 0.34);
      pieza(caja, remate, cx + (s * (x1 - x0)) / 2, y + alto + 0.04, cz, 0.34, 0.08, z1 - z0 + 0.1);
    }
    pieza(caja, picon, cx, y + alto - 0.12, cz, x1 - x0 - 0.2, 0.1, z1 - z0 - 0.2);
  }
  // --- Plantas de jardín seco: tuneras, cardones, pitas y bolas de lava ---
  function tunera(x: number, z: number, y = 0) {
    for (let k = 0; k < 6; k++)
      pieza(esfera, k % 2 ? '#6f8f4a' : '#7d9b55', x + (azar() - 0.5) * 0.7, y + 0.3 + k * 0.2, z + (azar() - 0.5) * 0.4, 0.3, 0.36, 0.09, 0, azar() * 3);
  }
  function cardon(x: number, z: number, y = 0) {
    for (let k = 0; k < 7; k++) {
      const h = 0.7 + azar() * 0.9;
      pieza(poste, '#5f7d52', x + (azar() - 0.5) * 0.7, y + h / 2, z + (azar() - 0.5) * 0.7, 0.16, h, 0.16);
    }
  }
  function pita(x: number, z: number, y = 0, color = '#7f9a86') {
    for (let k = 0; k < 9; k++) {
      const a = k * 0.7;
      pieza(piramide, color, x + Math.cos(a) * 0.22, y + 0.35, z + Math.sin(a) * 0.22, 0.08, 0.8, 0.14, Math.sin(a) * 0.7, a, -Math.cos(a) * 0.7);
    }
  }
  function lava(x: number, z: number, r: number, y = 0) {
    pieza(esfera, azar() > 0.5 ? '#3a3431' : '#4a403b', x, y + r * 0.3, z, r, r * 0.6, r * 0.85, 0, azar() * 3);
  }
  function buganvilla(x: number, z: number, alto: number, base = 0) {
    for (let i = 0; i < 26; i++) {
      const t = i / 26,
        r = 0.16 + azar() * 0.14;
      pieza(esfera, ['#b4246a', '#d23d84', '#3d6a3a', '#9b2a72', '#e05a9a'][i % 5], x + (azar() - 0.5) * 0.9, base + 0.2 + t * alto + (azar() - 0.5) * 0.3, z + (azar() - 0.5) * 0.9, r * 1.2, r, r);
    }
  }

  // --- Casas de Lanzarote: cubos encalados de azotea, carpintería verde y chimenea blanca ---
  const ocupado: Rect[] = suelos.map(({ r }) => [r[0] - 0.3, r[1] - 0.3, r[2] + 0.3, r[3] + 0.3]);
  const libre = ([a, b, c, d]: Rect) => !ocupado.some(([e, f, g, h]) => a < g && c > e && b < h && d > f);
  interface Opciones {
    tinte?: string;
    chimenea?: boolean;
    flores?: boolean;
  }
  /** Casa de una o dos plantas: `w` es el ancho de la fachada y `d` el fondo. */
  function casa(x: number, z: number, w: number, d: number, h: number, frente: Frente, base = 0, o: Opciones = {}) {
    const [nx] = NORMAL[frente];
    const sx = nx ? d : w,
      sz = nx ? w : d;
    const tinte = o.tinte ?? verdes[0];
    ocupado.push([x - sx / 2, z - sz / 2, x + sx / 2, z + sz / 2]);
    bloque(x, base + (h - 3) / 2, z, sx, h + 3, sz);
    pieza(caja, '#d3cec4', x, base + 0.1, z, sx + 0.04, 0.2, sz + 0.04);
    // Azotea: pretil corrido y, a veces, la chimenea de sombrerete.
    pieza(caja, '#d9d2c6', x, base + h + 0.02, z, sx - 0.2, 0.04, sz - 0.2);
    for (const s of [-1, 1]) {
      pieza(caja, blanco, x, base + h + 0.16, z + (s * (sz - 0.14)) / 2, sx, 0.32, 0.14);
      pieza(caja, blanco, x + (s * (sx - 0.14)) / 2, base + h + 0.16, z, 0.14, 0.32, sz);
    }
    const f = fachada(x, z, d / 2, base, frente);
    if (o.chimenea) {
      const [cx, cz] = f.donde(w * 0.28, -d * 0.72);
      pieza(caja, blanco, cx, base + h + 0.7, cz, 0.5, 1.4, 0.5);
      pieza(caja, blanco, cx, base + h + 1.45, cz, 0.72, 0.1, 0.72);
      for (const giro of [0, Math.PI / 2]) pieza(caja, oscuro, cx, base + h + 1.24, cz, 0.52, 0.14, 0.18, 0, giro);
      pieza(piramide, blanco, cx, base + h + 1.68, cz, 0.44, 0.38, 0.44, 0, Math.PI / 4);
    }
    const ancha = w >= 4;
    puerta(f, ancha ? 0 : -w * 0.2, tinte);
    const huecos = ancha ? [-w * 0.3, w * 0.3] : [w * 0.25];
    for (const u of huecos) ventana(f, u, 1.35, tinte);
    if (h >= 4.2) for (const u of ancha ? [-w * 0.3, 0, w * 0.3] : [-w * 0.2, w * 0.25]) ventana(f, u, h - 1.25, tinte);
    if (o.flores) {
      const [bx, bz] = f.donde(w / 2 - 0.35, 0.35);
      buganvilla(bx, bz, h + 0.2, base);
    }
  }
  /** Tapia encalada entre dos casas, con albardilla y algo verde asomando. */
  function tapia(x: number, z: number, largo: number, frente: Frente, base = 0) {
    const [nx, nz] = NORMAL[frente];
    const w = nx ? 0.24 : largo,
      d = nx ? largo : 0.24;
    pieza(caja, blanco, x, base + 0.7, z, w, 1.4, d);
    pieza(caja, remate, x, base + 1.44, z, w + 0.08, 0.08, d + 0.08);
    pieza(esfera, '#4c7440', x - nx * 0.9, base + 1.6, z - nz * 0.9, 0.8, 0.7, 0.8);
  }
  const anchos = [4.4, 3.6, 5.2, 3.9, 4.8, 3.4],
    altos = [2.9, 3.2, 2.8, 4.6, 3, 2.7, 4.4];
  let cuenta = 0;
  const tinte = (i: number) => (i % 9 === 4 ? '#2f5f8a' : i % 11 === 7 ? tea : verdes[i % verdes.length]);
  /**
   * Hilera de casas con la fachada en la línea `fijo`, de `desde` a `hasta`. Las `bajas`, de una
   * planta, quedan entre la cámara y la calle y dejan ver al viajero.
   */
  function hilera(frente: Frente, fijo: number, desde: number, hasta: number, d = 3.8, bajas = false, base = 0) {
    const [nx, nz] = NORMAL[frente];
    for (let a = desde; ; ) {
      const i = cuenta++;
      const w = Math.min(anchos[i % anchos.length], hasta - a);
      if (w < 2.8) break;
      const u = a + w / 2;
      const x = nx ? fijo - (nx * d) / 2 : u,
        z = nx ? u : fijo - (nz * d) / 2;
      const h = bajas ? [2.6, 2.9, 2.7][i % 3] : altos[i % altos.length];
      casa(x, z, w, d, h, frente, base, { tinte: tinte(i), chimenea: i % 3 !== 1, flores: i % 5 === 2 });
      const hueco = i % 2 ? 0.04 : 1.3;
      if (hueco > 1 && a + w + hueco + 2.8 < hasta) {
        const m = a + w + hueco / 2;
        tapia(nx ? fijo - nx * 0.3 : m, nx ? m : fijo - nz * 0.3, hueco, frente, base);
      }
      a += w + hueco;
    }
  }
  hilera('s', -4.8, -36, 41.6); // calle Vista de Yaiza, acera norte
  hilera('s', -4.8, 46, 60);
  hilera('n', -0.4, -38, -29.6, 3.8, true); // acera sur, a poniente del callejón
  hilera('e', -29.6, 3.8, 13.6, 3.6, true); // callejón de poniente
  hilera('n', 16.6, -29.4, -8.6, 3.6, true); // al sur del paseo
  hilera('o', 15.2, 14.4, 30, 3.6, true); // calle Salida al Rubicón, acera de levante
  hilera('e', 11.6, 26.4, 31, 3.6, true); // y la de poniente, tras el jardín
  hilera('n', 10.2, 15.2, 29.2, 3.6, true); // al sur de la iglesia
  hilera('n', 10.2, 29.8, 44, 3.6, true); // tras el jardín del Ayuntamiento
  hilera('n', -0.4, 46, 58, 3.6, true); // acera sur, pasada la carretera de Timanfaya

  // --- Firme: asfalto en la calle Vista de Yaiza, aceras claras y losas en las calles del centro ---
  suelos.forEach((s, i) => {
    if (i === 0 || i === 8 || i === 13) return; // plaza, jardín y patio llevan su propio suelo
    if (s.y2 !== undefined) {
      // Escalones: tres peldaños de piedra clara.
      const [x0, z0, x1, z1] = s.r,
        porX = s.eje === 'x';
      for (let k = 0; k < 3; k++) {
        const tk = (k + 0.5) / 3,
          y = (s.y ?? 0) + (s.y2 - (s.y ?? 0)) * tk;
        const cx = porX ? x0 + (x1 - x0) * tk : (x0 + x1) / 2,
          cz = porX ? (z0 + z1) / 2 : z0 + (z1 - z0) * tk;
        pieza(caja, k % 2 ? '#cfc6b6' : '#ddd4c4', cx, y / 2 - 0.03, cz, porX ? (x1 - x0) / 3 + 0.02 : x1 - x0, y + 0.06, porX ? z1 - z0 : (z1 - z0) / 3 + 0.02);
      }
      return;
    }
    // Asfalto en las calles con coches; losas claras en el paseo, el callejón y el portón.
    losa(t, s, [9, 11, 12].includes(i) ? '#b7b0a5' : '#5f5d5b', 0.02);
  });
  // Acera alrededor de la iglesia, como una isla entre sus cuatro calles.
  pieza(caja, '#c9c2b6', 20.7, 0.03, 3.5, 11.9, 0.06, 8.6);
  // Aceras de la calle Vista de Yaiza, un dedo por encima del asfalto, y las rayas del centro.
  for (const z of [-4.3, -0.9]) pieza(caja, '#c9c2b6', 6, 0.03, z, 84, 0.06, 0.6);
  for (let x = -34; x < 47; x += 2.4) pieza(caja, '#e9e4d6', x, 0.035, -2.6, 1.2, 0.02, 0.1);

  // --- Plaza de los Remedios: losas grises con fajas de piedra clara, parterres, laureles y farolas ---
  const losas = tenido(cal, '#a9adb0');
  superficie(caja, losas, -0.4, 0.2, 6.7, 25.6, 0.4, 13, 2.2);
  for (const z of [0.4, 4.4, 9, 13]) pieza(caja, remate, -0.4, 0.405, z, 25.6, 0.012, 0.42);
  for (const x of [-13, -6, 0, 6, 12.2]) pieza(caja, remate, x, 0.405, 6.7, 0.42, 0.012, 13);
  for (const r of [
    [-11.4, 0.8, -5.4, 3],
    [3.4, 0.8, 9.8, 3],
    [-12, 10.4, -6, 12.6],
    [3.4, 10.4, 9.8, 12.6],
    [-1.6, 5.8, 1.6, 7.6],
  ] as Rect[])
    parterre(r, 0.4);
  // Pilares de piedra clara en las entradas de la plaza.
  for (const [x, z] of [
    [-1.7, 0.35],
    [1.7, 0.35],
    [12.25, 6.4],
    [12.25, 9.6],
    [-5.1, 13.05],
    [-1.5, 13.05],
  ]) {
    pieza(caja, blanco, x, 0.75, z, 0.4, 0.7, 0.4);
    pieza(caja, remate, x, 1.14, z, 0.52, 0.1, 0.52);
  }
  // Muretes bajos que cierran la plaza por el norte y el sur, entre los parterres y las entradas.
  for (const [x0, x1, z] of [
    [-13.2, -1.7, 0.3],
    [1.7, 12.4, 0.3],
    [-13.2, -5.1, 13.1],
    [-1.5, 12.4, 13.1],
  ]) {
    pieza(caja, blanco, (x0 + x1) / 2, 0.3, z, x1 - x0, 0.6, 0.22);
    pieza(caja, remate, (x0 + x1) / 2, 0.64, z, x1 - x0 + 0.06, 0.08, 0.32);
  }
  for (const [x, z] of [
    [-9.4, 1.9],
    [5.2, 1.9],
    [8.4, 1.9],
    [-10.2, 11.5],
    [-7.6, 11.5],
    [5.4, 11.5],
  ])
    laurel(x, z, 0.4, 1.7 + azar() * 0.4);
  for (const [x, z] of [
    [-11, 1.6],
    [7.6, 1.2],
    [-7, 11.9],
    [4.2, 11.8],
  ])
    tunera(x, z, 0.4);
  pita(0, 6.7, 0.4, '#8aa57d');
  // Las cuatro farolas del centro coinciden con las luces que la vista enciende de noche.
  for (const x of [-8.5, -3, 3, 8.5]) farola(x, 3.35, 0.4);
  for (const [x, z] of [
    [-12.6, 12.6],
    [11.9, 12.6],
    [11.9, 0.8],
    [-12.6, 0.8],
  ])
    farola(x, z, 0.4);
  for (const x of [-8.4, -6.2, 5, 7.6]) banco(x, 3.4, 1, 0.4);
  for (const x of [-10.4, -7.4, 5.2, 8]) banco(x, 10, -1, 0.4);

  // --- Iglesia de Nuestra Señora de los Remedios: nave encalada, tejado de teja y espadaña ---
  const nave = { x0: 15.2, x1: 26.2, z0: 1.2, z1: 7.4, alto: 6 };
  const ncx = (nave.x0 + nave.x1) / 2,
    ncz = (nave.z0 + nave.z1) / 2,
    largo = nave.x1 - nave.x0,
    anchoNave = nave.z1 - nave.z0;
  bloque(ncx, (nave.alto - 3) / 2, ncz, largo, nave.alto + 3, anchoNave);
  for (const s of [-1, 1]) pieza(caja, blanco, ncx, nave.alto - 0.1, ncz + (s * anchoNave) / 2, largo + 0.02, 0.2, 0.26);
  tejado(tejados, ncx, nave.alto + 0.02, ncz, largo, anchoNave + 0.6, 1.9, 2);
  // Capilla lateral, más baja, con su tejado a un agua contra la nave.
  bloque(19.6, 0.6, 0.4, 8.4, 7.2, 1.6);
  superficie(caja, teja, 19.6, 4.5, 0.34, 8.7, 0.12, 2.15, 1.85, -0.42);
  ocupado.push([15.2, -0.4, 26.2, 7.4]);
  // Fachada a poniente: portada de piedra rojiza, ventanuco de medio punto y farol en la esquina.
  const oeste = fachada(ncx, ncz, largo / 2, 0, 'o');
  portada(oeste, -1.3, 1.4, 2.5);
  oeste.pieza(canteria, -2.3, 4.3, 0.02, 0.62, 0.8, 0.07);
  oeste.pieza(canteria, -2.3, 4.7, 0.02, 0.62, 0.62, 0.07, arco);
  oeste.luz(-2.3, 4.35, 0.06, 0.38, 0.64, 0.04);
  farolPared(oeste, 2.6, 3.3);
  oeste.pieza('#4a4440', 1.3, 2.9, 0.02, 0.9, 0.34, 0.02); // rótulo de la plaza
  // Espadaña sobre el hastial: dos huecos con campana, cornisas y remate curvo con cruz.
  const ue = 0.45;
  oeste.pieza(blanco, ue, 8.1, -0.3, 2.9, 3.2, 0.62);
  for (const y of [7.25, 9.72]) oeste.pieza(blanco, ue, y, -0.3, 3.1, 0.14, 0.76);
  for (const s of [-1, 1]) {
    const u = ue + s * 0.68;
    oeste.pieza('#2a2420', u, 8.3, -0.3, 0.56, 0.95, 0.66);
    oeste.pieza('#2a2420', u, 8.78, -0.3, 0.56, 0.56, 0.66, arco);
    oeste.pieza('#8a6a33', u, 8.35, -0.3, 0.34, 0.42, 0.34, poste);
    oeste.pieza('#8a6a33', u, 8.6, -0.3, 0.16, 0.12, 0.16, esfera);
    oeste.pieza(blanco, ue + s * 1.42, 9.98, -0.3, 0.2, 0.2, 0.2, esfera);
  }
  oeste.pieza(blanco, ue, 9.79, -0.3, 1.9, 1.3, 0.62, arco);
  oeste.pieza(oscuro, ue, 10.85, -0.3, 0.06, 0.6, 0.06);
  oeste.pieza(oscuro, ue, 10.98, -0.3, 0.34, 0.06, 0.06);
  // Muro sur: puerta lateral de piedra, ventana alta con postigo y un ventanuco.
  const sur = fachada(ncx, ncz, anchoNave / 2, 0, 's');
  portada(sur, 2.9, 1.2, 2.2);
  sur.pieza('#ebe6dc', -1.2, 4, 0.02, 0.96, 1.7, 0.06);
  sur.pieza('#6e3424', -1.2, 4, 0.05, 0.8, 1.52, 0.06);
  sur.pieza('#4a2a20', -1.2, 4, 0.085, 0.03, 1.4, 0.02);
  sur.pieza('#5a3a2a', -1.2, 2.15, 0.03, 0.38, 0.38, 0.05);
  farolPared(sur, -3.6, 3.3);
  const este = fachada(ncx, ncz, largo / 2, 0, 'e');
  este.pieza(canteria, 0, 4.2, 0.02, 0.6, 0.9, 0.07);
  este.luz(0, 4.2, 0.06, 0.36, 0.7, 0.04);
  laurel(14.6, -0.1, 0, 1.6);
  laurel(21.8, 8, 0, 1.5);
  farola(15, 9.8);

  // --- Casa natal de Benito Pérez Armas, hoy Casa de la Cultura ---
  // Ala de la plaza, de una planta y tejados de teja a cuatro aguas.
  bloque(-15.1, 0.35, 6.8, 3.4, 5.9, 12.4);
  tejado(tejados, -15.1, 3.33, 3.6, 3.9, 6.4, 1.15);
  tejado(tejados, -15.1, 3.33, 9.95, 3.9, 6.5, 1.25);
  for (const s of [-1, 1]) pieza(caja, blanco, -15.1 + s * 1.7, 3.24, 6.8, 0.2, 0.14, 12.5);
  const cultura = fachada(-15.1, 6.8, 1.7, 0.4, 'e');
  const verdeCultura = '#23484a';
  puerta(cultura, -1.6, verdeCultura, 2.1);
  puerta(cultura, -5.2, verdeCultura, 2);
  for (const u of [-3.6, 1.4, 3.6]) ventana(cultura, u, 1.35, verdeCultura, 0.8);
  for (const u of [-2.6, 2.5]) farolPared(cultura, u, 2.3);
  cultura.pieza('#efe9dc', -3.6, 2.3, 0.05, 0.6, 0.3, 0.04); // rótulo «Cultura»
  cultura.pieza('#efe9dc', 4.9, 2.2, 0.05, 0.9, 0.26, 0.04); // y «Arte»
  for (const u of [-0.6, 0.5]) {
    cultura.pieza('#a35a3c', u, 0.22, 0.4, 0.34, 0.44, 0.34, poste);
    const [px, pz] = cultura.donde(u, 0.4);
    pita(px, pz, 0.62, '#6e8f5a');
  }
  // Esquina de sillares de piedra ocre y gris, como la de la casa.
  for (let k = 0, y = 0.6; y < 3.1; k++, y += 0.34) {
    const [px, pz] = cultura.donde(6.2 - (k % 2 ? 0.28 : 0.16), 0.02);
    pieza(caja, k % 2 ? '#b08a5c' : '#7b7570', px, y, pz, 0.08, 0.3, k % 2 ? 0.56 : 0.32);
    pieza(caja, k % 2 ? '#7b7570' : '#b08a5c', -13.4 - (k % 2 ? 0.16 : 0.28), y, 0.58, k % 2 ? 0.32 : 0.56, 0.3, 0.08);
  }
  // Ala de la calle Vista de Yaiza.
  bloque(-21.4, -0.05, 2.3, 9.2, 5.9, 3.4);
  tejado(tejados, -21.4, 2.93, 2.3, 9.6, 3.9, 1.1);
  const norte = fachada(-21.4, 2.3, 1.7, 0, 'n');
  puerta(norte, 0, verdeCultura);
  for (const u of [-2.6, 2.6]) ventana(norte, u, 1.35, verdeCultura, 0.8);
  // El sobrado: dos plantas, azotea de torta encalada y galería de madera sobre el patio.
  bloque(-24.3, 1.2, 8.5, 3.4, 8.4, 9);
  tejado(muros, -24.3, 5.4, 8.5, 3.9, 9.5, 0.75);
  pieza(caja, blanco, -24.3, 5.32, 8.5, 3.6, 0.16, 9.2);
  const sobrado = fachada(-24.3, 8.5, 1.7, 0, 'e');
  const galeria = '#33433e';
  // Abajo, puerta y ventana bajo la galería; arriba, la puerta de la habitación alta y sus ventanas.
  puerta(sobrado, -2.4, galeria);
  ventana(sobrado, -0.6, 1.35, galeria, 0.7);
  puerta(sobrado, -2.4, galeria, 1.9);
  sobrado.pieza(galeria, -2.4, 3.7, 0.04, 0.88, 1.9, 0.06);
  for (const u of [-0.6, -4]) ventana(sobrado, u, 3.75, galeria, 0.7);
  // Galería: suelo volado, pies derechos hasta el alero y baranda de balaustres.
  sobrado.pieza(tea, -1.9, 2.7, 0.55, 5.4, 0.12, 1.1);
  for (const u of [-4.5, -2.7, -0.9, 0.8]) sobrado.pieza(galeria, u, 2.7, 1.05, 0.12, 5.4, 0.12);
  sobrado.pieza(galeria, -1.9, 3.55, 1.05, 5.4, 0.08, 0.08);
  for (let u = -4.5; u <= 0.8; u += 0.22) sobrado.pieza(galeria, u, 3.13, 1.05, 0.05, 0.8, 0.05);
  for (const n of [0.15, 0.6]) sobrado.pieza(galeria, -4.6, 3.13, n, 0.05, 0.8, 0.05);
  // Escalera de madera adosada al muro, que sube del patio a la galería.
  for (let k = 0; k < 9; k++) {
    const y = 0.15 + k * 0.3;
    pieza(caja, tea, -21.95, y, 4.6 + k * 0.36, 1.1, 0.08, 0.36);
    pieza(caja, galeria, -21.42, y + 0.45, 4.6 + k * 0.36, 0.05, 0.8, 0.05);
  }
  pieza(caja, galeria, -21.42, 2.2, 6.04, 0.06, 0.06, 3.8, -Math.atan2(2.4, 2.88));
  // Patio enlosado de barro, con su canal de piedra, y la tapia del sur con el portón.
  superficie(caja, tenido(cal, '#d27a52'), -19.7, 0.02, 8.5, 5.8, 0.06, 8.8, 0.9);
  pieza(caja, '#4a4440', -19.7, 0.06, 8.5, 0.35, 0.02, 8.6);
  for (const [x0, x1] of [
    [-22.6, -20.4],
    [-19, -16.8],
  ]) {
    pieza(caja, blanco, (x0 + x1) / 2, 0.6, 13, x1 - x0, 1.2, 0.24);
    pieza(caja, remate, (x0 + x1) / 2, 1.24, 13, x1 - x0 + 0.08, 0.08, 0.34);
  }
  for (const x of [-20.5, -18.9]) {
    pieza(caja, blanco, x, 0.9, 13, 0.36, 1.8, 0.36);
    pieza(piramide, blanco, x, 1.98, 13, 0.28, 0.35, 0.28, 0, Math.PI / 4);
  }
  banco(-17.6, 6, 1, 0, Math.PI / 2);
  pieza(poste, '#a35a3c', -17.4, 0.25, 11.9, 0.4, 0.5, 0.4);
  pita(-17.4, 11.9, 0.5);
  ocupado.push([-26, 0.6, -13.4, 13.1]);

  // --- Ayuntamiento: casa baja encalada con su moldura, y el jardín de palmeras y banderas ---
  bloque(38.9, 0.1, 4.5, 5, 6.2, 7.8);
  pieza(caja, blanco, 38.9, 3.02, 4.5, 5.3, 0.18, 8.1);
  pieza(caja, blanco, 38.9, 3.16, 4.5, 5.15, 0.1, 7.95);
  for (const s of [-1, 1]) {
    pieza(caja, blanco, 38.9, 3.42, 4.5 + s * 3.85, 5, 0.42, 0.14);
    pieza(caja, blanco, 38.9 + s * 2.45, 3.42, 4.5, 0.14, 0.42, 7.8);
  }
  pieza(caja, '#d9d2c6', 38.9, 3.22, 4.5, 4.8, 0.04, 7.6);
  ocupado.push([36.4, 0.6, 41.4, 8.4]);
  const ayto = fachada(38.9, 4.5, 2.5, 0, 'o');
  puerta(ayto, 0, tea, 2.2);
  for (const u of [-3, -1.6, 1.6, 3]) ventana(ayto, u, 1.45, tea, 0.86);
  ayto.pieza('#b89a5a', 1, 1.5, 0.05, 0.36, 0.24, 0.03); // placa
  superficie(caja, tenido(adoquin, '#b3a690'), 32.9, 0.02, 4.7, 7, 0.06, 10.6, 1.8);
  parterre([30.4, 0.6, 33, 3.4]);
  parterre([30.4, 6.4, 33, 9.2]);
  parterre([33.6, 0.8, 35.4, 2.6]);
  // Araucaria: tronco recto y pisos de ramas cada vez más cortos.
  pieza(poste, '#6b5242', 34.5, 3.6, 1.7, 0.24, 7.2, 0.24);
  for (let k = 0; k < 8; k++) {
    const r = 1.6 - k * 0.17;
    pieza(esfera, k % 2 ? '#2f5a36' : '#3b6a40', 34.5, 2.2 + k * 0.72, 1.7, r, 0.16, r, 0, k);
  }
  // Escultura sobre una roca de lava.
  lava(34.4, 7.6, 0.6);
  pieza(poste, '#3b3230', 34.4, 1.0, 7.6, 0.3, 0.9, 0.26);
  pieza(esfera, '#3b3230', 34.4, 1.55, 7.6, 0.18, 0.2, 0.18);
  // Mástiles con las banderas de Europa, España y Canarias.
  for (const x of [30.6, 31.8, 33]) pieza(poste, '#dedad2', x, 2.4, 0.95, 0.06, 4.8, 0.06);
  pieza(caja, '#1f3d8f', 31.1, 4.35, 0.95, 1, 0.66, 0.02);
  pieza(caja, '#c60b1e', 32.3, 4.35, 0.95, 1, 0.66, 0.02);
  pieza(caja, '#ffc400', 32.3, 4.35, 0.95, 1, 0.33, 0.03);
  ['#f4f1ea', '#0768a9', '#ffcc00'].forEach((c, k) => pieza(caja, c, 33.17 + k * 0.33, 4.35, 0.95, 0.33, 0.66, 0.02));
  for (const [x, z] of [
    [29.8, 0],
    [29.8, 9.6],
    [36, 9.6],
  ])
    farola(x, z);
  banco(33.6, 9.5, -1);

  // --- Jardín de picón al sur del paseo: tuneras, cardones, pitas, palmeras y bolas de lava ---
  pieza(caja, picon, 1.8, 0.04, 21.6, 19.6, 0.1, 9.6);
  for (const [x0, x1] of [
    [-8, -1.6],
    [1.6, 11.6],
  ]) {
    pieza(caja, blanco, (x0 + x1) / 2, 0.3, 16.7, x1 - x0, 0.6, 0.22);
    pieza(caja, remate, (x0 + x1) / 2, 0.64, 16.7, x1 - x0 + 0.06, 0.08, 0.32);
  }
  for (let i = 0; i < 34; i++) {
    const x = -7.2 + azar() * 18,
      z = 17.6 + azar() * 8;
    if (Math.hypot(x + 3.2, z - 20.6) < 0.9 || Math.hypot(x - 6.8, z - 22.4) < 0.9) continue;
    [tunera, cardon, pita, tunera, cardon][i % 5](x, z, 0.08);
    if (i % 3 === 0) lava(x + 0.8, z + 0.4, 0.25 + azar() * 0.25, 0.08);
  }
  // Drago, en el centro del jardín.
  pieza(poste, '#9a8d78', 1.8, 1.1, 22, 0.5, 2.2, 0.5);
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05;
    pieza(poste, '#9a8d78', 1.8 + Math.cos(a) * 0.45, 2.5, 22 + Math.sin(a) * 0.45, 0.2, 1.1, 0.2, Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
    pieza(esfera, '#4f6e4a', 1.8 + Math.cos(a) * 0.95, 3.2, 22 + Math.sin(a) * 0.95, 0.6, 0.45, 0.6);
  }
  ocupado.push([-8, 16.6, 11.6, 26.4]);

  // --- Bancales de tierra roja con palmeras, al sureste ---
  for (const [k, z] of [17, 22.5, 28].entries()) {
    pieza(caja, '#8c4a32', 42, 0.15 + k * 0.2, z, 22, 0.3 + k * 0.4, 5.2);
    pieza(caja, '#4a403b', 42, 0.2 + k * 0.2, z - 2.6, 22, 0.4 + k * 0.4, 0.3);
  }
  ocupado.push([30.6, 14, 53.4, 31]);

  // --- Huerta enarenada al norte: zocos de piedra seca en media luna, con su vid, sobre el picón ---
  const zoco = new T.TorusGeometry(0.75, 0.2, 4, 9, Math.PI).rotateX(-Math.PI / 2);
  for (let z = -11.6; z > -30; z -= 3.3)
    for (let x = -24.5; x < 13; x += 3.1) {
      const px = x + (azar() - 0.5) * 0.8,
        pz = z + (azar() - 0.5) * 0.8;
      pieza(zoco, azar() > 0.5 ? '#4a4440' : '#5a524c', px, 0.18, pz, 1, 2.2, 1, 0, 0.6 + (azar() - 0.5) * 0.4);
      pieza(esfera, azar() > 0.3 ? '#5d7a3a' : '#6f8a45', px, 0.22, pz + 0.15, 0.55, 0.28, 0.5);
    }
  for (const [x0, z0, x1, z1] of [
    [-26, -10, 14, -10],
    [-26, -31, 14, -31],
    [-26, -31, -26, -10],
    [14, -31, 14, -10],
  ]) {
    const porX = x1 - x0 > z1 - z0;
    pieza(caja, blanco, (x0 + x1) / 2, 0.45, (z0 + z1) / 2, porX ? x1 - x0 : 0.24, 0.9, porX ? 0.24 : z1 - z0);
  }
  ocupado.push([-26.5, -31.5, 14.5, -9.6]);

  // --- Carretera de Timanfaya: sale de la calle hacia el norte, hacia las Montañas del Fuego ---
  const carretera: Rect = [42.6, -48, 45.4, -4.6];
  pieza(caja, '#5f5d5b', 44, -0.06, -26.3, 2.8, 0.12, 43.4);
  for (let z = -6; z > -47; z -= 2.4) pieza(caja, '#e9e4d6', 44, 0.005, z, 0.1, 0.02, 1.2);
  pieza(poste, '#dcd6c8', 42.2, 1, -4.9, 0.08, 2, 0.08);
  pieza(caja, '#6b3f26', 42.2, 1.85, -4.95, 1.2, 0.5, 0.05); // cartel pardo de los espacios naturales
  pieza(caja, '#efe9dc', 42.2, 1.85, -4.92, 0.9, 0.08, 0.02);
  ocupado.push([42, -48.5, 46, -4.6]);

  // --- Terreno: picón negro alrededor del pueblo y, a lo lejos, los volcanes ---
  // Conos: x, z, radio, altura y hondura del cráter. Al norte, las Montañas del Fuego; al oeste,
  // la montaña redonda que asoma tras la Casa de la Cultura; al sur, el macizo de Los Ajaches.
  const conos: [number, number, number, number, number][] = [
    [-50, -52, 12, 5, 1.2],
    [-28, -64, 14, 6.5, 1.6],
    [-6, -70, 13, 5.5, 1.4],
    [16, -66, 15, 7, 1.8],
    [38, -60, 12, 5, 1.3],
    [58, -46, 13, 5.5, 0],
    [-16, -54, 9, 3.5, 1],
    [28, -48, 8, 3, 0.8],
    [-64, 8, 16, 9, 0],
    [-62, 32, 13, 6, 0],
    [-34, 62, 16, 8, 0],
    [-10, 70, 18, 11, 0],
    [16, 68, 16, 9, 0],
    [40, 62, 17, 10, 0],
    [60, 46, 13, 6, 0],
    [-54, 46, 12, 5, 0],
    [74, -6, 12, 5, 0],
    [68, -30, 11, 5, 1.2],
  ];
  const ladera = (x: number, z: number) => {
    // Lomas bajas cerrando el horizonte, para que no asome el mar del paisaje pintado.
    const lejos = Math.min(1, Math.max(0, (Math.hypot(x, z) - 60) / 16)),
      a = Math.atan2(z, x);
    let monte = lejos * lejos * (3 - 2 * lejos) * (3.2 + 1.2 * Math.sin(a * 7) + 0.8 * Math.sin(a * 17 + 1));
    for (const [cx, cz, r, h, crater] of conos) {
      const d = Math.hypot(x - cx, z - cz) / r;
      if (d >= 1) continue;
      // Falda tendida, ladera recta y hombros redondos; los conos con cráter, truncados.
      const borde = 1 + 0.12 * Math.sin(Math.atan2(z - cz, x - cx) * 5 + cx) + 0.06 * Math.sin(x * 0.5 + z * 0.4);
      const cima = crater ? 0.3 : 0,
        s = Math.min(1, (1 - d) / (1 - cima));
      const m = d < cima ? h * borde - crater * (1 - d / cima) : h * s * s * (3 - 2 * s) * borde;
      monte = Math.max(monte, m);
    }
    return -0.12 + 0.16 * Math.sin(x * 0.21 + z * 0.13) * Math.sin(z * 0.17 - x * 0.05) + monte;
  };
  const altura = (x: number, z: number): number => {
    let cerca = Infinity,
      camino = 0;
    for (const r of [...suelos.map((s) => s.r), carretera]) {
      const cx = Math.min(Math.max(x, r[0]), r[2]),
        cz = Math.min(Math.max(z, r[1]), r[3]),
        d = Math.hypot(x - cx, z - cz);
      if (d < cerca) {
        cerca = d;
        camino = calle(cx, cz);
      }
    }
    const k = Math.min(1, Math.max(0, cerca - 0.9) / 3.5),
      suave = k * k * (3 - 2 * k);
    return (camino - 0.1) * (1 - suave) + ladera(x, z) * suave;
  };
  const color = new T.Color();
  /** Color de cada faceta: picón y tierra ocre en el llano; rojizos y negros en los volcanes del norte. */
  function tono(x: number, y: number, z: number) {
    const ruido = Math.sin(x * 0.31 + z * 0.17) + Math.sin(x * 0.07 - z * 0.23) + (azar() - 0.5) * 0.6;
    if (y < 0.6) return color.set(Math.hypot(x - 6, z - 4) > 30 && ruido > 0.7 ? '#6e5038' : ruido > 0 ? '#302e31' : '#28272a');
    const norte = z < -25;
    const banda = y > 5 ? 0 : y > 2 ? 1 : 2;
    const paleta = norte ? ['#6e3a2e', '#7f5038', '#3a3230'] : ['#80684e', '#8f7356', '#6a5240'];
    color.set(paleta[banda]);
    if (norte && ruido > 0.9) color.set('#2c2624'); // coladas negras
    return color.multiplyScalar(0.9 + azar() * 0.2);
  }
  {
    const [x0, z0, x1, z1] = [-84, -88, 92, 84],
      paso = 2;
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso),
      fila = nx + 1;
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.5) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.5) * paso;
        p.push(new T.Vector3(x, altura(x, z), z));
      }
    const vertices: number[] = [],
      colores: number[] = [];
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * fila + i,
          b = a + 1,
          c = a + fila,
          d = c + 1;
        const tri = (i + j) % 2 ? [a, c, b, b, c, d] : [a, c, d, a, d, b];
        for (let k = 0; k < 6; k += 3) {
          const [u, v, w] = [p[tri[k]], p[tri[k + 1]], p[tri[k + 2]]];
          tono((u.x + v.x + w.x) / 3, (u.y + v.y + w.y) / 3, (u.z + v.z + w.z) / 3);
          for (const q of [u, v, w]) {
            vertices.push(q.x, q.y, q.z);
            colores.push(color.r, color.g, color.b);
          }
        }
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(colores, 3));
    geo.computeVertexNormals();
    const tierra = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, map: cal.map });
    superficie(geo, tierra, 0, 0, 0, 1, 1, 1, 6);
    geo.dispose();
  }

  // --- Barrios: casas sueltas entre huertas de picón, con su tapia y alguna palmera o tunera ---
  for (let i = 0, puestas = 0; i < 500 && puestas < 44; i++) {
    const a = azar() * Math.PI * 2,
      r = 24 + azar() * 22;
    const x = 6 + Math.cos(a) * r * 1.2,
      z = 4 + Math.sin(a) * r;
    const frente: Frente = (['s', 's', 'e', 'o', 'n'] as Frente[])[Math.floor(azar() * 5)];
    const w = 3.4 + azar() * 1.6,
      d = 3.2 + azar() * 0.8;
    const [nx] = NORMAL[frente],
      sx = nx ? d : w,
      sz = nx ? w : d;
    if (!libre([x - sx / 2 - 1.2, z - sz / 2 - 1.2, x + sx / 2 + 1.2, z + sz / 2 + 1.2])) continue;
    const base = Math.min(altura(x - sx / 2, z - sz / 2), altura(x + sx / 2, z + sz / 2), altura(x, z));
    if (Math.max(altura(x - sx / 2, z - sz / 2), altura(x + sx / 2, z + sz / 2)) - base > 1.2) continue;
    const k = cuenta++;
    casa(x, z, w, d, k % 4 === 0 ? 4.4 : 2.8 + azar() * 0.4, frente, base, { tinte: tinte(k), chimenea: k % 3 !== 2, flores: k % 6 === 1 });
    const [gx, gz] = [x + (azar() - 0.5) * sx * 1.6, z + (azar() - 0.5) * sz * 1.6];
    if (libre([gx - 0.6, gz - 0.6, gx + 0.6, gz + 0.6])) [tunera, cardon, pita][k % 3](gx, gz, altura(gx, gz));
    puestas++;
  }
  // Matorral y bolas de lava por el llano.
  for (let i = 0; i < 120; i++) {
    const x = -70 + azar() * 150,
      z = -60 + azar() * 120;
    if (!libre([x - 0.6, z - 0.6, x + 0.6, z + 0.6])) continue;
    const y = altura(x, z);
    if (y > 2) continue;
    if (i % 3) pieza(esfera, i % 2 ? '#7d8152' : '#6b7448', x, y + 0.15, z, 0.4 + azar() * 0.4, 0.3, 0.4 + azar() * 0.3);
    else lava(x, z, 0.4 + azar() * 0.6, y);
  }
  cocer(muros, encalado, 2.6);
  cocer(tejados, teja, 1.85);
  for (const g of [arco, aro, zoco]) g.dispose();

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
