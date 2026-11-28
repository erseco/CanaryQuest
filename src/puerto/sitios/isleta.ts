import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS, type Suelo } from '../../data/pueblos';
import { alturaPaseo } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa } from './terreno';

/** Hacia dónde mira una fachada; el norte es −z. */
type Frente = 'n' | 's' | 'e' | 'o';
type Rect = [number, number, number, number];
const NORMAL: Record<Frente, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] };
/** Alto de una planta. */
const PLANTA = 1.7;

const suave = (v: number) => {
  const k = Math.min(1, Math.max(0, v));
  return k * k * (3 - 2 * k);
};
/** x de la costa de poniente en cada z: recta junto al barrio y, al noroeste, abierta hacia El Confital. */
const costaOeste = (z: number) =>
  z > -30 ? -44 + 0.5 * Math.sin(z * 0.6) : -44 - (-30 - z) * 1.15 + 2.5 * Math.sin((-30 - z) * 0.3);
/** Volcán: laderas de picón rectas y surcadas hasta una cima roma, con su cráter. */
function cono(x: number, z: number, cx: number, cz: number, radio: number, alto: number, crater = 0) {
  const d = Math.hypot(x - cx, z - cz) / radio;
  if (d >= 1) return 0;
  const surcos = 1 + 0.12 * Math.sin(Math.atan2(z - cz, x - cx) * 9 + radio) * suave(d / 0.4);
  return alto * suave((1 - d) / 0.72) * surcos - crater * suave(1 - d / 0.24);
}
/** Ladera natural: llano en el puerto, el barrio en cuesta hacia el norte y los volcanes detrás. */
function ladera(x: number, z: number): number {
  const s = -z;
  let y =
    s < 10.5
      ? 0
      : s < 17.2
        ? (s - 10.5) * 0.328
        : s < 21
          ? 2.2
          : s < 27.7
            ? 2.2 + (s - 21) * 0.478
            : s < 31.5
              ? 5.4
              : 5.4 + Math.min(3, (s - 31.5) * 0.3);
  // Al este, los tanques y las naves del puerto quedan en un llano más bajo.
  y *= 1 - 0.6 * suave((x - 24) / 8);
  const ruido = 0.5 * Math.sin(x * 0.5 + z * 0.3) + 0.4 * Math.sin(x * 0.23 - z * 0.61);
  y +=
    Math.max(
      cono(x, z, 4, -58, 22, 11, 2.5), // la montaña de La Isleta, con su cráter
      cono(x, z, 34, -48, 14, 8, 2), // el cono del este, de picón oscuro
      cono(x, z, -24, -52, 12, 6.5, 1.5), // el cono rojizo del oeste
      cono(x, z, 18, -43, 8, 4),
      cono(x, z, -9, -46, 7, 3),
    ) +
    ruido * suave((s - 34) / 6);
  // Lejos, la península baja al mar antes de llegar al horizonte pintado.
  y = (y + 1.8) * suave((80 - Math.hypot(x, z)) / 14) - 1.8;
  // En El Confital la orilla es una rasa baja de roca y arena; en el resto, un acantilado de lava.
  const rasa = suave((-33 - z) / 3) * suave((z + 56) / 4);
  y *= 1 - rasa * (1 - suave((x - costaOeste(z) - 2) / 9));
  const borde = suave((x - costaOeste(z)) / 2.5);
  return y * borde - 1.8 * (1 - borde);
}

/**
 * La Isleta (Las Palmas de Gran Canaria), trazada sobre la ortofoto PNOA y OpenStreetMap y comprimida
 * a escala de maqueta, con el norte arriba (−z) y el puerto delante. En la orilla, la avenida y el
 * muelle de los pesqueros; detrás, el Castillo de La Luz en su jardín y la iglesia de La Luz con su
 * plaza; luego el barrio, que trepa por Juan Rejón, La Naval y una calle alta hasta el pie de los
 * volcanes, que son zona militar. Al este, los tanques de combustible y las grúas de la terminal de
 * contenedores; al noroeste, El Confital. Las calles pisables están en `PUEBLOS.isleta.plano.suelos`;
 * si se mueve una calle, hay que mover allí su rectángulo.
 */
