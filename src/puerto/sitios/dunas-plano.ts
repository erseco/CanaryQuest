import type { Suelo } from '../../data/pueblos';

/**
 * Plano de las Dunas de Maspalomas (Gran Canaria), sin Three.js: lo usan `PUEBLOS.dunas` para
 * caminar y `dunas.ts` para dibujar. Trazado sobre la ortofoto PNOA y OpenStreetMap con el
 * Mirador de las Dunas cerca del centro, y comprimido: Playa del Inglés a unos 20 m por unidad
 * (la avenida de Tirajana, de 650 m, en 33 unidades), las dunas al sur a unos 33 m por unidad,
 * y la Charca y el faro, a más de 2 km al suroeste, acercados a la esquina del lugar.
 * Norte hacia −z: el Atlántico queda al sur y al este; Playa del Inglés, en su terraza al norte,
 * con el Riu Palace asomado a las dunas y el campo de golf al noroeste.
 */
export type Punto = [number, number];
type Rect = [number, number, number, number];

/** Orilla del mar, de oeste a este y luego al norte por Playa del Inglés: la tierra queda a la izquierda. */
export const COSTA: Punto[] = [
  [-75, 29.2],
  [-50, 29.2],
  [-45.5, 31.2],
  [-40.5, 31.4],
  [-37.5, 30],
  [-28, 29.4],
  [-16, 29.2],
  [-2, 28.4],
  [6, 27.6],
  [15.4, 26.2],
  [26.5, 23.5],
  [35.4, 20.5],
  [41, 17.1],
  [45.4, 12.4],
  [47.6, 7],
  [48.7, 0.3],
  [50, -40],
  [51.5, -75],
];
/**
 * Borde de la terraza, con ella a la izquierda: el campo de golf al oeste y Playa del Inglés,
 * que acaba en punta en el Mirador de las Dunas y sube luego al nordeste junto al paseo.
 */
export const ESCARPE: Punto[] = [
  [-75, -6.5],
  [-40, -8.5],
  [-14, -20],
  [-3.2, -16.5],
  [-0.45, -12.9],
  [4.95, -5.05],
  [8, -3.6],
  [14.45, -8.75],
  [19.05, -15],
  [23.2, -23.3],
  [27.35, -31.6],
  [33.55, -38.65],
  [39.8, -46.1],
  [43.5, -75],
];
/** Paseo Costa Canaria, por el borde de la terraza del mirador hacia la playa del Inglés. */
export const PASEO: Punto[] = [
  [9.6, -5.4],
  [13.4, -8.8],
  [17.6, -14.6],
  [21.6, -22.6],
  [25.9, -31.2],
  [32, -38.4],
  [38.4, -46],
];
/** Orilla de la Charca: larga de norte a sur, con su barra de arena frente a la playa. */
export const CHARCA: Punto[] = [
  [-34.5, 8.5],
  [-33, 8.8],
  [-31.6, 10.6],
  [-29.9, 13.5],
  [-28.2, 16.7],
  [-26.7, 19.9],
  [-26.1, 22.5],
  [-26.9, 24.4],
  [-28.8, 25.3],
  [-31, 24.9],
  [-32.6, 23.3],
  [-33.4, 20.7],
  [-33.9, 17.5],
  [-34.4, 14],
  [-34.9, 10.5],
];
/** Cauce del barranco de Maspalomas, que baja del norte a morir en la Charca. */
export const BARRANCO: Punto[] = [
  [-34.4, 9],
  [-35.6, -3],
  [-37.5, -20],
  [-40, -45],
];
/** Sendero balizado que baja del mirador a la playa, entre las dunas. */
export const SENDERO: Punto[] = [
  [8, -0.6],
  [7, 6],
  [9, 13],
  [6.5, 20],
  [5, 26],
];
/** Pie de la torre del faro. */
export const FARO: Punto = [-43, 28];
/** Altura de Playa del Inglés sobre las dunas, en el mirador. */
export const TERRAZA = 3.4;
/** Plaza del faro y paseo de Meloneras, enlosados a la altura `LOSAS`. Al este bajan en rampa a la arena. */
export const PLAZA: Rect = [-55, 21, -38, 28.6];
export const LOSAS = 0.3;
export const PALMERAL: Rect = [-48, 8, -35.5, 21.2];
/** Mirador de las Dunas, en la punta de la terraza, y la escalera que baja de él a la arena. */
export const MIRADOR: Rect = [6, -6.6, 10, -3.8];
export const ESCALERA: Rect = [7.3, -3.8, 8.7, -0.6];
/** Avenida de Tirajana, de la rotonda de Francia al Riu, y avenida de Francia a los dos lados de la rotonda. */
export const TIRAJANA: Rect = [5.4, -48, 9.8, -16.5];
export const FRANCIA: Rect = [-2, -39.4, 21, -35.8];
/** Avenida de Alemania, que baja desde Francia, tras el CITA, hasta el Paseo Costa Canaria. */
export const ALEMANIA: Rect = [19.6, -39.4, 22.6, -25.4];
/** Pasaje público que cruza el jardín del Riu de Tirajana al mirador. */
export const PASAJE: Rect = [6.6, -17, 8.6, -6.4];
export const ROTONDA: Punto = [7.6, -37.6];

