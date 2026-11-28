import geografia from './geografia.json';
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

/** ETRS89, norte arriba. Misma extensión que scripts/generar-carta.py. */
export function puntoCarta(longitud: number, latitud: number): Punto {
  return { x: (longitud + 18.53) * 2752 / 5.45, y: (29.83 - latitud) * 1536 / 2.68 };
}

export function proyectarLugar([longitud, latitud]: number[]): Punto {
  return puntoCarta(longitud, latitud);
}

/** Puerto de ferry o aeropuerto, con su posición dentro de la ilustración de la isla. */
export interface Terminal {
  id: string;
  nombre: string;
  tipo: 'puerto' | 'aeropuerto';
  /** Posición sobre carta-canarias.webp (2752×1536), para el mapa de viaje. */
  mapa: Punto;
}

export interface Isla {
  id: IslaId;
  nombre: string;
  /** Puertos y aeropuertos reales (el primer puerto es donde apareces al llegar sin destino). */
  terminales: Terminal[];
  /** Centro de la isla sobre carta-canarias.webp (2752×1536). */
  mapaMundo: Punto;
  /** Zonas de detalle (mapa Tiled `mapa`). */
  zonas?: Array<{ mapa: string; etiqueta: string }>;
}

export const ISLAS: Record<IslaId, Isla> = {
  'la-palma': {
    id: 'la-palma',
    nombre: 'La Palma',
    terminales: [
      { id: 'lp-santa-cruz', nombre: 'Puerto de Santa Cruz de La Palma', tipo: 'puerto', mapa: proyectarLugar(geografia['la-palma']['lp-santa-cruz']) },
      { id: 'lp-aeropuerto', nombre: 'Aeropuerto de La Palma', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['la-palma']['lp-aeropuerto']) },
    ],
    mapaMundo: puntoCarta(-17.85, 28.67),
  },
  'el-hierro': {
    id: 'el-hierro',
    nombre: 'El Hierro',
    terminales: [
      { id: 'eh-la-estaca', nombre: 'Puerto de La Estaca', tipo: 'puerto', mapa: proyectarLugar(geografia['el-hierro']['eh-la-estaca']) },
      { id: 'eh-aeropuerto', nombre: 'Aeropuerto de El Hierro', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['el-hierro']['eh-aeropuerto']) },
    ],
    mapaMundo: puntoCarta(-18.015, 27.745),
    zonas: [{ mapa:'la-restinga', etiqueta:'La Restinga' }, { mapa: 'orchilla', etiqueta:'Faro de Orchilla' }, { mapa: 'la-caleta', etiqueta: 'Piscinas de La Caleta' }, { mapa: 'valverde', etiqueta: 'Valverde' }],
  },
  'la-gomera': {
    id: 'la-gomera',
    nombre: 'La Gomera',
    terminales: [
      { id: 'lg-san-sebastian', nombre: 'Puerto de San Sebastián de La Gomera', tipo: 'puerto', mapa: proyectarLugar(geografia['la-gomera']['lg-san-sebastian']) },
      { id: 'lg-aeropuerto', nombre: 'Aeropuerto de La Gomera', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['la-gomera']['lg-aeropuerto']) },
    ],
    mapaMundo: puntoCarta(-17.23, 28.12),
    zonas: [{ mapa: 'garajonay', etiqueta: 'Bosque de Garajonay' }],
  },
  tenerife: {
    id: 'tenerife',
    nombre: 'Tenerife',
    terminales: [
      { id: 'tf-santa-cruz', nombre: 'Puerto de Santa Cruz de Tenerife', tipo: 'puerto', mapa: proyectarLugar(geografia['tenerife']['tf-santa-cruz']) },
      { id: 'tf-los-cristianos', nombre: 'Puerto de Los Cristianos', tipo: 'puerto', mapa: proyectarLugar(geografia['tenerife']['tf-los-cristianos']) },
      { id: 'tf-norte', nombre: 'Aeropuerto Tenerife Norte', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['tenerife']['tf-norte']) },
      { id: 'tf-sur', nombre: 'Aeropuerto Tenerife Sur', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['tenerife']['tf-sur']) },
    ],
    mapaMundo: puntoCarta(-16.54, 28.28),
  },
  'gran-canaria': {
    id: 'gran-canaria',
    nombre: 'Gran Canaria',
    terminales: [
      { id: 'gc-las-palmas', nombre: 'Puerto de Las Palmas', tipo: 'puerto', mapa: proyectarLugar(geografia['gran-canaria']['gc-las-palmas']) },
      { id: 'gc-agaete', nombre: 'Puerto de Agaete', tipo: 'puerto', mapa: proyectarLugar(geografia['gran-canaria']['gc-agaete']) },
      { id: 'gc-aeropuerto', nombre: 'Aeropuerto de Gran Canaria', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['gran-canaria']['gc-aeropuerto']) },
    ],
    mapaMundo: puntoCarta(-15.6, 27.96),
  },
  fuerteventura: {
    id: 'fuerteventura',
    nombre: 'Fuerteventura',
    terminales: [
      { id: 'fv-puerto-rosario', nombre: 'Puerto del Rosario', tipo: 'puerto', mapa: proyectarLugar(geografia['fuerteventura']['fv-puerto-rosario']) },
      { id: 'fv-corralejo', nombre: 'Puerto de Corralejo', tipo: 'puerto', mapa: proyectarLugar(geografia['fuerteventura']['fv-corralejo']) },
      { id: 'fv-morro-jable', nombre: 'Puerto de Morro Jable', tipo: 'puerto', mapa: proyectarLugar(geografia['fuerteventura']['fv-morro-jable']) },
      { id: 'fv-aeropuerto', nombre: 'Aeropuerto de Fuerteventura', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['fuerteventura']['fv-aeropuerto']) },
    ],
    mapaMundo: puntoCarta(-14.03, 28.36),
    zonas: [{ mapa: 'betancuria', etiqueta: 'Betancuria y el malpaís' }],
  },
  lanzarote: {
    id: 'lanzarote',
    nombre: 'Lanzarote',
    terminales: [
      { id: 'lz-arrecife', nombre: 'Puerto de Arrecife', tipo: 'puerto', mapa: proyectarLugar(geografia['lanzarote']['lz-arrecife']) },
      { id: 'lz-playa-blanca', nombre: 'Puerto de Playa Blanca', tipo: 'puerto', mapa: proyectarLugar(geografia['lanzarote']['lz-playa-blanca']) },
      { id: 'lz-orzola', nombre: 'Puerto de Órzola', tipo: 'puerto', mapa: proyectarLugar(geografia['lanzarote']['lz-orzola']) },
      { id: 'lz-aeropuerto', nombre: 'Aeropuerto César Manrique-Lanzarote', tipo: 'aeropuerto', mapa: proyectarLugar(geografia['lanzarote']['lz-aeropuerto']) },
    ],
    mapaMundo: puntoCarta(-13.64, 29.025),
    zonas: [
      { mapa: 'timanfaya', etiqueta: 'Montañas del Fuego (Timanfaya)' },
      { mapa: 'jameos', etiqueta: 'Jameos del Agua' },
      { mapa: 'yaiza', etiqueta: 'Yaiza' },
    ],
  },
  'la-graciosa': {
    id: 'la-graciosa',
    nombre: 'La Graciosa',
    terminales: [{ id: 'lgr-caleta-sebo', nombre: 'Puerto de Caleta de Sebo', tipo: 'puerto', mapa: proyectarLugar(geografia['la-graciosa']['lgr-caleta-sebo']) }],
    mapaMundo: puntoCarta(-13.51, 29.25),
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
