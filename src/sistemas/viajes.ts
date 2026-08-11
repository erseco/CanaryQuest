import { ISLAS, RUTAS_BARCO, type IslaId } from '../data/islas';

export type MedioTransporte = 'barco' | 'avion';

/**
 * Islas alcanzables desde `islaId` con el medio dado.
 * Avión: todas las islas con aeropuerto entre sí (red de Binter).
 * Barco: rutas de ferry definidas en RUTAS_BARCO (simétricas).
 */
export function destinosDesde(islaId: IslaId, medio: MedioTransporte): IslaId[] {
  if (medio === 'avion') {
    if (ISLAS[islaId].aeropuerto === null) return [];
    return Object.values(ISLAS)
      .filter((i) => i.id !== islaId && i.aeropuerto !== null)
      .map((i) => i.id);
  }
  const destinos: IslaId[] = [];
  for (const [a, b] of RUTAS_BARCO) {
    if (a === islaId) destinos.push(b);
    if (b === islaId) destinos.push(a);
  }
  return destinos;
}
