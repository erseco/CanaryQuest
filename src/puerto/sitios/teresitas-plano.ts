import type { Suelo } from '../../data/pueblos';

/**
 * Plano de la playa de Las Teresitas y San Andrés (Santa Cruz de Tenerife), sin Three.js: lo usan
 * `PUEBLOS['las-teresitas']` para caminar y `teresitas.ts` para dibujar. Trazado sobre la ortofoto
 * PNOA y girado unos 27° para que la cuerda de la playa corra a lo largo de x: el suroeste (San
 * Andrés) queda a la izquierda, la punta de los Órganos a la derecha y el mar abierto delante (+z).
 * La media luna de la playa se ha aplanado a la mitad de su hondura y ensanchado para que quepa
 * en cámara; la playa mide unos 19 m por unidad a lo largo y algo menos de fondo.
 */
export type Punto = [number, number];
interface Muestra {
  x: number;
  z: number;
  /** Tangente unitaria, de suroeste a nordeste. La normal hacia el mar es (−tz, tx). */
  tx: number;
  tz: number;
  /** Recorrido desde el extremo suroeste. */
  s: number;
}

/** Borde de la arena por el lado del paseo, de San Andrés a la punta de los Órganos. */
const TRAZO: Punto[] = [
  [-28, 13], [-25, 8.7], [-21, 5.5], [-16, 3.1], [-10, 1.5], [-4, 0.8], [2, 0.7],
  [8, 1], [14, 1.7], [19, 2.6], [23.5, 3.7], [27, 4.9], [29.5, 6.3],
];
/** Rompeolas exento, paralelo a la orilla, con una boca abierta en cada punta. */
export const ROMPEOLAS: Punto[] = [
  [-19.8, 22.9], [-17.6, 20.4], [-14.5, 18.1], [-9.5, 16], [-3.5, 15], [2.5, 14.9],
  [8.5, 15.2], [14, 15.9], [18.5, 16.5], [21.6, 17],
];

/** Curva de Catmull-Rom por los puntos, muestreada cada `paso` aproximadamente. */
export function muestrear(p: Punto[], paso: number): Muestra[] {
  const puntos: Punto[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b, c, d] = [p[Math.max(0, i - 1)], p[i], p[i + 1], p[Math.min(p.length - 1, i + 2)]];
    const n = Math.max(1, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / paso));
    for (let k = 0; k < n; k++) {
      const t = k / n,
        t2 = t * t,
        t3 = t2 * t;
      const eje = (j: 0 | 1) =>
        0.5 *
        (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3);
      puntos.push([eje(0), eje(1)]);
    }
  }
  puntos.push(p[p.length - 1]);
  let s = 0;
  return puntos.map(([x, z], i) => {
    const [ax, az] = puntos[Math.max(0, i - 1)],
      [bx, bz] = puntos[Math.min(puntos.length - 1, i + 1)];
    const largo = Math.hypot(bx - ax, bz - az);
    if (i > 0) s += Math.hypot(x - puntos[i - 1][0], z - puntos[i - 1][1]);
    return { x, z, tx: (bx - ax) / largo, tz: (bz - az) / largo, s };
  });
}

export const BORDE = muestrear(TRAZO, 0.5);
/** Largo de la playa a lo largo del paseo. */
export const LARGO = BORDE[BORDE.length - 1].s;
/** Ancho del paseo azul, detrás de la arena. */
export const PASEO = 3;
/** Hasta dónde se pisa la arena; la orilla queda un poco más allá. */
export const ARENA = 6.2;
/** Altura de la arena según su distancia al paseo: baja suave hasta meterse en el agua. */
export const arena = (d: number) => -0.03 - 0.115 * d;
/** Distancia al paseo a la que la arena se mete bajo el agua (y = −0,84). */
export const ORILLA = (0.84 - 0.03) / 0.115;