const suave = (v: number) => {
  const k = Math.min(1, Math.max(0, v));
  return k * k * (3 - 2 * k);
};
const dentro = ([x0, z0, x1, z1]: Rect, x: number, z: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
/** Distancia a una línea quebrada, con signo: positiva a su izquierda (tierra adentro en `COSTA`). */
export function lado(linea: Punto[], x: number, z: number): number {
  let mejor = Infinity,
    signo = 1;
  for (let i = 1; i < linea.length; i++) {
    const [ax, az] = linea[i - 1],
      [bx, bz] = linea[i];
    const dx = bx - ax,
      dz = bz - az;
    const k = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(x - ax - dx * k, z - az - dz * k);
    if (d < mejor) {
      mejor = d;
      signo = dx * (z - az) - dz * (x - ax) < 0 ? 1 : -1;
    }
  }
  return mejor * signo;
}
/** Distancia a la orilla de la Charca: negativa en el agua. */
export function aLaCharca(x: number, z: number): number {
  let dentroDelAgua = false,
    mejor = Infinity;
  for (let i = 0, j = CHARCA.length - 1; i < CHARCA.length; j = i++) {
    const [ax, az] = CHARCA[j],
      [bx, bz] = CHARCA[i];
    if (az > z !== bz > z && x < ax + ((z - az) * (bx - ax)) / (bz - az)) dentroDelAgua = !dentroDelAgua;
    const dx = bx - ax,
      dz = bz - az;
    const k = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    mejor = Math.min(mejor, Math.hypot(x - ax - dx * k, z - az - dz * k));
  }
  return dentroDelAgua ? -mejor : mejor;
}
/** De 0 en la hoya de matorral del noroeste, donde la arena está quieta, a 1 en las dunas vivas. */
export function viva(x: number, z: number): number {
  const linea = 13.8 - 0.6 * (x + 29.9);
  return Math.max(suave((z - linea) / 8 + 0.5), suave((x + 2) / 6));
}
/**
 * Crestas de las dunas vivas. El alisio sopla del nordeste: cada duna sube suave por barlovento
 * y cae a pico por la cara de avalancha, al suroeste. Las crestas serpentean y cambian de altura
 * a lo largo, como las barjanas que se unen en cordones.
 */
function crestas(x: number, z: number): number {
  const s = (z - x) * Math.SQRT1_2, // a favor del viento
    c = (x + z) * Math.SQRT1_2; // a lo largo de la cresta
  const f = (s + 2.2 * Math.sin(c * 0.38) + 1.3 * Math.sin(c * 0.16 + 1.3)) / 10.5;
  const n = Math.floor(f),
    p = f - n;
  const alto = 4 * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(c * 0.27 + n * 2.3)));
  // La cresta es un filo: el barlovento llega a ella con pendiente y la cara de avalancha cae de golpe.
  const perfil = p < 0.72 ? 1 - Math.cos((Math.PI / 2) * (p / 0.72)) : (1 - (p - 0.72) / 0.28) ** 1.5;
  return Math.max(0, alto * perfil - 0.2);
}
/** Montículos bajos de la arena quieta, cada uno sujeto por su mata. */
function monticulos(x: number, z: number): number {
  const a = Math.sin(x * 0.55 + 1.7 * Math.sin(z * 0.31)) * Math.sin(z * 0.62 + 1.3 * Math.sin(x * 0.27));
  return 1.1 * Math.max(0, a) ** 1.4;
}
/** Altura de la terraza: el golf, más bajo, al oeste, y Playa del Inglés, que baja hacia su playa al este. */
export const meseta = (x: number) => 1 + (TERRAZA - 1) * suave((x + 6) / 4) - 1.8 * suave((x - 22) / 20);
/** Altura del terreno natural, sin las losas: arena, orillas, el talud de la terraza y la Charca. */
export function arena(x: number, z: number): number {
  const d = lado(COSTA, x, z);
  // La playa sube desde el agua; tras ella, la arena llana del pie de las dunas.
  let y = d < 6 ? -0.95 + 0.158 * d : Math.min(LOSAS, 0.008 + (d - 6) * 0.073);
  const e = lado(ESCARPE, x, z);
  // Las dunas nacen tras la playa, se apagan junto al palmeral y se amontonan contra la terraza.
  const campo = suave((d - 7) / 6) * suave((-e - 0.5) / 4) * suave((x + 36) / 4);
  const v = viva(x, z);
  y += campo * (v * crestas(x, z) + (1 - v) * monticulos(x, z));
  // El barranco llega a la Charca en un cauce poco hondo, entre cañas.
  y -= 0.6 * (1 - suave(Math.abs(lado(BARRANCO, x, z)) / 2.2)) * suave((9 - z) / 2);
  // Talud de la terraza: la arena sube hasta su borde.
  y += (meseta(x) - y) * suave((e + 2.6) / 2.6);
  // La Charca: el agua al nivel del mar, con la orilla que sube rápido hacia la arena.
  const c = aLaCharca(x, z);
  if (c < 0) return -0.9 - 0.5 * Math.min(1, -c / 1.5);
  if (c < 2.5) {
    const k = c / 2.5;
    return -0.9 + (y + 0.9) * k * (2 - k);
  }
  return y;
}
/** Altura del suelo que se pisa: la arena y la terraza, más los llanos enlosados y sus bajadas. */
export function cota(x: number, z: number): number {
  if (dentro(PLAZA, x, z)) {
    const k = suave((x + 41) / 3);
    return LOSAS * (1 - k) + arena(x, z) * k;
  }
  if (dentro(MIRADOR, x, z)) return TERRAZA;
  if (dentro(ESCALERA, x, z)) {
    const k = (z - ESCALERA[1]) / (ESCALERA[3] - ESCALERA[1]);
    return TERRAZA + (arena(x, ESCALERA[3]) - TERRAZA) * k;
  }
  return arena(x, z);
}

