// El canal separa los dos paseos. El puente es el único cruce.
export const PASTOR = { x: 4.5, z: 1 };
export const INICIO = { x: -5, z: 2.8 };
export type PuntoPuerto = typeof INICIO;

export function transitable(x: number, z: number): boolean {
  if (Math.abs(x) > 9.3 || z < -0.45 || z > 3.15) return false;
  return Math.abs(x) >= 1.75 || Math.abs(z - 1) <= 0.65;
}

export function rutaPuerto(desde: PuntoPuerto, hasta: PuntoPuerto): PuntoPuerto[] {
  if (!transitable(hasta.x, hasta.z)) return [];
  if (
    Math.sign(desde.x) === Math.sign(hasta.x) &&
    Math.min(Math.abs(desde.x), Math.abs(hasta.x)) >= 1.75
  )
    return [hasta];
  return [{ x: desde.x, z: 1 }, { x: hasta.x, z: 1 }, hasta];
}

export function alturaPaseo(x: number, z: number): number {
  return Math.abs(z - 1) <= 0.85 && Math.abs(x) < 2.2 ? 0.38 * Math.cos((x * Math.PI) / 4.4) : 0;
}