/** Punto de la playa a `s` del extremo suroeste y a `d` del paseo (positiva hacia el mar). */
export function enPlaya(s: number, d: number): Punto {
  const j = BORDE.findIndex((m) => m.s >= s);
  const i = j < 0 ? BORDE.length - 2 : Math.min(BORDE.length - 2, Math.max(0, j - 1));
  const a = BORDE[i],
    b = BORDE[i + 1];
  const k = (s - a.s) / (b.s - a.s);
  const tx = a.tx + (b.tx - a.tx) * k,
    tz = a.tz + (b.tz - a.tz) * k,
    n = Math.hypot(tx, tz);
  return [a.x + (b.x - a.x) * k - (d * tz) / n, a.z + (b.z - a.z) * k + (d * tx) / n];
}
/** Giro de la tangente de la playa en `s`, para alinear lo que se pone a lo largo del paseo. */
export function rumbo(s: number): number {
  const [x0, z0] = enPlaya(s - 0.5, 0),
    [x1, z1] = enPlaya(s + 0.5, 0);
  return -Math.atan2(z1 - z0, x1 - x0);
}
/** Distancia con signo al paseo (positiva hacia el mar) y recorrido del punto más cercano. */
export function enBorde(x: number, z: number): [number, number] {
  let mejor = Infinity,
    d = 0,
    s = 0;
  for (let i = 1; i < BORDE.length; i++) {
    const a = BORDE[i - 1],
      b = BORDE[i];
    const dx = b.x - a.x,
      dz = b.z - a.z,
      l2 = dx * dx + dz * dz;
    let k = ((x - a.x) * dx + (z - a.z) * dz) / l2;
    // Los tramos de los extremos se prolongan: así la playa acaba en una recta, junto a cada espigón.
    if (i > 1) k = Math.max(0, k);
    if (i < BORDE.length - 1) k = Math.min(1, k);
    const qx = a.x + dx * k,
      qz = a.z + dz * k,
      dist = Math.hypot(x - qx, z - qz);
    if (dist < mejor) {
      mejor = dist;
      d = ((x - qx) * -dz + (z - qz) * dx) / Math.sqrt(l2);
      s = a.s + k * Math.sqrt(l2);
    }
  }
  return [d, s];
}

// --- San Andrés y la desembocadura del barranco ---
/** Torre redonda del castillo de San Andrés: centro y radio. */
export const CASTILLO = { x: -40.4, z: 10, r: 2 };
/** Cauce encalado del barranco, de la montaña al mar: x de sus dos muros. */
export const BARRANCO = { oeste: -37, este: -33.5, mar: 17.5 };
/** Cofradía de pescadores, junto al barranco y de espaldas a él. */
export const COFRADIA: [number, number, number, number] = [-33.1, 7.3, -30.9, 13.1];
/** Pendiente de las calles que suben del pueblo hacia la montaña. */
export const CALLE = { desde: 0.1, hasta: -13.5, alto: 1.9 };
export const cuesta = (z: number) => Math.max(0, Math.min(1, (CALLE.desde - z) / (CALLE.desde - CALLE.hasta))) * CALLE.alto;
/** Calles del pueblo que bajan a la avenida, entre las manzanas: x de cada acera. */
export const CALLES: [number, number][] = [
  [-60.6, -58.8],
  [-51.4, -49.6],
];

/** Muelle de la cofradía: arranca en la explanada y sale al mar por el borde suroeste de la playa. */
const s0 = BORDE[0];
const normal0: Punto = [-s0.tz, s0.tx];
export const MUELLE = {
  desde: [s0.x - 1.4 * s0.tx - 0.5 * normal0[0], s0.z - 1.4 * s0.tz - 0.5 * normal0[1]] as Punto,
  dir: normal0,
  largo: 9.8,
  ancho: 2.6,
};
/** Punto del muelle a `t` de su arranque. */
export const enMuelle = (t: number): Punto => [MUELLE.desde[0] + MUELLE.dir[0] * t, MUELLE.desde[1] + MUELLE.dir[1] * t];

type Rect = [number, number, number, number];
const redondo = (v: number) => Math.round(v * 100) / 100;

/**
 * Suelos de la playa: columnas de una unidad de ancho que siguen la curva, una para el paseo y otra para
 * la arena, juntadas donde la curva apenas cambia. La arena baja en rampa hacia la orilla.
 */
