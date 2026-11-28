import type { Suelo } from '../../data/pueblos';

/**
 * Plano de las piscinas de La Caleta (El Hierro), sin Three.js: lo usan `PUEBLOS['la-caleta']`
 * para caminar y `caleta.ts` para dibujar. Medido sobre la ortofoto PNOA `la-caleta-pnoa.webp`
 * a 2,5 m por unidad. Norte hacia −z, como en los demás lugares: el mar abierto queda al sur y
 * al este, la carretera baja del pueblo por el norte y el origen está junto al vaso alto.
 */
export type Punto = [number, number];
/** Vértice de un camino: x, z y altura del firme. */
export type Paso = [number, number, number];
type Rect = [number, number, number, number];

/**
 * Contornos de los vasos: el alto junto al mirador, el grande de abajo y el pequeño pegado a él.
 * Trazados en píxeles sobre la ortofoto y pasados a unidades de juego.
 */
export const VASOS: Punto[][] = [
  [[1.88, 1.87], [3.13, 1.73], [4.13, 2.68], [4.51, 4.04], [5.63, 4.99], [7.01, 5.53], [8.14, 7.02], [8.64, 8.51], [7.89, 9.32], [5.26, 10.27], [4.26, 9.86], [2.88, 8.24], [1.88, 6.61], [1.13, 4.44], [1.13, 2.95]],
  [[-2.75, 15.15], [-1.13, 14.47], [-0.13, 13.66], [0.38, 11.9], [1.13, 11.76], [1.5, 12.58], [1.5, 13.8], [2.38, 14.34], [3.13, 15.42], [2.75, 16.37], [1.25, 17.86], [-0.75, 18.81], [-2.63, 18.95], [-3.63, 18.4], [-3.63, 17.05]],
  [[1.88, 12.03], [3.13, 11.08], [4.76, 11.22], [5.26, 11.76], [4.51, 13.12], [3.76, 13.93], [2.75, 13.93], [2, 13.25]],
];
/** Plataforma alta (solárium y vaso alto), plataforma baja (vasos de abajo) y azotea del mirador. */
export const ALTA = 0.55,
  BAJA = 0.1,
  MIRADOR = 1.95;
/** Jardineras redondas del solárium: x, z y radio. La última es de tierra; las otras, de picón. */
export const JARDINERAS: [number, number, number][] = [
  [-8.6, 5.9, 0.9],
  [-11.6, 7, 0.9],
  [-9.7, 8.5, 0.9],
  [-10, 11, 1.05],
];
/** Parterres de lava y plantas entre los paseos del solárium. */
export const PARTERRES: Rect[] = [
  [-7.2, 2.6, -4.6, 6.8],
  [-8.2, 11.4, -4.4, 15],
  [-8.2, 16.2, -6.6, 20.2],
  [-2.6, 1, -0.6, 7.5], // jardín dentro de la rampa en curva
];
/** Coches del aparcamiento, de morro al norte: x y z. */
export const APARCADOS: Punto[] = [
  [-21, 8.3],
  [-19.3, 8.3],
];
/** Mirador redondo junto al vaso alto: centro y radio. */
export const CASETA = { x: 11.6, z: 4, r: 2 };

