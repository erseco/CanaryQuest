import { PUEBLOS, type Pueblo, type CasaPuerto } from '../data/pueblos';

export const PASTOR = { x: 4.5, z: 1 };
export const INICIO = { x: -5, z: 2.8 };
export const MUELLE = { x: -6.5, z: 3.35 };
/** Salida por carretera hacia el otro pueblo: en Mogán queda al final del barrio del espigón. */
export const camino = (pueblo: Pueblo) => ({ x: pueblo === 'mogan' ? 30.6 : 13.5, z: -5.3 });
export type PuntoPuerto = typeof INICIO;
export const umbral = (c: CasaPuerto) => ({ x: c.x, z: c.z + c.fondo / 2 + 0.52 });

type Rect = [number, number, number, number];
/** Centro de cada canal; su puente lo cruza a la altura de z = 1. */
export const CANALES: Record<Pueblo, number[]> = { mogan: [0, 16.6], agaete: [0] };
/** Rectángulo que abarca todo lo pisable de cada pueblo. Mogán suma la playa y el espigón. */
const ZONA: Record<Pueblo, Rect> = { mogan: [-30.4, -9.8, 31.1, 12.9], agaete: [-14.5, -9.8, 14.5, 3.4] };
export const ESPIGON = { x: 24.9, ancho: 2.2 };
function obstaculos(pueblo: Pueblo): Rect[] {
  const casas: Rect[] = PUEBLOS[pueblo].casas.map((c) => [
    c.x - c.ancho / 2 - 0.17,
    c.z - c.fondo / 2 - 0.17,
    c.x + c.ancho / 2 + 0.17,
    c.z + c.fondo / 2 + 0.17,
  ]);
  const canales = CANALES[pueblo].flatMap((c): Rect[] => [
    [c - 1.75, -5.1, c + 1.75, 0.35],
    [c - 1.75, 1.65, c + 1.75, 4],
  ]);
  if (pueblo === 'agaete') return [...casas, ...canales];
  const borde = ESPIGON.ancho / 2 - 0.15;
  return [
    ...casas,
    ...canales,
    [-14.4, 3.45, ESPIGON.x - borde, 99], // mar entre la playa y el espigón
    [ESPIGON.x + borde, 3.45, 99, 99], // mar al este del espigón
    [-99, 4.85, -14.4, 99], // mar frente a la playa
    [-15, -0.3, -14.4, 4.85], // muro del muelle: la arena queda más baja
    [-99, -99, -14.6, -6.05], // matorral tras la playa
  ];
}
const limites = { mogan: obstaculos('mogan'), agaete: obstaculos('agaete') };
export function transitable(x: number, z: number, pueblo: Pueblo = 'mogan') {
  const [x0, z0, x1, z1] = ZONA[pueblo];
  return (
    x >= x0 &&
    x <= x1 &&
    z >= z0 &&
    z <= z1 &&
    !limites[pueblo].some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d)
  );
}
function cruza(a: PuntoPuerto, b: PuntoPuerto, [x0, z0, x1, z1]: Rect) {
  let entrada = 0,
    salida = 1;
  for (const [valor, delta, min, max] of [
    [a.x, b.x - a.x, x0, x1],
    [a.z, b.z - a.z, z0, z1],
  ]) {
    if (delta === 0) {
      if (valor < min || valor > max) return false;
      continue;
    }
    const t0 = (min - valor) / delta,
      t1 = (max - valor) / delta;
    entrada = Math.max(entrada, Math.min(t0, t1));
    salida = Math.min(salida, Math.max(t0, t1));
    if (entrada > salida) return false;
  }
  return true;
}
// El camino directo sirve en la plaza. En callejones, la cuadrícula busca rodeos
// y la comprobación final elimina los recodos que el jugador puede atravesar en línea recta.
export function rutaPuerto(
  desde: PuntoPuerto,
  hasta: PuntoPuerto,
  pueblo: Pueblo = 'mogan',
): PuntoPuerto[] {
  if (!transitable(hasta.x, hasta.z, pueblo)) return [];
  const libre = (a: PuntoPuerto, b: PuntoPuerto) =>
    transitable(b.x, b.z, pueblo) && !limites[pueblo].some((rect) => cruza(a, b, rect));
  if (libre(desde, hasta)) return [hasta];
  const cola = [desde],
    padres = [-1],
    vistos = new Set<string>();
  for (let i = 0; i < cola.length; i++) {
    const p = cola[i];
    if (libre(p, hasta)) {
      const ruta = [hasta];
      for (let j = i; j > 0; j = padres[j]) ruta.unshift(cola[j]);
      let anterior = desde;
      return ruta.filter((pt, k) => {
        if (k + 1 < ruta.length && libre(anterior, ruta[k + 1])) return false;
        anterior = pt;
        return true;
      });
    }
    for (const [dx, dz] of [
      [0.5, 0],
      [-0.5, 0],
      [0, 0.5],
      [0, -0.5],
    ]) {
      const q = { x: Math.round(p.x * 2) / 2 + dx, z: Math.round(p.z * 2) / 2 + dz },
        clave = q.x + ',' + q.z;
      if (!vistos.has(clave) && libre(p, q)) {
        vistos.add(clave);
        cola.push(q);
        padres.push(i);
      }
    }
  }
  return [];
}
/** Altura del suelo: la joroba de cada puente y la arena de la playa bajando hacia el agua. */
export function alturaPaseo(x: number, z: number): number {
  if (x < -14.5) return z > 0 ? -0.16 * z : 0;
  if (Math.abs(z - 1) > 0.85) return 0;
  const canal = CANALES.mogan.find((c) => Math.abs(x - c) < 2.2);
  return canal === undefined ? 0 : 0.38 * Math.cos(((x - canal) * Math.PI) / 4.4);
}

export function sueloInterior(x: number, z: number) {
  return (
    Math.abs(x) <= 3.65 &&
    Math.abs(z) <= 2.8 &&
    !(x > 1.8 && z > -1.7 && z < 0.6) &&
    !(x < -2.1 && z < 0)
  );
}