// ponytail: columnas rectas que dejan un escalón de hasta medio metro en la curva del suroeste;
// más finas cuestan más rectángulos y más tiempo al buscar rutas.
const COLUMNA = 1;
function playa(): Suelo[] {
  const paseo: { x: number; z: [number, number] }[] = [],
    arenal: typeof paseo = [];
  /** z de la columna en la que la distancia al paseo vale `d`: crece hacia el mar, así que se biseca. */
  const corte = (x: number, d: number) => {
    let a = -15,
      b = 35;
    for (let k = 0; k < 22; k++) {
      const m = (a + b) / 2;
      if (enBorde(x, m)[0] < d) a = m;
      else b = m;
    }
    return a;
  };
  /** Tramo de la columna entre dos distancias, recortado a lo largo de la playa (de 0 a LARGO). */
  function tramo(x: number, da: number, db: number): [number, number] | undefined {
    const za = corte(x, da),
      zb = corte(x, db);
    const dentro = (z: number) => {
      const s = enBorde(x, z)[1];
      return s >= 0 && s <= LARGO;
    };
    if (dentro(za) && dentro(zb) && dentro((za + zb) / 2)) return [za, zb];
    // En las puntas, donde la playa acaba contra el espigón, se busca a pasos lo que queda dentro.
    let z0 = Infinity,
      z1 = -Infinity;
    for (let z = za; z <= zb; z += 0.05)
      if (dentro(z)) {
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      }
    return z1 - z0 > 0.3 ? [z0, z1] : undefined;
  }
  for (let x = Math.floor(BORDE[0].x - PASEO); x < BORDE[BORDE.length - 1].x + PASEO; x += COLUMNA) {
    const p = tramo(x + COLUMNA / 2, -PASEO, 0),
      a = tramo(x + COLUMNA / 2, 0, ARENA);
    if (p) paseo.push({ x, z: p });
    if (a) arenal.push({ x, z: a });
  }
  // Une columnas seguidas mientras sus bordes no se aparten más de 30 cm.
  function juntar(cols: typeof paseo, trasero: boolean): { r: Rect; mitad: number }[] {
    const rects: { r: Rect; mitad: number }[] = [];
    for (let i = 0; i < cols.length; ) {
      let j = i;
      while (
        j + 1 < cols.length &&
        cols[j + 1].x === cols[j].x + COLUMNA &&
        Math.abs(cols[j + 1].z[0] - cols[i].z[0]) < 0.3 &&
        Math.abs(cols[j + 1].z[1] - cols[i].z[1]) < 0.3
      )
        j++;
      const run = cols.slice(i, j + 1);
      // El borde con la otra franja se toma holgado, para que paseo y arena se solapen; el de fuera, justo.
      const z0 = trasero ? Math.max(...run.map((c) => c.z[0])) : Math.min(...run.map((c) => c.z[0]));
      const z1 = trasero ? Math.max(...run.map((c) => c.z[1])) : Math.min(...run.map((c) => c.z[1]));
      rects.push({ r: [cols[i].x, redondo(z0), cols[j].x + COLUMNA, redondo(z1)], mitad: (cols[i].x + cols[j].x + COLUMNA) / 2 });
      i = j + 1;
    }
    return rects;
  }
  const suelos: Suelo[] = juntar(paseo, true).map(({ r }) => ({ r }));
  for (const { r, mitad } of juntar(arenal, false)) {
    const y = arena(Math.max(0, enBorde(mitad, r[1])[0])),
      y2 = arena(Math.min(ARENA, enBorde(mitad, r[3])[0]));
    suelos.push({ r, y: redondo(y), y2: redondo(y2) });
  }
  return suelos;
}

/** Cuadrados que cubren el centro de una franja inclinada, para caminar por el muelle. */
function tira(desde: Punto, dir: Punto, largo: number, medio: number, paso = 0.6): Suelo[] {
  const suelos: Suelo[] = [];
  for (let t = 0; t <= largo; t += paso) {
    const x = desde[0] + dir[0] * t,
      z = desde[1] + dir[1] * t;
    suelos.push({ r: [redondo(x - medio), redondo(z - medio), redondo(x + medio), redondo(z + medio)] });
  }
  return suelos;
}

