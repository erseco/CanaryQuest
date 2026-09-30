import { ISLAS, RUTAS_BARCO, buscarTerminal, type IslaId, type Terminal } from '../data/islas';

export type MedioTransporte = 'barco' | 'avion';

export interface Destino {
  isla: IslaId;
  terminal: Terminal;
  /** Naviera del ferry, o Binter en avión. */
  compania: string;
}

export function medioDe(terminal: Terminal): MedioTransporte {
  return terminal.tipo === 'puerto' ? 'barco' : 'avion';
}

/**
 * Destinos desde una terminal.
 * Puerto: las líneas de RUTAS_BARCO que salen de ese puerto (simétricas).
 * Aeropuerto: el primer aeropuerto de cada otra isla (red interinsular de Binter).
 */
export function destinosDesde(terminalId: string): Destino[] {
  const origen = buscarTerminal(terminalId);
  if (origen === null) return [];
  if (origen.terminal.tipo === 'aeropuerto') {
    return Object.values(ISLAS)
      .filter((i) => i.id !== origen.isla.id)
      .flatMap((i) => {
        const aeropuerto = i.terminales.find((t) => t.tipo === 'aeropuerto');
        return aeropuerto ? [{ isla: i.id, terminal: aeropuerto, compania: 'Binter' }] : [];
      });
  }
  const destinos: Destino[] = [];
  for (const { a, b, naviera } of RUTAS_BARCO) {
    const otro = a === terminalId ? b : b === terminalId ? a : null;
    const destino = otro === null ? null : buscarTerminal(otro);
    if (destino) destinos.push({ isla: destino.isla.id, terminal: destino.terminal, compania: naviera });
  }
  return destinos;
}