/**
 * La arena, de la terraza a la orilla, en franjas norte-sur de 2 de ancho: cada una va desde
 * el borde de la terraza (o el golf) hasta un paso de la orilla. Más estrechas ceñirían mejor
 * los bordes, pero cada zona encarece la búsqueda de rutas.
 */
function franjasDeArena(): Rect[] {
  const franjas: Rect[] = [];
  for (let x0 = -38; x0 < 49; x0 += 2) {
    const x1 = x0 + 2;
    let z0 = -60;
    while (z0 < 30 && Math.max(lado(ESCARPE, x0, z0), lado(ESCARPE, x1, z0)) > 0.3) z0 += 0.25;
    let z1 = z0;
    while (z1 < 40 && Math.min(lado(COSTA, x0, z1 + 0.25), lado(COSTA, x1, z1 + 0.25)) > 1.2) z1 += 0.25;
    if (z1 - z0 > 1) franjas.push([x0, z0, x1, z1]);
  }
  return franjas;
}
/** El Paseo Costa Canaria, en baldosas solapadas a lo largo de su trazado. */
function baldosasDelPaseo(): Rect[] {
  const baldosas: Rect[] = [];
  for (let i = 1; i < PASEO.length; i++) {
    const [ax, az] = PASEO[i - 1],
      [bx, bz] = PASEO[i];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 2);
    for (let k = 0; k < n; k++) {
      const x = ax + ((bx - ax) * k) / n,
        z = az + ((bz - az) * k) / n;
      baldosas.push([x - 1.3, z - 1.3, x + 1.3, z + 1.3]);
    }
  }
  return baldosas;
}
/** Zonas pisables: calles y mirador de Playa del Inglés, el paseo, la arena, el palmeral y la plaza del faro. */
export const SUELOS: Suelo[] = [
  { r: TIRAJANA },
  { r: FRANCIA },
  { r: ALEMANIA },
  { r: PASAJE },
  { r: MIRADOR },
  { r: ESCALERA },
  ...baldosasDelPaseo().map((r) => ({ r })),
  ...franjasDeArena().map((r) => ({ r })),
  { r: PALMERAL },
  { r: PLAZA },
];

