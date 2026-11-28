import type { IslaId } from './islas';
import { SUELOS as SUELOS_CALETA, VALLAS as VALLAS_CALETA } from '../puerto/sitios/caleta-plano';
import { PALMERAS as PALMERAS_CANTERAS, SUELOS as SUELOS_CANTERAS, VALLAS as VALLAS_CANTERAS } from '../puerto/sitios/canteras-plano';
import {
  SUELOS as SUELOS_TERESITAS,
  VALLAS as VALLAS_TERESITAS,
  PALMERAS as PALMERAS_TERESITAS,
  CASTILLO,
  LARGO,
  enPlaya,
  enMuelle,
} from '../puerto/sitios/teresitas-plano';
import * as DUNAS from '../puerto/sitios/dunas-plano';

export type Pueblo = 'mogan' | 'agaete' | 'la-restinga' | 'orchilla' | 'valverde' | 'la-caleta' | 'las-palmas' | 'playa-blanca' | 'las-canteras' | 'isleta' | 'las-teresitas' | 'chipude' | 'dunas' | 'loro-parque' | 'yaiza';
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
  sitio?: 'restinga' | 'orchilla' | 'valverde' | 'caleta' | 'agaete' | 'vegueta' | 'playa-blanca' | 'canteras' | 'isleta' | 'teresitas' | 'chipude' | 'dunas' | 'loro' | 'yaiza';
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
  /**
   * Lugar en cuesta: la cámara mira más desde arriba y sigue de cerca al viajero, también en altura.
   * `desnivel` baja el horizonte pintado: el mar queda lejos, abajo. `mirada` es la inclinación
   * de la cámara a ras del mar, más baja que la normal (0,54) para dejar ver los montes de detrás;
   * al subir por las calles vuelve a la normal.
   * `picado` cambia esa inclinación normal: más baja, deja ver lo que se alza al fondo.
   */
  cuesta?: { desnivel: number; mirada?: number; picado?: number };
  /** Bruma propia: distancia a la que empieza la niebla y a la que ya lo cubre todo. */
  bruma?: [number, number];
  /** Altura del suelo en un lugar que no es de losas ni rampas, como unas dunas: manda sobre `suelos`. */
  cota?: (x: number, z: number) => number;
  /** Cuánto baja el horizonte pintado sin tocar la cámara: tierra adentro, los montes propios tapan su mar. */
  horizonte?: number;
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
  /** Quien recibe dentro: el personaje con el que se habla al entrar y cómo se le nombra. */
  anfitrion?: { npc: string; nombre: string };
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
  /** Giro de la cámara al llegar, para encuadrar lo que se describe; si se omite, no gira. */
  vista?: number;
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
  /**
   * Rincón que solo aparece mientras la misión del pastor pasa por el lugar: al cerrar su texto
   * se sigue el rastro hasta el mapa de tiles donde andan las cabras.
   */
  rastro?: Rincon;
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
  // Gran Canaria, costa noroeste. Trazado sobre la ortofoto PNOA y girado para que el mar abierto quede
  // delante: de izquierda a derecha (de norte a sur) las Salinas, el pueblo con su playa y la ermita, la
  // dársena tras el dique, el ferry de Tenerife, el muelle viejo, la playa de las Nieves y el Dedo de Dios.
  agaete: {
    nombre: 'Puerto de las Nieves',
    isla: 'gran-canaria',
    poi: 'gc-agaete',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'agaete',
      estilo: 'blanca',
      palmeras: [
        [-10.7, -1.5, 4.2],
        [-10.7, 3.5, 3.8],
        [-10.7, 8.8, 4.4],
        [-10.6, -7.8, 4.6],
        [-2.6, -9, 4],
        [-27.5, 12.2, 4],
        [-21.8, 9.2, 4.6],
        [-14.6, 12.2, 3.8],
        [-46, -7.2, 4.4],
        [-42.5, -6.8, 3.8],
        [-38.8, -7.4, 4.8],
        [-48.2, -12, 4],
        [-34.5, -6.9, 4.6],
      ],
      suelos: [
        { r: [-30, 13, 10, 17.5] }, // dique, con la avenida del puerto
        { r: [9.6, 13.5, 26, 17.5] }, // muelle del ferry
        { r: [26, 12.8, 29.5, 17.5] }, // morro del dique
        { r: [8, 4.5, 9.6, 13.5] }, // contradique de la dársena
        { r: [-30, 6, -11, 13] }, // explanada
        { r: [-11, -4, -7, 13] }, // paseo de la playa
        { r: [-11, -4, -3, 1.5] }, // plaza de la ermita
        { r: [-3, 0, 6.5, 1.5] }, // muelle viejo
        { r: [6.5, -0.3, 9, 1.8] }, // su punta
        { r: [-30, -2, -11, 0.5] }, // calle de atrás
        { r: [-22, -2, -19.5, 6] }, // travesía
        { r: [-12.5, -13, -11, -2] }, // carretera de Agaete
        { r: [-45.5, -5.5, -30, 6.5] }, // las Salinas
        { r: [-3.8, -7.5, -2, -4] }, // bajada a la playa de las Nieves
        { r: [-7, 0, -3, 9.5], y: 0, y2: -0.7, eje: 'x' }, // playa del puerto
        { r: [-3, -7, 19.5, -3.5], y: 0.05, y2: -0.7 }, // playa de las Nieves
      ],
      vallas: [
        [-45.5, 1.5, -41, 5.5], // piscinas de las Salinas
        [-45.5, -4.5, -41, 0.5],
        [-40, -4.5, -36.5, -0.5],
      ],
    },
    salidas: { mar: 'ferry', tierra: 'mogan' },
    casas: [
      casa('Estación marítima', -3.75, 11.25, 6, 2.9, 3.5, '#1d5aa8'),
      casa('Casa de los callaos', -27.5, 4.2, 4.2, 3.4, 3.4, '#1f4f9a'),
      casa('Pescadería de las Nieves', -23.7, 4.2, 3, 3.4, 3.4, '#2a5fa8'),
      casa('Casa del patrón', -17, 4.2, 4, 5.1, 3.4, '#1b4a8c'),
      casa('Heladería del paseo', -13.2, 4.2, 3.2, 3.4, 3.4, '#2f6db3'),
      casa('Casa de la Rama', -27.5, -3.9, 4.2, 5.1, 3.4, '#2a5fa8'),
      casa('Taller de redes', -23.7, -3.9, 3, 3.4, 3.4, '#1f4f9a'),
      casa('Cofradía de pescadores', -16.6, -3.9, 4, 3.4, 3.4, '#1b4a8c'),
    ],
    inicio: { x: -5.5, z: -1.5 },
    embarcadero: { x: 9.1, z: 11.3 },
    carretera: { x: -11.75, z: -12 },
    rincones: [
      {
        nombre: 'Dedo de Dios',
        x: 18.5,
        z: -5.4,
        texto:
          'El roque de basalto al pie del risco tuvo durante siglos un dedo que apuntaba al cielo. La tormenta tropical Delta lo partió en noviembre de 2005: hoy queda el muñón, y el dedo duerme en el agua a sus pies.',
      },
      {
        nombre: 'Las Salinas',
        x: -37.5,
        z: 2.5,
        texto: 'Tres piscinas de agua de mar excavadas en la lava y unidas por túneles volcánicos. Los pilares de roca, como almenas de un castillo, frenan las olas del norte.',
      },
      {
        nombre: 'Ermita de las Nieves',
        x: -7,
        z: -3.3,
        texto: 'Ermita blanca de dos torres con cúpula roja. Guarda un tríptico flamenco atribuido a Joos van Cleve, y en agosto, por las fiestas de la Virgen de las Nieves, se baja con ramas a golpear el mar para pedir lluvia.',
      },
      {
        nombre: 'Muelle viejo',
        x: 7.8,
        z: 0.75,
        texto: 'El muelle de piedra del puerto antiguo. Desde su punta se ve el Dedo de Dios y, los días claros, el Teide al otro lado del mar.',
      },
      {
        nombre: 'Playa de las Nieves',
        x: 6,
        z: -5.3,
        texto: 'Callaos negros, redondos y lisos de tanto rodar con las olas. Suenan bajo los pies cuando el mar se retira.',
      },
      {
        nombre: 'Dársena',
        x: 3.75,
        z: 13.6,
        texto: 'Barquillos de pesca y veleros amarrados al pantalán, al abrigo del dique.',
      },
      {
        nombre: 'Punta del dique',
        x: 28,
        z: 15,
        texto: 'Los riscos de Tamadaba caen a pico sobre el mar, cientos de metros de roca. Por aquí entra el ferry que cruza a Santa Cruz de Tenerife.',
      },
    ],
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
  // El Hierro, la capital: un pueblo de interior a unos 600 m, en una ladera que mira al nordeste,
  // hacia el mar lejano. Trazado sobre la ortofoto PNOA y OpenStreetMap, comprimido: la calle
  // principal sube de norte a sur, la iglesia y su plaza se asoman al barranco por el este y la
  // calle de las Quinteras trepa hacia el oeste.
  valverde: {
    nombre: 'Valverde',
    isla: 'el-hierro',
    poi: 'valverde',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'valverde',
      sinMar: true,
      sinFaroles: true,
      cuesta: { desnivel: 22 },
      bruma: [30, 120],
      palmeras: [
        [-9.3, 9.3, 4.4],
        [0.3, 9.3, 3.9],
      ],
      suelos: [
        { r: [-6, -9, 2, 3] }, // atrio de la iglesia
        { r: [-10, 3, 1, 10] }, // plaza del Ayuntamiento
        { r: [2, 0.6, 17, 3] }, // paseo del mirador, al pie de la iglesia
        { r: [-12.5, -4, -6, -1] }, // calle de la iglesia
        { r: [-16, -4, -12.5, -1] }, // cruce frente al Cabildo
        { r: [-16, -24, -12.5, -4], y: -3.2, y2: 0 }, // calle principal, que baja al norte hacia El Cabo
        { r: [-16, -1, -12.5, 14], y: 0, y2: 2.4 }, // calle principal, que sube al sur
        { r: [-12.5, 6, -10, 8], y: 1.28, y2: 0, eje: 'x' }, // escalinata de la plaza
        { r: [-16, 14, -12.5, 17.5], y: 2.4 }, // cruce alto
        { r: [-28, 14, -16, 17.5], y: 4.4, y2: 2.4, eje: 'x' }, // calle de las Quinteras
        { r: [-36, 12, -28, 17.5], y: 4.4 }, // plazoleta de las Quinteras
        { r: [-12.5, -20, -0.5, -17.5], y: -2.36 }, // calle baja
        { r: [-3, -17.5, -0.5, -9], y: -2.36, y2: 0 }, // callejón que sube a la plaza
      ],
      vallas: [
        [-5.1, -8, -3.9, -6.8], // laureles del atrio
        [0, -8, 1.2, -6.8],
        [-9, 3.4, -7.8, 4.6], // laureles de la plaza
        [-1.2, 3.4, 0, 4.6],
        [-9.7, 8.9, -8.9, 9.7], // palmeras
        [-0.1, 8.9, 0.7, 9.7],
      ],
    },
    salidas: {},
    casas: [],
    inicio: { x: -3.5, z: -1.5 },
    rincones: [
      { nombre: 'Iglesia de la Concepción', x: -1.2, z: -3, texto: 'Cal en los muros y cantería en el arco y las esquinas. Desde la galería de la torre se vigilaba el mar por si asomaban velas piratas.' },
      { nombre: 'Plaza y Ayuntamiento', x: -4.5, z: 8.4, texto: 'Frente a la iglesia, la casa consistorial y su balcón de madera. La levantaron en piedra después del incendio de 1899, que se llevó el archivo de la villa.' },
      { nombre: 'Cabildo de El Hierro', x: -14.2, z: -7.6, texto: 'Aquí se gobierna la isla. Valverde es la única capital canaria que vive de espaldas al mar, a salvo de los piratas.' },
      { nombre: 'Casa de las Quinteras', x: -32, z: 13.6, texto: 'Una casa de familia convertida en centro etnográfico: el telar, la fragua, la loza y los aperos del campo herreño.' },
      { nombre: 'Mirador del barranco', x: 16, z: 1.8, texto: 'Bajo la plaza se abre el barranco. Cuando levanta la bruma se ve el mar del nordeste y, en los días claros, La Gomera.' },
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
  // Gran Canaria, Vegueta. La plaza de Santa Ana girada 30° para que su eje corra de oeste a
  // este: la catedral al este, las Casas Consistoriales al oeste, la Casa Regental y el Palacio
  // Episcopal al norte, la calle del Castillo al sur. Detrás de la catedral, el Pilar Nuevo y la
  // Casa de Colón; al oeste, la plazoleta del Espíritu Santo. Trazado en `sitios/vegueta.ts`.
  'las-palmas': {
    nombre: 'Las Palmas de Gran Canaria',
    isla: 'gran-canaria',
    poi: 'las-palmas',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'vegueta',
      sinMar: true,
      palmeras: [
        // Las dos hileras de la plaza, a lo largo de sus lados mayores.
        ...[-11.2, -7.6, -4, -0.4, 3.2, 6.8, 10.4].flatMap((x, i): [number, number, number][] => [
          [x, 1.9, 6.6 + (i % 3) * 0.5],
          [x + 0.3, 10.3, 7.3 - (i % 2) * 0.6],
        ]),
        [4.4, -6.4, 4.4], // patio del Palacio Episcopal
        [26.4, 13.6, 4.8], // patio de los Naranjos
      ],
      suelos: [
        { r: [13.2, 4.9, 14.3, 7.3], y: 0.15, y2: 0, eje: 'x' }, // gradas entre los perros
        { r: [-13, 1, 13.2, 11.2], y: 0.15 }, // plaza de Santa Ana
        { r: [-27, -1.6, 13.2, 1] }, // calle Doramas, al pie del Palacio Episcopal
        { r: [13.2, -3, 17.4, 17.6] }, // calle Obispo Codina, ante la catedral
        { r: [-28, 11.2, 13.2, 14.2] }, // calle del Castillo
        { r: [-17, 1, -13, 11.2] }, // explanada de las Casas Consistoriales
        { r: [-18.6, 1.6, -17, 10.6] }, // su soportal
        { r: [-37, 7, -28, 19] }, // plazoleta del Espíritu Santo
        { r: [17.4, 15, 38, 17.6] }, // calle del Espíritu Santo
        { r: [34.6, 9, 38, 15] }, // callejón hacia el Pilar Nuevo
        { r: [33.6, 1.5, 45, 9] }, // plaza del Pilar Nuevo
      ],
      vallas: [
        [12.7, 1, 13.4, 4.9], // pedestales de los perros, al norte de las gradas
        [12.7, 7.3, 13.4, 11.2], // y al sur
        [39.7, 4.7, 41.3, 6.3], // pilar de la plaza
        [-33.7, 11.8, -31.3, 14.2], // templete del Espíritu Santo
      ],
    },
    salidas: {},
    casas: [],
    inicio: { x: 4, z: 8 },
    rincones: [
      { nombre: 'Plaza de Santa Ana', x: 0, z: 6.1, texto: 'La plaza mayor de Vegueta, el barrio donde nació la ciudad. En un extremo manda la Iglesia y en el otro el Cabildo, frente a frente, entre dos hileras de palmeras.', vista: -0.3 },
      { nombre: 'Los perros de Santa Ana', x: 12.2, z: 6.1, texto: 'Ocho perros sentados miran hacia la catedral. Parecen de bronce, pero son de hierro fundido. Recuerdan a los canes que, según Plinio, dieron nombre a las islas.', vista: -0.75 },
      { nombre: 'Catedral de Santa Ana', x: 16.2, z: 6.1, texto: 'Se empezó hacia 1500 y tardó casi cuatro siglos en terminarse. Por dentro es gótica, con columnas que se abren como palmeras. Por fuera, una fachada neoclásica de piedra gris entre dos torres.', vista: -0.9 },
      { nombre: 'Palacio Episcopal', x: 6, z: -0.5, texto: 'La casa del obispo. Cuando la armada holandesa quemó la ciudad en 1599, de ella solo quedó en pie esta portada de piedra, de aire mudéjar.', vista: -0.2 },
      { nombre: 'Casa Regental', x: -7.25, z: -0.5, texto: 'Aquí vivía el regente de la Real Audiencia. Su portada renacentista es de las más bellas de Canarias; hoy alberga el Tribunal Superior de Justicia.', vista: -0.2 },
      { nombre: 'Casas Consistoriales', x: -15.2, z: 6.1, texto: 'El antiguo ayuntamiento mira a la catedral desde el otro extremo de la plaza. Se rehízo tras el incendio de 1842, con un soportal de nueve arcos.', vista: 1.45 },
      { nombre: 'Calle del Castillo', x: -27.6, z: 12.7, texto: 'Empedrado, fachadas de colores y balcones de madera de tea: así es Vegueta. Esta calle une la plaza de Santa Ana con la del Espíritu Santo; en una de sus casas vivió y murió el ilustrado Viera y Clavijo.', vista: -0.5 },
      { nombre: 'Plaza del Espíritu Santo', x: -30.4, z: 15.4, texto: 'Una plazoleta recogida, con su fuente bajo un templete neoclásico y la pequeña ermita del Espíritu Santo.', vista: -0.36 },
      { nombre: 'Casa de Colón', x: 40, z: 2.6, texto: 'La antigua casa de los gobernadores, a espaldas de la catedral. Según la tradición, Colón se alojó aquí en 1492. Tras su portada de piedra labrada hay hoy un museo sobre Canarias y América.', vista: -0.2 },
    ],
  },
  // Lanzarote, la punta sur, frente a Fuerteventura. Trazado sobre la ortofoto PNOA y comprimido de
  // oeste a este: el puerto del ferry de Corralejo, la playa del Pueblo con el casco viejo y la iglesia
  // del Carmen, el paseo sobre la lava, Playa Dorada entre escolleras, la Marina Rubicón y, en la punta
  // del Águila, el Castillo de las Coloradas. Trazado en `sitios/playa-blanca.ts`.
  'playa-blanca': {
    nombre: 'Playa Blanca',
    isla: 'lanzarote',
    poi: 'lz-playa-blanca',
    plano: {
      orillas: [],
      canales: [],
      lava: true,
      sitio: 'playa-blanca',
      estilo: 'blanca',
      bruma: [60, 190],
      palmeras: [
        [-21.2, 0.4, 4.4],
        [-7.9, 0.4, 3.9],
        [-6.9, -7.7, 4.8],
        [0.9, -7.7, 4.2],
        [-17.6, 0.5, 4],
        [8.6, 0.4, 4.6],
        [14.5, -3.4, 3.8],
        [20.4, 0.4, 4.2],
        [28.7, 3.1, 4.4],
        [-37.3, -2.2, 4],
      ],
      suelos: [
        { r: [-17, 1, -8.5, 6.5], y: 0, y2: -0.85 }, // playa del Pueblo
        { r: [9, 2.5, 19.5, 7], y: 0, y2: -0.75 }, // Playa Dorada
        { r: [42.5, 9, 45.5, 13], y: 0, y2: 1.5, eje: 'x' }, // subida a la punta del Águila
        { r: [-46, -1.5, -38, 20] }, // explanada del puerto
        { r: [-46, 20, -19, 23.5] }, // muelle del ferry
        { r: [-38, 11, -27, 12.5] }, // muelle de la dársena pesquera
        { r: [-28.5, 6, -27, 11] }, // su codo
        { r: [-38, -1.5, -20, 1.5] }, // paseo del puerto
        { r: [-22, -2.5, -2, 1] }, // avenida de la playa
        { r: [-7.5, -8.3, 1.5, -2.5] }, // plaza del Carmen
        { r: [-2, -1, 8.5, 2.5] }, // paseo de la punta
        { r: [8, 0, 23, 2.5] }, // paseo de Playa Dorada
        { r: [22, 2.5, 42.5, 5] }, // muelle norte de la marina
        { r: [22.5, 5, 29, 13] }, // muelle de poniente
        { r: [40, 5, 42.5, 20.5] }, // muelle de levante
        { r: [22, 17, 42.5, 20.5] }, // dique de la marina
        { r: [45.5, 7, 52, 18.5], y: 1.5 }, // explanada del castillo
      ],
      vallas: [
        [-7.3, -8.1, -6.5, -7.3], // alcorques de las palmeras de la plaza
        [0.5, -8.1, 1.3, -7.3],
        [-18, 0.1, -17.2, 0.9], // y de la avenida
        [-8.3, 0, -7.5, 0.8],
        [-21.6, 0, -20.8, 0.8],
        [8.2, 0, 9, 0.8],
        [20, 0, 20.8, 0.8],
        [-5.35, -8.3, -3.65, -6.9], // murete del atrio de la iglesia
        [-2.35, -8.3, -0.65, -6.9],
        [-7, -4.8, -6.2, -4], // laureles de la plaza
        [0.2, -4.8, 1, -4],
        [-39.7, 7.7, -38.7, 9.9], // taquillas del puerto
        [28.3, 2.7, 29.1, 3.5], // palmera de la marina
        [47.2, 10.7, 51.4, 14.9], // Castillo de las Coloradas
        [45.9, 12.2, 47.2, 13.4], // su escalera
      ],
    },
    salidas: { mar: 'ferry' },
    casas: [
      casa('Estación marítima', -42.5, 4.6, 6, 2.9, 3.4, '#2a5f9e'),
      casa('Casa de los marinos', -31, -3.4, 3.4, 3.4, 3.2, '#2f6e3b'),
      casa('Bar del muelle', -27, -3.4, 3.6, 2.7, 3.2, '#2a5f9e'),
      casa('Casa del patrón', -20, -4.35, 3.6, 3.4, 3.4, '#2f6e3b'),
      casa('Heladería de la playa', -16.2, -4.35, 3.4, 2.7, 3.4, '#2a5f9e'),
      casa('Pescadería del pueblo', -12.5, -4.35, 3.4, 3.4, 3.4, '#2f6e3b'),
      casa('Casa de las celosías', -9, -4.35, 3.2, 5.1, 3.4, '#6b4a32'),
      casa('Restaurante del paseo', 4, -3, 3.8, 2.7, 3.2, '#2f6e3b'),
      casa('Apartamentos Playa Dorada', 12, -1.7, 4.6, 3.4, 3.2, '#2a5f9e'),
      casa('Chiringuito de la playa', 17.5, -1.4, 3.6, 2.4, 2.6, '#2f6e3b'),
      casa('Capitanía de la marina', 25.2, 8.4, 4.2, 3.4, 3.2, '#2f6e3b'),
      casa('Tienda náutica', 31, 0.8, 3.6, 2.7, 3.2, '#2a5f9e'),
      casa('Café de la marina', 35.5, 0.8, 3.8, 3.4, 3.2, '#2f6e3b'),
      casa('Velería', 39.6, 0.8, 3.2, 2.7, 3.2, '#6b4a32'),
    ],
    inicio: { x: -30, z: 0 },
    embarcadero: { x: -38.8, z: 17.6 },
    rincones: [
      {
        nombre: 'Muelle del ferry',
        x: -20.2,
        z: 21.75,
        texto: 'De aquí salen los ferris que cruzan el estrecho de La Bocaina hasta Corralejo, en Fuerteventura: unos trece kilómetros de mar que se pasan en media hora larga. Enfrente asoma el islote de Lobos.',
        vista: -2.2,
      },
      {
        nombre: 'Playa del Pueblo',
        x: -12.75,
        z: 2.6,
        texto: 'La pequeña playa del casco viejo, la del antiguo pueblo de pescadores. A su alrededor creció Playa Blanca, que hoy es el segundo núcleo más poblado de Lanzarote.',
      },
      {
        nombre: 'Iglesia del Carmen',
        x: -3,
        z: -6.4,
        texto: 'Una iglesia blanca y sencilla, con espadaña de dos campanas y cantería en la puerta. La Virgen del Carmen es la patrona del pueblo: en julio sale en procesión por el mar, escoltada por las barcas.',
        vista: 0,
      },
      {
        nombre: 'Paseo marítimo',
        x: 3,
        z: 1.6,
        texto: 'Unos siete kilómetros de paseo bordean la costa de lava negra, entre casas blancas de carpintería verde, terrazas y palmeras.',
      },
      {
        nombre: 'Playa Dorada',
        x: 14.5,
        z: 4,
        texto: 'Arena dorada al abrigo de dos escolleras que amansan el agua. Los días claros se ven enfrente Lobos y las dunas blancas de Corralejo.',
      },
      {
        nombre: 'Marina Rubicón',
        x: 33,
        z: 4.2,
        texto: 'El puerto deportivo toma el nombre del Rubicón, la comarca donde Jean de Béthencourt levantó en 1402 su primera fortaleza al empezar la conquista de Canarias. Los miércoles y los sábados hay mercadillo en sus muelles.',
      },
      {
        nombre: 'Dique de la marina',
        x: 23.2,
        z: 18.75,
        texto: 'En la punta del dique hay un helipuerto. Por dentro, cientos de veleros; por fuera, el mar abierto de La Bocaina.',
      },
      {
        nombre: 'Castillo de las Coloradas',
        x: 46.2,
        z: 15.8,
        texto: 'También llamado Torre del Águila. Se levantó entre 1741 y 1744 contra los piratas berberiscos, que lo incendiaron en 1749; una lápida sobre la puerta recuerda que se rehízo en 1769, reinando Carlos III. Se entra por una escalera de piedra y un puente levadizo.',
        vista: -0.6,
      },
      {
        nombre: 'Punta del Águila',
        x: 50.8,
        z: 17.6,
        texto: 'Las rocas rojizas de la punta, las «coloradas», caen al mar. Al otro lado de La Bocaina se ven el islote de Lobos, con su montaña de la Caldera, y la costa norte de Fuerteventura.',
        vista: 2.1,
      },
    ],
  },
  // Gran Canaria, la playa de la ciudad: tres kilómetros de arena dorada en el istmo de Guanarteme,
  // de La Puntilla al Auditorio Alfredo Kraus, con La Barra en paralelo a la orilla y una muralla
  // de edificios detrás del paseo. Se camina de La Puntilla a la Peña de la Vieja; el arco de La
  // Cícer y el Auditorio quedan al fondo. Trazado en `src/puerto/sitios/canteras-plano.ts`.
  'las-canteras': {
    nombre: 'Playa de Las Canteras',
    isla: 'gran-canaria',
    poi: 'las-canteras',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'canteras',
      costa: 7.5,
      sinFaroles: true,
      palmeras: PALMERAS_CANTERAS,
      suelos: SUELOS_CANTERAS,
      vallas: VALLAS_CANTERAS,
    },
    salidas: { tierra: 'isleta' },
    casas: [],
    inicio: { x: -8, z: 1.6 },
    carretera: { x: -54.2, z: -16.5 },
    rincones: [
      { nombre: 'La Puntilla', x: -50.8, z: 2.6, vista: -1.3, texto: 'El último refugio de los pescadores de la playa. Las barcas se varan en la arena, entre nasas de alambre, y otras quedan fondeadas en el remanso de la punta.' },
      { nombre: 'Paseo de Las Canteras', x: -12, z: -5.4, texto: 'El paseo recorre la playa entera, del Auditorio a La Puntilla: ladrillo rojo, palmeras, terrazas y una muralla de hoteles y apartamentos que mira al mar.' },
      { nombre: 'La Barra', x: 2, z: 5.6, vista: 1.2, texto: 'Un arrecife de arenisca de unos dos kilómetros corre en paralelo a la orilla, a unos doscientos metros. Frena las olas y convierte el agua en una laguna mansa; con la bajamar asoma. De su arenisca se sacaba piedra, y de esas canteras le viene el nombre a la playa.' },
      { nombre: 'Playa Chica', x: 27.5, z: 2.2, vista: 1, texto: 'Una playa pequeña dentro de la grande, entre rocas y charcos. Es la zona de las familias y de los que bucean entre viejas y pejeverdes.' },
      { nombre: 'Peña de la Vieja', x: 39, z: 4.4, vista: -1.3, texto: 'La peña más famosa de Las Canteras asoma a unos sesenta metros de la orilla. La playa mira a poniente: el sol se pone en el mar y, en los días claros, se ve el Teide al otro lado.' },
      { nombre: 'Hacia La Cícer', x: 47, z: 3, vista: -1.7, texto: 'Al sur la playa se abre sin la barra y llegan las olas de los surfistas. Al fondo, el Auditorio Alfredo Kraus, de Óscar Tusquets, inaugurado en 1997: su autor lo pensó entre fortaleza y faro.' },
    ],
  },
  // Gran Canaria, la península al norte de Las Palmas. Trazado sobre la ortofoto PNOA y
  // OpenStreetMap con el norte arriba (−z): delante, la dársena con el muelle de los pesqueros;
  // el Castillo de La Luz en su jardín y la iglesia de La Luz al oeste; las calles Juan Rejón y
  // La Naval y una calle alta que trepan hacia los volcanes; al este, los tanques y las grúas del
  // puerto, y al noroeste, El Confital. Trazado en `sitios/isleta.ts`.
  isleta: {
    nombre: 'La Isleta',
    isla: 'gran-canaria',
    poi: 'isleta',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'isleta',
      estilo: 'blanca',
      costa: 0,
      cuesta: { desnivel: 0, mirada: 0.3 },
      bruma: [55, 190],
      palmeras: [
        // Jardín del castillo.
        [-7.6, -3.2, 4.6],
        [-7.4, 1.8, 4],
        [-6.6, 5.7, 4.4],
        [7.4, 5.4, 4.2],
        // Mediana de la avenida del puerto.
        ...[-22, -16, -10, -4, 9, 15, 21].map((x, i): [number, number, number] => [x, 9.9, 4.4 + (i % 3) * 0.4]),
        // Plaza de la iglesia.
        [-25.6, 5.6, 4.2],
        [-10.6, 5.6, 4.6],
      ],
      suelos: [
        { r: [-27, 7, 26, 13] }, // avenida y muelle de la dársena
        { r: [1.5, 13, 4.5, 29.5] }, // muelle de los pesqueros
        { r: [-9, -8, 13, 7] }, // jardín del castillo
        { r: [-27, -1, -9, 7] }, // plaza de la iglesia
        { r: [-27, -8, -24.5, -1] }, // callejón de la iglesia
        { r: [-38, -10.5, 30, -8] }, // calle Juan Rejón
        { r: [-32, -21, 22, -17.2], y: 2.2 }, // calle La Naval
        { r: [-36, -31.5, 14, -27.7], y: 5.4 }, // calle alta, al pie de la montaña
        { r: [-41, -33, -36, -27], y: 5.4 }, // mirador de El Confital
        { r: [-31.5, -17.2, -29, -10.5], y: 2.2, y2: 0 }, // calle del Faro, de Juan Rejón a La Naval
        { r: [-31.5, -27.7, -29, -21], y: 5.4, y2: 2.2 }, // y de La Naval a la calle alta
        { r: [-2.5, -17.2, 0, -10.5], y: 2.2, y2: 0 }, // calle del medio, cuesta abajo
        { r: [-2.5, -27.7, 0, -21], y: 5.4, y2: 2.2 }, // y en escalera hasta arriba
        { r: [17, -17.2, 19.5, -10.5], y: 2.2, y2: 0 }, // calle del este
      ],
      vallas: [
        [-5.7, -6.7, 5.7, 4.7], // el castillo y su foso
        [9.5, -5.5, 12.5, 1.5], // edificio de la fundación
      ],
    },
    salidas: { tierra: 'las-canteras' },
    casas: [
      {
        ...casa('La Chistera', -12, -12.4, 3.6, 2.6, 3.4, '#7a2f8f'),
        anfitrion: { npc: 'comico', nombre: 'El cómico' },
      },
    ],
    inicio: { x: 3, z: 9.6 },
    // Hacia La Puntilla y Las Canteras, por el oeste de Juan Rejón.
    carretera: { x: -37, z: -9.25 },
    rincones: [
      {
        nombre: 'Castillo de La Luz',
        x: 0,
        z: 5.4,
        texto: 'Se levantó en piedra en 1494 sobre un arrecife que la marea dejaba aislado. La armada holandesa de Van der Does lo incendió en 1599 y hubo que rehacerlo. El puerto creció tanto que hoy queda a más de 150 metros del agua; dentro guarda la colección del escultor Martín Chirino.',
        vista: -0.15,
      },
      {
        nombre: 'Iglesia de La Luz',
        x: -18,
        z: 0.4,
        texto: 'La parroquia del Puerto se inauguró en 1914 donde antes hubo varias ermitas. Tiene tres rosetones y bóvedas de media naranja, y guarda la Virgen de La Luz que talló Luján Pérez, patrona del puerto.',
        vista: -0.1,
      },
      {
        nombre: 'Muelle de los pesqueros',
        x: 3,
        z: 28.6,
        texto: 'Barcos de pesca a los dos lados y, al fondo, grúas de contenedores y tanques de combustible. El Puerto de La Luz empezó a construirse en 1883 en la bahía que abriga La Isleta, y con él creció el barrio.',
        vista: 0.35,
      },
      {
        nombre: 'Calle La Naval',
        x: -14,
        z: -19.5,
        texto: 'Tiendas, bares y casas de colores con azoteas llenas de depósitos de agua. En octubre, por las fiestas de La Naval, el barrio saca en procesión a la Virgen de La Luz y recuerda con fuegos la defensa contra la flota de Drake en 1595.',
      },
      {
        nombre: 'Lo alto del barrio',
        x: -1.25,
        z: -30,
        texto: 'Las calles se empinan hasta acabar en escaleras al pie de la montaña. Muchas casas crecieron planta a planta, y alguna aún espera la de arriba con los hierros al aire. Detrás, los volcanes de La Isleta son zona militar.',
        vista: Math.PI,
      },
      {
        nombre: 'Mirador de El Confital',
        x: -39.5,
        z: -30,
        texto: 'Al noroeste se abre El Confital: plataformas de roca, arena gruesa y una ola de derecha que muchos surfistas cuentan entre las mejores de Europa. Hasta 2004 hubo chabolas a la orilla; hoy es parte del paisaje protegido de La Isleta.',
        vista: 0.4,
      },
    ],
  },
  // Tenerife, Santa Cruz. La media luna de arena del Sáhara con su rompeolas exento, los kioscos y
  // las palmeras, al pie de los riscos de Anaga; en su punta suroeste, el pueblo de pescadores de
  // San Andrés y las ruinas de su castillo junto al barranco. Trazado en `sitios/teresitas-plano.ts`.
  'las-teresitas': {
    nombre: 'Playa de Las Teresitas',
    isla: 'tenerife',
    poi: 'las-teresitas',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'teresitas',
      estilo: 'blanca',
      costa: 9,
      palmeras: PALMERAS_TERESITAS,
      suelos: SUELOS_TERESITAS,
      vallas: VALLAS_TERESITAS,
    },
    salidas: {},
    casas: [
      casa('Casa de comidas', -63.1, 11.1, 4.4, 3.6, 4, '#2f6f8f'),
      casa('Casa del pescador', -53.35, 11.1, 3.4, 3.4, 4, '#3d7a5a'),
    ],
    inicio: playa(33, 5.2),
    rincones: [
      { nombre: 'Playa de Las Teresitas', ...playa(36.5, 4), texto: 'Más de un kilómetro de arena rubia al pie de los riscos de Anaga. Donde hubo una playa de arena negra, en 1973 se volcaron unas 270.000 toneladas de arena traída del Sáhara.' },
      { nombre: 'El rompeolas', ...playa(43, 5.9), texto: 'A unos 150 metros de la orilla corre un rompeolas de piedra de casi un kilómetro, con una boca en cada punta. Las obras empezaron en 1968, y gracias a él el agua de la playa está casi siempre mansa.' },
      { nombre: 'Kioscos del paseo', ...playa(20.5, -0.9), texto: 'Los kioscos se asoman a la arena entre corros de palmeras canarias. Detrás del paseo azul, otra hilera de palmeras parte en dos el aparcamiento.' },
      { nombre: 'Macizo de Anaga', ...playa(50, -2), texto: 'Detrás de la carretera se levantan a pico las montañas de Anaga, pardas en verano y verdes después de las lluvias. Todo el macizo es Reserva de la Biosfera desde 2015.' },
      { nombre: 'Punta de los Órganos', ...playa(LARGO - 2, 3.5), texto: 'Aquí acaba la arena, contra el espigón que arranca de la punta de los Órganos. Más allá, la costa de Anaga sigue hacia el nordeste, toda de riscos.', vista: 1 },
      { nombre: 'Muelle de los pescadores', ...punto(enMuelle(8.2)), texto: 'El muelle de la cofradía de San Andrés, en el extremo sur de la playa. Cada mes de julio, por la Virgen del Carmen, la imagen embarca aquí para salir en procesión por el mar.', vista: -1.1 },
      { nombre: 'Castillo de San Andrés', x: CASTILLO.x, z: CASTILLO.z + 2.8, texto: 'Torre redonda de piedra que guardaba la playa de los piratas desde comienzos del siglo XVIII. Las avenidas del barranco se llevaron media torre; la otra mitad sigue en pie y es Bien de Interés Cultural. Se cuenta que en 1797 sus cañones alcanzaron a uno de los barcos de Nelson.', vista: -0.8 },
      { nombre: 'San Andrés', x: -56, z: 15.2, texto: 'Pueblo de pescadores en la boca del barranco, con las casas de colores apretadas entre la montaña y el mar. En la avenida se come el pescado del día.' },
    ],
  },
  // La Gomera, cumbre de Vallehermoso. La Fortaleza, la mesa de roca de 1.243 m, y el pueblo de
  // Chipude a sus pies, trazados sobre la ortofoto PNOA y las curvas de nivel del IGN. Todo gira
  // para que la mesa asome al fondo del encuadre: la iglesia mira a la cámara, la plaza queda tras
  // ella y el camino baja entre bancales, sube a Pavón, rodea la mesa hasta el collado y trepa por
  // la canal de la arista nordeste. Trazado en `sitios/chipude.ts`.
  chipude: {
    nombre: 'La Fortaleza de Chipude',
    isla: 'la-gomera',
    poi: 'chipude',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'chipude',
      sinMar: true,
      sinFaroles: true,
      cuesta: { desnivel: 10, picado: 0.24 },
      bruma: [45, 160],
      palmeras: [
        [6.5, 4, 5.4],
        [6.6, 9.5, 4.8],
        [13.2, -9.6, 4.6],
      ],
      suelos: [
        { r: [-8.2, 14, 9, 19] }, // atrio, ante la fachada
        { r: [3.4, -1, 9, 14] }, // costado sur de la iglesia
        { r: [-8.2, -11, 16, 1.2] }, // plaza de Chipude
        { r: [-12.5, -13, -8.2, 26] }, // carretera del pueblo
        { r: [-26, 6, -12.5, 8.4], y: -1.4, y2: 0, eje: 'x' }, // camino de El Cercado
        { r: [0.5, -19.5, 3, -11], y: -1.2, y2: 0 }, // camino que baja de la plaza al barranquillo
        { r: [0.5, -22, 3, -19.5], y: -1.2 }, // paso del barranquillo, entre pretiles de piedra
        { r: [0.5, -31, 3, -22], y: 2.4, y2: -1.2 }, // cuesta de Pavón, entre bancales
        { r: [-11, -35, 3, -31], y: 2.4 }, // Pavón, donde arranca la senda
        { r: [-5, -46, -2.5, -35], y: 4.2, y2: 2.4 }, // senda al collado
        { r: [-5.5, -50.5, 3, -46], y: 4.2 }, // collado de la Fortaleza
        { r: [3, -50.5, 10.5, -48.2], y: 4.2, y2: 7.4, eje: 'x' }, // canal de la arista nordeste
        { r: [10.5, -50.5, 12.7, -48.2], y: 7.4 },
        { r: [10.5, -48.2, 12.7, -43.6], y: 7.4, y2: 10.2 },
        { r: [10.5, -43.6, 12.7, -41.4], y: 10.2 },
        { r: [12.7, -43.6, 19, -41.4], y: 10.2, y2: 13, eje: 'x' }, // paso de la cornisa
        { r: [19, -46, 30, -37.5], y: 13 }, // cima
        { r: [22, -37.5, 28, -33], y: 13 }, // proa del norte
        { r: [30, -47, 35.5, -40], y: 13 },
        { r: [35.5, -49.3, 40.5, -44], y: 13 },
        { r: [40.5, -51.4, 43.5, -47.5], y: 13 }, // punta sur, sobre el barranco de Erque
      ],
      vallas: [
        [-3.9, 13.6, -2.1, 15.2], // campanario
        [2.2, 1.5, 4.6, 4.3], // sacristía
        [6.1, 3.6, 6.9, 4.4], // palmeras
        [6.2, 9.1, 7, 9.9],
        [12.8, -10, 13.6, -9.2],
        [-6.6, -8.4, -5.4, -7.2], // laureles de la plaza
        [6.4, -8.4, 7.6, -7.2],
      ],
    },
    salidas: {},
    casas: [],
    inicio: { x: 3, z: 17 },
    rincones: [
      { nombre: 'Iglesia de la Candelaria', x: -1, z: 16.8, texto: 'Dos naves encaladas bajo teja roja y, entre sus dos hastiales, un campanario de cantería oscura. Fue una de las primeras ermitas de la isla y en el siglo XVII se hizo parroquia.' },
      { nombre: 'Plaza de Chipude', x: 6, z: -5, texto: 'La plaza del pueblo, a más de mil metros de altura. Cada 15 de agosto se llena para la fiesta de la Virgen de Candelaria, una de las más grandes de La Gomera.', vista: -0.5 },
      { nombre: 'Camino de El Cercado', x: -24.5, z: 7.2, texto: 'Por aquí se baja a El Cercado, el pago de las loceras. Hacen la loza sin torno, con técnicas anteriores a la Conquista: modelan el barro a mano, lo alisan con un callao y lo pintan con almagre.', vista: 0.5 },
      { nombre: 'Bancales del barranquillo', x: 1.75, z: -20.75, texto: 'Muros de piedra seca escalonan la ladera para sujetar la tierra. Donde hubo monte se sembró cereal; hoy muchos bancales descansan sin cultivar.' },
      { nombre: 'Pavón', x: -6.5, z: -33, texto: 'El último caserío antes de la Fortaleza. De aquí sale la senda que rodea la mesa por el norte hasta el collado.' },
      { nombre: 'Collado de la Fortaleza', x: -1, z: -48.2, texto: 'Desde este collado, a 1.125 metros, la senda trepa por una canal de la arista nordeste. Es la única entrada a la cima: un paso estrecho que se puede cerrar con facilidad.', vista: -0.9 },
      { nombre: 'Cima de la Fortaleza', x: 24, z: -41, texto: 'Una mesa casi llana a 1.243 metros, cercada de paredes verticales: un domo de lava espesa que se enfrió sin derramarse. Quizá sea la Argodey de las crónicas, una fortaleza «toda cercada de peña muy fuerte» con una sola entrada.' },
      { nombre: 'Recintos de piedra', x: 33, z: -43.5, texto: 'Restos de construcciones de piedra seca de los antiguos gomeros. Para unos estudiosos son aras de una montaña sagrada, donde se cree que se ofrendaban cabras; para otros, cabañas de pastores que subían en ciertas épocas del año.' },
      { nombre: 'Punta sur', x: 42.5, z: -49.5, texto: 'La mesa acaba en proa. A sus pies se abre el barranco de Erque, cientos de metros más abajo, y al fondo brilla el mar.', vista: 0.6 },
    ],
  },
  // Gran Canaria, la punta sur. Playa del Inglés en su terraza (la rotonda de Tirajana y Francia,
  // Pepe Chiringo, el CITA y el Riu Palace en la punta, sobre el Mirador de las Dunas), el Paseo
  // Costa Canaria por el borde y el campo de dunas hasta el mar, con la Charca, el palmeral y el
  // faro acercados al suroeste. Trazado en `src/puerto/sitios/dunas-plano.ts`.
  dunas: {
    nombre: 'Dunas de Maspalomas',
    isla: 'gran-canaria',
    poi: 'dunas',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'dunas',
      sinFaroles: true,
      costa: 29,
      // La cámara sube y baja con el viajero, de la terraza a las dunas.
      cuesta: { desnivel: 0 },
      bruma: [60, 175],
      palmeras: DUNAS.PALMERAS,
      suelos: DUNAS.SUELOS,
      vallas: DUNAS.VALLAS,
      cota: DUNAS.cota,
    },
    salidas: {},
    casas: [],
    inicio: { x: 9.4, z: -4.4 },
    rincones: [
      { nombre: 'Mirador de las Dunas', x: 8, z: -4.9, texto: 'En la punta de Playa del Inglés la calle se acaba y empieza la arena. Desde aquí se ve todo el campo de dunas, hasta el faro, y una escalera baja a pisarlas.', vista: 3.1 },
      { nombre: 'Riu Palace Maspalomas', x: 7.6, z: -12.6, texto: 'El primer hotel Palace de la cadena Riu, de estilo colonial, con la fachada curva abrazando un jardín de palmeras al borde de las dunas. Un pasaje público lo cruza para bajar de Tirajana al mirador.', vista: 0.2 },
      { nombre: 'Pepe Chiringo', x: 11.6, z: -38.7, texto: 'Hamburguesas, bocadillos y terraza en la esquina de Tirajana con Francia, en los bajos del hotel Rey Carlos.', vista: 0 },
      { nombre: 'Centro Comercial CITA', x: 17.6, z: -38.7, texto: 'Uno de los centros comerciales más antiguos de Playa del Inglés, de comienzos de los años setenta. Lo adornan réplicas de monumentos europeos, como la torre Eiffel o la de Pisa, y en su patio un Volkswagen rosa hace de emblema.', vista: 0 },
      { nombre: 'Paseo Costa Canaria', x: 21.6, z: -22.6, texto: 'El paseo bordea las dunas desde el Riu hacia la playa del Inglés: a un lado, hoteles y apartamentos; al otro, el mar de arena.', vista: 1.2 },
      { nombre: 'Campo de dunas', x: 14, z: 8, texto: 'Unas 400 hectáreas de arena, reserva natural desde 1987. El alisio sopla del nordeste y empuja las dunas despacio hacia el suroeste. Hay quien dice que esta arena voló desde el Sáhara, pero, según los geólogos, salió del mar: el viento la sopló desde la plataforma que quedó al aire en la última glaciación.', vista: 2.4 },
      { nombre: 'Balancones de Playa del Inglés', x: 44.5, z: -14, texto: 'El balancón, un arbusto de hojas carnosas, frena la arena que trae el viento y la retiene a su alrededor: así nacen estos montículos al borde de la playa.', vista: 1.6 },
      { nombre: 'Playa de Maspalomas', x: 5, z: 25.6, texto: 'Arena dorada abierta al Atlántico, del faro a la punta donde empieza la playa del Inglés. A la espalda, las dunas; delante, mar abierto.', vista: -0.2 },
      { nombre: 'La Charca', x: -24.6, z: 19.5, texto: 'Laguna de agua salobre donde acaba el barranco de Maspalomas, separada del mar por una barra de arena. Es parada de aves migratorias; las más abundantes son las limícolas, como el chorlitejo patinegro.', vista: 1.5 },
      { nombre: 'Palmeral del Oasis', x: -41, z: 14, texto: 'Palmeras canarias junto a la Charca: lo que queda de un palmeral mucho mayor. Por ellas a este rincón lo llaman el Oasis.', vista: 0.4 },
      { nombre: 'Faro de Maspalomas', x: -36.8, z: 24.6, texto: 'Torre troncocónica de cantería gris de 56 metros, obra del ingeniero Juan de León y Castillo. Se encendió el 1 de febrero de 1890. La casa del torrero, adosada a su pie, es hoy un centro etnográfico.', vista: 1.1 },
    ],
    rastro: { nombre: 'Rastro de las cabras', x: -14, z: -4, texto: 'Huellas de pezuña entre los matorrales y ramas mordisqueadas. Las cabras del pastor se han metido dunas adentro: hay que seguirlas.' },
  },
  // Tenerife, Punta Brava (Puerto de la Cruz). Trazado sobre la ortofoto PNOA y OpenStreetMap y
  // girado media vuelta para que el Teide, que queda al suroeste, asome al fondo: el norte real
  // (el mar) apunta a +z y el oeste a +x. Dos paseos de oeste a este: entre ellos, los estanques
  // de las carpas, de los tigres, de los delfines y de las orcas; al sur, las gradas, el café,
  // Planet Penguin, los aviarios y los gorilas. El trazado está en `src/puerto/sitios/loro-parque.ts`.
  'loro-parque': {
    nombre: 'Loro Parque',
    isla: 'tenerife',
    poi: 'loro-parque',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'loro',
      // Agua clara en todos los estanques; el Atlántico queda al norte, a la espalda de la cámara.
      costa: 40,
      sinFaroles: true,
      bruma: [60, 210],
      palmeras: [
        // Explanada y pabellón de la entrada.
        [49.2, 0.6, 5.2],
        [50.6, -2.4, 5.6],
        [39.2, -0.8, 5],
        [29, 10.6, 5.6],
        [29.2, -0.6, 5],
        // Entre los estanques, junto a las sendas.
        [22.9, 8.9, 5.2],
        [11, 1.4, 5.8],
        [11.2, 8.8, 5],
        [-0.4, 1.2, 5.4],
        [-0.4, 8.8, 4.8],
        [-4.6, 1, 6],
        [-4.6, 8.8, 5.2],
        [-16.1, 9, 4.6],
        [-32.4, 8.8, 5.6],
        [-33.8, -1, 5.2],
        // Isla del Tigre.
        [6.4, 4.8, 3.8],
        // Al sur, tras las gradas, el café y Planet Penguin.
        [-18.2, -9, 5],
        [-8.2, -11, 5.6],
        [0.4, -16, 6.2],
        [13.6, -15.4, 5.4],
        [25.2, -10.6, 5.4],
        [-33.6, -14, 5.8],
        // Jardín del norte, entre el paseo y la tapia.
        [-12, 14.4, 4.6],
        [12, 14.6, 5],
      ],
      suelos: [
        { r: [39.6, 0, 48, 13] }, // explanada de la entrada, con la parada del tren
        { r: [38, 3.5, 39.6, 6.5], y: 0.4, y2: 0, eje: 'x' }, // escalinata del pabellón tailandés
        { r: [30, 1.5, 38, 8.5], y: 0.4 }, // pabellón de la entrada
        { r: [28.4, 3.5, 30, 6.5], y: 0, y2: 0.4, eje: 'x' }, // escalinata hacia el parque
        { r: [24, -9.5, 28.4, 13] }, // plaza del pueblo tailandés, que baja hasta los gorilas
        { r: [-19.6, 10, 24, 13] }, // paseo norte, sobre los estanques
        { r: [-33, -5, 24, -2] }, // paseo sur, entre los estanques y las gradas
        { r: [-4, -2, -1, 10] }, // senda del palmeral
        { r: [-19.6, -2, -16.6, 10] }, // senda de las orcas
        { r: [-5.5, -10, -0.5, -5] }, // terraza del café Vista Teide
        { r: [2.5, -6.5, 10.5, -5] }, // portada de Planet Penguin
        { r: [15.6, -2, 18.4, 1.4] }, // tarima de la sala tailandesa, sobre el estanque
      ],
      vallas: [
        [42.2, 8, 45.8, 11.6], // fuente de la explanada
        [30.8, 1.5, 37.2, 2.9], // taquillas del pabellón
        [30.8, 7.1, 37.2, 8.5],
      ],
    },
    salidas: {},
    casas: [],
    inicio: { x: 43.5, z: 5.5 },
    rincones: [
      {
        nombre: 'Entrada tailandesa',
        x: 42,
        z: 7.5,
        texto: 'El parque abrió en 1972 con unos 150 loros. Se entra por un pabellón de estilo tailandés, de tejados escalonados con remates dorados y columnas rojas; el pueblo tailandés se inauguró en 1993.',
      },
      {
        nombre: 'Estanque de las carpas koi',
        x: 17,
        z: -0.6,
        texto: 'Junto al pueblo tailandés, carpas koi blancas, naranjas y negras asoman entre los nenúfares, a la sombra de una sala de tejado verde.',
      },
      {
        nombre: 'Aviarios de los loros',
        x: 21,
        z: -3.4,
        texto: 'Los loros dieron nombre al parque. Hoy reúne unos 4.000, de unas 350 especies y subespecies: una de las mayores colecciones del mundo. Su fundación trabaja para conservar las especies amenazadas.',
      },
      {
        nombre: 'Gorilas',
        x: 27.4,
        z: -8.2,
        texto: 'Una familia de gorilas de llanura entre rocas, hierba y troncos para trepar. Su recinto se abrió a comienzos de los años noventa.',
        vista: -0.9,
      },
      {
        nombre: 'Planet Penguin',
        x: 6.5,
        z: -5.8,
        texto: 'Abrió en 1999 y recrea la Antártida: dentro cae nieve de verdad cada día. Viven allí pingüinos rey, papúa, barbijo y saltarrocas; los de Humboldt, de costas templadas, nadan fuera, junto a la puerta.',
        vista: -0.15,
      },
      {
        nombre: 'Palmeral',
        x: -2.5,
        z: 4,
        texto: 'Palmeras, helechos y árboles tropicales cubren los senderos. El parque es tanto jardín como zoológico.',
      },
      {
        nombre: 'Isla del Tigre',
        x: 5.5,
        z: 11,
        texto: 'Los tigres viven en una isla rodeada por un foso de agua. La primera Isla del Tigre se abrió en 1991.',
      },
      {
        nombre: 'Orca Ocean',
        x: -25.5,
        z: -3.5,
        texto: 'Abrió en 2006. Las gradas, bajo una gran cubierta blanca, miran al estanque de las orcas, con forma de ocho.',
      },
      {
        nombre: 'Delfinario',
        x: -11.3,
        z: -3.5,
        texto: 'Se inauguró en 1987. Los delfines mulares nadan ante una pared de roca artificial con su cascada.',
      },
      {
        nombre: 'Café Vista Teide',
        x: -3,
        z: -8.6,
        texto: 'Desde la terraza se ve el Teide, a unos diecisiete kilómetros, al fondo del valle de La Orotava. Con sus 3.718 metros es el pico más alto de España.',
        vista: -0.45,
      },
    ],
  },
  // Lanzarote, el sur. Pueblo blanco de interior trazado sobre la ortofoto PNOA: la calle Vista de
  // Yaiza corre de oeste a este; al sur, la plaza de los Remedios entre la casa natal de Benito
  // Pérez Armas y la iglesia; más allá, el Ayuntamiento y la carretera de Timanfaya.
  // Trazado en `sitios/yaiza.ts`.
  yaiza: {
    nombre: 'Yaiza',
    isla: 'lanzarote',
    poi: 'yaiza',
    plano: {
      orillas: [],
      canales: [],
      sitio: 'yaiza',
      sinMar: true,
      bruma: [60, 175],
      horizonte: 20,
      palmeras: [
        [-6.6, 2, 6.6], // plaza
        [8.8, 11.6, 6],
        [31.7, 2, 6.4], // jardín del Ayuntamiento
        [31.7, 7.8, 6.8],
        [-3.2, 20.6, 4.6], // jardín de picón
        [6.8, 22.4, 5.4],
        // Bancales de tierra roja con palmeras, al sureste.
        ...[33, 37, 41, 45, 49].flatMap((x, i): [number, number, number][] => [
          [x, 17, 3.6 + (i % 3) * 0.4],
          [x + 2, 22.5, 4.4 - (i % 2) * 0.5],
          [x, 28, 3.8 + (i % 2) * 0.6],
        ]),
      ],
      suelos: [
        { r: [-13.2, 0.2, 12.4, 13.2], y: 0.4 }, // plaza de los Remedios
        { r: [-36, -4.6, 48, -0.6] }, // calle Vista de Yaiza
        { r: [-1.4, -0.6, 1.4, 0.2], y: 0, y2: 0.4 }, // escalones de la plaza a la calle
        { r: [12.4, 6.6, 13.2, 9.4], y: 0.4, y2: 0, eje: 'x' }, // escalones hacia la iglesia
        { r: [-4.8, 13.2, -1.8, 13.8], y: 0.4, y2: 0 }, // escalones al paseo
        { r: [13.2, -0.6, 15, 16.4] }, // calle ante la iglesia
        { r: [15, 7.4, 29.4, 10] }, // calle al sur de la iglesia
        { r: [26.4, -0.6, 29.4, 7.4] }, // calle al este de la iglesia
        { r: [29.4, -0.6, 36.4, 10] }, // jardín del Ayuntamiento
        { r: [-29.4, 13.8, 15, 16.4] }, // paseo al sur de la plaza
        { r: [11.8, 16.4, 15, 30] }, // calle Salida al Rubicón
        { r: [-29.4, -0.6, -26.4, 13.8] }, // callejón de poniente
        { r: [-20.4, 12.8, -19, 13.8] }, // portón del patio
        { r: [-22.4, 4.2, -17, 12.8] }, // patio de la casa natal
      ],
      vallas: [
        [-11.4, 0.8, -5.4, 3], // parterres de la plaza: laureles, palmeras y picón
        [3.4, 0.8, 9.8, 3],
        [-12, 10.4, -6, 12.6],
        [3.4, 10.4, 9.8, 12.6],
        [-1.6, 5.8, 1.6, 7.6],
        [14.2, -0.5, 15, 0.3], // laureles junto a la iglesia
        [21.4, 7.6, 22.2, 8.4],
        [30.4, 0.6, 33, 3.4], // jardín del Ayuntamiento: palmeras, araucaria y escultura
        [30.4, 6.4, 33, 9.2],
        [33.6, 0.8, 35.4, 2.6],
        [33.9, 7.1, 34.9, 8.1],
        [-22.4, 4.4, -21.2, 8.8], // escalera del sobrado
      ],
    },
    salidas: {},
    casas: [],
    inicio: { x: 4, z: 6 },
    rincones: [
      { nombre: 'Iglesia de los Remedios', x: 14.1, z: 4.4, texto: 'Encalada de arriba abajo, con tejado de teja y una espadaña de dos campanas sobre la fachada. Está dedicada a la Virgen de los Remedios, la patrona de Yaiza.', vista: -1.1 },
      { nombre: 'Plaza de los Remedios', x: 0, z: 4.4, texto: 'La plaza mayor del pueblo, a la sombra de los laureles de Indias: farolas verdes, bancos de madera y parterres de picón negro entre la iglesia y la casa natal de Benito Pérez Armas.' },
      { nombre: 'Casa de la Cultura', x: -12.4, z: 7.2, texto: 'Aquí nació en 1871 Benito Pérez Armas, escritor y político. La casona, de una planta y tejados de teja, es hoy la Casa de la Cultura y está declarada Bien de Interés Cultural.', vista: 1.15 },
      { nombre: 'Patio de la casa natal', x: -18.2, z: 9.6, texto: 'La casa se abre a un patio, como manda la arquitectura tradicional canaria. Una escalera de madera sube al sobrado, la habitación alta, con su balcón corrido.', vista: 0.35 },
      { nombre: 'Ayuntamiento de Yaiza', x: 35.4, z: 4.5, texto: 'Casa consistorial baja y encalada, con puertas y ventanas de madera. Delante, un jardín con dos grandes palmeras canarias, una araucaria, las banderas y una escultura.', vista: -0.6 },
      { nombre: 'Jardín de picón', x: 3, z: 16, texto: 'Tuneras, cardones, pitas y palmeras sobre picón negro. En Lanzarote el picón no es solo adorno: retiene la humedad de la noche y frena la evaporación en una isla donde casi no llueve.', vista: 2.8 },
      { nombre: 'Camino de Timanfaya', x: 44, z: -2.2, texto: 'Por aquí se va a las Montañas del Fuego. El cura de Yaiza, Andrés Lorenzo Curbelo, anotó que el 1 de septiembre de 1730, entre las nueve y las diez de la noche, la tierra se abrió cerca de Timanfaya, a dos leguas del pueblo. Los volcanes ardieron seis años.', vista: -0.1 },
      { nombre: 'Calle Vista de Yaiza', x: -22, z: -2.6, texto: 'Casas bajas y cúbicas, encaladas, de azotea, con chimeneas blancas y puertas y ventanas verdes. En Lanzarote se suele pintar la carpintería de verde tierra adentro y de azul junto al mar, una estética que César Manrique defendió para toda la isla.' },
    ],
  },
};
/** Punto redondeado al centímetro, para los rincones de un trazado calculado. */
function punto([x, z]: [number, number]) {
  return { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 };
}
/** Punto de la playa de Las Teresitas a `s` de su punta suroeste y a `d` del paseo. */
function playa(s: number, d: number) {
  return punto(enPlaya(s, d));
}
