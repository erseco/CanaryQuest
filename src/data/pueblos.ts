import type { IslaId } from './islas';
import { SUELOS as SUELOS_CALETA, VALLAS as VALLAS_CALETA } from '../puerto/sitios/caleta-plano';

export type Pueblo = 'mogan' | 'agaete' | 'la-restinga' | 'orchilla' | 'la-caleta';
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
  /** Lugar con trazado propio en `src/puerto/sitios`, en vez del pueblo de orillas y canales. */
  sitio?: 'restinga' | 'orchilla' | 'caleta';
  /** Casas blancas de azotea, por plantas, en lugar de las de teja y buganvilla. */
  estilo?: 'blanca';
  /** Zonas pisables de un trazado propio: rectángulo x0, z0, x1, z1 y su altura. */
  suelos?: Suelo[];
  /** Recintos cerrados dentro de esas zonas: naves, vallados. */
  vallas?: [number, number, number, number][];
  /** z de la orilla, donde el agua clarea; 3,7 (el borde del muelle) si se omite. */
  costa?: number;
  /** Lugar sin alumbrado: de noche no se encienden farolas. */
  sinFaroles?: boolean;
  /** Lugar de interior (una plaza, un casco viejo): no se dibuja el agua del puerto. */
  sinMar?: boolean;
}
export interface Suelo {
  r: [number, number, number, number];
  /** Altura del suelo; 0 si se omite. Con `y2`, la del borde norte u oeste de una rampa. */
  y?: number;
  /** Altura en el borde opuesto: el suelo sube o baja de uno a otro a lo largo de `eje`. */
  y2?: number;
  /** Eje de la rampa: 'z' (de norte a sur) si se omite. */
  eje?: 'x' | 'z';
  /** Pendiente con la que baja hacia el mar a partir del borde de la avenida (z = 3,7). */
  baja?: number;
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
  /** Dónde aparece el viajero; junto al embarcadero si se omite. */
  inicio?: { x: number; z: number };
  /** Punto del muelle donde se coge y se deja el barco de `salidas.mar`. */
  embarcadero?: { x: number; z: number };
  /** Punto por el que se sale por carretera hacia `salidas.tierra`, y se llega desde allí. */
  carretera?: { x: number; z: number };
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
  // El Hierro. Trazado sobre la ortofoto PNOA: avenida al norte, playa negra y pantalán en el
  // fondo de la bahía, muelle viejo al oeste, varadero al este y el dique rompeolas cerrando el sur.
  'la-restinga': {
    nombre: 'La Restinga',
    isla: 'el-hierro',
    poi: 'la-restinga',
    plano: {
      orillas: [],
      canales: [],
      lava: true,
      sitio: 'restinga',
      estilo: 'blanca',
      palmeras: [
        [-24, 1.9, 3.8],
        [-12.6, 2, 4.2],
        [-1.4, 2.1, 3.6],
        [10.8, 1.4, 4],
      ],
      suelos: [
        { r: [-29.5, -3.1, 13, 3.4] }, // avenida marítima
        { r: [3, 3.4, 12.7, 8.6], baja: 0.141 }, // playa de arena negra
        { r: [0.1, 3.4, 2.3, 9.2], baja: 0.141 }, // rampa
        { r: [0.6, 9.2, 1.8, 19.8], y: -0.6 }, // pantalán flotante
        { r: [-3.5, 12.5, 0.6, 13.5], y: -0.6 }, // su brazo
        { r: [-19, 3.4, -17, 17.6] }, // muelle viejo
        { r: [13, -3.1, 36.5, 26.3] }, // explanada del puerto
        { r: [-26.5, 26.3, 36.5, 28.7] }, // dique rompeolas, hasta las casetas del muro
      ],
      vallas: [
        [19.5, 3, 34.5, 14.5], // varadero
        [23.8, 16.3, 34.2, 21.7], // nave de la cofradía
      ],
    },
    salidas: {},
    casas: [
      casa('Bar de la avenida', -27, -4.8, 4.2, 3.6, 3.2, '#2f6f9f'),
      casa('Apartamentos del faro', -22, -4.9, 4.6, 5.3, 3.4, '#3c8d7a'),
      casa('Centro de buceo', -16.6, -4.8, 4.2, 3.7, 3.2, '#1f6f8b'),
      casa('Casa del patrón', -11.8, -4.7, 3.6, 2.6, 3, '#b8863b'),
      casa('Tasca del mar de las Calmas', -6.9, -4.9, 4.6, 5.2, 3.4, '#2f6f9f'),
      casa('Pescadería', -1.9, -4.8, 3.8, 3.6, 3.2, '#3c8d7a'),
      casa('Apartamentos de la playa', 3.4, -4.9, 4.8, 5.3, 3.4, '#1f6f8b'),
      casa('Casa de las lapas', 8.6, -4.7, 3.8, 2.7, 3, '#b8863b'),
      casa('Cofradía de pescadores', 19.5, 22.6, 4.2, 2.8, 3.2, '#2f6f9f'),
    ],
    rincones: [
      { nombre: 'Playa de La Restinga', x: 8, z: 6, texto: 'Arena negra de volcán, al abrigo del dique. El agua aquí casi no se mueve.' },
      { nombre: 'Pantalán', x: 1.2, z: 18.6, texto: 'Las barcas de pesca y las zodiacs de los buceadores se mecen amarradas a los dos lados.' },
      { nombre: 'Muelle viejo', x: -18, z: 16.6, texto: 'El primer abrigo que tuvo el pueblo, antes de que levantaran el dique.' },
      { nombre: 'Varadero', x: 17.6, z: 9, texto: 'Aquí sacan los barcos a tierra para carenarlos. El pórtico azul los levanta del agua.' },
      { nombre: 'Dique rompeolas', x: -21, z: 28, texto: 'Al otro lado del muro rompe el mar abierto. Frente a esta punta nació en 2011 el volcán Tagoro.' },
    ],
  },
  // El Hierro, punta oeste. El faro sobre el malpaís, la pista que baja al embarcadero por el
  // que llegó su piedra y la senda al monumento del antiguo meridiano cero.
  orchilla: {
    nombre: 'Faro de Orchilla',
    isla: 'el-hierro',
    poi: 'orchilla',
    plano: {
      orillas: [],
      canales: [],
      lava: true,
      sitio: 'orchilla',
      palmeras: [],
      costa: 12,
      sinFaroles: true,
      suelos: [
        { r: [-9, -13, 9, -5], y: 3.2 }, // explanada del faro
        { r: [6, -5, 9, 1], y: 3.2, y2: 2 }, // la pista baja hacia el sur
        { r: [-8, 1, 9, 4], y: 1, y2: 2, eje: 'x' }, // revuelve al oeste
        { r: [-11, 1, -8, 9], y: 1, y2: 0.3 }, // y vuelve a bajar
        { r: [-11, 9, 2, 12], y: 0.3 }, // tramo de costa
        { r: [-2, 12, 2, 17], y: 0.3 }, // embarcadero
        { r: [-20, -10, -9, -7.5], y: 2.2, y2: 3.2, eje: 'x' }, // senda al monumento
        { r: [-24, -11.5, -20, -6], y: 2.2 }, // plazoleta del meridiano
      ],
      vallas: [
        [-6.3, -10.9, -2.7, -7.3], // torre del faro
        [-2, -12.7, 7.3, -6.4], // casa del farero
        [-22.9, -9.6, -21.1, -7.8], // monolito
      ],
    },
    salidas: {},
    casas: [],
    inicio: { x: 8, z: -5.6 },
    rincones: [
      { nombre: 'Faro de Orchilla', x: -7.4, z: -6, texto: 'Piedra gris de cantería sobre la lava. Desde 1933 es la última luz de España hacia poniente.' },
      { nombre: 'Monumento al Meridiano Cero', x: -20.6, z: -8.7, texto: 'Por aquí pasó durante siglos el meridiano cero de los mapas, antes de que se lo llevaran a Greenwich.' },
      { nombre: 'Embarcadero de Orchilla', x: 0, z: 16, texto: 'Por este muellito desembarcaron la piedra y la linterna del faro. Hoy el agua quieta invita a bañarse.' },
    ],
  },
  // El Hierro, costa de Valverde. Tres vasos de agua de mar sobre la lava, el solárium con sus
  // jardineras redondas, el mirador y la carretera en serpentina que baja del pueblo.
  // El trazado está en `src/puerto/sitios/caleta-plano.ts`.
  'la-caleta': {
    nombre: 'Piscinas de La Caleta',
    isla: 'el-hierro',
    poi: 'la-caleta',
    plano: {
      orillas: [],
      canales: [],
      lava: true,
      sitio: 'caleta',
      estilo: 'blanca',
      costa: 22,
      sinFaroles: true,
      palmeras: [
        [18, 1.6, 6.9],
        [24.2, -3.6, 7.3],
        [29, 4.7, 6.9],
        [21.4, -12.8, 8.6],
        [38.4, -4, 7.8],
      ],
      suelos: SUELOS_CALETA,
      vallas: VALLAS_CALETA,
    },
    salidas: {},
    casas: [],
    inicio: { x: 6.2, z: 10.5 },
    rincones: [
      { nombre: 'Piscinas de La Caleta', x: 5.6, z: 15.6, texto: 'Tres vasos de agua de mar sobre la lava: el grande de arriba, junto al mirador, y abajo otro grande pegado a uno pequeño. Con la pleamar las olas saltan el muro y se forma una cascada.' },
      { nombre: 'Mirador de las piscinas', x: 11.6, z: 4, texto: 'Desde la azotea de la caseta redonda se ven los tres vasos sobre la lava, la carretera de curvas que baja del pueblo y la rompiente del este.' },
      { nombre: 'Solárium de las jardineras', x: -11.7, z: 9.4, texto: 'Cuatro jardineras redondas, tres de picón negro y una de tierra, entre parterres de tabaibas y verodes.' },
      { nombre: 'Escalera al mar', x: -6.6, z: 22.2, texto: 'Unos peldaños bajan desde la plataforma directos al océano. Solo para los días de mar en calma.' },
      { nombre: 'Camino de la costa', x: 38, z: 5.2, texto: 'La barandilla blanca acompaña el camino entre la rompiente y las casas. En las rocas de esta costa los bimbaches grabaron letreros líbico-bereberes; muchos acabaron hechos grava para la carretera en 1920.' },
      { nombre: 'Cancha de La Caleta', x: 12.2, z: -6.5, texto: 'La cancha del barrio, junto al cruce donde aparcan los que bajan a bañarse.' },
    ],
  },
};
