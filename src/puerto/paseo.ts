import { PUEBLOS, type Pueblo, type CasaPuerto } from '../data/pueblos';

export const PASTOR = { x: 4.5, z: 1 };
export const INICIO = { x: -5, z: 2.8 };
export const MUELLE = { x: -6.5, z: 3.35 };
/** Salida por carretera hacia el otro pueblo: en Mogán queda al final del barrio del espigón. */
export const camino = (pueblo: Pueblo) =>
  PUEBLOS[pueblo].carretera ?? { x: pueblo === 'mogan' ? 30.6 : 13.5, z: -5.3 };
/** Donde se coge y se deja el barco. */
export const muelle = (pueblo: Pueblo) => PUEBLOS[pueblo].embarcadero ?? MUELLE;
/** Donde aparece el viajero al entrar sin venir de otro pueblo. */
export const inicio = (pueblo: Pueblo) => PUEBLOS[pueblo].inicio ?? INICIO;
export type PuntoPuerto = typeof INICIO;
export const umbral = (c: CasaPuerto) => ({ x: c.x, z: c.z + c.fondo / 2 + 0.52 });

type Rect = [number, number, number, number];
const PUEBLO_IDS = Object.keys(PUEBLOS) as Pueblo[];
/** Rectángulo que abarca todo lo pisable: las orillas, más la playa y el espigón donde los hay. */
function zona(pueblo: Pueblo): Rect {
  const { orillas, playa, espigon } = PUEBLOS[pueblo].plano;
  if (!orillas.length) return [0, 0, 0, 0]; // trazado propio: manda `suelos`
  return [
    playa ? -30.4 : Math.min(...orillas) - 6.2,
    -9.8,
    Math.max(...orillas) + 6.2,
    espigon !== undefined ? 12.9 : playa ? 4.85 : 3.4,
  ];
}
function obstaculos(pueblo: Pueblo): Rect[] {
  const { casas, plano } = PUEBLOS[pueblo];
  const rects: Rect[] = casas.map((c) => [
    c.x - c.ancho / 2 - 0.17,
    c.z - c.fondo / 2 - 0.17,
    c.x + c.ancho / 2 + 0.17,
    c.z + c.fondo / 2 + 0.17,
  ]);
  rects.push(...(plano.vallas ?? []));
  for (const c of plano.canales) rects.push([c - 1.75, -5.1, c + 1.75, 0.35], [c - 1.75, 1.65, c + 1.75, 4]);
  // Mar frente al muelle: todo salvo el ancho del espigón.
  const oeste = plano.playa ? -14.4 : -99;
  if (plano.espigon !== undefined)
    rects.push([oeste, 3.45, plano.espigon - 0.95, 99], [plano.espigon + 0.95, 3.45, 99, 99]);
  else if (plano.playa) rects.push([oeste, 3.45, 99, 99]);
  if (plano.playa)
    rects.push(
      [-99, 4.85, -14.4, 99], // mar frente a la playa
      [-15, -0.3, -14.4, 4.85], // muro del muelle: la arena queda más baja
      [-99, -99, -14.6, -6.05], // matorral tras la playa
    );
  return rects;
}
const zonas = Object.fromEntries(PUEBLO_IDS.map((p) => [p, zona(p)])) as Record<Pueblo, Rect>;
const limites = Object.fromEntries(PUEBLO_IDS.map((p) => [p, obstaculos(p)])) as Record<Pueblo, Rect[]>;
const dentro = ([a, b, c, d]: Rect, x: number, z: number, holgura = 0) =>
  x >= a - holgura && x <= c + holgura && z >= b - holgura && z <= d + holgura;
