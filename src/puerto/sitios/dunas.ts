import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MASPALOMAS } from '../../data/dialogos';
import type { Sitio, Taller } from '../maqueta';
import {
  aLaCharca,
  arena,
  BARRANCO,
  CHARCA,
  COSTA,
  ESCALERA,
  ESCARPE,
  ALEMANIA,
  FARO,
  FRANCIA,
  lado,
  LOSAS,
  meseta,
  MIRADOR,
  PALMERAL,
  PASAJE,
  PASEO,
  PLAZA,
  ROTONDA,
  SENDERO,
  TERRAZA,
  TIRAJANA,
  viva,
  type Punto,
} from './dunas-plano';

type Rect = [number, number, number, number];
/** Distancia sin signo a una línea quebrada. */
const cerca = (linea: Punto[], x: number, z: number) => Math.abs(lado(linea, x, z));

/**
 * Dunas de Maspalomas (Gran Canaria). Arriba, en su terraza, Playa del Inglés: la rotonda de
 * Tirajana y Francia con Pepe Chiringo en los bajos del Rey Carlos y el CITA con sus monumentos
 * de cartón piedra; Tirajana baja hasta el Riu Palace, que asoma en media luna sobre el Mirador de
 * las Dunas, y el Paseo Costa Canaria sigue el borde hacia la playa del Inglés. Abajo, la arena:
 * crestas que el alisio empuja al suroeste, la hoya de matorral, la Charca con su palmeral y el
 * faro en la punta. El plano, con las zonas pisables y la altura del suelo, está en `dunas-plano.ts`.
 */
