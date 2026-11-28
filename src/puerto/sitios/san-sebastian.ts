import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Sitio, Taller } from '../maqueta';

type Rect = [number, number, number, number];
interface Opciones {
  color?: string;
  postigo?: string;
  piedra?: string;
  /** Altura del suelo ante la casa: las de las laderas se asientan sobre el terreno. */
  base?: number;
  balcon?: boolean;
  azotea?: boolean;
}

/** Orilla del suroeste, del barranco de la Villa a la punta que cierra la bahía (línea del agua). */
const ORILLA: [number, number][] = [
  [-23, 9.5],
  [-28, 16.5],
  [-33, 25.5],
  [-37.5, 36.5],
  [-40, 49],
  [-41.5, 66],
];
/** Distancia con signo a la orilla del suroeste: positiva tierra adentro, hacia el oeste. */
function aOrilla(x: number, z: number): number {
  let mejor = Infinity,
    signo = 1;
  for (let i = 1; i < ORILLA.length; i++) {
    const [ax, az] = ORILLA[i - 1],
      [bx, bz] = ORILLA[i];
    const dx = bx - ax,
      dz = bz - az;
    const k = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(x - ax - dx * k, z - az - dz * k);
    if (d < mejor) {
      mejor = d;
      signo = dx * (z - az) - dz * (x - ax) > 0 ? 1 : -1;
    }
  }
  return mejor * signo;
}
const suave = (v: number) => {
  const k = Math.min(1, Math.max(0, v));
  return k * k * (3 - 2 * k);
};
const roca = (x: number, z: number) => 0.7 * Math.sin(x * 0.8 + z * 0.35) + 0.5 * Math.sin(x * 0.27 - z * 0.9);
/** Altura del plano del Parador, en lo alto del lomo de la Horca. */
const LOMO = 7.6;

/**
 * Relieve: el risco del suroeste tras la playa y su avenida, el lomo de la Horca al este con el
 * Parador arriba, y las lomas del norte detrás de la villa. Donde no hay tierra queda el fondo
 * del mar; el casco, los muelles y la explanada se montan aparte, en losas a ras del paseo.
 */
function altura(x: number, z: number): number {
  let y = -3;
  if (x < -23) {
    const d = aOrilla(x, z);
    if (d < 0) y = -0.82 + d * 0.8;
    else if (d < 3.2) y = -0.82 + d * 0.25; // arena negra
    else {
      // Tras la avenida sube el risco; al norte, el cauce del barranco de la Villa lo separa del casco.
      // El risco de la costa es más abrupto que la ladera del barrio, al otro lado del barranco.
      const t = z < 4 ? Math.min(d - 6.4, -27.6 - x) : d - 6.4;
      const pendiente = 0.95 + 0.5 * suave(z / 8);
      y = t > 0 ? Math.min(15, t * pendiente) + roca(x, z) * suave(t / 3) : z < 4 && x > -27.6 ? -0.55 : 0;
    }
  }
  if (x > 10.6 && z < 3.9) {
    // Lomo de la Horca: cae a pico sobre el paseo y la explanada y, al este, sobre el mar.
    const t = Math.min(3.9 - z, x - 10.6);
    const h =
      LOMO * suave(t / 4.2) +
      Math.max(0, -z - 16) * 0.6 +
      roca(x, z) * 0.8 * Math.max(suave((-z - 16) / 4), suave((x - 42) / 4)) * suave(t / 5);
    y = Math.max(y, -3 + (h + 3) * suave((57 - x) / 7));
  }
  if (z < -30.5) y = Math.max(y, Math.min(16, (-30.5 - z) * 0.85) + roca(x, z) * suave((-30.5 - z) / 4));
  // Lejos, el relieve baja antes de llegar al horizonte pintado.
  return y > -3 ? -3 + (y + 3) * suave((77 - Math.hypot(x, z)) / 12) : y;
}

/**
 * San Sebastián de La Gomera, la capital y su puerto, trazada sobre la ortofoto PNOA y las
 * posiciones de OpenStreetMap con el norte hacia −z, y comprimida a escala de maqueta (una unidad,
 * unos 8 m en el trazado; las casas, a unos 2,5 m por unidad). La plaza de las Américas abre la
 * villa al mar; al norte, la plaza de la Constitución con sus laureles y la Casa de la Aduana, y la
 * calle Real que sube hasta la iglesia de la Asunción y la Casa de Colón. Al oeste, el parque de la
 * Torre del Conde y el barranco de la Villa; al sur, la playa de arena negra; al sureste, la marina,
 * la explanada del puerto y el dique donde atraca el ferry de Los Cristianos. El Parador corona el
 * lomo de la Horca, al este. Las zonas pisables están en `PUEBLOS['san-sebastian'].plano.suelos`:
 * si se mueve una calle, hay que moverla también allí.
 */
