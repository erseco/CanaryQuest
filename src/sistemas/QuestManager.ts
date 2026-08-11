import { MISIONES, type PasoMision } from '../data/misiones';
import type { EstadoMision } from './SaveManager';

export interface EventoJuego {
  tipo: 'hablar' | 'recoger' | 'derrotar' | 'llegar';
  objetivo: string;
}

/** Objetivo textual de un paso, para casar eventos con pasos. */
function objetivoDelPaso(paso: PasoMision): string {
  switch (paso.tipo) {
    case 'hablar':
      return paso.npc;
    case 'recoger':
      return paso.item;
    case 'derrotar':
      return paso.enemigo;
    case 'llegar':
      return paso.poi;
  }
}

function cantidadDelPaso(paso: PasoMision): number {
  return paso.tipo === 'recoger' || paso.tipo === 'derrotar' ? paso.cantidad : 1;
}

export class QuestManager {
  private estado: Record<string, EstadoMision>;

  constructor(estado: Record<string, EstadoMision>) {
    this.estado = structuredClone(estado);
  }

  activar(id: string): void {
    if (!(id in MISIONES)) throw new Error(`Misión desconocida: ${id}`);
    const actual = this.estado[id];
    if (actual === undefined || actual.estado === 'pendiente') {
      this.estado[id] = { estado: 'activa', paso: 0, progreso: 0 };
    }
  }

  pasoActual(id: string): PasoMision | null {
    const e = this.estado[id];
    if (e === undefined || e.estado !== 'activa') return null;
    return MISIONES[id].pasos[e.paso] ?? null;
  }

  progreso(id: string): number {
    return this.estado[id]?.progreso ?? 0;
  }

  estaActiva(id: string): boolean {
    return this.estado[id]?.estado === 'activa';
  }

  estaCompletada(id: string): boolean {
    return this.estado[id]?.estado === 'completada';
  }

  /** Devuelve los ids de misiones que avanzaron de paso con este evento. */
  notificar(evento: EventoJuego): string[] {
    const avanzadas: string[] = [];
    for (const [id, e] of Object.entries(this.estado)) {
      if (e.estado !== 'activa') continue;
      const paso = MISIONES[id].pasos[e.paso];
      if (paso === undefined) continue;
      if (paso.tipo !== evento.tipo) continue;
      if (objetivoDelPaso(paso) !== evento.objetivo) continue;
      e.progreso += 1;
      if (e.progreso < cantidadDelPaso(paso)) continue;
      e.paso += 1;
      e.progreso = 0;
      if (e.paso >= MISIONES[id].pasos.length) {
        e.estado = 'completada';
      }
      avanzadas.push(id);
    }
    return avanzadas;
  }

  exportar(): Record<string, EstadoMision> {
    return structuredClone(this.estado);
  }
}