// --- Calles y caminos, de un extremo a otro, con la altura del firme en cada vértice ---
/** Carretera que baja del pueblo por el noroeste hasta la horquilla sobre el acantilado. */
export const CARRETERA_OESTE: Paso[] = [
  [-21, -62, 12.4], [-23, -45, 9.2], [-25, -31, 6.9], [-27, -28, 6.6], [-30, -22, 5.8], [-33, -16, 5],
  [-36, -10, 4.3], [-38.5, -4.5, 3.7], [-40.5, 0, 3.3], [-42, 2, 3.1], [-44.5, 6, 2.8], [-47, 10, 2.55],
  [-48.3, 14, 2.4], [-47, 18, 2.3], [-44, 20.6, 2.3], [-40, 21.4, 2.3], [-36, 20.3, 2.25], [-32, 17.3, 2.2],
  [-28, 14.5, 2.1], [-24, 10, 2], [-20, 6, 1.95],
];
/** La diagonal que sube del aparcamiento al cruce, con los coches aparcados al lado de la montaña. */
export const DIAGONAL: Paso[] = [
  [-20, 6, 1.95], [-16, 3.3, 2.1], [-12, 0.2, 2.4], [-6, -4.3, 2.9], [0, -9.8, 3.35], [6, -14, 3.8],
  [12, -17.5, 4.25], [16, -19.5, 4.55],
];
/** Del cruce sigue hacia el pueblo, al norte. */
export const CARRETERA_NORTE: Paso[] = [
  [16, -19.5, 4.55], [18.5, -23, 4.95], [20.5, -27, 5.45], [22, -31, 6], [23.5, -38, 7.4], [25, -46, 9.2],
  [26.5, -62, 12.6],
];
/** Ramal del cruce hacia el sur, con aparcamiento a los dos lados, hasta la calle del este. */
export const RAMAL: Paso[] = [
  [16, -19.5, 4.55], [17, -14, 4.05], [18, -8, 3.5], [20, -4, 3.2], [22, -2, 3.1],
];
export const CALLE_ESTE: Paso[] = [
  [22, -2, 3.1], [30, 0, 3.1], [40, 2.1, 3.2], [48, 3.7, 3.25], [56, 5.3, 3.3],
];
/** Senda que baja de la calle a la azotea del mirador. */
export const ACCESO: Paso[] = [
  [21.5, -1, 3.1], [16, 0, 2.45], [11.2, 0.4, MIRADOR],
];
/** Paseo de la orilla, de las piscinas hacia el este, junto a la rompiente. */
export const ORILLA: Paso[] = [
  [13.6, 9.5, ALTA], [19, 9.9, 0.6], [24, 10.9, 0.7], [30.6, 11.3, 0.85],
];
/** Camino de la barandilla blanca: sube de la orilla a la plaza de la calle del este. */
export const SENDA: Paso[] = [
  [30.6, 11.3, 0.85], [31.4, 9.8, 1.25], [32.4, 8.3, 1.7], [33.4, 7, 2.1], [34.9, 5.8, 2.5], [36.6, 5.2, 2.7],
  [43, 4.9, 3.2],
];

/** Rectángulos pisables a lo largo de un camino: rampas cortas que siguen su eje dominante. */
function tira(camino: Paso[], ancho: number, paso = 1): Suelo[] {
  const suelos: Suelo[] = [];
  for (let k = 1; k < camino.length; k++) {
    const a = camino[k - 1],
      b = camino[k];
    const porX = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
    const n = Math.ceil(Math.abs(porX ? b[0] - a[0] : b[1] - a[1]) / paso);
    for (let i = 0; i < n; i++) {
      const p = a.map((v, j) => v + ((b[j] - v) * i) / n),
        q = a.map((v, j) => v + ((b[j] - v) * (i + 1)) / n);
      // Ordenados a lo largo del eje: la rampa va de la altura del primero a la del segundo.
      const [m, M] = (porX ? p[0] < q[0] : p[1] < q[1]) ? [p, q] : [q, p];
      suelos.push(
        porX
          ? { r: [m[0], Math.min(m[1], M[1]) - ancho, M[0], Math.max(m[1], M[1]) + ancho], y: m[2], y2: M[2], eje: 'x' }
          : { r: [Math.min(m[0], M[0]) - ancho, m[1], Math.max(m[0], M[0]) + ancho, M[1]], y: m[2], y2: M[2], eje: 'z' },
      );
    }
  }
  return suelos;
}
const llano = (x0: number, z0: number, x1: number, z1: number, y: number): Suelo => ({ r: [x0, z0, x1, z1], y });
const rampa = (r: Rect, y: number, y2: number, eje: 'x' | 'z' = 'z'): Suelo => ({ r, y, y2, eje });