export function trazarIsleta(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const { plano, casas } = PUEBLOS.isleta;
  const suelos = plano.suelos!;
  const calle = (x: number, z: number) => alturaPaseo(x, z, 'isleta');
  const cornisa = '#efe9dd',
    hierro = '#3a3734';
  const cilindro = new T.CylinderGeometry(1, 1, 1, 18),
    cupula = new T.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);

  // --- Terreno: el barrio se amolda a sus calles y, lejos de ellas, sube a los volcanes ---
  const altura = (x: number, z: number): number => {
    let cerca = Infinity,
      camino = 0;
    for (const { r } of suelos) {
      const cx = Math.min(Math.max(x, r[0]), r[2]),
        cz = Math.min(Math.max(z, r[1]), r[3]),
        d = Math.hypot(x - cx, z - cz);
      if (d < cerca) {
        cerca = d;
        camino = calle(cx, cz);
      }
    }
    const k = suave((cerca - 0.9) / 3.5);
    return (camino - 0.1) * (1 - k) + ladera(x, z) * k;
  };
  {
    const paso = 1.3,
      [x0, z0, x1, z1] = [-72, -100, 66, 13];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        // El borde sur queda recto, bajo el muro del muelle.
        const x = x0 + (i + (azar() - 0.5) * 0.4) * paso,
          z = Math.min(z1, z0 + (j + (azar() - 0.5) * 0.4) * paso);
        p.push(new T.Vector3(x, altura(x, z), z));
      }
    const picon = ['#4a3c35', '#3e3430', '#57443a', '#4d4039', '#5f4a3d', '#6b4a3a'];
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
          // Ni el fondo del mar ni lo que asomaría tras el horizonte pintado.
          if (Math.max(u.y, v.y, w.y) < -1 || Math.hypot(u.x, u.z) > 79) continue;
          const y = (u.y + v.y + w.y) / 3,
            x = (u.x + v.x + w.x) / 3,
            z = (u.z + v.z + w.z) / 3,
            mar = x - costaOeste(z);
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          let color: string;
          if (mar < 9 && y < 1.4 && z < -33 && z > -54) color = y < -0.5 ? '#9c8a68' : '#cdb48c'; // arena de El Confital
          else if (mar < 3 || y < -0.3) color = (i + j) % 3 ? '#3d3532' : '#4a403b'; // lava de la orilla
          else if (x > 26 && z > -34) color = '#8e8880'; // llano del puerto
          else if (z > -35) color = '#8a7a66'; // tierra del barrio
          else if (Math.hypot(x + 24, z + 52) < 10) color = (i + j) % 2 ? '#7d4634' : '#8a4f3a'; // cono rojizo
          else if (Math.abs(normal.y) > 0.86 && y > 7) color = (i * 7 + j) % 5 ? '#8a7f5f' : '#7b7a55'; // tabaibal
          else color = picon[Math.min(picon.length - 1, Math.max(0, Math.floor((y + 3 * Math.sin(x * 0.2 + z * 0.13)) / 6)))];
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

  // --- Firme: avenida, muelles, jardín, plaza y calles ---
  const asfalto = tenido(cal, '#6e6b68'),
    losas = tenido(adoquin, '#cfc6b8'),
    hormigon = tenido(cal, '#c4bdb1');
  pieza(caja, '#8d857a', 3, -0.75, 12.8, 54, 1.4, 0.5); // muro del muelle
  // La avenida sigue al oeste hacia La Puntilla.
  superficie(caja, losas, -7, -0.04, 7.5, 74, 0.1, 1, 2.6); // acera del jardín
  superficie(caja, asfalto, -7, -0.04, 9.9, 74, 0.1, 3.8, 5); // avenida
  superficie(caja, hormigon, -7, -0.04, 12.3, 74, 0.1, 1.4, 4); // borde del muelle
  pieza(caja, '#c9c2b6', -7, 0.05, 9.9, 74, 0.1, 0.7); // mediana de las palmeras
  for (let x = -42.5; x < 28; x += 2.4) for (const z of [8.7, 11.1]) pieza(caja, '#e8e4da', x, 0.02, z, 1.2, 0.02, 0.08);
  for (let x = -22; x < 30; x += 3) {
    pieza(poste, '#2f3a36', x, 0.2, 12.8, 0.22, 0.4, 0.22); // norays
    pieza(poste, '#2f3a36', x, 0.4, 12.8, 0.28, 0.05, 0.28);
  }
  // Muelle de los pesqueros, con su baliza verde en la punta.
  pieza(caja, '#8d857a', 3, -0.75, 21.25, 3, 1.4, 16.5);
  superficie(caja, hormigon, 3, -0.03, 21.25, 3, 0.08, 16.5, 4);
  for (let z = 14.5; z < 29.5; z += 2.2)
    for (const x of [1.65, 4.35]) {
      pieza(poste, '#2f3a36', x, 0.18, z, 0.18, 0.36, 0.18);
      pieza(caja, '#1f1f1f', x + (x < 3 ? -0.2 : 0.2), -0.35, z, 0.12, 0.6, 0.5); // defensas
    }
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? t.blanco : '#2e8b57', 3, 0.35 + j * 0.6, 29, 0.6 - j * 0.05, 0.6, 0.6 - j * 0.05);
  ventanas.push([3, 2.7, 29, 0.26, 0.32, 0.26]);
  // Cajas de pescado y redes en el muelle.
  for (const [x, z, c] of [
    [2.2, 15.4, '#2f7fb8'],
    [2.2, 16, '#d9573b'],
    [3.9, 19.6, '#2f7fb8'],
    [3.8, 24.1, '#e3b53c'],
  ] as [number, number, string][])
    pieza(caja, c, x, 0.17, z, 0.55, 0.34, 0.4);
  pieza(esfera, '#3f6f6a', 2.3, 0.15, 21.6, 0.5, 0.18, 0.7);
  pieza(esfera, '#b55b3b', 3.9, 0.12, 27, 0.45, 0.14, 0.55);
  // Jardín del castillo: césped, paseos de jabre y bancos.
  for (const [x, z, w, d] of [
    [-7.35, -1, 3.1, 13], // oeste
    [7.6, -1, 3.6, 13], // este
    [0, -7.35, 11.2, 1.1], // norte
    [0, 5.9, 11.2, 1.7], // sur
  ])
    pieza(caja, '#6f8a45', x, -0.02, z, w, 0.1, d);
  for (const [x, z, w, d] of [
    [0, 5.85, 1.6, 2.3], // paseo hasta el puente
    [-7.35, 6.1, 3.3, 1.2],
    [7.6, 6.1, 3.6, 1.2],
    [12.8, -1, 0.5, 14],
  ])
    pieza(caja, '#cdbf9f', x, 0.0, z, w, 0.1, d);
  for (const [x, z, giro] of [
    [-8.4, -1, Math.PI / 2],
    [-3, 6.4, 0],
    [3, 6.4, 0],
  ]) {
    pieza(caja, t.madera, x, 0.42, z, 1.4, 0.07, 0.42, 0, giro);
    for (const s of [-0.55, 0.55]) pieza(caja, hierro, x + (giro ? 0 : s), 0.21, z + (giro ? s : 0), 0.08, 0.42, 0.36, 0, giro);
  }
  // Plaza de la iglesia y su callejón.
  superficie(caja, losas, -18, -0.04, 3, 18, 0.1, 8, 2.6);
  superficie(caja, losas, -25.75, -0.04, -4.5, 2.5, 0.1, 7, 2.6);
  for (const x of [-22, -14]) {
    pieza(caja, t.blanco, x, 0.22, 5.2, 1.5, 0.44, 0.45);
    pieza(caja, t.madera, x, 0.47, 5.2, 1.5, 0.06, 0.45);
  }
  // Calles: asfalto con aceras y, en la cuesta más fuerte, escaleras.
  suelos.slice(5).forEach((s, i) => {
    const escalera = s.y2 !== undefined && s.y! - s.y2 > 3;
    if (i === 3) {
      superficie(caja, losas, -38.5, s.y! - 0.04, -30, 5, 0.1, 6, 2.6); // mirador
      return;
    }
    if (escalera) return;
    losa(t, s, '#6d6964', 0.02);
    // Aceras a los lados, un dedo por encima del asfalto.
    const [x0, z0, x1, z1] = s.r;
    const porX = x1 - x0 > z1 - z0;
    for (const a of porX ? [z0, z1 - 0.55] : [x0, x1 - 0.55]) {
      const acera: Suelo = { ...s, r: porX ? [x0, a, x1, a + 0.55] : [a, z0, a + 0.55, z1], y: (s.y ?? 0) + 0.06 };
      if (s.y2 !== undefined) acera.y2 = s.y2 + 0.06;
      losa(t, acera, '#b9b2a7');
    }
  });
  // Escaleras de la calle del Faro y de la del medio, con su pasamanos.
  for (const s of suelos.filter((s) => s.y2 !== undefined && s.y! - s.y2 > 3)) {
    const [x0, z0, x1, z1] = s.r,
      x = (x0 + x1) / 2;
    for (let z = z0 + 0.25; z < z1; z += 0.5)
      pieza(caja, (Math.round(z * 2) % 2 ? '#b3aca1' : '#a59d92'), x, calle(x, z) - 0.2, z, x1 - x0, 0.5, 0.52);
    const largo = Math.hypot(z1 - z0, s.y! - s.y2!),
      pendiente = Math.atan2(s.y! - s.y2!, z1 - z0),
      borde = x1 - 0.15;
    pieza(caja, hierro, borde, (s.y! + s.y2!) / 2 + 0.85, (z0 + z1) / 2, 0.06, 0.06, largo, pendiente);
    for (let z = z0 + 1; z < z1; z += 2) pieza(caja, hierro, borde, calle(x, z) + 0.42, z, 0.05, 0.85, 0.05);
  }
  // Barandilla del mirador sobre el acantilado.
  for (const [x, z, w, d] of [
    [-41, -30, 0.08, 6],
    [-38.5, -33, 5, 0.08],
  ]) {
    pieza(caja, t.blanco, x, 6.25, z, w, 0.07, d);
    pieza(caja, t.blanco, x, 5.85, z, w, 0.05, d);
  }
  for (let z = -32.9; z <= -27; z += 1.2) pieza(caja, t.blanco, -41, 5.85, z, 0.07, 0.85, 0.07);

  // --- Casas del barrio: de colores, de azotea, a menudo a medio acabar ---
  const pintadas: T.BufferGeometry[] = [];
  /** Muro pintado: un bloque con su color por vértice, que se tiñe sobre el enfoscado. */
  function muro(x: number, y0: number, y1: number, z: number, sx: number, sz: number, color: string) {
    const g = new T.BoxGeometry(sx, y1 - y0, sz).translate(x, (y0 + y1) / 2, z);
    const n = g.toNonIndexed();
    g.dispose();
    n.deleteAttribute('uv');
    const rgb = new T.Color(color),
      colores = new Float32Array(n.attributes.position.count * 3);
    for (let i = 0; i < colores.length; i += 3) rgb.toArray(colores, i);
    n.setAttribute('color', new T.BufferAttribute(colores, 3));
    pintadas.push(n);
  }
  /** Piezas sobre una fachada: u corre a lo largo de ella, n hacia fuera, y desde el suelo. */
  function fachada(x: number, z: number, fondo: number, base: number, frente: Frente) {
    const [nx, nz] = NORMAL[frente];
    const donde = (u: number, n: number) => [x + nx * (fondo + n) + nz * u, z + nz * (fondo + n) - nx * u];
    return {
      giro: nx ? Math.PI / 2 : 0,
      donde,
      pieza(color: string, u: number, y: number, n: number, a: number, alto: number, b: number, forma = caja) {
        const [px, pz] = donde(u, n);
        pieza(forma, color, px, base + y, pz, nx ? b : a, alto, nx ? a : b);
      },
      luz(u: number, y: number, n: number, a: number, alto: number, b: number) {
        const [px, pz] = donde(u, n);
        ventanas.push([px, base + y, pz, nx ? b : a, alto, nx ? a : b]);
      },
    };
  }
  type Fachada = ReturnType<typeof fachada>;
  /** Ventana de aluminio con la persiana a medio bajar y su alféizar. */
  function ventana(f: Fachada, u: number, y: number) {
    f.pieza(cornisa, u, y, 0.02, 0.76, 0.94, 0.06);
    f.luz(u, y - 0.12, 0.06, 0.56, 0.5, 0.03);
    f.pieza('#d6d1c6', u, y + 0.2, 0.07, 0.6, 0.34, 0.03);
    f.pieza(cornisa, u, y - 0.48, 0.07, 0.84, 0.06, 0.14);
  }
  function farol(f: Fachada, u: number) {
    f.pieza('#2b2b2b', u, 2.3, 0.2, 0.04, 0.04, 0.4);
    f.pieza('#2b2b2b', u, 2.28, 0.4, 0.24, 0.05, 0.24);
    f.luz(u, 2.12, 0.4, 0.16, 0.26, 0.16);
  }
  const ocupado: Rect[] = suelos.map(({ r }) => [r[0] - 0.3, r[1] - 0.3, r[2] + 0.3, r[3] + 0.3]);
  for (const c of casas) ocupado.push([c.x - c.ancho / 2, c.z - c.fondo / 2, c.x + c.ancho / 2, c.z + c.fondo / 2]);
  ocupado.push(
    [-24.2, -7.8, -11.8, -0.9], // iglesia
    [9.3, -5.7, 12.7, 1.7], // fundación
    [26, -30, 50, -2], // tanques
    [-31, -50, 8, -39], // cuarteles
    [-45, 7, -27, 13], // la avenida hacia La Puntilla
    [-2.6, -37, 0.1, -31.5], // el callejón que sube al monte
  );
  const libre = ([a, b, c, d]: Rect) => !ocupado.some(([e, f, g, h]) => a < g && c > e && b < h && d > f);
  interface Vivienda {
    x: number;
    z: number;
    /** Ancho de la fachada y fondo de la casa. */
    w: number;
    d: number;
    plantas: number;
    /** Altura del suelo ante la puerta. */
    base: number;
    frente: Frente;
    color: string;
    /** La última planta, de bloque sin enfoscar y con los hierros al aire. */
    obra: boolean;
    /** Bajo comercial con su cierre metálico. */
    tienda: boolean;
    farol: boolean;
  }
  const azoteas = ['#b4553f', '#c26a4c', '#b9b2a6', '#d8d2c6', '#a9a39a'];
  function vivienda(c: Vivienda) {
    const [nx] = NORMAL[c.frente];
    const sx = nx ? c.d : c.w,
      sz = nx ? c.w : c.d;
    ocupado.push([c.x - sx / 2, c.z - sz / 2, c.x + sx / 2, c.z + sz / 2]);
    const h = c.plantas * PLANTA,
      techo = c.base + h,
      pretil = c.plantas > 1 ? 0.38 : 0,
      pintado = c.obra ? h - PLANTA : h + pretil;
    muro(c.x, c.base - 3, c.base + pintado, c.z, sx, sz, c.color);
    if (c.obra) {
      // Bloque de hormigón gris y las esperas de hierro en las esquinas.
      muro(c.x, c.base + pintado, techo, c.z, sx - 0.04, sz - 0.04, '#9b968e');
      for (const [ex, ez] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        pieza(caja, '#5a4436', c.x + ex * (sx / 2 - 0.15), techo + 0.35, c.z + ez * (sz / 2 - 0.15), 0.05, 0.7, 0.05);
      pieza(caja, '#8f8a82', c.x, techo + 0.02, c.z, sx - 0.1, 0.05, sz - 0.1);
    } else pieza(caja, azoteas[Math.abs(Math.round(c.x * 3 + c.z * 7)) % azoteas.length], c.x, techo + pretil + 0.01, c.z, sx - 0.26, 0.02, sz - 0.26);
    pieza(caja, '#7c7770', c.x, c.base + 0.22, c.z, sx + 0.04, 0.44, sz + 0.04); // zócalo
    // En la azotea: depósito de agua, antena, parabólica o la caseta de la escalera. Las casas de
    // una planta la dejan despejada, para que se vea la calle de detrás.
    const r = Math.abs(Math.round(c.x * 13 + c.z * 5));
    const y = techo + (c.obra ? 0.05 : pretil + 0.02);
    if (c.plantas > 1 && r % 3 !== 2) pieza(cilindro, r % 2 ? '#f1efe9' : '#2c2c2e', c.x + sx * 0.22, y + 0.35, c.z - sz * 0.2, 0.3, 0.7, 0.3);
    if (c.plantas > 1 && r % 4 === 1) {
      pieza(caja, '#9a9a9a', c.x - sx * 0.25, y + 0.7, c.z + sz * 0.1, 0.03, 1.4, 0.03);
      pieza(caja, '#9a9a9a', c.x - sx * 0.25, y + 1.2, c.z + sz * 0.1, 0.5, 0.03, 0.03, 0, 0.6);
    }
    if (c.plantas > 1 && r % 5 === 2) pieza(esfera, '#e6e4df', c.x - sx * 0.2, y + 0.35, c.z - sz * 0.25, 0.28, 0.28, 0.08, -0.5, 0.4);
    if (c.plantas > 1 && !c.obra && r % 4 === 3) muro(c.x - sx * 0.22, y, y + 1.1, c.z - sz * 0.18, 1.1, 1.1, c.color);
    // Fachada a la calle: puerta, ventanas por planta, bandas blancas en los forjados.
    const f = fachada(c.x, c.z, c.d / 2, c.base, c.frente);
    const n = Math.max(1, Math.round((c.w - 0.8) / 1.4)),
      paso = Math.min(1.7, (c.w - 0.5) / n),
      huecos = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * paso);
    for (let k = 1; k < c.plantas; k++) f.pieza(cornisa, 0, k * PLANTA, 0.03, c.w + 0.04, 0.12, 0.08);
    const puerta = n === 1 ? -c.w * 0.2 : huecos[0];
    f.pieza(r % 2 ? '#6b4a33' : '#8d8f91', puerta, 0.88, 0.04, 0.72, 1.6, 0.05);
    huecos.slice(1).forEach((u, i) => {
      if (c.tienda && i === 0) {
        f.pieza('#8a8c8e', u, 0.72, 0.04, Math.min(1.5, paso * 0.9), 1.3, 0.05);
        f.pieza(['#c23a2e', '#2f6fa8', '#e3b53c'][r % 3], u, 1.5, 0.06, Math.min(1.5, paso * 0.9), 0.2, 0.04);
      } else ventana(f, u, 0.98);
    });
    if (n === 1) ventana(f, c.w * 0.22, 0.98);
    for (let k = 1; k < c.plantas; k++) {
      for (const u of huecos) ventana(f, u, k * PLANTA + 0.98);
      if ((r + k) % 4 === 0) {
        // Balcón de obra con barandilla de hierro.
        const u = huecos[huecos.length - 1],
          ancho = Math.min(1.4, c.w - 0.4);
        f.pieza(cornisa, u, k * PLANTA + 0.08, 0.3, ancho, 0.1, 0.6);
        f.pieza(hierro, u, k * PLANTA + 0.6, 0.58, ancho, 0.04, 0.04);
        for (let a = -ancho / 2; a <= ancho / 2 + 0.01; a += ancho / 6) f.pieza(hierro, u + a, k * PLANTA + 0.35, 0.58, 0.03, 0.5, 0.03);
      }
    }
    if (c.farol) farol(f, c.w / 2 - 0.25);
    // A la espalda, que es lo que se ve desde el puerto en las aceras de enfrente, una ventana por planta.
    const espalda = fachada(c.x, c.z, c.d / 2, c.base, ({ n: 's', s: 'n', e: 'o', o: 'e' } as const)[c.frente]);
    for (let k = c.plantas > 1 ? 1 : 0; k < c.plantas; k++) ventana(espalda, 0, k * PLANTA + 0.98);
  }
  const colores = [
    '#e4a548', // ocre
    '#e98f7a', // salmón
    '#4fb3a5', // turquesa
    '#f1e9dc', // crema
    '#7fc1d9', // azul cielo
    '#f2d16b', // amarillo
    '#d9605a', // almagre
    '#c9d6a3', // pistacho
    '#f4f1ea', // blanco
    '#8fb3d9', // lavanda
    '#d98b5f', // teja
    '#b7d8c2', // menta
  ];
  const anchos = [3.2, 2.8, 3.6, 3, 3.4, 2.6, 3.8];
  let cuenta = 0;
  function ficha(frente: Frente, x: number, z: number, w: number, d: number, base: number, alturas: number[], tiendas: boolean): Vivienda {
    const i = cuenta++;
    const plantas = alturas[i % alturas.length];
    return {
      x,
      z,
      w,
      d,
      plantas,
      base,
      frente,
      color: colores[(i * 7) % colores.length],
      obra: plantas >= 2 && i % 6 === 3,
      tienda: tiendas && i % 3 !== 1,
      farol: i % 3 === 0,
    };
  }
  /** Hilera de casas con la fachada en la línea `fijo`, de `desde` a `hasta`, sobre la calle de enfrente. */
  function hilera(frente: Frente, fijo: number, desde: number, hasta: number, base: number, d: number, alturas: number[], tiendas = false) {
    const [nx, nz] = NORMAL[frente];
    for (let a = desde; ; ) {
      const w = Math.min(anchos[cuenta % anchos.length], hasta - a);
      if (w < 2.4) break;
      const u = a + w / 2;
      vivienda(ficha(frente, nx ? fijo - (nx * d) / 2 : u, nx ? u : fijo - (nz * d) / 2, w, d, base, alturas, tiendas));
      a += w + 0.03;
    }
  }
  // Juan Rejón, acera norte: la calle de abajo, de dos a cuatro plantas.
  for (const [a, b] of [
    [-38, -31.6],
    [-28.9, -14],
    [-10, -2.6],
    [0.1, 16.9],
    [19.6, 29.5],
  ])
    hilera('s', -10.6, a, b, 0, 3.5, [2, 3, 3, 2, 3, 2], true);
  // La Naval: casas de una planta en la acera de abajo, que dejan ver al viajero, y más altas enfrente.
  for (const [a, b] of [
    [-28.9, -2.6],
    [0.1, 16.9],
    [19.6, 22],
  ])
    hilera('n', -17.1, a, b, 2.2, 2.9, [1]);
  for (const [a, b] of [
    [-28.9, -2.6],
    [0.1, 22],
  ])
    hilera('s', -21.1, a, b, 2.2, 3.3, [2, 3, 2, 3, 4, 2], true);
  // Calle alta: bajas por debajo y, por encima, la última fila antes del monte.
  for (const [a, b] of [
    [-35.9, -31.6],
    [-28.9, -2.6],
    [0.1, 14],
  ])
    hilera('n', -27.6, a, b, 5.4, 2.9, [1]);
  // Frente a la escalera del medio la fila se abre en un callejón de peldaños que sigue monte arriba.
  hilera('s', -31.6, -35.9, -2.6, 5.4, 3.5, [2, 3, 2, 2, 3]);
  hilera('s', -31.6, 0.1, 14, 5.4, 3.5, [2, 3, 2, 2, 3]);
  for (let z = -31.75; z > -35.5; z -= 0.5) pieza(caja, '#a59d92', -1.25, 5.4 + (-31.5 - z) * 0.4 - 0.25, z, 2.4, 0.5, 0.52);
  // Acera sur de Juan Rejón, al oeste de la iglesia y al este del castillo, y frente a la avenida.
  hilera('n', -7.9, -38, -27.1, 0, 3.4, [1, 2, 2]);
  hilera('n', -7.9, 13.1, 30, 0, 3.4, [2, 1, 2]);
  hilera('e', -27.1, -4.2, 6.9, 0, 3.4, [2, 3, 2]);
  hilera('s', 6.9, 13.1, 26, 0, 3.6, [3, 2, 4, 3], true);
  // Edificios altos hacia La Puntilla, donde la ciudad sigue al sur.
  for (const [x, z, w, d, plantas, frente] of [
    [-40, 17.5, 6, 4.5, 6, 'e'],
    [-31, 15.6, 7.5, 4.2, 5, 's'],
    [-31, 22, 7.5, 4.5, 7, 's'],
    [-39.8, 25.5, 6, 6, 6, 'e'],
  ] as [number, number, number, number, number, Frente][])
    vivienda({ x, z, w, d, plantas, base: 0, frente, color: colores[(x * 3 + z) & 7], obra: false, tienda: true, farol: false });
  // Casas sueltas por los huecos que quedan, ladera arriba y hacia la costa.
  for (let i = 0, puestas = 0; i < 900 && puestas < 70; i++) {
    const x = -44 + azar() * 72,
      z = -44 + azar() * 56;
    if (x < costaOeste(z) + 2.5) continue;
    const frente: Frente = azar() > 0.3 ? 's' : azar() > 0.5 ? 'e' : 'o',
      w = 2.8 + azar() * 0.9,
      d = 3 + azar() * 0.6;
    const [nx] = NORMAL[frente],
      sx = nx ? d : w,
      sz = nx ? w : d;
    if (!libre([x - sx / 2 - 0.1, z - sz / 2 - 0.1, x + sx / 2 + 0.1, z + sz / 2 + 0.1])) continue;
    const base = Math.min(altura(x - sx / 2, z - sz / 2), altura(x + sx / 2, z + sz / 2), altura(x, z));
    vivienda(ficha(frente, x, z, w, d, base, z < -34 ? [1, 2, 1] : [2, 3, 2, 1], false));
    puestas++;
  }

  // --- Castillo de La Luz: mampostería, almenas de cantería, garita y torreones redondos ---
  const mamposteria = tenido(adoquin, '#e0d2b4');
  const sillar = '#d2c09a',
    oscuro = '#4a4642';
  const cx = 0,
    cz = -1,
    lado = 9,
    alto = 4.3;
  // Foso seco alrededor, con su pretil de piedra abierto ante el puente de la puerta.
  pieza(caja, '#5d564d', cx, -0.06, cz, lado + 2.2, 0.1, lado + 2.2);
  for (const s of [-1, 1]) {
    pieza(caja, '#8a8070', cx + s * (lado / 2 + 1.1), 0.2, cz, 0.25, 0.45, lado + 2.45);
    pieza(caja, '#8a8070', cx, 0.2, cz - (lado / 2 + 1.1), lado + 2.2, 0.45, 0.25);
    pieza(caja, '#8a8070', cx + s * (lado / 4 + 1.2), 0.2, cz + lado / 2 + 1.1, lado / 2 + 0.6, 0.45, 0.25);
  }
  superficie(caja, mamposteria, cx, alto / 2 - 0.6, cz, lado, alto + 1.2, lado, 1.4);
  pieza(caja, '#8a7d68', cx, alto + 0.02, cz, lado - 1.2, 0.1, lado - 1.2); // terraza
  pieza(caja, '#3c3631', cx, alto + 0.05, cz, 2.6, 0.1, 2.6); // el patio, abajo
  // Almenas de cantería clara sobre el parapeto.
  for (const s of [-1, 1])
    for (let a = -lado / 2 + 0.6; a < lado / 2 - 0.3; a += 1.55) {
      pieza(caja, sillar, cx + a, alto + 0.25, cz + (s * (lado - 0.4)) / 2, 1.05, 0.5, 0.42);
      pieza(caja, sillar, cx + (s * (lado - 0.4)) / 2, alto + 0.25, cz + a, 0.42, 0.5, 1.05);
    }
  // Torreones redondos en las esquinas noreste y suroeste, a la altura del muro.
  for (const [ex, ez] of [
    [1, -1],
    [-1, 1],
  ]) {
    const x = cx + (ex * lado) / 2,
      z = cz + (ez * lado) / 2;
    superficie(cilindro, mamposteria, x, alto / 2 - 0.4, z, 1.5, alto + 0.8, 1.5, 1.4);
    pieza(cilindro, sillar, x, alto + 0.42, z, 1.56, 0.12, 1.56);
  }
  // Garita volada en la esquina noroeste, con su remate cónico, y sillares de basalto bajo ella.
  {
    const x = cx - lado / 2 + 0.2,
      z = cz - lado / 2 + 0.2;
    pieza(cilindro, '#c9b892', x, alto - 0.9, z, 0.85, 0.25, 0.85);
    pieza(cilindro, '#bfae8a', x, alto + 0.1, z, 0.8, 1.8, 0.8);
    pieza(cilindro, sillar, x, alto + 1.03, z, 0.86, 0.1, 0.86);
    pieza(piramide, '#a99878', x, alto + 1.5, z, 0.95, 0.9, 0.95, 0, Math.PI / 8);
    pieza(caja, '#2a2522', x + 0.5, alto + 0.35, z + 0.5, 0.25, 0.22, 0.25, 0, Math.PI / 4);
    // Esquina de sillares de basalto, a soga y tizón.
    const ex = cx - lado / 2,
      ez = cz - lado / 2;
    for (let k = 0; k < 7; k++) {
      const largo = k % 2 ? 0.6 : 1;
      pieza(caja, oscuro, ex + largo / 2, 0.3 + k * 0.5, ez - 0.03, largo, 0.46, 0.06);
      pieza(caja, oscuro, ex - 0.03, 0.3 + k * 0.5, ez + (1.6 - largo) / 2, 0.06, 0.46, 1.6 - largo);
    }
  }
  // Puerta de arco de medio punto al sur, sobre el foso.
  {
    const z = cz + lado / 2;
    pieza(caja, sillar, cx, 1.05, z + 0.04, 1.5, 2.1, 0.1);
    pieza(cilindro, sillar, cx, 2.05, z + 0.03, 0.75, 0.1, 0.75, Math.PI / 2);
    pieza(caja, '#2b231d', cx, 0.9, z + 0.1, 1, 1.8, 0.06);
    pieza(cilindro, '#2b231d', cx, 1.8, z + 0.09, 0.5, 0.06, 0.5, Math.PI / 2);
    pieza(caja, '#6b5a48', cx, -0.06, z + 0.62, 1.5, 0.12, 1.25); // puente
    for (const s of [-1, 1]) pieza(caja, hierro, cx + s * 0.74, 0.4, z + 0.62, 0.05, 0.05, 1.25);
    // Saeteras y un escudo de piedra sobre la puerta.
    pieza(caja, sillar, cx, 2.9, z + 0.04, 0.6, 0.75, 0.08);
    for (const a of [-3, 3]) pieza(caja, '#2a2522', cx + a, 2.6, z + 0.03, 0.12, 0.5, 0.04);
  }
  // Cajas de acero corten sobre la terraza: la reforma de 2015 para el museo.
  pieza(caja, '#7b4a30', cx + 0.8, alto + 0.75, cz - 2.6, 4.2, 1.4, 1.1);
  pieza(caja, '#6e4129', cx - 3, alto + 0.55, cz + 1.2, 1, 1.1, 2.4);
  // El edificio de la fundación, también de corten, al este del jardín.
  pieza(caja, '#74452c', 11, 1.1, -2, 3, 2.2, 7);
  pieza(caja, '#5f3923', 11, 2.25, -2, 3.1, 0.1, 7.1);
  ventanas.push([9.47, 1.1, -2, 0.04, 1.2, 4.5]);
  // Laureles de Indias y un drago en el jardín.
  for (const [x, z, r] of [
    [-7.4, -6.5, 1.6],
    [8.1, -6.8, 1.3],
    [-6.2, 4.6, 1.1],
  ]) {
    pieza(poste, '#6e5a48', x, 1.2, z, 0.32, 2.4, 0.32);
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9;
      pieza(esfera, k % 2 ? '#3b5d36' : '#4a6d3c', x + Math.cos(a) * r * 0.55, 2.7 + (k % 3) * 0.3, z + Math.sin(a) * r * 0.55, r, r * 0.7, r);
    }
  }
  pieza(poste, '#8a7a62', 7.7, 0.8, 4.4, 0.4, 1.6, 0.4);
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05;
    pieza(poste, '#8a7a62', 7.7 + Math.cos(a) * 0.35, 1.9, 4.4 + Math.sin(a) * 0.35, 0.18, 0.9, 0.18, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    pieza(esfera, '#4d6b45', 7.7 + Math.cos(a) * 0.65, 2.45, 4.4 + Math.sin(a) * 0.65, 0.42, 0.3, 0.42);
  }

  // --- Iglesia de La Luz: tres naves con sus rosetones al sur y tejado de cúpulas ---
  {
    const ix = -18,
      iz = -4.25,
      ancho = 12,
      fondo = 6.5,
      muroAlto = 4.6,
      frente = iz + fondo / 2,
      crema = '#e9dcc0',
      piedra = '#8e877c';
    muro(ix, -1, muroAlto, iz, ancho, fondo, crema);
    pieza(caja, piedra, ix, 0.25, iz, ancho + 0.06, 0.5, fondo + 0.06);
    pieza(caja, '#b4553c', ix, muroAlto + 0.12, iz, ancho - 0.2, 0.24, fondo - 0.2);
    // Seis bóvedas de media naranja sobre el tejado y la linterna.
    for (const dx of [-4, 0, 4])
      for (const dz of [-1.5, 1.5]) pieza(cupula, '#b8583e', ix + dx, muroAlto + 0.2, iz + dz, 1.35, 0.8, 1.35);
    pieza(cilindro, crema, ix + 4, muroAlto + 1.25, iz - 1.5, 0.35, 0.5, 0.35);
    pieza(cupula, '#e9e3d6', ix + 4, muroAlto + 1.5, iz - 1.5, 0.38, 0.35, 0.38);
    // Una portada por nave, cada una con su hastial y su rosetón.
    const vidrio = ['#2f4a7a', '#7a2f3a', '#2f6a4a'];
    for (const [k, dx] of [-4, 0, 4].entries()) {
      const x = ix + dx,
        mayor = dx === 0;
      pieza(piramide, crema, x, muroAlto + 0.7, frente - 0.1, mayor ? 2.1 : 1.8, 1.4, 0.25);
      pieza(caja, piedra, x, muroAlto + 0.05, frente + 0.05, mayor ? 4 : 3.6, 0.16, 0.12);
      pieza(cilindro, piedra, x, 3.3, frente + 0.05, mayor ? 0.85 : 0.7, 0.08, mayor ? 0.85 : 0.7, Math.PI / 2);
      pieza(cilindro, vidrio[k], x, 3.3, frente + 0.1, mayor ? 0.68 : 0.55, 0.04, mayor ? 0.68 : 0.55, Math.PI / 2);
      ventanas.push([x, 3.3, frente + 0.12, 0.3, 0.3, 0.02]);
      for (let a = 0; a < 4; a++)
        pieza(caja, piedra, x, 3.3, frente + 0.13, 0.05, mayor ? 1.3 : 1.05, 0.02, 0, 0, (a * Math.PI) / 4);
      // Puerta de madera bajo arco de cantería.
      const ancho = mayor ? 1.3 : 0.95;
      pieza(caja, piedra, x, 1.1, frente + 0.04, ancho + 0.3, 2.2, 0.08);
      pieza(cilindro, piedra, x, 2.2, frente + 0.03, (ancho + 0.3) / 2, 0.08, (ancho + 0.3) / 2, Math.PI / 2);
      pieza(caja, '#5a3523', x, 1, frente + 0.1, ancho, 2, 0.05);
      pieza(cilindro, '#5a3523', x, 2, frente + 0.09, ancho / 2, 0.05, ancho / 2, Math.PI / 2);
    }
    // Pilastras de piedra entre las naves.
    for (const dx of [-6, -2, 2, 6]) pieza(caja, piedra, ix + dx, muroAlto / 2, frente + 0.06, 0.35, muroAlto, 0.12);
  }

  // --- La Chistera: el letrero y la chistera colgada sobre la puerta ---
  {
    const c = casas[0],
      x = c.x,
      z = c.z + c.fondo / 2;
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 128;
    const ctx = lienzo.getContext('2d')!;
    ctx.fillStyle = '#2a0f35';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#f0c75a';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = '#ffd86b';
    ctx.font = '700 62px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.nombre.toUpperCase(), 256, 68, 470);
    const mapa = new T.CanvasTexture(lienzo);
    mapa.colorSpace = T.SRGBColorSpace;
    const neon = new T.MeshStandardMaterial({ map: mapa, emissive: '#ffffff', emissiveMap: mapa, emissiveIntensity: 0.45, roughness: 0.7 });
    const placa = superficie(caja, neon, x, 1.92, z + 0.09, 1, 1, 1, 1);
    placa.geometry.dispose();
    placa.geometry = new T.PlaneGeometry(2.6, 0.62);
    // Una chistera gigante sobre el pretil de la azotea.
    const y = c.alto + 0.36,
      hx = x - 0.9,
      hz = z - 0.45;
    pieza(cilindro, '#1d1a1f', hx, y, hz, 0.7, 0.06, 0.7);
    pieza(cilindro, '#1d1a1f', hx, y + 0.45, hz, 0.42, 0.85, 0.42);
    pieza(cilindro, '#b2263a', hx, y + 0.15, hz, 0.43, 0.16, 0.43);
  }

  // --- El puerto: el barco de carga, la terminal con sus grúas y los tanques ---
  // Muelle del este, con su tinglado, y el carguero atracado.
  pieza(caja, '#8d857a', 16.5, -0.75, 23.5, 5, 1.4, 21);
  superficie(caja, hormigon, 16.5, -0.03, 23.5, 5, 0.08, 21, 4);
  pieza(caja, '#d9d6cf', 17.2, 1.1, 24, 3, 2.2, 14);
  pieza(caja, '#7d8a91', 17.2, 2.3, 24, 3.2, 0.25, 14.2);
  for (let z = 17.6; z < 31; z += 2.1) pieza(caja, '#9aa3a8', 15.68, 0.8, z, 0.04, 1.5, 1.6);
  carguero(t, 11.4, 23.5);
  // Terminal de contenedores, al otro lado del canal.
  pieza(caja, '#8d857a', 47, -0.75, 31, 34, 1.4, 36);
  superficie(caja, hormigon, 47, -0.03, 31, 34, 0.08, 36, 5);
  const tonos = ['#b5402f', '#2f6fa8', '#3f8a4f', '#d98a2b', '#e9e6de', '#8a8f93', '#7a2b22', '#2d4f7a'];
  for (let x = 38; x < 62; x += 2.9)
    for (let z = 15; z < 46; z += 1.25) {
      if (azar() < 0.15) continue;
      const pisos = 1 + Math.floor(azar() * 3.4);
      for (let k = 0; k < pisos; k++)
        pieza(caja, tonos[Math.floor(azar() * tonos.length)], x, 0.5 + k * 1.02, z, 2.6, 1, 1.05);
    }
  for (const z of [17, 24, 31, 38]) grua(t, 32.5, z);
  // Tanques de combustible en el llano del este, junto a las últimas casas.
  for (const [x, z, r, h] of [
    [30, -9, 2.2, 2.6],
    [35, -9, 2.2, 2.6],
    [40.5, -10, 2.8, 3],
    [46, -9, 2, 2.4],
    [30.5, -14.5, 2.4, 2.8],
    [36, -15, 2.6, 3],
    [42, -16, 2.6, 3],
    [31, -21, 2.2, 2.6],
    [37, -22, 2.8, 3.2],
    [43.5, -22.5, 2.2, 2.6],
    [33, -27, 2.4, 2.8],
    [39, -28, 2.2, 2.6],
  ]) {
    const y = altura(x, z) - 0.1;
    pieza(cilindro, '#c9c4ba', x, y + 0.15, z, r + 0.5, 0.3, r + 0.5);
    pieza(cilindro, '#f1efe9', x, y + h / 2, z, r, h, r);
    pieza(cilindro, '#d0cdc6', x, y + h * 0.82, z, r + 0.02, 0.12, r + 0.02);
    pieza(cupula, '#e6e3dc', x, y + h, z, r, r * 0.35, r);
    pieza(caja, '#8a8f93', x + r * 0.7, y + h / 2, z + r * 0.7, 0.12, h, 0.12, 0, Math.PI / 4);
  }
  // Naves del puerto entre el barrio y los tanques.
  for (const [x, z, w, d, c] of [
    [25.8, -16, 4.4, 7, '#dad6ce'],
    [25.8, -25, 4.4, 8, '#c7cfd3'],
    [48, 2, 10, 6, '#dad6ce'],
    [37, 3, 9, 5, '#c7cfd3'],
  ] as [number, number, number, number, string][]) {
    const y = altura(x, z);
    pieza(caja, c, x, y + 0.5, z, w, 4, d);
    pieza(caja, '#8b949a', x, y + 2.6, z, w + 0.2, 0.25, d + 0.2);
  }

  // --- Los cuarteles al pie de la montaña, que es zona militar ---
  for (const [x, z, w, d] of [
    [-26, -41, 7, 3],
    [-17, -42.5, 9, 3.2],
    [-8, -41, 6, 3],
    [-21, -47, 8, 3],
    [-10, -47.5, 7, 3.4],
  ]) {
    const y = altura(x, z);
    pieza(caja, '#ddd2bb', x, y + 0.2, z, w, 3.4, d);
    pieza(caja, '#b9ad96', x, y + 1.95, z, w + 0.15, 0.12, d + 0.15);
    for (let a = -w / 2 + 0.8; a < w / 2 - 0.4; a += 1.2) pieza(caja, '#4a5560', x + a, y + 1.1, z + d / 2 + 0.02, 0.5, 0.6, 0.04);
  }
  // El muro del recinto y la pista que sube en zigzag.
  for (let x = -30; x < 8; x += 1.6) pieza(caja, '#cfc4ad', x, altura(x, -38.5) + 0.5, -38.5, 1.6, 1, 0.2);
  for (let k = 0; k < 40; k++) {
    const tramo = Math.floor(k / 10),
      s = (k % 10) / 10;
    const x = tramo % 2 ? 14 - s * 18 : -4 + s * 18,
      z = -50 - tramo * 3 - s * 2.5;
    pieza(caja, '#9a8b74', x, altura(x, z) + 0.05, z, 2, 0.12, 1.2, 0, tramo % 2 ? 0.14 : -0.14);
  }

  // --- La costa de poniente: rompiente, lava y la playa de El Confital ---
  for (let i = 0; i < 160; i++) {
    const z = 28 - azar() * 86,
      x = costaOeste(z) - 0.4 - azar() * 2.2;
    const confital = z < -32 && z > -52;
    pieza(esfera, '#f1f4f1', x, -0.8, z, 0.6 + azar() * 1.1, 0.06, 0.5 + azar() * 0.6, 0, azar() * 3);
    if (!confital && i % 2) pieza(esfera, i % 4 ? '#3a322e' : '#4a403a', x + 1.2, -0.6, z + azar(), 0.5 + azar() * 0.6, 0.45, 0.6, 0, azar() * 3);
  }
  // Las olas entran en El Confital en crestas paralelas a la orilla, rotas a trechos.
  for (let k = 0; k < 3; k++)
    for (let a = 0; a < 22; ) {
      const largo = 2 + azar() * 4,
        z = -34 - (a + largo / 2) * 0.66,
        x = costaOeste(z) - 2.5 - k * 3.4 - azar() * 0.6;
      pieza(caja, k ? '#e4eeec' : '#f4f7f5', x, -0.79, z, largo, 0.05, 0.3 + (2 - k) * 0.15, 0, -0.72);
      a += largo + 0.6 + azar() * 2.5;
    }
  // Tierra de La Puntilla, al suroeste, donde la ciudad sigue hacia Las Canteras.
  pieza(caja, '#8d857a', -34, -0.75, 21.5, 20, 1.4, 17);
  superficie(caja, losas, -34, -0.03, 21.5, 20, 0.08, 17, 2.6);

  // Los muros pintados se juntan en una malla: el enfoscado, teñido del color de cada casa.
  const pintura = cal.clone();
  pintura.vertexColors = true;
  pintura.color.setRGB(1.25, 1.25, 1.25);
  const merged = mergeGeometries(pintadas);
  superficie(merged, pintura, 0, 0, 0, 1, 1, 1, 2.6);
  for (const g of [...pintadas, merged]) g.dispose();
  cilindro.dispose();
  cupula.dispose();

  return {
    // Pesqueros a los dos lados del muelle, un velero y una barca junto al carguero.
    amarres: [
      [0, 0.3, 16, -Math.PI / 2],
      [0, 0.3, 19.6, -Math.PI / 2],
      [2, 0.6, 22.6, -Math.PI / 2],
      [0, 0.3, 26, -Math.PI / 2],
      [0, 5.7, 15.8, Math.PI / 2],
      [2, 5.4, 18.8, Math.PI / 2],
      [0, 5.7, 22.4, Math.PI / 2],
      [0, 5.7, 27, Math.PI / 2],
      [0, 7.2, 31.5, 0.4],
      [2, -6, 16, 1.2],
      [1, -12, 19, 0.9],
    ],
    enSeco: [],
  };
}

