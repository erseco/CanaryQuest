const CLAVE = 'canaryquest-ajustes';

/** Preferencias del jugador (independientes de la partida). Volúmenes en 0..1. */
export interface Ajustes {
  /** Volumen general: música y efectos. */
  volumen: number;
  /** Volumen de la música, relativo al general. */
  musica: number;
}

const DEFECTO: Ajustes = { volumen: 1, musica: 0.5 };

const nivel = (v: unknown, defecto: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : defecto;

export const AjustesStore = {
  cargar(): Ajustes {
    try {
      const dato = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Ajustes>;
      return { volumen: nivel(dato.volumen, DEFECTO.volumen), musica: nivel(dato.musica, DEFECTO.musica) };
    } catch {
      return { ...DEFECTO };
    }
  },

  guardar(ajustes: Ajustes): void {
    localStorage.setItem(CLAVE, JSON.stringify(ajustes));
  },
};