/** Zonas pisables. Las primeras mandan donde se solapan: escalones, mirador y escaleras. */
export const SUELOS: Suelo[] = [
  rampa([-4.4, 10.4, 9.8, 11.1], ALTA, BAJA), // gradas entre el vaso alto y los de abajo
  rampa([-12.6, 12.2, -8.2, 13], ALTA, BAJA), // y entre el solárium y el paseo del oeste
  llano(10.4, 2.6, 12.8, 5.4, MIRADOR), // azotea del mirador
  llano(11, 0.9, 12.2, 2.7, MIRADOR), // pasarela a la senda
  rampa([13.6, 0.8, 15.4, 8.6], 2.25, 0.6), // escalera del mirador a la plataforma
  rampa([-16, 7.4, -12.6, 9.8], 1.9, ALTA, 'x'), // escalinata del aparcamiento al solárium
  llano(-21.5, 7.2, -16, 10, 1.9), // aparcamiento
  llano(9, -9.5, 15.5, -3.5, 3.45), // cancha
  llano(15.5, -7.2, 17.4, -5.8, 3.45), // su entrada desde el ramal
  // Plataforma alta: solárium al oeste y vaso alto al este.
  llano(-8, 0.8, 7, 10.75, ALTA),
  llano(7, 3, 9.4, 10.75, ALTA),
  llano(-12.6, 3.4, -8, 12.6, ALTA),
  llano(9.4, 6.4, 13.6, 10.75, ALTA),
  llano(13.6, 8.6, 15.4, 10.4, ALTA),
  // Plataforma baja, cerrada por el muro de la rompiente, y el paseo que baja por el oeste.
  llano(-4.4, 11.1, 9, 14.6, BAJA),
  llano(-12, 13, -8.2, 14.6, BAJA),
  llano(-10.5, 14.6, 6, 18, BAJA),
  llano(-9.4, 18, 1.5, 21, BAJA),
  llano(-8.6, 21, -2.5, 22.6, BAJA),
  ...tira(DIAGONAL, 1, 1.2),
  ...tira(RAMAL, 1),
  ...tira(CALLE_ESTE, 1, 2),
  ...tira(ACCESO, 0.7),
  ...tira(ORILLA, 0.75),
  ...tira(SENDA, 0.7, 0.8),
  llano(43, 4, 53, 6.4, 3.25), // plaza al final del camino de la barandilla
];

/** Franjas que tapan el agua de un vaso: tiras horizontales metidas un poco dentro del borde. */
function franjas(vaso: Punto[], alto = 0.4): Rect[] {
  const zs = vaso.map(([, z]) => z);
  const rects: Rect[] = [];
  for (let z = Math.min(...zs); z < Math.max(...zs); z += alto) {
    const medio = z + alto / 2;
    const cortes = vaso
      .flatMap(([x0, z0], i) => {
        const [x1, z1] = vaso[(i + 1) % vaso.length];
        return z0 <= medio !== z1 <= medio ? [x0 + ((medio - z0) / (z1 - z0)) * (x1 - x0)] : [];
      })
      .sort((a, b) => a - b);
    for (let i = 0; i + 1 < cortes.length; i += 2) rects.push([cortes[i] + 0.08, z, cortes[i + 1] - 0.08, z + alto]);
  }
  return rects;
}
export const VALLAS: Rect[] = [
  ...VASOS.flatMap((v) => franjas(v)),
  ...PARTERRES,
  ...JARDINERAS.map(([x, z, r]): Rect => [x - r + 0.1, z - r + 0.1, x + r - 0.1, z + r - 0.1]),
  ...APARCADOS.map(([x, z]): Rect => [x - 0.5, z - 1, x + 0.5, z + 1]),
];