export function trazarSanSebastian(t: Taller): Sitio {
  const { pieza, superficie, farol, azar, ventanas, blanco, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, teja } = t.materiales;
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
  encalado.color.setRGB(1.42, 1.44, 1.5); // por encima de 1: la cal tira a blanco
  const arco = new T.CylinderGeometry(0.5, 0.5, 1, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  const prisma = new T.CylinderGeometry(1, 1, 1, 6);
  const canteria = '#7f776d',
    toba = '#9a4a36',
    tea = '#5b3a24',
    hierro = '#2c2f2e',
    oscuro = '#2b2724';
  const paleta = ['#f3eee3', '#efe0bf', '#e8cd88', '#e2b45c', '#d98b5f', '#f1e7d2', '#c9d6c0', '#e3c4a8', '#ece4d4', '#b9cdd6'];
  const postigos = ['#3e6b4d', '#6b4632', '#2f5d48', '#5a3a28', '#3f5f7a'];
  const elige = <C>(lista: C[]) => lista[Math.floor(azar() * lista.length)];

  // Muros y tejados se juntan en una malla por color: pocas llamadas para muchas casas.
  const muros = new Map<string, T.BufferGeometry[]>(),
    tejados: T.BufferGeometry[] = [];
  const muro = (color: string, x: number, y: number, z: number, w: number, h: number, d: number) => {
    if (!muros.has(color)) muros.set(color, []);
    muros.get(color)!.push(new T.BoxGeometry(w, h, d).translate(x, y, z));
  };
  /** Tejado de teja a cuatro aguas, con la cumbrera a lo largo del lado mayor. */
  function tejado(x: number, y: number, z: number, w: number, d: number, alto: number) {
    const largo = w >= d,
      L = Math.max(w, d) / 2,
      S = Math.min(w, d) / 2,
      r = L - S;
    const p = (l: number, h: number, s: number) => (largo ? [x + l, y + h, z + s] : [x + s, y + h, z + l]);
    const puntos = [
      ...[p(-L, 0, S), p(L, 0, S), p(r, alto, 0), p(-L, 0, S), p(r, alto, 0), p(-r, alto, 0)],
      ...[p(L, 0, -S), p(-L, 0, -S), p(-r, alto, 0), p(L, 0, -S), p(-r, alto, 0), p(r, alto, 0)],
      ...[p(L, 0, S), p(L, 0, -S), p(r, alto, 0), p(-L, 0, -S), p(-L, 0, S), p(-r, alto, 0)],
    ];
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(puntos.flat(), 3));
    g.computeVertexNormals();
    tejados.push(g);
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

  /**
   * Plano de una fachada: `u` corre a lo largo de ella, `v` sale hacia la calle e `y` sube desde
   * `base`. `giro` 0 mira al sur (+z), π al norte, π/2 al este y −π/2 al oeste.
   */
  const euler = new T.Euler(),
    local = new T.Euler(),
    cuaternion = new T.Quaternion();
  function frente(cx: number, cz: number, giro: number, base = 0) {
    const c = Math.cos(giro),
      s = Math.sin(giro),
      deLado = Math.abs(s) > 0.5;
    const en = (u: number, v: number) => [cx + u * c + v * s, cz - u * s + v * c];
    return {
      en,
      d(forma: T.BufferGeometry, color: string, u: number, y: number, v: number, w: number, h: number, f: number, rx = 0, rz = 0) {
        const [x, z] = en(u, v);
        euler.setFromQuaternion(cuaternion.setFromEuler(local.set(rx, giro, rz, 'YXZ')), 'XYZ');
        pieza(forma, color, x, base + y, z, w, h, f, euler.x, euler.y, euler.z);
      },
      /** Cristal que se enciende de noche. */
      luz(u: number, y: number, v: number, w: number, h: number, f = 0.05) {
        const [x, z] = en(u, v);
        ventanas.push(deLado ? [x, base + y, z, f, h, w] : [x, base + y, z, w, h, f]);
      },
    };
  }
  type Frente = ReturnType<typeof frente>;
  /** Ventana de guillotina con los postigos abiertos y poyo de piedra. */
  function ventana(p: Frente, u: number, y: number, w: number, h: number, postigo: string, marco = blanco) {
    p.d(caja, marco, u, y, 0.03, w + 0.16, h + 0.16, 0.07);
    p.luz(u, y, 0.07, w, h);
    p.d(caja, marco, u, y, 0.1, 0.035, h, 0.02);
    p.d(caja, marco, u, y + h * 0.08, 0.1, w, 0.035, 0.02);
    for (const s of [-1, 1]) p.d(caja, postigo, u + s * (w * 0.75 + 0.1), y, 0.06, w / 2, h, 0.035);
    p.d(caja, '#8c8378', u, y - h / 2 - 0.1, 0.1, w + 0.3, 0.07, 0.2);
  }
  /** Puerta de madera con jambas y dintel de cantería. */
  function puerta(p: Frente, u: number, h: number, color: string, piedra = canteria) {
    p.d(caja, piedra, u, h / 2, 0.04, 1.1, h + 0.1, 0.08);
    p.d(caja, color, u, h / 2 - 0.02, 0.08, 0.78, h - 0.1, 0.04);
    p.d(caja, piedra, u, h + 0.1, 0.06, 1.25, 0.14, 0.12);
  }
  /** Portada de arco: hoja de madera y arco de piedra. */
  function portada(p: Frente, u: number, ancho: number, alto: number, piedra: string, hoja = '#4a3122') {
    p.d(arco, piedra, u, alto, 0.03, ancho + 0.44, ancho + 0.44, 0.06);
    p.d(caja, hoja, u, alto / 2, 0.05, ancho, alto, 0.06);
    p.d(arco, hoja, u, alto, 0.06, ancho, ancho, 0.06);
    for (const s of [-1, 1]) p.d(caja, piedra, u + s * (ancho / 2 + 0.11), alto / 2, 0.06, 0.22, alto, 0.1);
  }
  /** Balcón canario de tea: suelo sobre canes, balaustres, pies derechos y tejadillo. */
  function balcon(p: Frente, u: number, y0: number, ancho: number) {
    const fondo = 0.6;
    p.d(caja, '#3a2a1f', u, y0 + 0.85, 0.03, ancho * 0.5, 1.6, 0.05);
    p.luz(u, y0 + 0.9, 0.06, ancho * 0.38, 1.3);
    p.d(caja, tea, u, y0, fondo / 2 + 0.05, ancho + 0.1, 0.1, fondo + 0.1);
    for (let i = 0; i <= 4; i++) p.d(caja, tea, u - ancho / 2 + (i * ancho) / 4, y0 - 0.13, 0.3, 0.08, 0.16, 0.55);
    const n = Math.max(6, Math.round(ancho / 0.16));
    for (let i = 0; i <= n; i++) p.d(poste, tea, u - ancho / 2 + (i * ancho) / n, y0 + 0.36, 0.66, 0.05, 0.56, 0.05);
    for (const s of [-1, 1]) p.d(caja, tea, u + (s * ancho) / 2, y0 + 0.68, fondo / 2 + 0.05, 0.08, 0.07, fondo);
    p.d(caja, tea, u, y0 + 0.68, 0.66, ancho + 0.1, 0.08, 0.1);
    for (const i of [-0.5, 0, 0.5]) p.d(caja, tea, u + i * ancho, y0 + 1.2, 0.66, 0.07, 1, 0.07);
    p.d(caja, tea, u, y0 + 1.72, 0.66, ancho + 0.12, 0.09, 0.09);
    p.d(caja, '#9a4c34', u, y0 + 1.84, fondo / 2 + 0.08, ancho + 0.36, 0.07, fondo + 0.32, 0.3);
  }
  /** Zócalo y esquinas de sillares alternos en los bordes de una fachada, y cornisa encalada. */
  function lienzo(p: Frente, ancho: number, alto: number, piedra: string) {
    p.d(caja, piedra, 0, 0.2, 0.03, ancho + 0.04, 0.4, 0.07);
    for (const s of [-1, 1])
      for (let k = 0, y = 0.4; y < alto - 0.3; k++, y += 0.38) {
        const w = k % 2 ? 0.22 : 0.34;
        p.d(caja, piedra, s * (ancho / 2 - w / 2 + 0.01), y + 0.18, 0.04, w, 0.36, 0.08);
      }
    p.d(caja, blanco, 0, alto - 0.08, 0.07, ancho + 0.14, 0.18, 0.16);
  }
  function azotea(x: number, z: number, w: number, d: number, y: number) {
    for (const s of [-1, 1]) {
      pieza(caja, blanco, x, y + 0.16, z + (s * d) / 2, w, 0.32, 0.12);
      pieza(caja, blanco, x + (s * w) / 2, y + 0.16, z, 0.12, 0.32, d);
    }
    pieza(caja, '#d8d2c6', x, y + 0.04, z, w - 0.1, 0.06, d - 0.1);
    if (azar() > 0.5) pieza(poste, '#ece8df', x - w * 0.22, y + 0.45, z - d * 0.2, 0.7, 0.8, 0.7);
  }
  /**
   * Casa de la villa, de una o dos plantas: muros de cal o de color, cantería en zócalo y esquinas,
   * ventanas de postigos y, en la planta alta, a menudo un balcón de tea. Tejado de teja o azotea.
   */
  function casona([x0, z0, x1, z1]: Rect, alto: number, giro: number, o: Opciones = {}) {
    const base = o.base ?? 0,
      color = o.color ?? elige(paleta),
      postigo = o.postigo ?? elige(postigos),
      piedra = o.piedra ?? canteria;
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2,
      w = x1 - x0,
      d = z1 - z0;
    // En la ladera, el muro baja hasta perderse en el terreno.
    const hondo = base > 0.05 ? 2.5 : 0;
    muro(color, cx, base + (alto - hondo) / 2, cz, w, alto + hondo, d);
    const deLado = Math.abs(Math.sin(giro)) > 0.5;
    const ancho = deLado ? d : w,
      fondo = deLado ? w : d;
    const p = frente(cx + (Math.sin(giro) * fondo) / 2, cz + (Math.cos(giro) * fondo) / 2, giro, base);
    lienzo(p, ancho, alto, piedra);
    const lado = azar() > 0.5 ? 1 : -1,
      ancha = ancho >= 3.3,
      pu = ancha ? lado * ancho * 0.24 : 0,
      hp = Math.min(2.05, alto * 0.5);
    puerta(p, pu, hp, elige(['#4a3122', '#2f4d3a', '#6b2f24', '#3b4f66']));
    if (ancha) ventana(p, -lado * ancho * 0.24, hp * 0.62, 0.56, 0.86, postigo);
    const planta = Math.min(2.2, alto * 0.53);
    if (alto > 3.2) {
      const libre = alto - planta - 0.25,
        yv = planta + libre * 0.5;
      if ((o.balcon ?? azar() > 0.45) && ancho >= 3) {
        balcon(p, 0, planta + 0.05, Math.min(2.4, ancho * 0.5));
        if (ancho >= 5) for (const s of [-1, 1]) ventana(p, s * ancho * 0.36, yv, 0.5, libre * 0.6, postigo);
      } else for (const s of ancha ? [-1, 1] : [0]) ventana(p, s * ancho * 0.24, yv, 0.56, libre * 0.62, postigo);
    }
    if (o.azotea ?? azar() > 0.7) azotea(cx, cz, w, d, base + alto);
    else tejado(cx, base + alto + 0.02, cz, w + 0.3, d + 0.3, Math.min(w, d) * 0.3);
    // Trasera: ventanas sencillas, que también se ven desde lo alto.
    const q = frente(cx - (Math.sin(giro) * fondo) / 2, cz - (Math.cos(giro) * fondo) / 2, giro + Math.PI, base);
    for (const y of alto > 3.2 ? [1.3, planta + 0.9] : [1.3])
      for (const s of ancha ? [-1, 1] : [0]) {
        q.d(caja, blanco, s * ancho * 0.24, y, 0.03, 0.62, 0.86, 0.06);
        q.luz(s * ancho * 0.24, y, 0.06, 0.46, 0.7);
      }
  }
  /** Laurel de plaza: tronco grueso y una copa ancha y redonda. */
  function laurel(x: number, z: number, r = 1.7) {
    pieza(poste, blanco, x, 0.2, z, 0.95, 0.4, 0.95);
    pieza(poste, '#6b5a4a', x, 1.3, z, 0.36, 2.2, 0.36);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        d = i ? r * 0.55 : 0;
      pieza(esfera, ['#355d34', '#41693b', '#4d7644'][i % 3], x + Math.cos(a) * d, 2.9 + (i % 3) * 0.3, z + Math.sin(a) * d, r * 0.72, r * 0.5, r * 0.72);
    }
  }
  /** Palmera canaria de jardín, para los que no están a ras del paseo. */
  function palmera(x: number, y: number, z: number, h: number) {
    pieza(poste, '#8a6a4c', x, y + h / 2, z, 0.34, h, 0.36);
    pieza(esfera, '#7a5c40', x, y + h, z, 0.45, 0.35, 0.45);
    for (let j = 0; j < 12; j++) {
      const a = j * 2.4;
      pieza(caja, j % 2 ? '#447e5b' : '#70944f', x + Math.cos(a) * 0.8, y + h - 0.05, z + Math.sin(a) * 0.8, 1.7, 0.05, 0.36, 0, -a, -0.38);
    }
  }
  function banco(x: number, z: number, giro: number) {
    pieza(caja, blanco, x, 0.22, z, 1.5, 0.44, 0.45, 0, giro);
    pieza(caja, madera, x, 0.47, z, 1.5, 0.06, 0.45, 0, giro);
  }

  // --- Relieve: risco del suroeste, lomo de la Horca y lomas del norte ---
  {
    const paso = 1.15,
      [x0, z0, x1, z1] = [-78, -78, 78, 78];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.35) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.35) * paso;
        p.push(new T.Vector3(x, altura(x, z), z));
      }
    // Tobas y basaltos pardos por estratos, con una franja de almagre, y matorral seco donde la
    // ladera se tumba; abajo, la arena negra de la playa y el cauce de callaos del barranco.
    const estratos = ['#5b4a3f', '#6a5546', '#7a5f4c', '#8e6a51', '#9b6f52', '#8b715f', '#9e8266', '#a68b6b'];
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
          if (Math.max(u.y, v.y, w.y) < -1 || Math.hypot(u.x, u.z) > 78) continue;
          const y = (u.y + v.y + w.y) / 3,
            cx = (u.x + v.x + w.x) / 3,
            cz = (u.z + v.z + w.z) / 3;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          const orilla = cx < -23 ? aOrilla(cx, cz) : 99;
          const color =
            orilla < 3.3
              ? i % 3 ? '#433c38' : '#4b433e'
              : cz < 4 && cx > -27.6 && cx < -23
                ? '#77706a'
                : y < 0.25
                  ? '#4a403a'
                  : Math.abs(normal.y) > 0.82 && y > 2
                    ? y > 9 ? '#7d7a4e' : '#8f8758'
                    : estratos[Math.min(estratos.length - 1, Math.max(0, Math.floor((y + 0.9 * Math.sin(cx * 0.3)) / 2.2) + 1))];
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
  // Tabaibas y matorral seco por las laderas; balos y palmeras sueltas en los cauces.
  for (let i = 0; i < 420; i++) {
    const x = -76 + azar() * 140,
      z = -76 + azar() * 140,
      y = altura(x, z);
    if (y < 1.2 || Math.hypot(x, z) > 74 || (x > 14 && x < 40 && z > -16 && z < 0)) continue;
    const r = 0.3 + azar() * 0.5;
    pieza(esfera, i % 3 ? '#7f7f4f' : '#96925c', x, y + r * 0.3, z, r * 1.2, r * 0.6, r);
  }

  // --- Avenida del suroeste, a lo largo de la playa, y espuma en la orilla ---
  for (let i = 1; i < ORILLA.length - 1; i++) {
    const [ax, az] = ORILLA[i - 1],
      [bx, bz] = ORILLA[i];
    const dx = bx - ax,
      dz = bz - az,
      largo = Math.hypot(dx, dz),
      nx = -dz / largo,
      nz = dx / largo,
      giro = -Math.atan2(dz, dx);
    const cx = (ax + bx) / 2,
      cz = (az + bz) / 2;
    // Aceras rojizas, calzada gris y el bordillo sobre la arena.
    pieza(caja, '#bf9282', cx + nx * 3.85, 0.02, cz + nz * 3.85, largo + 1, 0.08, 1.3, 0, giro);
    pieza(caja, '#6e6a66', cx + nx * 5.4, 0.02, cz + nz * 5.4, largo + 1, 0.08, 1.8, 0, giro);
    pieza(caja, '#d9d2c4', cx + nx * 3.2, 0.06, cz + nz * 3.2, largo + 1, 0.16, 0.18, 0, giro);
    for (let k = 0; k < largo; k += 4.5) farol(ax + (dx * k) / largo + nx * 3.5, az + (dz * k) / largo + nz * 3.5);
    for (let k = 0; k < 16; k++) {
      const s = azar();
      pieza(esfera, '#f1f4f1', ax + dx * s - nx * 0.35, -0.8, az + dz * s - nz * 0.35, 0.5 + azar() * 0.6, 0.05, 0.18, 0, giro);
    }
  }
  // Cauce del barranco de la Villa: callaos entre muros de piedra, y el puente de la avenida.
  for (const x of [-27.75, -23.35]) pieza(caja, '#837a70', x, -0.05, -13, 0.3, 1.1, 36);
  for (let i = 0; i < 90; i++)
    pieza(esfera, ['#6f6862', '#8a827a', '#5d5752'][i % 3], -27.4 + azar() * 3.9, -0.55, -30 + azar() * 33.5, 0.2 + azar() * 0.2, 0.12, 0.2);
  pieza(caja, '#8c857b', -25.5, -0.3, 5.3, 4.6, 0.6, 2.6);
  superficie(caja, tenido(adoquin, '#c99f8f'), -25.5, -0.01, 5.3, 4.6, 0.04, 2.6, 3.2);
  for (const z of [3.9, 6.7]) {
    pieza(caja, blanco, -25.4, 0.35, z, 4.4, 0.7, 0.2);
    pieza(caja, canteria, -25.4, 0.73, z, 4.5, 0.08, 0.3);
  }
  // Bolardos donde el paseo sigue como avenida hacia el suroeste.
  for (let z = 4.3; z < 6.5; z += 0.55) pieza(poste, hierro, -27.55, 0.3, z, 0.16, 0.6, 0.16);

  // --- Suelo del casco, del paseo y de la playa ---
  pieza(caja, '#8c857b', -6.25, -0.72, -14, 34.5, 1.4, 36); // casco, del barranco al pie del lomo
  pieza(caja, '#8c857b', -1, -0.72, 5.3, 44, 1.4, 2.6); // paseo
  superficie(caja, tenido(adoquin, '#c99f8f'), -1, -0.01, 5.3, 44, 0.04, 2.6, 3.2); // losetas rojizas
  pieza(caja, '#e4ddd0', -1, 0.05, 6.55, 44, 0.12, 0.14); // bordillo sobre la arena y el agua
  const arena = tenido(cal, '#5d5853');
  superficie(caja, arena, -10.95, -0.99, 10.8, 25.1, 1, 8.4, 3, 0.0982); // playa de arena negra
  // Espuma de las olas que rompen en la orilla, y la arena mojada, más oscura.
  pieza(caja, '#34302d', -10.95, -0.8, 13.15, 25.1, 0.06, 1.2, 0.0982);
  for (let i = 0; i < 52; i++) {
    const x = -22 + i * 0.46 + azar() * 0.3,
      z = 13.75 + 0.25 * Math.sin(i * 0.4) + azar() * 0.2;
    pieza(esfera, '#f1f4f1', x, -0.8, z, 0.5 + azar() * 0.5, 0.05, 0.16 + azar() * 0.1);
  }
  // Cantos sueltos sobre la arena.
  for (let i = 0; i < 60; i++) {
    const x = -21.5 + azar() * 22.5,
      z = 7 + azar() * 5.8;
    pieza(esfera, '#7a716a', x, -0.08 - (z - 6.6) * 0.0985, z, 0.1 + azar() * 0.08, 0.04, 0.08);
  }
  // Sombrillas y toallas, a la orilla de la villa.
  const cono = new T.ConeGeometry(1, 1, 10);
  for (const [i, [x, z]] of [
    [-16, 9.2],
    [-12.5, 10.4],
    [-5.5, 9.6],
    [-2, 10.8],
  ].entries()) {
    const y = -0.08 - (z - 6.6) * 0.0985;
    pieza(poste, '#f4ead2', x, y + 0.95, z, 0.07, 1.9, 0.07);
    pieza(cono, ['#e0694f', '#2f8f8f', '#e8a93d', '#f3e3b5'][i], x, y + 1.98, z, 1.08, 0.36, 1.08);
    pieza(caja, ['#2f8f8f', '#e0694f', '#f3e3b5', '#3f5f7a'][i], x + 0.6, y + 0.03, z + 0.4, 0.6, 0.03, 1.4, 0.1);
  }
  cono.dispose();
  // Losas de las plazas, empedrado de la calle Real y del atrio.
  const losas = tenido(cal, '#d4cdc1'),
    empedrado = tenido(adoquin, '#a59b90');
  superficie(caja, losas, -3.7, 0, 0.5, 17.4, 0.04, 7, 2.4); // plaza de las Américas
  superficie(caja, losas, 0.7, 0, -7, 7.4, 0.04, 8, 2.4); // plaza de la Constitución
  superficie(caja, empedrado, -8.25, 0, -15.2, 2.5, 0.04, 24.4, 1.5); // calle Real
  superficie(caja, empedrado, -6.35, 0, -16.8, 1.3, 0.04, 10.4, 1.5); // atrio
  // Juntas de basalto en la plaza de las Américas, en cuadrícula.
  for (let x = -11.2; x < 5; x += 2.4) pieza(caja, '#8d877f', x, 0.025, 0.5, 0.06, 0.01, 7);
  for (let z = -2.1; z < 4; z += 2.4) pieza(caja, '#8d877f', -3.7, 0.025, z, 17.4, 0.01, 0.06);

  // --- Parque de la Torre del Conde: césped, paseos de jabre, árboles y la torre en medio ---
  pieza(caja, '#c8b48c', -17.7, 0.005, -3.25, 10.6, 0.02, 14.5);
  for (const [x0, z0, x1, z1] of [
    [-22.4, -9.9, -18.5, -5.8],
    [-16.5, -9.9, -13, -5.8],
    [-22.4, -1, -18.5, 3.4],
    [-16.5, -1, -13, 3.4],
  ])
    pieza(caja, '#6c8d47', (x0 + x1) / 2, 0.03, (z0 + z1) / 2, x1 - x0, 0.04, z1 - z0);
  pieza(poste, '#bba37a', -17.5, 0.02, -3.4, 7.4, 0.03, 7.4);
  for (const [x, z] of [
    [-21.6, -7.6],
    [-14, -6.8],
    [-21.4, 1.6],
    [-14.2, 1.8],
  ])
    laurel(x, z, 1.4);
  // Murete con verja sobre el cauce del barranco.
  pieza(caja, blanco, -23.1, 0.25, -3.25, 0.16, 0.5, 14.5);
  pieza(caja, hierro, -23.1, 0.75, -3.25, 0.16, 0.04, 14.5);
  for (let z = -10.4; z < 4; z += 0.4) pieza(caja, hierro, -23.1, 0.62, z, 0.03, 0.3, 0.03);

  // --- Torre del Conde: muros encalados de dos metros, esquinas de cantería roja y matacanes ---
  {
    const tx = -17.5,
      tz = -3.4,
      l = 3.8,
      alto = 7.6,
      rojo = '#94442f',
      rojizo = '#a65a3f';
    pieza(caja, rojo, tx, 0.22, tz, l + 0.5, 0.44, l + 0.5);
    muro('cal', tx, alto / 2, tz, l, alto, l);
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ])
      for (let k = 0, y = 0.66; y < alto + 0.4; k++, y += 0.44) {
        const a = k % 2 ? 0.66 : 0.4,
          b = k % 2 ? 0.4 : 0.66;
        pieza(caja, k % 3 ? rojo : rojizo, tx + sx * (l / 2 - a / 2 + 0.03), y, tz + sz * (l / 2 - b / 2 + 0.03), a, 0.4, b);
      }
    // Cordón de cantería y pretil del terrado.
    pieza(caja, rojo, tx, alto + 0.05, tz, l + 0.2, 0.16, l + 0.2);
    for (const s of [-1, 1]) {
      muro('cal', tx, alto + 0.5, tz + (s * (l - 0.2)) / 2, l, 0.8, 0.2);
      muro('cal', tx + (s * (l - 0.2)) / 2, alto + 0.5, tz, 0.2, 0.8, l);
      pieza(caja, rojo, tx, alto + 0.94, tz + (s * (l - 0.2)) / 2, l + 0.06, 0.08, 0.3);
      pieza(caja, rojo, tx + (s * (l - 0.2)) / 2, alto + 0.94, tz, 0.3, 0.08, l + 0.06);
    }
    for (const giro of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const p = frente(tx + Math.sin(giro) * (l / 2), tz + Math.cos(giro) * (l / 2), giro);
      // Matacán: garita volada sobre tres canes de piedra, en lo alto de cada cara.
      p.d(caja, blanco, 0, alto + 0.45, 0.32, 1.3, 1.1, 0.6);
      p.d(caja, rojo, 0, alto + 1.02, 0.32, 1.4, 0.08, 0.7);
      for (const u of [-0.5, 0, 0.5]) p.d(caja, rojo, u, alto - 0.25, 0.2, 0.18, 0.4, 0.42);
      p.d(caja, oscuro, 0, alto + 0.5, 0.63, 0.24, 0.5, 0.02);
      // Saeteras y ventanucos enmarcados en cantería roja.
      for (const [u, y, w, h] of giro === 0 ? [[0.9, 3.6, 0.42, 0.62], [0, 5.8, 0.5, 0.75]] : [[0, 3.2, 0.36, 0.7], [0, 5.6, 0.42, 0.62]]) {
        p.d(caja, rojo, u, y, 0.02, w + 0.24, h + 0.24, 0.06);
        p.d(caja, oscuro, u, y, 0.05, w, h, 0.03);
      }
    }
    // Puerta de arco al sur, con el escudo encima.
    const sur = frente(tx, tz + l / 2, 0);
    portada(sur, -0.55, 0.95, 1.7, rojo, '#4a3122');
    sur.d(caja, rojizo, -0.55, 2.75, 0.04, 0.5, 0.6, 0.06);
  }

  // --- Plaza de las Américas y plaza de la Constitución, con sus laureles y el quiosco ---
  // Tres laureles: el cuarto dejaría el patio de la Aduana sin asomarse a la plaza.
  for (const [x, z] of [
    [-1.4, -9.2],
    [2.9, -9.2],
    [2.9, -4.6],
  ])
    laurel(x, z);
  {
    const kx = 0.75,
      kz = -6.9;
    pieza(prisma, '#e8e1d2', kx, 0.55, kz, 0.95, 1.1, 0.95, 0, Math.PI / 6);
    pieza(prisma, '#2f5d48', kx, 1.12, kz, 1.02, 0.08, 1.02, 0, Math.PI / 6);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      pieza(poste, '#2f5d48', kx + Math.cos(a) * 0.9, 1.6, kz + Math.sin(a) * 0.9, 0.07, 1, 0.07);
    }
    ventanas.push([kx, 1.5, kz, 0.9, 0.6, 0.9]);
    const cono = new T.ConeGeometry(1, 1, 6);
    pieza(cono, '#2f5d48', kx, 2.45, kz, 1.35, 0.7, 1.35, 0, Math.PI / 6);
    cono.dispose();
    pieza(esfera, '#c9a85a', kx, 2.85, kz, 0.1, 0.12, 0.1);
  }
  for (const [x, z, g] of [
    [-0.3, -10.4, 0],
    [2.2, -10.4, 0],
    [-2.4, -6.9, Math.PI / 2],
    [3.9, -6.9, Math.PI / 2],
    [-8, 3.5, 0],
    [-4, 3.5, 0],
    [0.4, 3.5, 0],
  ])
    banco(x, z, g);
  for (const [x, z] of [
    [-10.8, -2.4],
    [-4, -2.4],
    [4.4, -2.4],
    [-2.6, -3.6],
    [4, -10.4],
    [-17, 4.4],
    [-9, 4.4],
    [-1, 4.4],
    [8, 4.4],
    [14, 4.4],
    [19, 4.4],
  ])
    farol(x, z);

  // --- Casas del casco ---
  casona([-7, -7.2, -3.2, -3.2], 4.4, 0, { color: '#efe0bf', balcon: true, azotea: false }); // esquina de la plaza
  casona([-12.2, -6.8, -9.7, -3.2], 4.2, Math.PI / 2, { azotea: false });
  casona([-12.2, -10.3, -9.7, -7], 3, Math.PI / 2);
  // Calle Real, acera de poniente, de la plaza hacia el norte: casas terreras, que dejan ver desde
  // lo alto la fachada de la iglesia y la Casa de Colón, enfrente.
  [
    [-14.4, -10.7, 3],
    [-18.2, -14.6, 2.7],
    [-22, -18.4, 3.1],
    [-25.6, -22.2, 2.8],
    [-29, -25.8, 3],
  ].forEach(([z0, z1, h], i) => casona([-13, z0, -9.7, z1], h, Math.PI / 2, { azotea: i % 2 === 1 }));
  // Al norte del parque, mirándolo.
  [-23.3, -19.7, -16.3].forEach((x0, i) => casona([x0, -14.2, x0 + 3.2, -10.7], [4.2, 3.2, 4.6][i], 0, { azotea: i === 1 }));
  // Manzanas de detrás, que se ven desde lo alto.
  for (const [z0, z1] of [
    [-18, -14.6],
    [-22, -18.4],
    [-25.6, -22.4],
    [-29.2, -26],
  ])
    [-23.3, -19.7, -16.5].forEach((x0) => casona([x0, z0, x0 + 3.3, z1], 3 + azar() * 1.6, 0));
  // Al norte de la plaza de la Constitución y al este, frente a los laureles.
  casona([-3.2, -14.2, 0.6, -11.2], 4.2, 0, { balcon: true, azotea: false });
  casona([0.8, -14.2, 4.6, -11.2], 3.2, 0, { azotea: false });
  casona([4.8, -8.2, 10.4, -5], 4.4, -Math.PI / 2, { color: '#e8cd88', balcon: true, azotea: false });
  casona([4.8, -11.4, 10.4, -8.4], 3.4, -Math.PI / 2);
  casona([5, -14.2, 10.4, -11.6], 4, -Math.PI / 2);
  casona([5, -18.2, 10.4, -14.4], 3.6, -Math.PI / 2);
  casona([5, -22, 10.4, -18.4], 3.2, -Math.PI / 2);
  // Detrás de la iglesia y de la Casa de Colón.
  [-1.8, 2.3, 6.4].forEach((x0) => casona([x0, -27.4, x0 + 4, -22.4], 3 + azar() * 1.4, Math.PI));
  // Hilera que cierra el casco por el norte, a los dos lados de la calle Real.
  [-23.3, -19.9, -16.5, -13.1].forEach((x0) => casona([x0, -32.6, x0 + 3.2, -29.4], 3.4 + azar(), 0));
  [-6.8, -3.4, 0, 3.4, 6.8].forEach((x0) => casona([x0, -32.2, x0 + 3.2, -28], 3.2 + azar(), 0));
  // La calle Real sigue hacia la ermita de San Sebastián, entre las casas de arriba.
  superficie(caja, empedrado, -8.25, 0, -30.5, 2.5, 0.04, 6.4, 1.5);
  // Al pie del lomo, sobre el paseo de la marina.
  casona([11.2, 0.6, 15.2, 3.8], 4.2, 0, { color: '#f1e7d2', balcon: true, azotea: true });
  casona([15.4, 0.6, 19.6, 3.8], 3.4, 0, { color: '#e3c4a8', azotea: true });

  // --- Casa de la Aduana: una planta en L, muros amarillos y el patio claustral con el pozo ---
  {
    const amarillo = '#e2b45c';
    muro(amarillo, -6.1, 1.5, -9.4, 1.8, 3, 4); // ala de la calle Real
    muro(amarillo, -4.2, 1.5, -10.6, 2, 3, 1.6); // ala del norte
    tejado(-6.1, 3.02, -9.4, 2.1, 4.3, 0.8);
    tejado(-4.15, 3.02, -10.6, 2.3, 1.9, 0.6);
    const calle = frente(-7, -9.4, -Math.PI / 2);
    lienzo(calle, 4, 3, canteria);
    puerta(calle, 0.9, 1.9, '#4a3122');
    ventana(calle, -0.9, 1.5, 0.56, 0.86, '#3e6b4d');
    // Galería de madera sobre pies derechos, a la sombra del alero, y el muro bajo hacia la plaza.
    for (const [x, z] of [
      [-5, -7.6],
      [-5, -8.8],
      [-4.1, -9.6],
      [-3.4, -9.6],
    ]) {
      pieza(caja, canteria, x, 0.08, z, 0.22, 0.16, 0.22);
      pieza(caja, tea, x, 1.2, z, 0.12, 2.2, 0.12);
    }
    pieza(caja, tea, -5, 2.33, -8.4, 0.16, 0.12, 2);
    pieza(caja, tea, -4.2, 2.33, -9.6, 1.8, 0.12, 0.16);
    superficie(caja, teja, -4.95, 2.55, -8.4, 0.9, 0.08, 2.1, 1.85);
    pieza(caja, '#cbbfa9', -4.2, 0.02, -8.5, 2, 0.04, 2.2); // losas del patio
    for (const [x, z, w, d] of [
      [-3.3, -8.95, 0.18, 1.3],
      [-3.3, -7.55, 0.18, 0.3],
      [-4.25, -7.45, 1.9, 0.18],
    ]) {
      pieza(caja, amarillo, x, 0.55, z, w, 1.1, d);
      pieza(caja, canteria, x, 1.13, z, w + 0.06, 0.08, d + 0.06);
    }
    // Cancela abierta de hierro entre los dos tramos de muro.
    pieza(caja, hierro, -3.25, 0.55, -8.15, 0.04, 1, 0.04);
    // El pozo: brocal de piedra, horquilla de madera, roldana y cubo; la cartela en la pared.
    const pz = -8.5,
      px = -4.25;
    pieza(poste, '#9a9188', px, 0.4, pz, 0.85, 0.8, 0.85);
    pieza(poste, '#2b3a40', px, 0.79, pz, 0.62, 0.02, 0.62);
    pieza(poste, '#b0a79c', px, 0.82, pz, 0.92, 0.06, 0.92);
    for (const s of [-1, 1]) pieza(caja, tea, px + s * 0.4, 1.35, pz, 0.08, 1.1, 0.08);
    pieza(caja, tea, px, 1.9, pz, 0.92, 0.07, 0.07);
    pieza(poste, '#6b6b6b', px, 1.78, pz, 0.18, 0.05, 0.18, Math.PI / 2);
    pieza(poste, '#6b5a3a', px + 0.05, 1.2, pz, 0.2, 0.22, 0.2);
    pieza(caja, '#cfc4a5', -5.18, 1.5, -8.6, 0.04, 0.4, 0.62);
    pieza(caja, '#3a3a36', -5.15, 1.5, -8.6, 0.02, 0.3, 0.5);
  }

  // --- Iglesia de la Asunción: tres naves, portada central de toba roja y laterales de piedra blanca ---
  {
    const x0 = -5.4,
      x1 = 4.8,
      cx = (x0 + x1) / 2,
      largo = x1 - x0;
    muro('cal', cx, 2.5, -18.2, largo, 5, 2.8); // nave central
    for (const z of [-20.8, -15.6]) muro('cal', cx, 1.7, z, largo, 3.4, 2.4); // naves laterales
    pieza(caja, blanco, cx, 5.05, -18.2, largo + 0.1, 0.14, 2.95);
    for (const s of [-1, 1]) {
      superficie(caja, teja, cx, 5.27, -18.2 + s * 0.8, largo + 0.3, 0.12, 1.75, 1.85, s * 0.33);
      // Faldón de la nave lateral, de la pared de la central al muro de fuera.
      superficie(caja, teja, cx, 3.85, -18.2 + s * 2.6, largo + 0.3, 0.12, 2.75, 1.85, s * 0.3);
    }
    // Hastial encalado de la nave central sobre la fachada.
    pieza(piramide, blanco, x0, 5.375, -18.2, 0.15, 0.75, 1.55);
    const fachada = frente(x0, -18.2, -Math.PI / 2);
    fachada.d(caja, canteria, 0, 0.2, 0.03, 7.64, 0.4, 0.06);
    for (const s of [-1, 1])
      for (let k = 0, y = 0.4; y < 3.3; k++, y += 0.38) {
        const w = k % 2 ? 0.22 : 0.34;
        fachada.d(caja, canteria, s * (3.8 - w / 2), y + 0.18, 0.04, w, 0.36, 0.08);
      }
    // Portada central de toba roja, con arco apuntado y las flechas del santo en la clave.
    fachada.d(caja, toba, 0, 1.6, 0.05, 2.1, 3.2, 0.1);
    fachada.d(piramide, toba, 0, 3.65, 0.05, 1.05, 0.9, 0.1);
    fachada.d(caja, '#4a3122', 0, 1.05, 0.11, 1.05, 2.1, 0.04);
    fachada.d(arco, '#4a3122', 0, 2.1, 0.11, 1.05, 1.05, 0.04);
    for (const s of [-1, 1]) fachada.d(poste, '#b3624b', s * 0.72, 1.2, 0.14, 0.14, 2.4, 0.14);
    fachada.d(caja, '#c9a85a', 0, 2.85, 0.13, 0.06, 0.32, 0.03, 0, 0.5);
    fachada.d(caja, '#c9a85a', 0, 2.85, 0.13, 0.06, 0.32, 0.03, 0, -0.5);
    fachada.d(poste, toba, 0, 4.45, 0.05, 0.6, 0.06, 0.6, Math.PI / 2);
    fachada.d(poste, '#3a3330', 0, 4.45, 0.08, 0.38, 0.04, 0.38, Math.PI / 2);
    fachada.luz(0, 4.45, 0.1, 0.26, 0.26);
    // Puertas laterales, en piedra blanca.
    for (const u of [-2.6, 2.6]) {
      fachada.d(caja, '#ece6da', u, 1.15, 0.05, 1.3, 2.3, 0.1);
      fachada.d(arco, '#ece6da', u, 2.3, 0.05, 1.3, 1.3, 0.1);
      fachada.d(caja, '#4a3122', u, 0.9, 0.1, 0.8, 1.8, 0.04);
      fachada.d(arco, '#4a3122', u, 1.8, 0.1, 0.8, 0.8, 0.04);
    }
    // Ventanas altas de la nave central sobre los tejados laterales.
    for (let x = -3; x <= 3.5; x += 2.2)
      for (const s of [-1, 1]) {
        pieza(caja, canteria, x, 4.62, -18.2 + s * 1.42, 0.5, 0.6, 0.06);
        ventanas.push([x, 4.62, -18.2 + s * 1.45, 0.32, 0.42, 0.04]);
      }
    // Campanario al sur de la fachada: caña encalada con esquinas de cantería y cuerpo de campanas.
    const bx = -4.5,
      bz = -13.1,
      ba = 2.2,
      alto = 7.2;
    muro('cal', bx, (alto + 1.6) / 2, bz, ba, alto + 1.6, ba);
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ])
      for (let k = 0, y = 0.2; y < alto + 1.6; k++, y += 0.36) {
        const a = k % 2 ? 0.46 : 0.3,
          b = k % 2 ? 0.3 : 0.46;
        pieza(caja, canteria, bx + sx * (ba / 2 - a / 2 + 0.03), y, bz + sz * (ba / 2 - b / 2 + 0.03), a, 0.32, b);
      }
    pieza(caja, blanco, bx, alto + 0.05, bz, ba + 0.2, 0.14, ba + 0.2);
    for (const giro of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const cara = frente(bx + Math.sin(giro) * (ba / 2), bz + Math.cos(giro) * (ba / 2), giro);
      // Hueco de campana en arco, con la campana asomando.
      cara.d(caja, oscuro, 0, alto + 0.6, 0.01, 0.75, 0.8, 0.04);
      cara.d(arco, oscuro, 0, alto + 1, 0.01, 0.75, 0.75, 0.04);
      cara.d(esfera, '#9a7a3a', 0, alto + 0.7, 0.06, 0.22, 0.28, 0.08);
      cara.d(caja, canteria, 0, 3.4, 0.02, 0.42, 0.7, 0.06);
      cara.luz(0, 3.4, 0.05, 0.26, 0.5);
    }
    pieza(caja, blanco, bx, alto + 1.68, bz, ba + 0.24, 0.16, ba + 0.24);
    pieza(piramide, '#8a8178', bx, alto + 2.45, bz, 1.6, 1.3, 1.6, 0, Math.PI / 4);
    pieza(caja, hierro, bx, alto + 3.35, bz, 0.05, 0.6, 0.05);
    pieza(caja, hierro, bx, alto + 3.45, bz, 0.32, 0.05, 0.05);
    portada(frente(bx - ba / 2, bz, -Math.PI / 2), 0, 0.7, 1.4, canteria);
  }

  // --- Casa de Colón: dos plantas en L, portada de cantería y balcón de tea sobre la calle Real ---
  {
    const color = '#f0e6cf';
    muro(color, -5.1, 2.3, -25.2, 3.8, 4.6, 4.4);
    muro(color, -2.6, 1.6, -26.5, 1.4, 3.2, 1.8); // ala de atrás, más baja
    tejado(-5.1, 4.62, -25.2, 4.1, 4.7, 1.2);
    tejado(-2.6, 3.22, -26.5, 1.7, 2.1, 0.5);
    const p = frente(-7, -25.2, -Math.PI / 2);
    lienzo(p, 4.4, 4.6, canteria);
    portada(p, 0, 1, 1.9, canteria);
    for (const s of [-1, 1]) ventana(p, s * 1.35, 1.3, 0.56, 0.86, '#2f5d48', canteria);
    balcon(p, 0, 2.5, 3);
    // Placa del museo junto a la puerta.
    p.d(caja, '#8a6a3a', -0.95, 1.5, 0.05, 0.42, 0.3, 0.03);
  }

  // --- Ayuntamiento, frente a la plaza: cal, cantería, balcón corrido y banderas ---
  {
    const color = '#f6f1e6';
    muro(color, 7.9, 2.3, -1.7, 5, 4.6, 6.2);
    tejado(7.9, 4.62, -1.7, 5.3, 6.5, 1.3);
    const p = frente(5.4, -1.7, -Math.PI / 2);
    lienzo(p, 6.2, 4.6, canteria);
    portada(p, 0, 1.2, 2, canteria);
    for (const u of [-2.2, 2.2]) ventana(p, u, 1.3, 0.56, 0.9, tea, canteria);
    balcon(p, 0, 2.55, 3.6);
    for (const u of [-2.4, 2.4]) ventana(p, u, 3.45, 0.5, 0.9, tea);
    // Banderas de España, de Canarias y de La Gomera en el balcón.
    for (const [u, colores] of [
      [-1.2, ['#c60b1e', '#ffc400', '#c60b1e']],
      [0, ['#f4f1ea', '#0768a9', '#ffcc00']],
      [1.2, ['#f4f1ea', '#1d4f9c', '#ffd23f']],
    ] as [number, string[]][]) {
      p.d(poste, '#d8d2c6', u, 4.35, 0.9, 0.04, 1.6, 0.04, 0.5);
      colores.forEach((c, k) => p.d(caja, c, u + 0.32, 4.95 - k * 0.16, 1.25, 0.64, 0.16, 0.02, 0.5));
    }
  }

  // --- Marina: muelles de piedra, dos pantalanes y la baliza de la bocana ---
  const muelle = '#8f877c';
  pieza(caja, muelle, 2.5, -0.72, 14.2, 1.8, 1.4, 15.2);
  pieza(caja, muelle, 10.2, -0.72, 20.9, 13.6, 1.4, 1.8);
  superficie(caja, tenido(cal, '#c4bdb1'), 2.5, -0.01, 14.2, 1.8, 0.04, 15.2, 4);
  superficie(caja, tenido(cal, '#c4bdb1'), 10.2, -0.01, 20.9, 13.6, 0.04, 1.8, 4);
  pieza(caja, blanco, 1.55, 0.3, 10, 0.2, 0.6, 7);
  for (let z = 8; z <= 20; z += 2.4) pieza(poste, hierro, 3.25, 0.2, z, 0.18, 0.4, 0.18);
  for (const x of [8, 14]) {
    pieza(caja, '#b7ab98', x, -0.55, 13.2, 1, 0.1, 10.6);
    pieza(caja, '#5d6b72', x, -0.68, 13.2, 0.9, 0.18, 10.4);
    for (let z = 8.4; z < 18.6; z += 2.6) pieza(poste, '#55606a', x, -0.4, z, 0.16, 1.2, 0.16);
    pieza(caja, '#9a9184', x, -0.25, 7.3, 1, 0.08, 1.6, 0.35);
  }
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#2e8b57', 16.4, 0.4 + j * 0.6, 20.9, 0.6 - j * 0.05, 0.6, 0.6 - j * 0.05);
  ventanas.push([16.4, 2.75, 20.9, 0.26, 0.32, 0.26]);
  pieza(piramide, '#2e8b57', 16.4, 3.1, 20.9, 0.3, 0.3, 0.3, 0, Math.PI / 4);

  // --- Explanada del puerto: estación marítima, aparcamiento, carriles de embarque ---
  pieza(caja, muelle, 31.5, -0.72, 12.9, 21, 1.4, 17.8);
  superficie(caja, tenido(cal, '#6e6b68'), 31.5, -0.01, 12.9, 21, 0.04, 17.8, 5);
  pieza(caja, '#c4bdb1', 31.5, 0.015, 4.6, 21, 0.03, 1.2); // acera al pie del lomo
  // Muro de contención de piedra al pie del risco, del pueblo a la explanada.
  pieza(caja, '#7a6e62', 31, 0.6, 3.75, 42, 1.2, 0.3);
  for (let x = 22; x < 28; x += 1.5) pieza(caja, '#e3b53c', x, 0.03, 17.6, 0.1, 0.02, 7.6); // carriles del ferry
  for (let z = 8.5; z < 17; z += 1.2) pieza(caja, '#e8e4da', 38.5, 0.03, z, 6, 0.02, 0.06);
  const coches = ['#c23a2e', '#e8e4da', '#2c4a6e', '#9aa3a8', '#2b2b2b', '#e3b53c', '#4f7d45'];
  for (let i = 0; i < 14; i++) {
    const x = i % 2 ? 40 : 37,
      z = 9.1 + Math.floor(i / 2) * 1.2,
      c = elige(coches);
    pieza(caja, c, x, 0.36, z, 2, 0.5, 0.95);
    pieza(caja, c, x - 0.1, 0.78, z, 1.1, 0.4, 0.85);
    pieza(caja, '#33404a', x - 0.1, 0.8, z, 1.12, 0.24, 0.87);
    for (const s of [-1, 1]) pieza(poste, '#1f1f1f', x + s * 0.62, 0.17, z, 0.34, 0.98, 0.34, Math.PI / 2);
  }
  // Estación marítima: nave larga de muros claros, cristaleras y cubierta de teja.
  {
    muro('#efe7d6', 31.25, 1.6, 14.25, 5.5, 3.2, 10.5);
    tejado(31.25, 3.22, 14.25, 5.9, 10.9, 1.2);
    const p = frente(28.5, 14.25, -Math.PI / 2);
    lienzo(p, 10.5, 3.2, '#9a8f84');
    for (let u = -4.2; u <= 4.2; u += 1.4) {
      p.d(caja, '#3b4f66', u, 1.35, 0.04, 1.1, 2.1, 0.05);
      p.luz(u, 1.35, 0.08, 0.95, 1.9);
    }
    // Marquesina azul y letrero sobre la entrada.
    p.d(caja, '#1f4f9a', 0, 2.55, 0.8, 7, 0.12, 1.6);
    for (const u of [-3.3, 3.3]) p.d(poste, blanco, u, 1.27, 1.5, 0.08, 2.55, 0.08);
    p.d(caja, '#1f4f9a', 0, 2.95, 0.06, 3.4, 0.5, 0.06);
    p.d(caja, '#f2efe6', 0, 2.95, 0.1, 3, 0.22, 0.02);
  }
  // Torres de luz del puerto.
  for (const [x, z] of [
    [24, 11.5],
    [36, 19.6],
  ]) {
    pieza(poste, '#9aa3a8', x, 3, z, 0.22, 6, 0.22);
    pieza(caja, '#5f6a70', x, 6.05, z, 1.2, 0.12, 0.5);
    ventanas.push([x, 5.9, z, 1, 0.16, 0.4]);
  }

  // --- Dique del ferry: muelle de asfalto, espaldón, escollera de bloques y baliza roja ---
  // El dique real sigue mucho más al sur: aquí acaba poco después del ferry, en su morro.
  const punta = 43;
  pieza(caja, muelle, 23.8, -0.72, (21.8 + punta) / 2, 4.4, 1.4, punta - 21.8);
  superficie(caja, tenido(cal, '#6e6b68'), 23.8, -0.01, (21.8 + punta) / 2, 4.4, 0.04, punta - 21.8, 5);
  pieza(caja, '#d2c9ba', 26.45, 0.7, (21.8 + punta) / 2, 0.9, 1.5, punta - 21.8); // espaldón
  pieza(caja, '#e5ddce', 26.45, 1.48, (21.8 + punta) / 2, 1.05, 0.1, punta - 21.7);
  pieza(caja, '#d2c9ba', 34.2, 0.55, 22.25, 16.4, 1.2, 0.7); // pretil de la explanada sobre la escollera
  pieza(caja, '#d2c9ba', 42.3, 0.55, 12.9, 0.7, 1.2, 17.8);
  pieza(poste, muelle, 23.8, -0.72, punta, 4.6, 1.4, 4.6); // morro
  pieza(poste, '#77736e', 23.8, -0.01, punta, 4.4, 0.04, 4.4);
  for (let i = 0; i < 160; i++) {
    // Bloques de hormigón al mar abierto: a lo largo del dique, bajo la explanada y en el morro.
    const s = azar(),
      tramo = i % 3;
    const [x, z] =
      tramo === 0
        ? [27.4 + azar() * 2.6, 21.5 + s * (punta - 21)]
        : tramo === 1
          ? [26 + s * 17.5, 22.9 + azar() * 2.4]
          : [42.9 + azar() * 2.4, 3.6 + s * 19];
    const g = 0.9 + azar() * 0.3;
    pieza(caja, ['#a9a49c', '#9b968f', '#b4afa6'][i % 3], x, -0.3 + azar() * 0.6, z, g, g, g, azar() - 0.5, azar() * 2, azar() - 0.5);
  }
  for (let i = 0; i < 26; i++) {
    const a = -0.6 + azar() * 3.8,
      r = 2.6 + azar() * 1.4,
      g = 0.9 + azar() * 0.3;
    pieza(caja, '#b3ac9f', 23.8 + Math.cos(a) * r, -0.3 + azar() * 0.4, punta + Math.sin(a) * r, g, g, g, azar(), azar(), azar());
  }
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#c23a2e', 24.6, 0.45 + j * 0.75, punta + 0.6, 0.95 - j * 0.07, 0.75, 0.95 - j * 0.07);
  ventanas.push([24.6, 3.5, punta + 0.6, 0.36, 0.44, 0.36]);
  pieza(piramide, '#c23a2e', 24.6, 3.95, punta + 0.6, 0.42, 0.4, 0.42, 0, Math.PI / 4);
  // Bolardos y defensas del atraque, y la rampa por la que entran los coches en el ferry.
  for (let z = 24; z <= punta - 2; z += 2.75) {
    pieza(poste, '#3b3b3b', 21.95, 0.22, z, 0.3, 0.44, 0.3);
    pieza(caja, '#2b2b2b', 21.5, -0.3, z + 1.3, 0.25, 0.7, 0.5);
  }
  for (const z of [27, 33, 39]) farol(23, z);
  pieza(caja, '#7f7b75', 19.6, -0.12, 23, 2.6, 0.1, 2.5, 0.09);
  for (const x of [18.4, 20.8]) pieza(caja, '#f2c230', x, 0.32, 23, 0.06, 0.06, 2.5, 0.09);
  pieza(caja, muelle, 19.6, -0.72, 21.75, 3.6, 1.4, 0.5);

  // --- Parador de La Gomera: casona canaria de teja y balcones en lo alto del lomo, con su jardín ---
  {
    const y = LOMO;
    for (const [r, h, giro] of [
      [[19, -11, 33, -7.4], 4.4, 0],
      [[19, -7.2, 22.6, -2.6], 3.4, Math.PI / 2],
      [[29.4, -7.2, 33, -2.6], 3.4, -Math.PI / 2],
    ] as [Rect, number, number][])
      casona(r, h, giro, { base: y, color: '#f4efe4', postigo: tea, balcon: true, azotea: false });
    // Torreón del Parador en la esquina, mirando al mar.
    casona([33.2, -11.4, 36.4, -8.2], 6.2, 0, { base: y, color: '#f4efe4', postigo: tea, balcon: true, azotea: false });
    // Jardín de césped y palmeras hasta el pretil sobre el risco.
    pieza(caja, '#6c8d47', 26, y + 0.02, -4.3, 6.6, 0.06, 5.4);
    pieza(caja, '#4f9fc2', 26, y + 0.06, -4.8, 2.6, 0.04, 1.6); // la piscina
    pieza(caja, '#e8e1d2', 26, y + 0.04, -4.8, 3, 0.04, 2);
    for (const [x, z, h] of [
      [17.5, -4, 4.4],
      [23.4, -1.6, 3.8],
      [28.8, -1.4, 4.6],
      [35.5, -5, 4],
      [36.4, -1.8, 4.4],
    ])
      palmera(x, y, z, h);
    pieza(caja, blanco, 26.5, y + 0.4, -0.7, 22, 0.8, 0.22);
    pieza(caja, canteria, 26.5, y + 0.84, -0.7, 22.2, 0.08, 0.32);
  }

  // --- Barrios de las laderas: casas sueltas a poniente del barranco y en las lomas del norte ---
  {
    const puestas: Rect[] = [];
    for (let i = 0, n = 0; i < 500 && n < 34; i++) {
      const oeste = i % 2 === 0;
      const x = oeste ? -50 + azar() * 21 : -30 + azar() * 40,
        z = oeste ? -34 + azar() * 34 : -48 + azar() * 13;
      const w = 2.8 + azar() * 1.2,
        d = 2.8 + azar() * 0.8;
      const r: Rect = [x - w / 2, z - d / 2, x + w / 2, z + d / 2];
      if (puestas.some(([a, b, c, e]) => r[0] < c + 0.6 && r[2] > a - 0.6 && r[1] < e + 0.6 && r[3] > b - 0.6)) continue;
      const alturas = [altura(r[0], r[1]), altura(r[2], r[1]), altura(r[0], r[3]), altura(r[2], r[3])];
      const base = Math.min(...alturas) + 0.6;
      if (base < 1.4 || Math.max(...alturas) - base > 1.6) continue;
      puestas.push(r);
      casona(r, 2.8 + azar() * 1.4, oeste ? Math.PI / 2 : 0, { base, balcon: false });
      n++;
    }
  }

  // Muros de cal, de color y de las casas de la villa; tejados de teja.
  for (const [color, lista] of muros) cocer(lista, color === 'cal' ? encalado : tenido(cal, color), 2.6);
  cocer(tejados, teja, 1.85);
  for (const g of [arco, prisma]) g.dispose();

  // Ferry de Los Cristianos amarrado al dique, con la popa hacia la rampa.
  const barco = ferry();
  barco.position.set(19.4, -1.03, 32);
  barco.userData.rumbo = 0;
  return {
    // Veleros y barcas atracados de punta a los pantalanes de la marina.
    amarres: [
      ...[10.2, 14.4].flatMap((z, i): [number, number, number, number][] => [
        [1, 5.75, z, Math.PI],
        [i ? 0 : 1, 10.4, z + 1.6, 0],
        [i ? 1 : 2, 16.4, z, 0],
      ]),
      [2, -3, 16.5, 0.6],
      [0, 8, 28, 1.9],
    ],
    // Dos barquillos varados en la arena negra.
    enSeco: [
      [2, -18.5, -0.45, 11, 2.4],
      [0, -16.6, -0.42, 10.6, 2],
    ],
    ferry: barco,
  };
}