/** El agua de la Charca, en franjas de una unidad metidas un poco dentro de la orilla. */
function franjasCharca(): Rect[] {
  const franjas: Rect[] = [];
  const zs = CHARCA.map(([, z]) => z);
  for (let z = Math.min(...zs); z < Math.max(...zs) - 0.5; z += 1) {
    const corte: number[] = [];
    const medio = z + 0.5;
    for (let i = 0, j = CHARCA.length - 1; i < CHARCA.length; j = i++) {
      const [ax, az] = CHARCA[j],
        [bx, bz] = CHARCA[i];
      if (az > medio !== bz > medio) corte.push(ax + ((medio - az) * (bx - ax)) / (bz - az));
    }
    const x0 = Math.min(...corte) + 0.3,
      x1 = Math.max(...corte) - 0.3;
    if (x1 > x0) franjas.push([x0, z, x1, z + 1]);
  }
  return franjas;
}
/** Lo que no se pisa: la Charca, el faro con la casa del torrero y la isleta de la rotonda. */
export const VALLAS: Rect[] = [
  ...franjasCharca(),
  [-46.7, 22.7, -39.3, 29],
  [ROTONDA[0] - 1.2, ROTONDA[1] - 1.2, ROTONDA[0] + 1.2, ROTONDA[1] + 1.2],
];

/**
 * Palmeras: x, z y altura. Las de la terraza llevan sumada su altura `TERRAZA`: el tronco arranca
 * del nivel del mar y queda oculto bajo el suelo del barrio.
 */
export const PALMERAS: [number, number, number][] = (() => {
  const palmeras: [number, number, number][] = [];
  let semilla = 97;
  const azar = () => (semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0) / 4294967296;
  // El palmeral del Oasis, suelto y algo apartado de la orilla de la Charca.
  for (let i = 0; palmeras.length < 26 && i < 400; i++) {
    const x = -49 + azar() * 14,
      z = 6 + azar() * 15;
    if (aLaCharca(x, z) < 1.5 || palmeras.some(([px, pz]) => Math.hypot(px - x, pz - z) < 2.3)) continue;
    palmeras.push([+x.toFixed(2), +z.toFixed(2), +(4.2 + azar() * 3.2).toFixed(2)]);
  }
  // Paseo de Meloneras, entre la plaza del faro y el mar.
  for (const x of [-53, -49.5]) palmeras.push([x, 27.6, 4.8]);
  // Avenida de Tirajana, en las dos aceras, y el jardín del Riu.
  for (const z of [-46, -39.5, -33, -26.5, -20]) palmeras.push([5.1, z, TERRAZA + 4.4]);
  for (const z of [-31.5, -25, -18.5]) palmeras.push([10.1, z, TERRAZA + 4.9]);
  for (const [x, z, h] of [
    [5.2, -10.4, 4.6],
    [10, -8.4, 5.2],
    [6, -14, 5.6],
    [9.2, -14.3, 4.4],
    [ROTONDA[0], ROTONDA[1], 5],
  ])
    palmeras.push([x, z, TERRAZA + h]);
  // Algunas a lo largo del Paseo Costa Canaria, del lado de los hoteles.
  for (const [x, z] of [
    [15.3, -9.6],
    [19.6, -16.4],
    [23.2, -24.6],
    [27.8, -32.6],
  ])
    palmeras.push([x, z, meseta(x) + 4.2]);
  // Y las del campo de golf, sueltas entre las calles de juego.
  for (const [x, z] of [
    [-30, -24],
    [-21, -31],
    [-12, -27],
    [-38, -17],
    [-47, -13],
    [-28, -44],
    [-16, -42],
  ])
    palmeras.push([x, z, meseta(x) + 4.6 + (x % 3) * 0.3]);
  return palmeras;
})();