/** Grúa pórtico de contenedores: cuatro patas, la viga y la pluma tendida sobre el agua (−x). */
function grua(t: Taller, x: number, z: number) {
  const { pieza } = t;
  const { caja } = t.formas;
  const azul = '#3f7fb8',
    blanco = '#e9e6de';
  for (const dx of [-1.6, 1.6])
    for (const dz of [-1.4, 1.4]) pieza(caja, azul, x + dx, 4.4, z + dz, 0.35, 8.8, 0.35);
  for (const dz of [-1.4, 1.4]) pieza(caja, azul, x, 3.2, z + dz, 3.6, 0.3, 0.3);
  // La pluma, tendida sobre el canal, y el brazo de detrás.
  pieza(caja, blanco, x - 3.4, 9, z, 17, 0.55, 1.3);
  pieza(caja, azul, x - 0.3, 9.7, z, 3.2, 1.2, 2);
  pieza(caja, blanco, x + 1, 9.75, z, 1.6, 1, 2.2);
  pieza(caja, '#30353a', x - 4, 8.4, z, 1.2, 0.6, 1.1);
  // Torre en A y los tirantes que sujetan la pluma.
  for (const dz of [-0.6, 0.6]) pieza(caja, azul, x + 0.4, 11.5, z + dz, 0.25, 4.6, 0.25, 0, 0, 0.12);
  for (const [dx, largo, giro] of [
    [-5.8, 13, 0.37],
    [3.4, 6.8, -0.62],
  ])
    pieza(caja, '#c9c6bf', x + dx, 11, z, largo, 0.08, 0.08, 0, 0, giro);
}

