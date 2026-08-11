import type { IslaId } from './islas';

export type PasoMision =
  | { tipo: 'hablar'; npc: string; dialogo: string }
  | { tipo: 'recoger'; item: string; cantidad: number }
  | { tipo: 'derrotar'; enemigo: string; cantidad: number }
  | { tipo: 'llegar'; poi: string };

export interface Mision {
  id: string;
  isla: IslaId;
  titulo: string;
  pasos: PasoMision[];
  /** Item que se entrega al completar (los símbolos abren el Teide). */
  recompensa: string;
}

export const MISIONES: Record<string, Mision> = {
  'aparejos-pescador': {
    id: 'aparejos-pescador',
    isla: 'la-graciosa',
    titulo: 'Los aparejos del pescador',
    pasos: [
      { tipo: 'hablar', npc: 'pescador', dialogo: 'pescador-encargo' },
      { tipo: 'recoger', item: 'aparejo', cantidad: 3 },
      { tipo: 'hablar', npc: 'pescador', dialogo: 'pescador-gracias' },
    ],
    recompensa: 'simbolo-la-graciosa',
  },
  'pastor-roque-nublo': {
    id: 'pastor-roque-nublo',
    isla: 'gran-canaria',
    titulo: 'El rebaño del Roque Nublo',
    pasos: [
      { tipo: 'hablar', npc: 'pastor', dialogo: 'pastor-encargo' },
      { tipo: 'recoger', item: 'cabra', cantidad: 3 },
      { tipo: 'derrotar', enemigo: 'alimana', cantidad: 1 },
      { tipo: 'hablar', npc: 'pastor', dialogo: 'pastor-gracias' },
    ],
    recompensa: 'simbolo-gran-canaria',
  },
  'agua-de-los-jameos': {
    id: 'agua-de-los-jameos',
    isla: 'lanzarote',
    titulo: 'El agua de los Jameos',
    pasos: [
      { tipo: 'hablar', npc: 'guardiana-jameos', dialogo: 'guardiana-encargo' },
      { tipo: 'llegar', poi: 'jameos-del-agua' },
      { tipo: 'recoger', item: 'agua-jameos', cantidad: 1 },
      { tipo: 'llegar', poi: 'crater-timanfaya' },
    ],
    recompensa: 'simbolo-lanzarote',
  },
  'queso-majorero': {
    id: 'queso-majorero',
    isla: 'fuerteventura',
    titulo: 'El queso majorero robado',
    pasos: [
      { tipo: 'hablar', npc: 'quesera', dialogo: 'quesera-encargo' },
      { tipo: 'hablar', npc: 'testigo-dunas', dialogo: 'testigo-pista' },
      { tipo: 'llegar', poi: 'betancuria' },
      { tipo: 'derrotar', enemigo: 'ladron', cantidad: 1 },
      { tipo: 'hablar', npc: 'quesera', dialogo: 'quesera-gracias' },
    ],
    recompensa: 'simbolo-fuerteventura',
  },
  'lente-del-observatorio': {
    id: 'lente-del-observatorio',
    isla: 'la-palma',
    titulo: 'La lente del observatorio',
    pasos: [
      { tipo: 'hablar', npc: 'astronoma', dialogo: 'astronoma-encargo' },
      { tipo: 'recoger', item: 'lente', cantidad: 1 },
      { tipo: 'llegar', poi: 'roque-de-los-muchachos' },
    ],
    recompensa: 'simbolo-la-palma',
  },
  'silbo-del-bosque': {
    id: 'silbo-del-bosque',
    isla: 'la-gomera',
    titulo: 'El silbo del bosque',
    pasos: [
      { tipo: 'hablar', npc: 'maestra-silbo', dialogo: 'silbo-leccion-1' },
      { tipo: 'hablar', npc: 'maestra-silbo', dialogo: 'silbo-leccion-2' },
      { tipo: 'llegar', poi: 'corazon-garajonay' },
    ],
    recompensa: 'simbolo-la-gomera',
  },
  'petroglifos-julan': {
    id: 'petroglifos-julan',
    isla: 'el-hierro',
    titulo: 'Los petroglifos de El Julan',
    pasos: [
      { tipo: 'hablar', npc: 'lagarto-gigante', dialogo: 'lagarto-encargo' },
      { tipo: 'recoger', item: 'fragmento-petroglifo', cantidad: 3 },
      { tipo: 'llegar', poi: 'el-julan' },
    ],
    recompensa: 'simbolo-el-hierro',
  },
  'mazmorra-del-teide': {
    id: 'mazmorra-del-teide',
    isla: 'tenerife',
    titulo: 'El corazón del Teide',
    pasos: [
      { tipo: 'llegar', poi: 'entrada-teide' },
      { tipo: 'derrotar', enemigo: 'guayota', cantidad: 1 },
      { tipo: 'hablar', npc: 'espiritu-teide', dialogo: 'final' },
    ],
    recompensa: 'simbolo-tenerife',
  },
};
