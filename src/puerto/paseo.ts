import { PUEBLOS, type Pueblo, type CasaPuerto } from '../data/pueblos';

export const PASTOR = { x: 4.5, z: 1 };
export const INICIO = { x: -5, z: 2.8 };
export const MUELLE = { x: -6.5, z: 3.35 };
export const CAMINO = { x: 13.5, z: -5.3 };
export type PuntoPuerto = typeof INICIO;
export const umbral = (c: CasaPuerto) => ({ x: c.x, z: c.z + c.fondo / 2 + 0.52 });

type Rect = [number, number, number, number];
function obstaculos(pueblo: Pueblo): Rect[] {
  const casas: Rect[] = PUEBLOS[pueblo].casas.map((c) => [
    c.x - c.ancho / 2 - 0.17,
    c.z - c.fondo / 2 - 0.17,
    c.x + c.ancho / 2 + 0.17,
    c.z + c.fondo / 2 + 0.17,
  ]);
  return [...casas, [-1.75, -5.1, 1.75, 0.35], [-1.75, 1.65, 1.75, 4]];
}
const limites = { mogan: obstaculos('mogan'), agaete: obstaculos('agaete') };
export function transitable(x: number, z: number, pueblo: Pueblo = 'mogan') {
  return (
    Math.abs(x) <= 14.5 &&
    z >= -9.8 &&
    z <= 3.4 &&
    !limites[pueblo].some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1)
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
export function alturaPaseo(x: number, z: number): number {
  return Math.abs(z - 1) <= 0.85 && Math.abs(x) < 2.2 ? 0.38 * Math.cos((x * Math.PI) / 4.4) : 0;
}

export function sueloInterior(x: number, z: number) {
  return (
    Math.abs(x) <= 3.65 &&
    Math.abs(z) <= 2.8 &&
    !(x > 1.8 && z > -1.7 && z < 0.6) &&
    !(x < -2.1 && z < 0)
  );
}
