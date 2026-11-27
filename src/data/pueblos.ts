import type { IslaId } from './islas';

export type Pueblo = 'mogan' | 'agaete' | 'la-restinga';
/** Trazado del pueblo: con qué piezas de la maqueta se monta. */
export interface Plano {
  /** Centro de cada orilla de mampostería, de 13,4 de ancho. */
  orillas: number[];
  /** Centro de cada canal; su puente lo cruza a la altura de z = 1. */
  canales: number[];
  /** Playa al oeste del muelle. */
  playa?: boolean;
  /** Posición del espigón con faro. */
  espigon?: number;
  /** Arcos de buganvilla sobre la calle, en estas x. */
  arcos?: number[];
  /** Costa de lava negra en lugar de bolos ocres. */
  lava?: boolean;
  /** Palmeras: x, z y altura. */
  palmeras: [number, number, number][];
}
/** Pueblos vecinos a los que se sale por mar o por carretera. */
export interface Salidas {
  mar?: Pueblo | 'ferry';
  tierra?: Pueblo;
}
export interface CasaPuerto {
  nombre: string;
  x: number;
  z: number;
  ancho: number;
  alto: number;
  fondo: number;
  color: string;
}
function casa(
  nombre: string,
  x: number,
  z: number,
  ancho: number,
  alto: number,
  fondo: number,
  color: string,
): CasaPuerto {
  return { nombre, x, z, ancho, alto, fondo, color };
}
/** Lugar del pueblo al que se puede pasear y que se describe al llegar. */
export interface Rincon {
  nombre: string;
  x: number;
  z: number;
  texto: string;
}
export interface DatosPueblo {
  nombre: string;
  isla: IslaId;
  /** Punto del mapa de la isla por el que se entra y se sale. */
  poi: string;
  plano: Plano;
  salidas: Salidas;
  casas: CasaPuerto[];
  rincones: Rincon[];
}
export const PUEBLOS: Record<Pueblo, DatosPueblo> = {
  mogan: {
    nombre: 'Puerto de Mogán',
    isla: 'gran-canaria',
    poi: 'pueblo',
    plano: {
      orillas: [-8.3, 8.3, 24.9],
      canales: [0, 16.6],
      playa: true,
      espigon: 24.9,
      arcos: [-7.6, 6.35, 22.4, 26.8],
      palmeras: [
        [-9.3, 0, 3.6],
        [9.2, 0, 4.4],
        [-2.5, -4.7, 4.1],
        [5, -5.5, 4.8],
        [-9, -8.5, 4],
        [19.6, 0.2, 4.2],
        [30.4, 0, 3.8],
        [27.3, -8.9, 4.4],
        [-17.6, -2.4, 4.6],
        [-25.2, -3.4, 4],
        [-29, -0.8, 4.4],
        [-23.4, -6.4, 3.8],
      ],
    },
    salidas: { mar: 'agaete', tierra: 'agaete' },
    casas: [
      casa('Casa del pescador', -8, -2.25, 3.3, 2.6, 3.1, '#16697a'),
      casa('Casa de las buganvillas', -4.4, -2.6, 3.1, 3.5, 3.1, '#b96943'),
      casa('Taller de redes', 3.6, -2.7, 2.9, 2.4, 3.1, '#16697a'),
      casa('Lonja del muelle', 7.3, -2.6, 3.4, 3.3, 3, '#bc7642'),
      casa('Casa de la plaza', -10, -7.7, 3.4, 2.7, 2.6, '#678e85'),
      casa('Casa del alfarero', -5.4, -7.9, 3, 3.4, 2.6, '#a86e4c'),
      casa('Casa del reloj', -1.6, -7.7, 3, 3.6, 2.8, '#b89553'),
      casa('Casa del mirador', 4, -7.8, 3.2, 2.8, 2.4, '#658b82'),
      casa('Casa del patio', 9, -7.4, 3.8, 3, 3, '#16697a'),
      casa('Casa de la huerta', 12, -2.7, 2.7, 2, 2.6, '#79885c'),
      // Barrio del espigón, al otro lado del segundo canal.
      casa('Bodega del puerto', 20.6, -2.6, 3.2, 3.4, 3.1, '#b96943'),
      casa('Casa del farero', 24.7, -2.5, 3.2, 2.5, 3, '#16697a'),
      casa('Posada de las barcas', 28.9, -2.6, 3.4, 3.5, 3.1, '#bc7642'),
      casa('Panadería del barranco', 20.2, -7.7, 3.2, 2.8, 2.6, '#678e85'),
      casa('Casa de los arcos', 24.6, -7.8, 3.3, 3.5, 2.7, '#a86e4c'),
      casa('Casa de la parra', 29, -7.6, 3.4, 2.7, 2.8, '#b89553'),
      // Sobre la arena.
      casa('Chiringuito de la playa', -20.5, -4.2, 3.4, 2.3, 2.6, '#c9824a'),
    ],
    rincones: [
      { nombre: 'Playa de Mogán', x: -23, z: 1.6, texto: 'La arena dorada baja mansa hasta el agua, al abrigo del espigón.' },
      { nombre: 'Faro del espigón', x: 24.9, z: 12.2, texto: 'Desde la punta del espigón se ve todo el puerto, con sus arcos de buganvilla.' },
    ],
  },
  agaete: {
    nombre: 'Puerto de las Nieves',
    isla: 'gran-canaria',
    poi: 'gc-agaete',
    plano: {
      orillas: [-8.3, 8.3],
      canales: [0],
      palmeras: [
        [-9.3, 0, 3.6],
        [9.2, 0, 4.4],
        [-2.5, -4.7, 4.1],
        [5, -5.5, 4.8],
        [-9, -8.5, 4],
      ],
    },
    salidas: { mar: 'ferry', tierra: 'mogan' },
    casas: [
      casa('Cofradía de pescadores', -8, -2.7, 4.3, 2.7, 3, '#245589'),
      casa('Casa de la sal', -3.6, -3.5, 2.8, 2.1, 2.5, '#357899'),
      casa('Lonja de Agaete', 6.5, -3, 5.4, 2.5, 3.4, '#245589'),
      casa('Casa del marinero', 11.9, -3.4, 2.8, 3.4, 2.8, '#295784'),
      casa('Casa del almendro', -9, -8, 3.2, 2.7, 2.7, '#357899'),
      casa('Casa de la ermita', -1.6, -8, 3.4, 2.6, 3, '#225b8c'),
      casa('Taller de cerámica', 5, -7.8, 3, 2.7, 2.5, '#39739b'),
    ],
    rincones: [],
  },
  // Pueblo pesquero del sur de El Hierro: un muelle corrido, sin canal, sobre lava negra.
  'la-restinga': {
    nombre: 'La Restinga',
    isla: 'el-hierro',
    poi: 'la-restinga',
    plano: {
      orillas: [-6.7, 6.7],
      canales: [],
      espigon: 11.2,
      lava: true,
      palmeras: [
        [-11.7, 0.2, 3.6],
        [-0.9, -5.2, 4.4],
        [11.4, -5.6, 4],
      ],
    },
    salidas: {},
    casas: [
      casa('Cofradía de pescadores', -9.6, -2.6, 3.6, 2.6, 3.1, '#1f6f8b'),
      casa('Centro de buceo', -5.2, -2.7, 3.2, 3.4, 3.1, '#2a8a7a'),
      casa('Casa del patrón', -0.9, -2.6, 3, 2.5, 3, '#c27a45'),
      casa('Casa de las redes', 3.1, -2.7, 3, 3.3, 3.1, '#6d8f5e'),
      casa('Bar del muelle', 7.3, -2.6, 3.4, 2.6, 3, '#1f6f8b'),
      casa('Casa del volcán', -8.5, -7.7, 3.4, 2.8, 2.7, '#8a6a52'),
      casa('Casa de la lapa', -3.6, -7.8, 3.2, 3.5, 2.7, '#2a8a7a'),
      casa('Casa del mar de las Calmas', 1.6, -7.7, 3.4, 2.7, 2.6, '#1f6f8b'),
      casa('Casa del faro viejo', 7.4, -7.8, 3.3, 3.4, 2.8, '#b3703f'),
    ],
    rincones: [
      { nombre: 'Pantalán de los pescadores', x: 11.2, z: 12.2, texto: 'Las barcas cabecean amarradas al pantalán. Más allá del faro se abre el mar de las Calmas.' },
    ],
  },
};
