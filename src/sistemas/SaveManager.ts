import type { IslaId } from '../data/islas';

export interface EstadoMision {
  estado: 'pendiente' | 'activa' | 'completada';
  paso: number;
  /** Progreso dentro del paso actual (p. ej. 2 de 3 cabras). */
  progreso: number;
}

export interface Partida {
  version: 1;
  islaActual: IslaId;
  simbolos: IslaId[];
  misiones: Record<string, EstadoMision>;
  inventario: string[];
  corazones: number;
}

const CLAVE = 'canaryquest-partida';

function esPartidaValida(dato: unknown): dato is Partida {
  if (typeof dato !== 'object' || dato === null) return false;
  const p = dato as Record<string, unknown>;
  return (
    p.version === 1 &&
    typeof p.islaActual === 'string' &&
    Array.isArray(p.simbolos) &&
    typeof p.misiones === 'object' &&
    p.misiones !== null &&
    Array.isArray(p.inventario) &&
    typeof p.corazones === 'number'
  );
}

export const SaveManager = {
  nueva(): Partida {
    return {
      version: 1,
      islaActual: 'gran-canaria',
      simbolos: [],
      misiones: {},
      inventario: [],
      corazones: 3,
    };
  },

  cargar(): Partida | null {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo === null) return null;
    try {
      const dato: unknown = JSON.parse(crudo);
      return esPartidaValida(dato) ? dato : null;
    } catch {
      return null;
    }
  },

  guardar(partida: Partida): void {
    localStorage.setItem(CLAVE, JSON.stringify(partida));
  },

  borrar(): void {
    localStorage.removeItem(CLAVE);
  },
};
