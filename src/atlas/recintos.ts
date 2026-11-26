// Vértices trazados sobre los recortes PNOA, en píxeles de la ortofoto (norte arriba).
export type XY = [number, number];
export const VASOS: XY[][] = [
  [
    [441, 243],
    [451, 242],
    [459, 249],
    [462, 259],
    [471, 266],
    [482, 270],
    [491, 281],
    [495, 292],
    [489, 298],
    [468, 305],
    [460, 302],
    [449, 290],
    [441, 278],
    [435, 262],
    [435, 251],
  ],
  [
    [404, 341],
    [417, 336],
    [425, 330],
    [429, 317],
    [435, 316],
    [438, 322],
    [438, 331],
    [445, 335],
    [451, 343],
    [448, 350],
    [436, 361],
    [420, 368],
    [405, 369],
    [397, 365],
    [397, 355],
  ],
  [
    [441, 318],
    [451, 311],
    [464, 312],
    [468, 316],
    [462, 326],
    [456, 332],
    [448, 332],
    [442, 327],
  ],
];
export const SOLARIUM: XY[] = [
  [309, 264],
  [362, 239],
  [409, 221],
  [437, 215],
  [464, 222],
  [472, 236],
  [500, 248],
  [523, 239],
  [535, 245],
  [526, 273],
  [495, 284],
  [500, 297],
  [484, 311],
  [494, 323],
  [489, 341],
  [469, 357],
  [434, 378],
  [400, 384],
  [378, 381],
  [368, 361],
  [348, 346],
  [330, 330],
];
export const PLAZA: XY[] = [
  [262, 303],
  [501, 205],
  [558, 290],
  [308, 391],
];
export function contiene(p: XY, poligono: XY[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [x, y] = poligono[i],
      [a, b] = poligono[j];
    if (y > p[1] !== b > p[1] && p[0] < ((a - x) * (p[1] - y)) / (b - y) + x) dentro = !dentro;
  }
  return dentro;
}
export function paseable(caleta: boolean, p: XY) {
  return caleta ? contiene(p, SOLARIUM) && !VASOS.some((v) => contiene(p, v)) : contiene(p, PLAZA);
}
