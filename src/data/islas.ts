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

/** Puerto de ferry o aeropuerto, con su posición dentro de la ilustración de la isla. */
export interface Terminal extends Punto {
  id: string;
  nombre: string;
  tipo: 'puerto' | 'aeropuerto';
  /** Posición sobre mapa-mundo.jpg (2752×1536), para el mapa de viaje. */
  mapa: Punto;
}

export interface Isla {
  id: IslaId;
  nombre: string;
  /** Ruta de la ilustración 1254×1254, o null si aún no hay arte. */
  ilustracion: string | null;
  /** Puertos y aeropuertos reales (el primer puerto es donde apareces al llegar sin destino). */
  terminales: Terminal[];
  /** Centro de la isla sobre mapa-mundo.jpg (2752×1536). */
  mapaMundo: Punto;
  /** Zonas de detalle (mapa Tiled `mapa`) para islas sin .tmj propio de overworld. */
  zonas?: Array<Punto & { mapa: string; etiqueta: string }>;
}

export const ISLAS: Record<IslaId, Isla> = {
  'la-palma': {
    id: 'la-palma',
    nombre: 'La Palma',
    ilustracion: 'assets/islas/la-palma.jpg',
    terminales: [
      { id: 'lp-santa-cruz', nombre: 'Puerto de Santa Cruz de La Palma', tipo: 'puerto', x: 1050, y: 620, mapa: { x: 398, y: 430 } },
      { id: 'lp-aeropuerto', nombre: 'Aeropuerto de La Palma', tipo: 'aeropuerto', x: 1000, y: 820, mapa: { x: 387, y: 538 } },
    ],
    mapaMundo: { x: 206, y: 413 },
  },
  'el-hierro': {
    id: 'el-hierro',
    nombre: 'El Hierro',
    ilustracion: 'assets/islas/el-hierro.jpg',
    terminales: [
      { id: 'eh-la-estaca', nombre: 'Puerto de La Estaca', tipo: 'puerto', x: 1040, y: 520, mapa: { x: 505, y: 1118 } },
      { id: 'eh-aeropuerto', nombre: 'Aeropuerto de El Hierro', tipo: 'aeropuerto', x: 1000, y: 380, mapa: { x: 473, y: 1064 } },
    ],
    mapaMundo: { x: 316, y: 1177 },
  },
  'la-gomera': {
    id: 'la-gomera',
    nombre: 'La Gomera',
    ilustracion: 'assets/islas/la-gomera.jpg',
    terminales: [
      { id: 'lg-san-sebastian', nombre: 'Puerto de San Sebastián de La Gomera', tipo: 'puerto', x: 1080, y: 790, mapa: { x: 1000, y: 1075 } },
      { id: 'lg-aeropuerto', nombre: 'Aeropuerto de La Gomera', tipo: 'aeropuerto', x: 700, y: 1030, mapa: { x: 860, y: 1268 } },
    ],
    mapaMundo: { x: 812, y: 1115 },
    zonas: [{ mapa: 'garajonay', etiqueta: 'Bosque de Garajonay', x: 630, y: 660 }],
  },
  tenerife: {
    id: 'tenerife',
    nombre: 'Tenerife',
    ilustracion: 'assets/islas/tenerife.jpg',
    terminales: [
      { id: 'tf-santa-cruz', nombre: 'Puerto de Santa Cruz de Tenerife', tipo: 'puerto', x: 1020, y: 400, mapa: { x: 1376, y: 237 } },
      { id: 'tf-los-cristianos', nombre: 'Puerto de Los Cristianos', tipo: 'puerto', x: 640, y: 1090, mapa: { x: 860, y: 796 } },
      { id: 'tf-norte', nombre: 'Aeropuerto Tenerife Norte', tipo: 'aeropuerto', x: 900, y: 330, mapa: { x: 1290, y: 258 } },
      { id: 'tf-sur', nombre: 'Aeropuerto Tenerife Sur', tipo: 'aeropuerto', x: 820, y: 1000, mapa: { x: 946, y: 774 } },
    ],
    mapaMundo: { x: 908, y: 509 },
  },
  'gran-canaria': {
    id: 'gran-canaria',
    nombre: 'Gran Canaria',
    ilustracion: 'assets/islas/gran-canaria.jpg',
    terminales: [
      { id: 'gc-las-palmas', nombre: 'Puerto de Las Palmas', tipo: 'puerto', x: 1030, y: 320, mapa: { x: 1774, y: 645 } },
      { id: 'gc-agaete', nombre: 'Puerto de Agaete', tipo: 'puerto', x: 250, y: 340, mapa: { x: 1344, y: 624 } },
      { id: 'gc-aeropuerto', nombre: 'Aeropuerto de Gran Canaria', tipo: 'aeropuerto', x: 1060, y: 700, mapa: { x: 1849, y: 968 } },
    ],
    mapaMundo: { x: 1555, y: 950 },
  },
  fuerteventura: {
    id: 'fuerteventura',
    nombre: 'Fuerteventura',
    ilustracion: 'assets/islas/fuerteventura.jpg',
    terminales: [
      { id: 'fv-puerto-rosario', nombre: 'Puerto del Rosario', tipo: 'puerto', x: 930, y: 560, mapa: { x: 2558, y: 925 } },
      { id: 'fv-corralejo', nombre: 'Puerto de Corralejo', tipo: 'puerto', x: 820, y: 200, mapa: { x: 2580, y: 645 } },
      { id: 'fv-morro-jable', nombre: 'Puerto de Morro Jable', tipo: 'puerto', x: 230, y: 1080, mapa: { x: 1935, y: 1333 } },
      { id: 'fv-aeropuerto', nombre: 'Aeropuerto de Fuerteventura', tipo: 'aeropuerto', x: 890, y: 760, mapa: { x: 2537, y: 1010 } },
    ],
    mapaMundo: { x: 2435, y: 991 },
    zonas: [{ mapa: 'betancuria', etiqueta: 'Betancuria y el malpaís', x: 560, y: 700 }],
  },
  lanzarote: {
    id: 'lanzarote',
    nombre: 'Lanzarote',
    ilustracion: 'assets/islas/lanzarote.jpg',
    terminales: [
      { id: 'lz-arrecife', nombre: 'Puerto de Arrecife', tipo: 'puerto', x: 830, y: 880, mapa: { x: 2343, y: 623 } },
      { id: 'lz-playa-blanca', nombre: 'Puerto de Playa Blanca', tipo: 'puerto', x: 330, y: 1010, mapa: { x: 2000, y: 709 } },
      { id: 'lz-orzola', nombre: 'Puerto de Órzola', tipo: 'puerto', x: 1000, y: 230, mapa: { x: 2537, y: 150 } },
      { id: 'lz-aeropuerto', nombre: 'Aeropuerto César Manrique-Lanzarote', tipo: 'aeropuerto', x: 740, y: 950, mapa: { x: 2257, y: 645 } },
    ],
    mapaMundo: { x: 2229, y: 399 },
    zonas: [
      { mapa: 'timanfaya', etiqueta: 'Montañas del Fuego (Timanfaya)', x: 560, y: 480 },
      { mapa: 'jameos', etiqueta: 'Jameos del Agua', x: 900, y: 700 },
    ],
  },
  'la-graciosa': {
    id: 'la-graciosa',
    nombre: 'La Graciosa',
    ilustracion: null,
    terminales: [{ id: 'lgr-caleta-sebo', nombre: 'Puerto de Caleta de Sebo', tipo: 'puerto', x: 627, y: 900, mapa: { x: 2440, y: 110 } }],
    mapaMundo: { x: 2462, y: 100 },
  },
};