export function transitable(x: number, z: number, pueblo: Pueblo = 'mogan') {
  const { suelos } = PUEBLOS[pueblo].plano;
  // Trazado propio: se pisa donde hay suelo; en los demás, dentro del rectángulo del pueblo.
  // El centímetro de holgura deja doblar la esquina entre dos suelos a quien llega a ella por el
  // borde: el paso se da por recorrido de ruta cumplido a menos de 8 mm, y sin holgura el viajero
  // se quedaba rozando el borde de fuera, sin poder avanzar por ningún eje.
  const enSuelo = suelos ? suelos.some((s) => dentro(s.r, x, z, 0.01)) : dentro(zonas[pueblo], x, z);
  return enSuelo && !limites[pueblo].some((r) => dentro(r, x, z));
}
/** Tramo del segmento a→b que cae dentro del rectángulo, como fracciones de 0 a 1. */
function tramo(a: PuntoPuerto, b: PuntoPuerto, [x0, z0, x1, z1]: Rect): [number, number] | null {
  let entrada = 0,
    salida = 1;
  for (const [valor, delta, min, max] of [
    [a.x, b.x - a.x, x0, x1],
    [a.z, b.z - a.z, z0, z1],
  ]) {
    if (delta === 0) {
      if (valor < min || valor > max) return null;
      continue;
    }
    const t0 = (min - valor) / delta,
      t1 = (max - valor) / delta;
    entrada = Math.max(entrada, Math.min(t0, t1));
    salida = Math.min(salida, Math.max(t0, t1));
    if (entrada > salida) return null;
  }
  return [entrada, salida];
}
/** El segmento entero se puede caminar: no toca obstáculos ni se sale del suelo. */
function despejado(a: PuntoPuerto, b: PuntoPuerto, pueblo: Pueblo) {
  // Un pelo de holgura: rozar justo la esquina de un obstáculo también cuenta como tocarlo.
  const roza = ([x0, z0, x1, z1]: Rect) => tramo(a, b, [x0 - 1e-6, z0 - 1e-6, x1 + 1e-6, z1 + 1e-6]);
  if (!transitable(b.x, b.z, pueblo) || limites[pueblo].some(roza)) return false;
  const { suelos } = PUEBLOS[pueblo].plano;
  if (!suelos) return true; // el rectángulo del pueblo es convexo: bastan los extremos
  // Los tramos que pisan cada zona, puestos en fila, han de cubrir el segmento sin huecos.
  let cubierto = 0;
  for (const [t0, t1] of suelos
    .map((s) => tramo(a, b, s.r))
    .filter((t) => t !== null)
    .sort((p, q) => p[0] - q[0])) {
    if (t0 > cubierto + 1e-9) return false;
    cubierto = Math.max(cubierto, t1);
  }
  return cubierto >= 1 - 1e-9;
}
// El camino directo sirve en una plaza. En callejones y muelles la cuadrícula busca el rodeo
// y después se quitan los recodos que el viajero puede atravesar en línea recta.
export function rutaPuerto(
  desde: PuntoPuerto,
  hasta: PuntoPuerto,
  pueblo: Pueblo = 'mogan',
): PuntoPuerto[] {
  if (!transitable(hasta.x, hasta.z, pueblo)) return [];
  const libre = (a: PuntoPuerto, b: PuntoPuerto) => despejado(a, b, pueblo);
  if (libre(desde, hasta)) return [hasta];
  const cola = [desde],
    padres = [-1],
    vistos = new Set<string>();
  let fin = -1;
  for (let i = 0; i < cola.length && fin < 0; i++) {
    const p = cola[i];
    if (Math.hypot(p.x - hasta.x, p.z - hasta.z) < 0.8 && libre(p, hasta)) fin = i;
    else
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
  if (fin < 0) return [];
  const pasos = [hasta];
  for (let j = fin; j > 0; j = padres[j]) pasos.unshift(cola[j]);
  const ruta: PuntoPuerto[] = [];
  let ancla = desde;
  for (let k = 0; k < pasos.length; ) {
    let m = k;
    while (m + 1 < pasos.length && libre(ancla, pasos[m + 1])) m++;
    ruta.push((ancla = pasos[m]));
    k = m + 1;
  }
  return ruta;
}
/** Altura del suelo: la joroba de cada puente, la arena que baja al agua, un pantalán flotante. */
export function alturaPaseo(x: number, z: number, pueblo: Pueblo = 'mogan'): number {
  const { canales, playa, suelos, cota } = PUEBLOS[pueblo].plano;
  if (cota) return cota(x, z);
  if (suelos) {
    const s = suelos.find((s) => dentro(s.r, x, z));
    if (!s) return 0;
    if (s.y2 === undefined) return (s.y ?? 0) - (s.baja ?? 0) * Math.max(0, z - 3.7);
    // Rampa: de `y` a `y2` a lo largo de su eje.
    const [x0, z0, x1, z1] = s.r;
    const t = s.eje === 'x' ? (x - x0) / (x1 - x0) : (z - z0) / (z1 - z0);
    return (s.y ?? 0) + (s.y2 - (s.y ?? 0)) * t;
  }
  if (playa && x < -14.5) return z > 0 ? -0.16 * z : 0;
  if (Math.abs(z - 1) > 0.85) return 0;
  const canal = canales.find((c) => Math.abs(x - c) < 2.2);
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
