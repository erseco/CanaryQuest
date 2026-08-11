export type IslaId =
  | 'el-hierro'
  | 'fuerteventura'
  | 'gran-canaria'
  | 'la-gomera'
  | 'la-graciosa'
  | 'la-palma'
  | 'lanzarote'
  | 'tenerife';

export interface Punto {
  x: number;
  y: number;
}

export interface Isla {
  id: IslaId;
  nombre: string;
  /** Ruta de la ilustración 1254×1254, o null si aún no hay arte. */
  ilustracion: string | null;
  /** Posición del puerto dentro de la ilustración. */
  puerto: Punto | null;
  /** Posición del aeropuerto dentro de la ilustración. */
  aeropuerto: Punto | null;
  /** Centro de la isla sobre mapa-mundo.jpg (2752×1536). */
  mapaMundo: Punto;
}

export const ISLAS: Record<IslaId, Isla> = {
  'la-palma': {
    id: 'la-palma',
    nombre: 'La Palma',
    ilustracion: 'assets/islas/la-palma.jpg',
    puerto: { x: 340, y: 780 },
    aeropuerto: { x: 950, y: 640 },
    mapaMundo: { x: 206, y: 413 },
  },
  'el-hierro': {
    id: 'el-hierro',
    nombre: 'El Hierro',
    ilustracion: 'assets/islas/el-hierro.jpg',
    puerto: { x: 990, y: 950 },
    aeropuerto: { x: 900, y: 780 },
    mapaMundo: { x: 316, y: 1177 },
  },
  'la-gomera': {
    id: 'la-gomera',
    nombre: 'La Gomera',
    ilustracion: 'assets/islas/la-gomera.jpg',
    puerto: { x: 1090, y: 790 },
    aeropuerto: { x: 700, y: 1030 },
    mapaMundo: { x: 812, y: 1115 },
  },
  tenerife: {
    id: 'tenerife',
    nombre: 'Tenerife',
    ilustracion: 'assets/islas/tenerife.jpg',
    puerto: { x: 640, y: 1120 },
    aeropuerto: { x: 870, y: 990 },
    mapaMundo: { x: 908, y: 509 },
  },
  'gran-canaria': {
    id: 'gran-canaria',
    nombre: 'Gran Canaria',
    ilustracion: 'assets/islas/gran-canaria.jpg',
    puerto: { x: 250, y: 950 },
    aeropuerto: { x: 1060, y: 700 },
    mapaMundo: { x: 1555, y: 950 },
  },
  fuerteventura: {
    id: 'fuerteventura',
    nombre: 'Fuerteventura',
    ilustracion: 'assets/islas/fuerteventura.jpg',
    puerto: { x: 220, y: 1120 },
    aeropuerto: { x: 890, y: 760 },
    mapaMundo: { x: 2435, y: 991 },
  },
  lanzarote: {
    id: 'lanzarote',
    nombre: 'Lanzarote',
    ilustracion: 'assets/islas/lanzarote.jpg',
    puerto: { x: 830, y: 880 },
    aeropuerto: { x: 740, y: 950 },
    mapaMundo: { x: 2229, y: 399 },
  },
  'la-graciosa': {
    id: 'la-graciosa',
    nombre: 'La Graciosa',
    ilustracion: null,
    puerto: { x: 627, y: 900 },
    aeropuerto: null,
    mapaMundo: { x: 2092, y: 248 },
  },
};

/** Rutas de ferry simplificadas (Fred Olsen / Naviera Armas / Líneas Romero). */
export const RUTAS_BARCO: Array<[IslaId, IslaId]> = [
  ['tenerife', 'gran-canaria'],
  ['tenerife', 'la-gomera'],
  ['tenerife', 'la-palma'],
  ['tenerife', 'el-hierro'],
  ['la-gomera', 'la-palma'],
  ['gran-canaria', 'fuerteventura'],
  ['gran-canaria', 'lanzarote'],
  ['fuerteventura', 'lanzarote'],
  ['lanzarote', 'la-graciosa'],
];