/**
 * Líneas de ferry reales entre puertos (simétricas). Navieras: Fred. Olsen Express,
 * Naviera Armas y, a La Graciosa, Líneas Romero / Biosfera Express.
 */
export const RUTAS_BARCO: Array<{ a: string; b: string; naviera: string }> = [
  { a: 'gc-agaete', b: 'tf-santa-cruz', naviera: 'Fred. Olsen Express' },
  { a: 'gc-las-palmas', b: 'tf-santa-cruz', naviera: 'Naviera Armas' },
  { a: 'gc-las-palmas', b: 'fv-puerto-rosario', naviera: 'Naviera Armas' },
  { a: 'gc-las-palmas', b: 'fv-morro-jable', naviera: 'Naviera Armas' },
  { a: 'gc-las-palmas', b: 'lz-arrecife', naviera: 'Naviera Armas' },
  { a: 'tf-los-cristianos', b: 'lg-san-sebastian', naviera: 'Fred. Olsen Express' },
  { a: 'tf-los-cristianos', b: 'lp-santa-cruz', naviera: 'Naviera Armas' },
  { a: 'tf-los-cristianos', b: 'eh-la-estaca', naviera: 'Naviera Armas' },
  { a: 'tf-santa-cruz', b: 'lp-santa-cruz', naviera: 'Naviera Armas' },
  { a: 'lg-san-sebastian', b: 'lp-santa-cruz', naviera: 'Fred. Olsen Express' },
  { a: 'lz-playa-blanca', b: 'fv-corralejo', naviera: 'Fred. Olsen Express' },
  { a: 'lz-orzola', b: 'lgr-caleta-sebo', naviera: 'Líneas Romero' },
];

/** Busca una terminal por id en todas las islas. */
export function buscarTerminal(id: string): { isla: Isla; terminal: Terminal } | null {
  for (const isla of Object.values(ISLAS)) {
    const terminal = isla.terminales.find((t) => t.id === id);
    if (terminal) return { isla, terminal };
  }
  return null;
}