/** Cuña con la roda inclinada: proa de un casco que mira a +z. */
function proa() {
  const [a, b, c, d] = [
    [-1, -1, 0],
    [1, -1, 0],
    [1, 1, 0],
    [-1, 1, 0],
  ];
  const [e, f] = [
    [0, 1, 1],
    [0, -1, 0.45],
  ];
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute([d, c, e, a, f, b, b, c, e, b, e, f, a, e, d, a, f, e].flat(), 3));
  return geo;
}

/**
 * Ferry de la línea de Los Cristianos, montado a lo largo de +z con la proa delante, como el de
 * Agaete. Provisional: se sustituirá por el ferry compartido de las navieras.
 */
function ferry(): T.Group {
  const partes: T.BufferGeometry[] = [];
  const caja = new T.BoxGeometry(),
    esfera = new T.IcosahedronGeometry(1, 1),
    poste = new T.CylinderGeometry(0.48, 0.55, 1, 9),
    cuna = proa();
  function parte(forma: T.BufferGeometry, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
    const geo = forma.index ? forma.toNonIndexed() : forma.clone();
    geo.deleteAttribute('uv');
    geo.deleteAttribute('normal');
    geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion(), new T.Vector3(w, h, d)));
    const rgb = new T.Color(color);
    const colores = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colores.length; i += 3) rgb.toArray(colores, i);
    geo.setAttribute('color', new T.BufferAttribute(colores, 3));
    partes.push(geo);
  }
  const casco = '#f4f3ee',
    franja = '#1f4e9c',
    amarillo = '#f2c230',
    cristal = '#22303d';
  parte(caja, casco, 0, 0.62, -1.75, 3.6, 2.15, 12.5);
  parte(cuna, casco, 0, 0.62, 4.5, 1.8, 1.075, 3.5);
  parte(caja, '#1d3557', 0, 0.2, -1.75, 3.64, 0.3, 12.5);
  parte(cuna, '#1d3557', 0, 0.2, 4.5, 1.84, 0.15, 2.2);
  for (const lado of [-1, 1]) parte(caja, franja, lado * 1.81, 1.12, -1.5, 0.04, 0.26, 11.6);
  parte(caja, '#2a2d31', 0, 0.95, -8.01, 2.4, 1.1, 0.04);
  parte(caja, casco, 0, 2.22, -1.3, 3.3, 1.05, 10.3);
  for (const lado of [-1, 1]) parte(caja, cristal, lado * 1.66, 2.25, -1.3, 0.04, 0.45, 9.6);
  parte(caja, cristal, 0, 2.25, 3.81, 2.8, 0.45, 0.04);
  for (const lado of [-1, 1]) parte(caja, casco, lado * 1.62, 2.86, -1.3, 0.05, 0.22, 10.3);
  parte(caja, amarillo, 0, 3.15, 0.85, 2.9, 0.8, 4.7);
  parte(caja, cristal, 0, 3.25, 3.21, 2.5, 0.35, 0.04);
  for (const lado of [-1, 1]) {
    parte(caja, cristal, lado * 1.46, 3.25, 1.4, 0.04, 0.35, 3);
    parte(caja, amarillo, lado * 1.7, 3.42, 2.85, 0.6, 0.14, 0.5);
  }
  parte(caja, amarillo, 0, 3.75, 0.2, 1.8, 0.4, 2);
  parte(poste, '#e9e6de', 0, 4.55, 0.4, 0.1, 1.3, 0.1);
  parte(caja, '#e9e6de', 0, 5.05, 0.4, 0.9, 0.06, 0.12);
  for (const lado of [-1, 1]) for (const z of [-5.6, -3.4]) parte(esfera, '#e8742a', lado * 1.45, 2.95, z, 0.32, 0.28, 0.75);
  for (const lado of [-1, 1]) parte(poste, '#d9d6cf', lado * 0.8, 3.05, -6.2, 0.4, 0.6, 0.4);
  const malla = new T.Mesh(
    mergeGeometries(partes),
    new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75 }),
  );
  for (const geo of [...partes, caja, esfera, poste, cuna]) geo.dispose();
  malla.castShadow = malla.receiveShadow = true;
  const grupo = new T.Group();
  grupo.add(malla);
  // Más alto que las casas de la villa, como se ve desde el paseo.
  grupo.scale.y = 1.25;
  return grupo;
}
