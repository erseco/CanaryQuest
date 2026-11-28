import type { Suelo } from '../../data/pueblos';

/**
 * Plano de la playa de Las Canteras (Las Palmas de Gran Canaria), sin Three.js: lo usan
 * `PUEBLOS['las-canteras']` para caminar y `canteras.ts` para dibujar. Trazado sobre la ortofoto
 * PNOA y desenrollado: la playa corre a lo largo de x, de La Puntilla (−x, al nornordeste) a la
 * Peña de la Vieja (+x); el mar queda delante (+z, al oestenoroeste) y la ciudad detrás (−z).
 * El arco real de la bahía se estira en línea, unos 19 m por unidad a lo largo de la playa y
 * unos 7 m de través, para que la cámara la recorra entera; La Puntilla y el arco de La Cícer,
 * que en la realidad cierran la bahía, se doblan hacia el mar en los extremos.
 */
export type Punto = [number, number];
type Rect = [number, number, number, number];

/** Altura del paseo, levantado sobre la arena por un muro. */
export const PASEO = 0.9;
/** Borde del paseo sobre el muro de la playa y pie del muro, donde empieza la arena. */
export const MURO = -3.3,
  PIE = -2.9;
/** Fachadas de la primera línea de edificios, al fondo del paseo. */
export const FACHADA = -8.4;
/** Hasta dónde se pisa la arena: x y z de la orilla, de norte a sur. El agua llega un metro más allá. */
export const ORILLA: Punto[] = [
  [-44, 7],
  [-36, 7.3],
  [-24, 6.9],
  [-10, 6.4],
  [4, 6],
  [14, 5.6],
  [19, 5.2],
  [22, 3.8],
  [26, 3.1],
  [31, 3.3],
  [34, 4.3],
  [40, 5],
  [48, 5.6],
];
/** Escaleras del paseo a la arena, por su x. */
export const ESCALERAS = [-34, -18, -2, 14, 30, 42];
/** Arena a cada lado de la orilla: la playa va de aquí al norte hasta allí al sur. */
const NORTE = -43.6,
  SUR = 50;
/** Rocas de la playa entre Playa Grande y Playa Chica, y las que cierran Playa Chica por el sur. */
export const ROCAS: Rect[] = [
  [19.4, 1.2, 22.6, 6],
  [33.4, 2.6, 35.2, 5],
];
/** Barcas varadas en la arena de La Puntilla, de proa al mar: x, z y giro. */
export const VARADAS: [number, number, number][] = [
  [-41.4, -0.2, 0.15],
  [-39.4, 0.4, -0.1],
  [-37.2, -0.6, 0.25],
];
/** Casetas de socorrismo en la arena: x y z. */
export const SOCORRISMO: Punto[] = [
  [-12, 1.8],
  [24.5, 0.4],
];
/** Terrazas de los bares al pie de las fachadas: de x0 a x1. */
export const TERRAZAS: Punto[] = [
  [-31, -26],
  [-21, -15],
  [-9, -5],
  [16, 21],
  [36, 46],
];
/** Palmeras del paseo, junto a la barandilla, y cocoteros de La Puntilla: x, z y altura. */
export const PALMERAS: [number, number, number][] = [
  ...[-38, -30, -22, -14, -6, 2, 10, 18, 26, 34, 46].map((x, i): [number, number, number] => [x, -4, 5.4 + (i % 3) * 0.7]),
  [-46.2, -6.5, 4.6],
  [-47.8, -1.8, 5.2],
  [-53.5, -4, 4.4],
  // En la explanada del Auditorio, fuera del paseo.
  [64.2, 7.6, 5.4],
  [62, 10.3, 4.8],
  [59.4, 15.8, 5],
  [66.9, 6.8, 4.6],
];

/** z de la orilla en x, interpolada entre los puntos de `ORILLA`. */
export function orilla(x: number): number {
  if (x <= ORILLA[0][0]) return ORILLA[0][1];
  for (let i = 1; i < ORILLA.length; i++) {
    const [x1, z1] = ORILLA[i];
    if (x <= x1) {
      const [x0, z0] = ORILLA[i - 1];
      return z0 + ((z1 - z0) * (x - x0)) / (x1 - x0);
    }
  }
  return ORILLA[ORILLA.length - 1][1];
}
/** Bajada de la arena: del pie del muro (altura 0) hasta la orilla, donde queda a −0,75. */
export const CAIDA = 0.75;
/** Tiras de arena de 2 de ancho; cada una llega hasta la orilla más cercana de su tramo. */
const TIRAS: Suelo[] = [];
for (let x = NORTE; x < SUR; x += 2) {
  const x1 = Math.min(SUR, x + 2),
    z = Math.min(orilla(x), orilla(x1), orilla((x + x1) / 2));
  TIRAS.push({ r: [x, PIE, x1, z], y: 0, y2: -CAIDA });
}
/** Altura de la arena, también bajo el agua: la de la tira que la contiene, prolongada mar adentro. */
export function arena(x: number, z: number): number {
  const tira = TIRAS.find(({ r }) => x >= r[0] && x <= r[2]) ?? (x < NORTE ? TIRAS[0] : TIRAS[TIRAS.length - 1]);
  return (-CAIDA * (z - PIE)) / (tira.r[3] - PIE);
}
const rampa = (r: Rect, y: number, y2: number, eje: 'x' | 'z' = 'z'): Suelo => ({ r, y, y2, eje });
const llano = (x0: number, z0: number, x1: number, z1: number, y = PASEO): Suelo => ({ r: [x0, z0, x1, z1], y });

/** Zonas pisables. Las primeras mandan donde se solapan: escaleras y rampas. */
export const SUELOS: Suelo[] = [
  ...ESCALERAS.map((x) => rampa([x - 0.8, MURO - 0.3, x + 0.8, -1.4], PASEO, arena(x, -1.4))),
  rampa([-44.4, 0, -42.6, 1.8], PASEO, arena(-42.6, 1), 'x'), // escalera de la plaza a la arena
  rampa([-52, 3.6, -49.6, 10.2], PASEO, -0.6), // varadero de La Puntilla
  llano(-44, -8, 50, MURO), // paseo de Las Canteras
  llano(-58, -12, -44, 3.6), // plaza de La Puntilla
  llano(-56, -18, -52.4, -12), // calle hacia La Isleta
  ...TIRAS,
];

export const VALLAS: Rect[] = [
  ...ROCAS,
  ...VARADAS.map(([x, z]): Rect => [x - 0.6, z - 1.5, x + 0.6, z + 1.5]),
  ...TERRAZAS.map(([x0, x1]): Rect => [x0, -8, x1, -7]),
  ...SOCORRISMO.map(([x, z]): Rect => [x - 0.55, z - 0.55, x + 0.55, z + 0.55]),
  ...PALMERAS.map(([x, z]): Rect => [x - 0.3, z - 0.3, x + 0.3, z + 0.3]),
];