export const SUELOS: Suelo[] = [
  ...playa(),
  { r: [-33.2, 10.3, -27.6, 16.1] }, // explanada de la cofradía
  ...tira(MUELLE.desde, MUELLE.dir, MUELLE.largo - 0.8, 0.8), // muelle de los pescadores
  { r: [-37.4, 13.5, -33.2, 15.5] }, // pasarela sobre la boca del barranco
  { r: [-43.5, 7, -37.4, 13.5] }, // plaza del castillo
  { r: [-70, 13.5, -37.4, 16.9] }, // avenida marítima de San Andrés
  { r: [-68, 0.1, -37.6, 1.9] }, // calle de en medio, que cruza el pueblo
  ...CALLES.flatMap(([x0, x1]): Suelo[] => [
    { r: [x0, 1.9, x1, 13.5] }, // baja a la avenida
    { r: [x0, CALLE.hasta, x1, CALLE.desde], y: CALLE.alto, y2: 0 }, // sube hacia la montaña
  ]),
];
export const VALLAS: Rect[] = [
  [CASTILLO.x - CASTILLO.r, CASTILLO.z - CASTILLO.r, CASTILLO.x + CASTILLO.r, CASTILLO.z + CASTILLO.r],
  COFRADIA,
];

/** Kioscos de la playa, sobre la arena junto al paseo: recorrido de cada uno. */
export const KIOSCOS = [11, 20.5, 30, 39.5, 49, 57.5];
/** Medidas de un kiosco: a lo largo del paseo, hacia el mar y su distancia al paseo. */
export const KIOSCO = { largo: 2.8, fondo: 2.3, d: 1.75 };
for (const s of KIOSCOS) {
  const [x, z] = enPlaya(s, KIOSCO.d),
    g = rumbo(s);
  const mx = (Math.abs(Math.cos(g)) * KIOSCO.largo + Math.abs(Math.sin(g)) * KIOSCO.fondo) / 2,
    mz = (Math.abs(Math.sin(g)) * KIOSCO.largo + Math.abs(Math.cos(g)) * KIOSCO.fondo) / 2;
  VALLAS.push([redondo(x - mx), redondo(z - mz), redondo(x + mx), redondo(z + mz)]);
}

/** Palmeras: la hilera de la mediana del aparcamiento y los corros sobre la arena. */
export const PALMERAS: [number, number, number][] = [];
for (let s = 9; s < LARGO - 2; s += 2.6) {
  const [x, z] = enPlaya(s, -6.7);
  PALMERAS.push([redondo(x), redondo(z), redondo(4.6 + ((s * 7) % 5) * 0.35)]);
}
for (const [s, d] of [
  [15.5, 1.2], [16.6, 2.6], [17.4, 0.9], [25, 1.3], [26.2, 2.7], [34.5, 1], [35.2, 2.6], [36.3, 1.3],
  [44.4, 1.2], [45.4, 2.8], [53, 1.1], [54.2, 2.5],
]) {
  const [x, z] = enPlaya(s, d);
  PALMERAS.push([redondo(x), redondo(z), redondo(3.6 + ((s * 13) % 7) * 0.3)]);
}
// Las palmeras de la arena son obstáculos; las de la mediana quedan fuera del paseo.
for (const [x, z] of PALMERAS.slice(-12)) VALLAS.push([redondo(x - 0.3), redondo(z - 0.3), redondo(x + 0.3), redondo(z + 0.3)]);

/** Barquillas varadas en la arena, junto al muelle: recorrido y distancia al paseo. */
export const VARADAS: Punto[] = [
  [1.9, 2.6],
  [3.5, 3.4],
];
for (const [s, d] of VARADAS) {
  const [x, z] = enPlaya(s, d);
  VALLAS.push([redondo(x - 1.1), redondo(z - 1.1), redondo(x + 1.1), redondo(z + 1.1)]);
}