/**
 * Barco de carga atracado a lo largo de z, con la proa hacia el muelle (−z): casco granate, bodegas,
 * grúas de cubierta y, a popa, el puente.
 */
function carguero(t: Taller, x: number, z: number) {
  const { pieza } = t;
  const { caja, poste } = t.formas;
  const casco = '#7d2622',
    blanco = '#f1efe9';
  pieza(caja, casco, x, -0.15, z + 1, 3.4, 1.9, 13);
  pieza(caja, '#262628', x, -0.75, z + 1, 3.44, 0.35, 13.04);
  const proa = cuna();
  pieza(proa, casco, x, -0.15, z - 5.5, 1.7, 0.95, 2.4, 0, Math.PI);
  proa.dispose();
  pieza(caja, '#4a4b4d', x, 0.85, z + 0.5, 3.2, 0.1, 13);
  // Tapas de las bodegas.
  for (const dz of [1.5, -1.5, -4.5]) pieza(caja, '#2f6a5a', x, 1.1, z + dz, 2.4, 0.4, 2.2);
  // Grúas de cubierta entre las bodegas.
  for (const dz of [0, -3]) {
    pieza(poste, '#e3b53c', x, 2.2, z + dz, 0.2, 2.6, 0.2);
    pieza(caja, '#e3b53c', x - 0.6, 3, z + dz - 0.3, 0.12, 0.12, 2.4, -0.5, -0.35);
  }
  // Superestructura blanca a popa, con el puente, sus cristales y la chimenea.
  pieza(caja, blanco, x, 2.2, z + 5.6, 3.2, 2.6, 2.6);
  pieza(caja, blanco, x, 3.8, z + 5.6, 3.8, 0.6, 2);
  pieza(caja, '#22303d', x, 3.85, z + 4.6, 3.4, 0.3, 0.04);
  pieza(caja, casco, x, 4.6, z + 6.2, 1.1, 1.3, 1);
  pieza(caja, '#262628', x, 5.3, z + 6.2, 1.12, 0.2, 1.02);
  for (let k = 0; k < 3; k++) pieza(caja, '#22303d', x + 1.61, 1.6 + k * 0.55, z + 5.6, 0.04, 0.25, 2.2);
}

/** Cuña de proa: prisma de base triangular que se afila hacia +z, de 2 × 2 × 1. */
function cuna() {
  const [a, b, c] = [
    [-1, 0],
    [1, 0],
    [0, 1],
  ];
  const v = (p: number[], y: number) => [p[0], y, p[1]];
  const caras = [
    [v(a, 1), v(b, 1), v(c, 1)],
    [v(a, -1), v(c, -1), v(b, -1)],
    [v(a, -1), v(a, 1), v(c, 1)],
    [v(a, -1), v(c, 1), v(c, -1)],
    [v(b, -1), v(c, -1), v(c, 1)],
    [v(b, -1), v(c, 1), v(b, 1)],
  ];
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(caras.flat(2), 3));
  geo.computeVertexNormals();
  return geo;
}