export function trazarDunas(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, blanco, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };

  // --- Terreno: la arena con sus rizos va en una malla con textura; lo demás, al horno común ---
  const conRizos: number[] = [],
    coloresRizos: number[] = [];
  const capas = new Map<string, number[]>();
  const tonos = new Map<string, T.Color>();
  const rgb = (hex: string) => {
    if (!tonos.has(hex)) tonos.set(hex, new T.Color(hex));
    return tonos.get(hex)!;
  };
  /** Color de una faceta y si lleva rizos de viento. */
  function tono(x: number, y: number, z: number, n: T.Vector3, k: number): [string, boolean] {
    const e = lado(ESCARPE, x, z);
    if (e > -0.15) {
      if (x < -4.5) return [n.y > 0.93 ? (k > 0.5 ? '#6f9b4c' : '#78a553') : '#8c8a5a', false]; // golf
      return [n.y > 0.93 ? '#d3c6a8' : '#c7a77b', false]; // suelo del barrio y talud
    }
    const c = aLaCharca(x, z);
    if (c < 0.15) return ['#596449', false];
    if (c < 1.4) return [k > 0.5 ? '#8f8460' : '#9a8c66', false];
    if (cerca(BARRANCO, x, z) < 1.6 && z < 9) return ['#9d9271', false];
    const d = lado(COSTA, x, z);
    if (d < 1.3) return ['#bba07a', false]; // arena mojada
    if (x < -35.5 && z > 4) return [k > 0.5 ? '#b9a27c' : '#b09a74', false]; // suelo del palmeral
    if (d < 4.5) return ['#ead0a0', true];
    if (cerca(SENDERO, x, z) < 0.7) return ['#dcc091', true];
    if (viva(x, z) < 0.45) return [k > 0.6 ? '#cfb684' : '#d8c193', true]; // hoya de matorral
    if (n.y < 0.9 && n.x < -0.12 && n.z > 0.12) return ['#e8c288', true]; // cara de avalancha
    if (n.y < 0.95 && n.x > 0.1 && n.z < -0.1) return ['#edd29e', true]; // barlovento
    return [y > 2.4 ? '#f7e0ad' : '#f1d7a4', true];
  }
  {
    // Hasta el horizonte pintado por el norte y el oeste, donde sigue la isla.
    const paso = 0.9,
      [x0, z0, x1, z1] = [-84, -84, 62, 38];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.35) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.35) * paso;
        p.push(new T.Vector3(x, arena(x, z), z));
      }
    const normal = new T.Vector3(),
      otro = new T.Vector3();
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i,
          b = a + 1,
          c = a + nx + 1,
          d = c + 1;
        for (const tri of (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]]) {
          const [u, v, w] = tri.map((q) => p[q]);
          // Ni el fondo del mar ni lo que asomaría tras el horizonte pintado.
          if (Math.max(u.y, v.y, w.y) < -1.05 || Math.hypot(u.x, u.z) > 84) continue;
          normal.subVectors(v, u).cross(otro.subVectors(w, u)).normalize();
          if (normal.y < 0) normal.negate();
          const [hex, rizado] = tono((u.x + v.x + w.x) / 3, (u.y + v.y + w.y) / 3, (u.z + v.z + w.z) / 3, normal, azar());
          if (rizado) {
            // Un pelo de variación por faceta, para que la arena no salga lisa como un plástico.
            const color = rgb(hex).clone().multiplyScalar(0.97 + azar() * 0.06);
            for (const q of [u, v, w]) {
              conRizos.push(q.x, q.y, q.z);
              coloresRizos.push(color.r, color.g, color.b);
            }
          } else {
            if (!capas.has(hex)) capas.set(hex, []);
            for (const q of [u, v, w]) capas.get(hex)!.push(q.x, q.y, q.z);
          }
        }
      }
  }
  const dunas = new T.BufferGeometry();
  dunas.setAttribute('position', new T.Float32BufferAttribute(conRizos, 3));
  dunas.setAttribute('color', new T.Float32BufferAttribute(coloresRizos, 3));
  dunas.computeVertexNormals();
  const arenaMaterial = new T.MeshStandardMaterial({ map: rizos(), vertexColors: true, flatShading: true, roughness: 1 });
  const escena = superficie(dunas, arenaMaterial, 0, 0, 0, 1, 1, 1, 2.6).parent!;
  dunas.dispose();
  for (const [color, vertices] of capas) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    pieza(geo, color, 0, 0, 0, 1, 1, 1);
    geo.dispose();
  }

  /** Cartel pintado: un plano con el texto, que mira al sur salvo que se gire. */
  function rotulo(texto: string, fondo: string, tinta: string, x: number, y: number, z: number, ancho: number, alto: number, giro = 0) {
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = Math.max(32, Math.round((512 * alto) / ancho));
    const ctx = lienzo.getContext('2d')!;
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.fillStyle = tinta;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(lienzo.height * 0.62)}px Georgia, serif`;
    ctx.fillText(texto, 256, lienzo.height * 0.54, 490);
    const mapa = new T.CanvasTexture(lienzo);
    mapa.colorSpace = T.SRGBColorSpace;
    const placa = new T.Mesh(
      new T.PlaneGeometry(ancho, alto),
      new T.MeshStandardMaterial({ map: mapa, emissiveMap: mapa, emissive: '#ffffff', emissiveIntensity: 0.18, roughness: 0.8 }),
    );
    placa.position.set(x, y, z);
    placa.rotation.y = giro;
    escena.add(placa);
  }
  function farola(x: number, y: number, z: number) {
    pieza(poste, '#3b474c', x, y + 1.1, z, 0.08, 2.2, 0.08);
    pieza(caja, '#3b474c', x, y + 2.26, z, 0.3, 0.08, 0.3);
    ventanas.push([x, y + 2.06, z, 0.2, 0.3, 0.2]);
  }
  /** Barra recta de un punto a otro, para celosías. */
  const arriba = new T.Vector3(0, 1, 0);
  function barra(ax: number, ay: number, az: number, bx: number, by: number, bz: number, grosor: number, color: string) {
    const dir = new T.Vector3(bx - ax, by - ay, bz - az);
    const largo = dir.length();
    const giro = new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(arriba, dir.normalize()));
    pieza(caja, color, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, grosor, largo, grosor, giro.x, giro.y, giro.z);
  }
  function banco(x: number, y: number, z: number, giro = 0) {
    pieza(caja, '#cfc6b8', x, y + 0.2, z, 1.3, 0.4, 0.42, 0, giro);
    pieza(caja, madera, x, y + 0.44, z, 1.3, 0.07, 0.46, 0, giro);
  }

  // --- La Charca: agua verdosa y quieta, cañas en la orilla, tarajales y garcetas ---
  {
    const forma = new T.Shape(CHARCA.map(([x, z]) => new T.Vector2(x, -z)));
    const geo = new T.ShapeGeometry(forma);
    const agua = new T.MeshStandardMaterial({ color: '#4d6a3c', transparent: true, opacity: 0.6, roughness: 0.5, depthWrite: false });
    superficie(geo, agua, 0, -0.82, 0, 1, 1, 1, 4, -Math.PI / 2).castShadow = false;
    geo.dispose();
  }
  for (let i = 0; i < CHARCA.length; i++) {
    const [ax, az] = CHARCA[i],
      [bx, bz] = CHARCA[(i + 1) % CHARCA.length];
    for (let k = 0; k < Math.hypot(bx - ax, bz - az) * 2.4; k++) {
      const s = azar(),
        x = ax + (bx - ax) * s + (azar() - 0.5) * 1.4,
        z = az + (bz - az) * s + (azar() - 0.5) * 1.4;
      if (z > 23.5) continue; // la barra de arena, frente a la playa, está pelada
      const h = 0.5 + azar() * 0.7;
      pieza(caja, azar() > 0.4 ? '#7d8f4c' : '#9aa25e', x, arena(x, z) + h / 2, z, 0.05, h, 0.05, (azar() - 0.5) * 0.4, 0, (azar() - 0.5) * 0.4);
    }
  }
  /** Tarajal: tronco torcido y follaje plumoso gris verdoso; alguno florido de rosa. */
  function tarajal(x: number, z: number, h: number) {
    if (aLaCharca(x, z) < 0.8) return;
    const y = arena(x, z);
    pieza(poste, '#6a5444', x, y + h * 0.35, z, 0.18, h * 0.7, 0.18, (azar() - 0.5) * 0.3, 0, (azar() - 0.5) * 0.3);
    for (let k = 0; k < 5; k++)
      pieza(
        esfera,
        k === 4 && azar() > 0.6 ? '#c9a2a4' : k % 2 ? '#7f8f6e' : '#92a07e',
        x + (azar() - 0.5) * h * 0.5,
        y + h * (0.65 + azar() * 0.35),
        z + (azar() - 0.5) * h * 0.5,
        h * 0.32,
        h * 0.22,
        h * 0.3,
      );
  }
  for (let i = 0; i < 26; i++) {
    // A los dos lados del cauce del barranco y en la orilla norte de la Charca.
    const s = azar(),
      [ax, az] = BARRANCO[s < 0.5 ? 0 : 1],
      [bx, bz] = BARRANCO[s < 0.5 ? 1 : 2],
      k = azar(),
      lado2 = (azar() > 0.5 ? 1 : -1) * (1.6 + azar() * 1.6);
    tarajal(ax + (bx - ax) * k + lado2, az + (bz - az) * k, 1.3 + azar() * 1.1);
  }
  for (const [x, z, giro] of [
    [-29.6, 15.4, 0.4],
    [-31.4, 20.6, 2.1],
    [-30.2, 12.6, -0.6],
  ]) {
    // Garcetas en el agua somera.
    pieza(esfera, '#f4f4ef', x, -0.55, z, 0.22, 0.16, 0.12, 0, giro);
    pieza(caja, '#f4f4ef', x + 0.12 * Math.cos(giro), -0.3, z - 0.12 * Math.sin(giro), 0.05, 0.4, 0.05, 0, giro, 0.3);
    pieza(caja, '#2b2b2b', x, -0.75, z, 0.025, 0.3, 0.025);
  }

  // --- Vegetación de la arena: matorral en la hoya, balancones sueltos y montículos junto a la playa ---
  for (let i = 0, puestos = 0; i < 2000 && puestos < 190; i++) {
    const x = -36 + azar() * 40,
      z = -22 + azar() * 46;
    if (viva(x, z) > 0.4 || lado(ESCARPE, x, z) > -3 || aLaCharca(x, z) < 1.8 || lado(COSTA, x, z) < 7 || cerca(BARRANCO, x, z) < 2) continue;
    if (x < -35.5 && z > 4) continue; // el palmeral
    const r = 0.35 + azar() * 0.6;
    pieza(esfera, ['#6f7f4b', '#83905a', '#5f6e43', '#8a8a55'][i % 4], x, arena(x, z) + r * 0.3, z, r * 1.2, r * 0.75, r);
    puestos++;
  }
  for (let i = 0; i < 18; i++) tarajal(-30 + azar() * 22, -14 + azar() * 16, 1.2 + azar() * 0.9);
  /** Balancón sobre su montículo de arena: matas carnosas de un verde amarillento. */
  function balancon(x: number, z: number, r: number) {
    const y = arena(x, z);
    pieza(esfera, '#e2c591', x, y - r * 0.2, z, r * 1.6, r * 0.75, r * 1.4);
    for (let k = 0; k < 4; k++)
      pieza(esfera, k % 2 ? '#8ea24f' : '#a4b35e', x + (azar() - 0.5) * r, y + r * 0.45 + azar() * 0.2, z + (azar() - 0.5) * r, r * 0.55, r * 0.4, r * 0.5);
  }
  for (let i = 0, puestos = 0; i < 600 && puestos < 34; i++) {
    // Montículos de balancones al pie de la playa del Inglés.
    const z = -48 + azar() * 52,
      x = 39 + azar() * 7;
    const d = lado(COSTA, x, z);
    if (d < 4 || d > 10 || lado(ESCARPE, x, z) > -2) continue;
    balancon(x, z, 0.5 + azar() * 0.5);
    puestos++;
  }
  for (let i = 0, puestos = 0; i < 900 && puestos < 26; i++) {
    // Sueltos en los llanos entre dunas.
    const x = -24 + azar() * 66,
      z = -36 + azar() * 60;
    if (viva(x, z) < 0.8 || arena(x, z) > 0.7 || lado(COSTA, x, z) < 8 || lado(ESCARPE, x, z) > -3 || aLaCharca(x, z) < 3) continue;
    balancon(x, z, 0.35 + azar() * 0.3);
    puestos++;
  }

  // --- Sendero balizado del mirador a la playa, sombrillas y espuma en la orilla ---
  for (let i = 1; i < SENDERO.length; i++) {
    const [ax, az] = SENDERO[i - 1],
      [bx, bz] = SENDERO[i];
    const largo = Math.hypot(bx - ax, bz - az),
      nx = -(bz - az) / largo,
      nz = (bx - ax) / largo;
    for (let s = 1.2; s < largo; s += 2.6)
      for (const l of [-0.95, 0.95]) {
        const x = ax + ((bx - ax) * s) / largo + nx * l,
          z = az + ((bz - az) * s) / largo + nz * l;
        const y = arena(x, z);
        pieza(poste, '#8a6a4a', x, y + 0.3, z, 0.1, 0.75, 0.1);
        pieza(poste, '#2f6fa3', x, y + 0.66, z, 0.11, 0.06, 0.11);
      }
  }
  const sombrilla = new T.ConeGeometry(1, 1, 9);
  for (const [x0, z0, dx, dz, n] of [
    [45.2, -40, 0, 2.4, 9], // playa del Inglés, en dos filas
    [46.5, -38.8, 0, 2.4, 8],
    [-7, 26.4, 2.4, -0.1, 5], // playa de Maspalomas
  ]) {
    for (let k = 0; k < n; k++) {
      const x = x0 + dx * k,
        z = z0 + dz * k,
        y = arena(x, z);
      pieza(poste, '#efe6d0', x, y + 0.85, z, 0.06, 1.7, 0.06);
      pieza(sombrilla, k % 3 ? '#d8c08a' : '#2f7fa0', x, y + 1.8, z, 0.95, 0.32, 0.95);
      for (const l of [-0.45, 0.45]) pieza(caja, '#f6f1e4', x + l, y + 0.16, z + 0.35, 0.42, 0.06, 1.2, 0.12);
    }
  }
  sombrilla.dispose();
  for (let i = 1; i < COSTA.length; i++) {
    const [ax, az] = COSTA[i - 1],
      [bx, bz] = COSTA[i];
    const largo = Math.hypot(bx - ax, bz - az);
    // Normal hacia tierra: la orilla clarea a unas siete décimas de la línea.
    const nx = (bz - az) / largo,
      nz = -(bx - ax) / largo;
    for (let s = 0; s < largo && ax > -52; s += 0.9) {
      if (Math.max(az, bz) < -50) break;
      const k = 0.2 + azar() * 1.1,
        x = ax + ((bx - ax) * s) / largo + nx * k,
        z = az + ((bz - az) * s) / largo + nz * k;
      pieza(esfera, '#f4f7f4', x, -0.82, z, 0.5 + azar() * 0.5, 0.04, 0.2 + azar() * 0.2, 0, Math.atan2(-(bz - az), bx - ax));
    }
  }

  // --- Playa del Inglés: calles, rotonda y manzanas en la terraza ---
  const y0 = TERRAZA;
  const muros: T.BufferGeometry[] = [];
  /** Lo ya construido o trazado en la terraza, para rellenar el barrio sin pisarlo. */
  const ocupado: Rect[] = [TIRAJANA, FRANCIA, ALEMANIA, PASAJE, [1, -17, 14.5, -7], [9.8, -45, 22, -39.6]];
  /** Bloque de apartamentos encalado: franjas de ventanas por planta, balcones o tejado de teja. */
  function bloque(x: number, z: number, w: number, d: number, h: number, { tejado = false, balcones = false, tinte = '#5e7f86' } = {}) {
    const base = meseta(x);
    ocupado.push([x - w / 2, z - d / 2, x + w / 2, z + d / 2]);
    muros.push(new T.BoxGeometry(w, h + 1, d).translate(x, base + (h - 1) / 2, z));
    pieza(caja, '#f7f3ea', x, base + h + 0.05, z, w + 0.14, 0.12, d + 0.14);
    if (tejado) pieza(piramide, '#b4634a', x, base + h + 0.5, z, w * 0.74, 0.9, d * 0.74, 0, Math.PI / 4);
    else for (const s of [-1, 1]) pieza(caja, '#f7f3ea', x, base + h + 0.28, z + (s * d) / 2, w + 0.1, 0.4, 0.12);
    for (let f = 0; f * 1.5 + 1.3 < h; f++) {
      const y = base + 0.85 + f * 1.5;
      // Fachada sur, la que mira a las dunas y a la cámara, y los costados.
      pieza(caja, '#4f6870', x, y, z + d / 2 + 0.02, w * 0.78, 0.62, 0.05);
      if ((f + Math.round(x)) % 3) ventanas.push([x - w * 0.2, y, z + d / 2 + 0.04, w * 0.25, 0.5, 0.03]);
      for (const s of [-1, 1]) pieza(caja, '#4f6870', x + (s * w) / 2 + s * 0.02, y, z, 0.05, 0.62, d * 0.7);
      if (balcones && f > 0) {
        pieza(caja, '#f7f3ea', x, y - 0.42, z + d / 2 + 0.28, w * 0.9, 0.08, 0.56);
        pieza(caja, tinte, x, y - 0.12, z + d / 2 + 0.55, w * 0.9, 0.05, 0.04);
        for (let k = -4; k <= 4; k++) pieza(caja, tinte, x + k * w * 0.1, y - 0.26, z + d / 2 + 0.55, 0.03, 0.28, 0.03);
      }
    }
  }
  // Asfalto con aceras de losa clara.
  const asfalto = (r: Rect) => {
    const [x0, z0, x1, z1] = r;
    pieza(caja, '#cfc7b8', (x0 + x1) / 2, y0 + 0.02, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0);
    const enX = x1 - x0 > z1 - z0;
    pieza(caja, '#6b6865', (x0 + x1) / 2, y0 + 0.04, (z0 + z1) / 2, enX ? x1 - x0 : x1 - x0 - 1.4, 0.06, enX ? z1 - z0 - 1.4 : z1 - z0);
  };
  asfalto(TIRAJANA);
  asfalto(FRANCIA);
  asfalto(ALEMANIA);
  for (let z = TIRAJANA[1] + 1; z < TIRAJANA[3] - 1; z += 2.2) pieza(caja, '#eeeae0', 7.6, y0 + 0.08, z, 0.1, 0.02, 1.1);
  for (let x = FRANCIA[0] + 1; x < FRANCIA[2] - 1; x += 2.2) if (Math.abs(x - 7.6) > 2.6) pieza(caja, '#eeeae0', x, y0 + 0.08, -37.6, 1.1, 0.02, 0.1);
  // Rotonda: isleta de césped con su bordillo, y la placa de las dos avenidas.
  pieza(poste, '#e9e4d8', ROTONDA[0], y0 + 0.12, ROTONDA[1], 2.4, 0.2, 2.4);
  pieza(poste, '#6f9a4c', ROTONDA[0], y0 + 0.2, ROTONDA[1], 2.1, 0.08, 2.1);
  pieza(poste, '#6b6b62', 10.2, y0 + 1, -35.6, 0.08, 2, 0.08);
  rotulo(MASPALOMAS.francia, '#2f5a5e', '#fff3d0', 11.3, y0 + 2.05, -35.55, 2.2, 0.32);
  rotulo(MASPALOMAS.tirajana, '#2f5a5e', '#fff3d0', 11.3, y0 + 1.65, -35.55, 2.2, 0.32);
  for (const z of [-44, -31, -24, -18]) farola(9.95, y0, z);
  for (const z of [-41, -28, -21]) farola(5.25, y0, z);
  for (const x of [1, 15, 20]) farola(x, y0, -35.65);
  // Manzanas: chalés de teja al oeste de Tirajana, apartamentos encalados al este y hacia el paseo.
  for (const z of [-46.6, -43.4, -33.3, -30.2, -27.1, -24, -20.9])
    for (const x of [0.3, 3.4]) bloque(x, z, 2.6, 2.4, 1.8, { tejado: true });
  bloque(1.9, -50.5, 5.6, 4, 6, { balcones: true });
  bloque(12.4, -32.6, 3.6, 3.6, 1.8, { tejado: true });
  bloque(12.8, -26.6, 4.4, 4.6, 4.5, { balcones: true, tinte: '#7a5a3c' });
  bloque(12.4, -20.9, 3.6, 4.2, 3);
  bloque(17.2, -32.4, 3.6, 3.4, 1.8, { tejado: true });
  bloque(17.2, -27, 3.4, 3.4, 3, { tejado: true });
  bloque(24.4, -34.4, 2.2, 3.2, 3, { tejado: true });
  bloque(16.4, -21.8, 2.6, 3, 2.6, { tejado: true });
  bloque(14.9, -16, 2.2, 2.6, 2.2, { tejado: true });
  bloque(24.8, -40.6, 3.4, 3, 3.2, { balcones: true, tinte: '#7a5a3c' });
  bloque(29.8, -43.4, 4, 3.6, 4.4, { balcones: true });
  bloque(27.6, -49.5, 5, 4, 5.4, { balcones: true });
  bloque(12.2, -51.5, 5, 4.4, 7.4, { balcones: true });
  bloque(19.6, -51, 6, 4, 5, { balcones: true, tinte: '#7a5a3c' });
  bloque(2.6, -42.6, 4.4, 4.4, 4.6, { balcones: true });
  // Más barrio hacia el norte, hasta el horizonte: chalés de teja y bloques de tres a seis plantas.
  for (let i = 0, puestos = 0; i < 900 && puestos < 46; i++) {
    const x = -1 + azar() * 44,
      z = -84 + azar() * 66,
      w = 3 + azar() * 2.4,
      d = 3 + azar() * 1.8;
    if (lado(ESCARPE, x, z) < 4.5 || Math.hypot(x, z) > 78) continue;
    if (ocupado.some(([a, b, c, e]) => x - w / 2 - 0.9 < c && x + w / 2 + 0.9 > a && z - d / 2 - 0.9 < e && z + d / 2 + 0.9 > b)) continue;
    const alto = azar() > 0.55 ? 1.8 : 3 + Math.floor(azar() * 3) * 1.5;
    bloque(x, z, w, d, alto, { tejado: alto < 2, balcones: alto > 4, tinte: i % 3 ? '#5e7f86' : '#7a5a3c' });
    puestos++;
  }
  // Campo de golf: arboledas, búnkeres de arena, greens con su bandera y un lago.
  for (let i = 0, puestos = 0; i < 900 && puestos < 60; i++) {
    const x = -80 + azar() * 74,
      z = -84 + azar() * 78;
    if (x > -7 || lado(ESCARPE, x, z) < 2 || Math.hypot(x, z) > 78) continue;
    const y = arena(x, z);
    if (i % 7 === 0) pieza(poste, '#eadab0', x, y + 0.02, z, 2.2 + azar(), 0.06, 1.4 + azar());
    else if (i % 11 === 0) {
      pieza(poste, '#8cc063', x, y + 0.02, z, 3.2, 0.05, 2.6);
      pieza(poste, '#f4f1e8', x, y + 0.7, z, 0.04, 1.4, 0.04);
      pieza(caja, '#d23b2f', x + 0.2, y + 1.25, z, 0.4, 0.26, 0.02);
    } else {
      const h = 1.2 + azar() * 1.2;
      pieza(poste, '#5e4535', x, y + h / 2, z, 0.16, h, 0.16);
      for (let k = 0; k < 3; k++)
        pieza(esfera, k % 2 ? '#3f6b3a' : '#4c7a40', x + (azar() - 0.5) * 0.8, y + h + k * 0.3, z + (azar() - 0.5) * 0.8, 0.9 - k * 0.15, 0.6, 0.9 - k * 0.15);
    }
    puestos++;
  }
  pieza(poste, '#4b8fa3', -24, arena(-24, -34) + 0.03, -34, 7, 0.06, 4);
  pieza(poste, '#4b8fa3', -48, arena(-48, -30) + 0.03, -30, 5, 0.06, 3.4);

  // --- Hotel Rey Carlos, con Pepe Chiringo en los bajos de la esquina de Tirajana y Francia ---
  {
    const x = 12,
      z = -42.3,
      w = 3.6,
      d = 5,
      h = 7.6,
      frente = z + d / 2;
    muros.push(new T.BoxGeometry(w, h + 1, d).translate(x, y0 + (h - 1) / 2, z));
    pieza(caja, '#f7f3ea', x, y0 + h + 0.05, z, w + 0.14, 0.12, d + 0.14);
    for (let f = 1; f * 1.5 + 1.5 < h; f++) {
      const y = y0 + 1.1 + f * 1.5;
      for (const u of [-1.05, 0, 1.05]) {
        pieza(caja, '#525d55', x + u, y + 0.15, frente + 0.02, 0.8, 0.85, 0.05);
        ventanas.push([x + u - 0.15, y + 0.15, frente + 0.04, 0.3, 0.6, 0.03]);
        pieza(caja, '#e8d5aa', x + u, y - 0.32, frente + 0.3, 0.98, 0.36, 0.6);
      }
      for (const u of [-1.6, 0, 1.6]) pieza(caja, '#525d55', x - w / 2 - 0.02, y + 0.15, z + u, 0.05, 0.85, 0.8);
    }
    // Pepe Chiringo: escaparate, rótulo rojo, toldo a rayas y terraza a la acera de Francia.
    pieza(caja, '#33494d', x, y0 + 0.85, frente + 0.03, w - 0.3, 1.4, 0.06);
    ventanas.push([x, y0 + 0.85, frente + 0.06, w - 0.6, 1.1, 0.02]);
    pieza(caja, '#33494d', x - w / 2 - 0.03, y0 + 0.85, z + 1, 0.06, 1.4, 2.4);
    // El rótulo va por encima del toldo, para que se lea desde la avenida.
    pieza(caja, '#963a31', x, y0 + 2.02, frente + 0.06, w, 0.52, 0.1);
    rotulo(MASPALOMAS.pepe, '#963a31', '#fff5cf', x, y0 + 2.02, frente + 0.12, w - 0.1, 0.46);
    for (let i = 0; i < 12; i++) pieza(caja, i % 2 ? '#f6ecd6' : '#b5463b', x - w / 2 + 0.15 + i * 0.3, y0 + 1.6, frente + 0.5, 0.3, 0.06, 1, 0.22);
    for (const [dx, dz] of [
      [-1.1, 1.25],
      [0.4, 1.4],
      [1.6, 1.25],
    ]) {
      const tx = x + dx,
        tz = frente + dz;
      pieza(poste, '#2f4f4f', tx, y0 + 0.36, tz, 0.07, 0.72, 0.07);
      pieza(poste, '#e9dfc9', tx, y0 + 0.74, tz, 0.62, 0.05, 0.62);
      for (const s of [-1, 1]) pieza(caja, '#b5463b', tx + s * 0.42, y0 + 0.3, tz, 0.3, 0.6, 0.3);
    }
  }

  // --- Centro Comercial CITA: soportales en arco, torretas, rótulo y sus monumentos de cartón piedra ---
  {
    const x = 17.9,
      z = -42.8,
      w = 7.4,
      d = 6,
      h = 3.6,
      frente = z + d / 2;
    const fachada = '#e6aa87';
    pieza(caja, fachada, x, y0 + h / 2, z, w, h, d);
    pieza(caja, '#f2dcc4', x, y0 + h + 0.08, z, w + 0.2, 0.16, d + 0.2);
    // Soportal: cinco arcos sobre pilares y los escaparates detrás.
    const arco = new T.TorusGeometry(0.62, 0.11, 5, 12, Math.PI);
    for (let k = 0; k < 5; k++) {
      const ax = x - w / 2 + 0.74 + k * 1.48;
      pieza(caja, '#326f69', ax, y0 + 0.85, frente - 0.6, 1.1, 1.5, 0.06);
      ventanas.push([ax, y0 + 0.95, frente - 0.56, 0.9, 1.1, 0.02]);
      pieza(arco, '#f2dcc4', ax, y0 + 1.55, frente + 0.02, 1, 1, 1);
      pieza(caja, '#f2dcc4', ax - 0.74, y0 + 0.78, frente + 0.02, 0.18, 1.56, 0.2);
    }
    pieza(caja, '#f2dcc4', x + w / 2 - 0.02, y0 + 0.78, frente + 0.02, 0.18, 1.56, 0.2);
    pieza(caja, '#d79c79', x, y0 + 0.02, frente - 0.3, w, 0.05, 0.6);
    arco.dispose();
    // Planta alta: ventanas en fila y el rótulo en el centro.
    for (let k = 0; k < 8; k++) if (k < 3 || k > 4) pieza(caja, '#3e5b5d', x - w / 2 + 0.55 + k * 0.9, y0 + 2.75, frente + 0.02, 0.55, 0.62, 0.05);
    pieza(caja, '#953f36', x, y0 + 2.75, frente + 0.05, 1.9, 0.78, 0.08);
    rotulo(MASPALOMAS.cita, '#953f36', '#fff5cf', x, y0 + 2.75, frente + 0.1, 1.8, 0.7);
    // Torretas en las esquinas del frente, con su corona de almenas.
    for (const s of [-1, 1]) {
      const tx = x + s * (w / 2 - 0.2),
        tz = frente - 0.3;
      pieza(poste, '#c99a7a', tx, y0 + 2.4, tz, 1.1, 4.8, 1.1);
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        pieza(caja, '#d9b294', tx + 0.48 * Math.cos(a), y0 + 4.95, tz + 0.48 * Math.sin(a), 0.24, 0.3, 0.24);
      }
    }
    // Torre Eiffel sobre la azotea: cuatro patas que se juntan en curva, dos plataformas y la aguja.
    const ex = x - 2.2,
      ez = z - 0.6,
      ey = y0 + h + 0.15,
      ocre = '#6f5848';
    const tramos: [number, number][] = [
      [0, 0.62],
      [1.3, 0.32],
      [2.7, 0.13],
      [4.3, 0.02],
    ];
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      for (let k = 1; k < tramos.length; k++) {
        const [ya, ra] = tramos[k - 1],
          [yb, rb] = tramos[k];
        barra(ex + sx * ra, ey + ya, ez + sz * ra, ex + sx * rb, ey + yb, ez + sz * rb, 0.1 - k * 0.02, ocre);
      }
    pieza(caja, ocre, ex, ey + 1.3, ez, 0.78, 0.1, 0.78);
    pieza(caja, ocre, ex, ey + 2.7, ez, 0.36, 0.08, 0.36);
    for (const s of [-1, 1]) {
      barra(ex - 0.5, ey + 0.05, ez + s * 0.5, ex, ey + 0.75, ez + s * 0.5, 0.06, ocre);
      barra(ex + 0.5, ey + 0.05, ez + s * 0.5, ex, ey + 0.75, ez + s * 0.5, 0.06, ocre);
    }
    pieza(poste, ocre, ex, ey + 4.6, ez, 0.05, 0.7, 0.05);
    // Torre de Pisa, blanca y vencida, con sus galerías.
    const px = x + 2.3,
      pz = z - 0.8;
    pieza(poste, '#f1ede2', px + 0.12, y0 + h + 1.4, pz, 0.62, 2.8, 0.62, 0, 0, -0.09);
    for (let k = 0; k < 6; k++) pieza(poste, '#d7d0c0', px + 0.03 + k * 0.045, y0 + h + 0.35 + k * 0.5, pz, 0.74, 0.07, 0.74, 0, 0, -0.09);
    // Arco de Triunfo, pequeño, sobre la esquina este.
    const tx = x + 1.4,
      tz = z + 1.6;
    for (const s of [-1, 1]) pieza(caja, '#d6cbb5', tx + s * 0.45, y0 + h + 0.55, tz, 0.4, 1, 0.4);
    pieza(caja, '#d6cbb5', tx, y0 + h + 1.2, tz, 1.4, 0.4, 0.42);
  }

  // --- Riu Palace Maspalomas: media luna abierta a las dunas, con pasaje, puente y jardín ---
  {
    const cx = 7.6,
      cz = -10.6,
      radio = 5.6,
      alto = 6.2;
    const blancoRiu = '#f5eee0';
    for (let a = 200; a <= 340; a += 10) {
      if (Math.abs(a - 270) < 12) continue; // el pasaje público
      const th = (a * Math.PI) / 180,
        x = cx + radio * Math.cos(th),
        z = cz + radio * Math.sin(th),
        giro = Math.atan2(-Math.cos(th), -Math.sin(th));
      muros.push(new T.BoxGeometry(1.05, alto + 1, 2.6).rotateY(giro).translate(x, y0 + (alto - 1) / 2, z));
      pieza(caja, '#b4634a', x, y0 + alto + 0.12, z, 1.1, 0.24, 2.8, 0, giro);
      // Balcones corridos hacia el jardín, con la madera oscura del estilo colonial.
      const ix = x - 1.32 * Math.cos(th),
        iz = z - 1.32 * Math.sin(th);
      for (let f = 0; f < 4; f++) {
        const y = y0 + 0.95 + f * 1.45;
        pieza(caja, '#4b5c60', ix, y, iz, 0.8, 0.7, 0.05, 0, giro);
        if ((a / 10 + f) % 3) ventanas.push([ix + 0.03 * Math.cos(th), y, iz + 0.03 * Math.sin(th), 0.3, 0.5, 0.03]);
        if (f) {
          pieza(caja, blancoRiu, ix - 0.3 * Math.cos(th), y - 0.42, iz - 0.3 * Math.sin(th), 1.05, 0.08, 0.6, 0, giro);
          pieza(caja, '#6b4a33', ix - 0.58 * Math.cos(th), y - 0.18, iz - 0.58 * Math.sin(th), 1.05, 0.36, 0.04, 0, giro);
        }
        // Ventanas también hacia fuera, a la avenida.
        pieza(caja, '#4b5c60', x + 1.32 * Math.cos(th), y, z + 1.32 * Math.sin(th), 0.7, 0.62, 0.05, 0, giro);
      }
    }
    // Las dos alas que bajan hacia el mirador.
    for (const [x, z] of [
      [2.6, -10.9],
      [12.6, -10.9],
    ]) {
      muros.push(new T.BoxGeometry(2.4, alto, 3).translate(x, y0 + alto / 2 - 0.5, z));
      pieza(caja, '#b4634a', x, y0 + alto - 0.38, z, 2.6, 0.24, 3.2);
      for (let f = 0; f < 3; f++) {
        pieza(caja, '#4b5c60', x, y0 + 0.95 + f * 1.45, z + 1.52, 1.7, 0.62, 0.05);
        ventanas.push([x, y0 + 0.95 + f * 1.45, z + 1.55, 0.5, 0.5, 0.03]);
      }
    }
    // Puente entre las dos medialunas, sobre el pasaje.
    const pz = cz - radio;
    pieza(caja, blancoRiu, cx, y0 + 4.4, pz, 2.8, 2.6, 2.2);
    pieza(caja, '#b4634a', cx, y0 + 5.82, pz, 3, 0.24, 2.4);
    for (const s of [-1, 1]) {
      pieza(caja, '#4b5c60', cx, y0 + 4.4, pz + s * 1.12, 2.2, 0.7, 0.05);
      rotulo(MASPALOMAS.riu, '#7a2f2b', '#fff3d6', cx, y0 + 3.42, pz + s * 1.13, 2.4, 0.42, s > 0 ? 0 : Math.PI);
    }
    // Jardín: césped, la piscina y tumbonas.
    for (const [x, z, w, d] of [
      [4.6, -9.6, 2.6, 4.4],
      [10.6, -9.4, 2.6, 4],
    ])
      pieza(caja, '#6f9a4c', x, y0 + 0.03, z, w, 0.06, d);
    pieza(poste, '#e9e4d8', 10.3, y0 + 0.05, -12.3, 3, 0.1, 2.1);
    pieza(poste, '#47b6c6', 10.3, y0 + 0.08, -12.3, 2.6, 0.08, 1.7);
    for (let k = 0; k < 4; k++) pieza(caja, blanco, 8.9 + k * 0.85, y0 + 0.15, -10.6, 0.4, 0.08, 1.1, 0.1);
    pieza(caja, '#d8cdb9', (PASAJE[0] + PASAJE[2]) / 2, y0 + 0.02, (PASAJE[1] + PASAJE[3]) / 2, PASAJE[2] - PASAJE[0], 0.05, PASAJE[3] - PASAJE[1]);
  }

  // --- Mirador de las Dunas, su escalera a la arena y el Paseo Costa Canaria ---
  {
    const [x0, z0, x1, z1] = MIRADOR;
    superficie(caja, tenido(adoquin, '#d9cbb4'), (x0 + x1) / 2, y0 - 0.5, (z0 + z1) / 2, x1 - x0, 1.06, z1 - z0, 2.4);
    // Pretil blanco alrededor, abierto a la escalera.
    for (const [a, b] of [
      [x0, ESCALERA[0]],
      [ESCALERA[2], x1],
    ])
      pieza(caja, blanco, (a + b) / 2, y0 + 0.4, z1, b - a, 0.8, 0.22);
    pieza(caja, blanco, x0, y0 + 0.4, (z0 + z1) / 2, 0.22, 0.8, z1 - z0);
    // Prismáticos de monedas, para ver las dunas de cerca.
    pieza(poste, '#4a5a60', 9.2, y0 + 0.5, -4.3, 0.12, 1, 0.12);
    pieza(caja, '#4a5a60', 9.2, y0 + 1.1, -4.3, 0.22, 0.25, 0.42, -0.2);
    banco(6.9, y0, -6.1);
    banco(9.1, y0, -6.1);
    farola(x0 + 0.2, y0, z0 + 0.3);
    farola(x1 - 0.2, y0, z0 + 0.3);
    // Escalera: peldaños de piedra entre muretes, de la terraza a la arena.
    const [ex0, ez0, ex1, ez1] = ESCALERA,
      abajo = arena((ex0 + ex1) / 2, ez1);
    for (let k = 0; k < 9; k++) {
      const z = ez0 + (k + 0.5) * ((ez1 - ez0) / 9),
        y = y0 + (abajo - y0) * ((k + 0.5) / 9);
      pieza(caja, k % 2 ? '#c9bba3' : '#d3c6ae', (ex0 + ex1) / 2, (y - 1.2) / 2, z, ex1 - ex0, y + 1.2, (ez1 - ez0) / 9 + 0.02);
    }
    const largo = Math.hypot(ez1 - ez0, y0 - abajo);
    for (const x of [ex0 - 0.1, ex1 + 0.1])
      pieza(caja, blanco, x, (y0 + abajo) / 2 + 0.35, (ez0 + ez1) / 2, 0.2, 0.8, largo, Math.atan2(y0 - abajo, ez1 - ez0));
  }
  for (let i = 1; i < PASEO.length; i++) {
    const [ax, az] = PASEO[i - 1],
      [bx, bz] = PASEO[i];
    const largo = Math.hypot(bx - ax, bz - az),
      giro = Math.atan2(-(bz - az), bx - ax);
    // Normal hacia las dunas, a la derecha según se va del mirador a la playa.
    const nx = -(bz - az) / largo,
      nz = (bx - ax) / largo;
    for (let s = 0; s < largo; s += 1) {
      const x = ax + ((bx - ax) * (s + 0.5)) / largo,
        z = az + ((bz - az) * (s + 0.5)) / largo,
        y = meseta(x);
      pieza(caja, s % 2 ? '#d8cbb3' : '#cdbfa6', x, y - 0.28, z, 1.08, 0.66, 2.5, 0, giro);
      // Murete encalado del lado de la arena, con su albardilla de piedra y huecos para bajar a ella.
      if (s % 6 !== 3) {
        pieza(caja, '#f1ece2', x + nx * 1.25, y + 0.2, z + nz * 1.25, 1.08, 0.5, 0.2, 0, giro);
        pieza(caja, '#b9ad98', x + nx * 1.25, y + 0.47, z + nz * 1.25, 1.1, 0.06, 0.28, 0, giro);
      }
      if (s % 5 === 2) farola(x - nx * 1.1, y, z - nz * 1.1);
      if (s % 7 === 4) banco(x - nx * 0.75, y, z - nz * 0.75, giro);
    }
  }
  {
    // Los muros encalados de todo el barrio, en una sola malla.
    const planos = muros.map((g) => g.toNonIndexed());
    const todos = mergeGeometries(planos);
    superficie(todos, tenido(cal, '#ffffff'), 0, 0, 0, 1, 1, 1, 2.6);
    for (const g of [...muros, ...planos, todos]) g.dispose();
  }

  // --- Faro de Maspalomas: torre troncocónica de cantería gris y la casa del torrero a su pie ---
  {
    const [plx0, plz0, , plz1] = PLAZA;
    // Plaza enlosada y paseo de Meloneras, con el muro al mar y su barandilla.
    superficie(caja, tenido(adoquin, '#ddd3c2'), (plx0 - 7 - 41) / 2, LOSAS - 0.7, (plz0 + plz1) / 2, -41 - plx0 + 7, 1.4, plz1 - plz0, 2.4);
    for (let x = plx0 - 6.5; x < -46; x += 1.2) {
      pieza(caja, '#8f877b', x, -0.25, plz1 + 0.1, 1.22, 1.2, 0.3);
      pieza(poste, blanco, x, LOSAS + 0.45, plz1 - 0.1, 0.05, 0.9, 0.05);
    }
    pieza(caja, blanco, (plx0 - 6.5 - 46) / 2, LOSAS + 0.9, plz1 - 0.1, -46 - plx0 + 6.5, 0.06, 0.08);
    for (const x of [-53.5, -50, -36.8]) farola(x, LOSAS, 22);
    for (const x of [-52, -48.5]) banco(x, LOSAS, 22.6);
    // Bajada en rampa a la playa, al este.
    for (let k = 0; k < 6; k++) {
      const x = -40.75 + k * 0.5,
        y = LOSAS + (arena(x, 26) - LOSAS) * ((k + 0.5) / 6);
      pieza(caja, '#d2c7b4', x, (y - 1) / 2, (plz0 + plz1) / 2, 0.52, y + 1, plz1 - plz0);
    }
    // Rocas de la punta, al pie de la torre.
    for (let i = 0; i < 26; i++) {
      const a = azar() * Math.PI - Math.PI * 0.05,
        r = 2.2 + azar() * 2.2;
      const s = 0.5 + azar() * 0.7;
      pieza(esfera, azar() > 0.5 ? '#4a423e' : '#5c524b', FARO[0] + Math.cos(a) * r, -0.6, FARO[1] + 0.6 + Math.sin(a) * r * 0.7, s * 1.3, s * 0.7, s);
    }
    // Bulevar de tiendas al norte de la plaza, y el hotel del Oasis tras el palmeral.
    for (const [x, z, w, d, h, toldo] of [
      [-54, 18.9, 3.6, 3.2, 2.6, '#2f7fa0'],
      [-50.3, 18.9, 3.4, 3.2, 3, '#b5463b'],
      [-57.5, 10, 6, 5, 3.2, ''],
      [-57, 2, 5, 5, 2.6, ''],
    ] as [number, number, number, number, number, string][]) {
      pieza(caja, '#f3ede0', x, LOSAS + h / 2 - 0.5, z, w, h + 1, d);
      if (toldo) {
        pieza(caja, toldo, x, LOSAS + 1.9, z + d / 2 + 0.4, w * 0.9, 0.06, 0.9, 0.25);
        pieza(caja, '#3a5458', x, LOSAS + 0.9, z + d / 2 + 0.02, w * 0.8, 1.3, 0.05);
        ventanas.push([x, LOSAS + 0.9, z + d / 2 + 0.05, w * 0.7, 1.1, 0.02]);
      } else pieza(piramide, '#b4634a', x, LOSAS + h + 0.4, z, w * 0.74, 0.8, d * 0.74, 0, Math.PI / 4);
    }
    const [fx, fz] = FARO,
      cantera = '#a3aaad',
      clara = '#b6bcbd';
    // Casa del torrero: dos plantas, encalada, con esquinas, cornisa y marcos de cantería.
    const hx = fx,
      hz = fz - 2.85,
      hw = 7,
      hd = 3.6,
      hh = 3.7;
    pieza(caja, '#efe9dc', hx, LOSAS + hh / 2, hz, hw, hh, hd);
    pieza(caja, cantera, hx, LOSAS + hh + 0.1, hz, hw + 0.24, 0.22, hd + 0.24);
    pieza(caja, cantera, hx, LOSAS + 0.2, hz, hw + 0.06, 0.4, hd + 0.06);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        for (let k = 0; k < 6; k++)
          pieza(caja, k % 2 ? cantera : clara, hx + sx * (hw / 2 - 0.15), LOSAS + 0.3 + k * 0.6, hz + sz * (hd / 2 - 0.15), 0.36, 0.56, 0.36);
    for (const [u, frente] of [
      [-2.4, 1],
      [2.4, 1],
      [-2.4, -1],
      [-0.8, -1],
      [0.8, -1],
      [2.4, -1],
    ])
      for (const y of [1.05, 2.75]) {
        const wz = hz + frente * (hd / 2 + 0.02);
        pieza(caja, cantera, hx + u, LOSAS + y, wz, 0.82, 1.05, 0.06);
        pieza(caja, '#4a3d33', hx + u, LOSAS + y, wz + frente * 0.02, 0.58, 0.82, 0.04);
        ventanas.push([hx + u, LOSAS + y, wz + frente * 0.04, 0.4, 0.6, 0.02]);
      }
    for (const lado2 of [-1, 1]) {
      const wx = hx + lado2 * (hw / 2 + 0.02);
      for (const y of [1.05, 2.75]) {
        pieza(caja, cantera, wx, LOSAS + y, hz, 0.06, 1.05, 0.82);
        pieza(caja, '#4a3d33', wx + lado2 * 0.02, LOSAS + y, hz, 0.04, 0.82, 0.58);
      }
    }
    // Puerta al norte con su balconcito de tea encima.
    pieza(caja, cantera, hx, LOSAS + 1.1, hz - hd / 2 - 0.03, 1.2, 2.2, 0.08);
    pieza(caja, '#5a3b26', hx, LOSAS + 1, hz - hd / 2 - 0.06, 0.9, 1.9, 0.05);
    pieza(caja, '#5a3b26', hx, LOSAS + 2.3, hz - hd / 2 - 0.35, 1.5, 0.08, 0.6);
    pieza(caja, '#5a3b26', hx, LOSAS + 2.62, hz - hd / 2 - 0.62, 1.5, 0.5, 0.05);
    // La torre: tronco de cono de sillería con hiladas, saeteras, capitel con ménsulas y linterna.
    const alto = 13,
      abajo = 1.55,
      arriba = 1.12;
    const tronco = new T.CylinderGeometry(arriba, abajo, 1, 18);
    pieza(tronco, cantera, fx, LOSAS + alto / 2, fz, 1, alto, 1);
    pieza(poste, '#7f878b', fx, LOSAS + 0.35, fz, 3.4, 0.7, 3.4);
    for (let y = 1.1; y < alto - 0.4; y += 1.05) {
      const r = abajo + (arriba - abajo) * (y / alto) + 0.015;
      pieza(tronco, clara, fx, LOSAS + y, fz, r / abajo, 0.06, r / abajo);
    }
    for (const a of [Math.PI / 2, 0, Math.PI]) {
      for (let y = 2.2; y < alto - 1; y += 2.6) {
        const r = abajo + (arriba - abajo) * (y / alto);
        pieza(caja, '#2f2c2a', fx + Math.cos(a) * r, LOSAS + y, fz + Math.sin(a) * r, 0.16, 0.85, 0.16, 0, -a);
      }
    }
    const cima = LOSAS + alto;
    pieza(poste, clara, fx, cima + 0.2, fz, 2.7, 0.4, 2.7);
    for (let k = 0; k < 14; k++) {
      const a = (k * Math.PI * 2) / 14;
      pieza(caja, cantera, fx + Math.cos(a) * 1.3, cima + 0.05, fz + Math.sin(a) * 1.3, 0.2, 0.32, 0.2, 0, -a);
    }
    pieza(poste, cantera, fx, cima + 0.5, fz, 3.4, 0.22, 3.4);
    const aro = new T.TorusGeometry(1.62, 0.035, 5, 20);
    pieza(aro, '#e9e6de', fx, cima + 1.2, fz, 1, 1, 1, Math.PI / 2);
    aro.dispose();
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI * 2) / 12;
      pieza(caja, '#e9e6de', fx + Math.cos(a) * 1.62, cima + 0.9, fz + Math.sin(a) * 1.62, 0.05, 0.6, 0.05);
    }
    pieza(poste, '#c9ccc9', fx, cima + 0.85, fz, 1.6, 0.5, 1.6);
    ventanas.push([fx, cima + 1.75, fz, 1.2, 1.25, 1.2]);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      pieza(caja, '#e9e6de', fx + Math.cos(a) * 0.66, cima + 1.75, fz + Math.sin(a) * 0.66, 0.06, 1.3, 0.06);
    }
    pieza(poste, '#e9e6de', fx, cima + 2.45, fz, 1.6, 0.12, 1.6);
    const cupula = new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    pieza(cupula, '#dfe3e3', fx, cima + 2.5, fz, 0.74, 0.62, 0.74);
    cupula.dispose();
    tronco.dispose();
    pieza(poste, '#3a3a3a', fx, cima + 3.4, fz, 0.05, 0.8, 0.05);
    pieza(caja, '#3a3a3a', fx + 0.18, cima + 3.6, fz, 0.4, 0.14, 0.02);
  }
  // Senda de tierra entre las palmeras del Oasis.
  pieza(caja, '#c2ab84', (PALMERAL[0] + PALMERAL[2]) / 2 + 1, 0.31, 15.2, PALMERAL[2] - PALMERAL[0] - 2, 0.03, 1.4);

  // Un velero mar adentro; los otros barcos de la maqueta quedan fondeados lejos de la vista.
  return {
    amarres: [
      [1, 14, 40, 0.6],
      [0, 0, -400],
      [2, 0, -400],
    ],
    enSeco: [],
  };
}

/** Rizos de viento: líneas onduladas, oscuras con un filo de luz, que se repiten sin costura. */
function rizos(): T.CanvasTexture {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 128;
  const ctx = lienzo.getContext('2d')!;
  ctx.fillStyle = '#efefef';
  ctx.fillRect(0, 0, 128, 128);
  for (const [color, dy] of [
    ['rgba(150,104,54,0.32)', 0],
    ['rgba(255,255,255,0.85)', 2.4],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    for (let k = -9; k < 17; k++) {
      ctx.beginPath();
      for (let u = 0; u <= 128; u += 4) {
        const v = k * 16 + u + dy + 2.6 * Math.sin((u / 128) * Math.PI * 4 + (k * Math.PI) / 4);
        if (u) ctx.lineTo(u, v);
        else ctx.moveTo(u, v);
      }
      ctx.stroke();
    }
  }
  const mapa = new T.CanvasTexture(lienzo);
  mapa.wrapS = mapa.wrapT = T.RepeatWrapping;
  mapa.colorSpace = T.SRGBColorSpace;
  mapa.anisotropy = 4;
  return mapa;
}
