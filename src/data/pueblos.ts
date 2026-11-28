import type { IslaId } from './islas';
import { SUELOS as SUELOS_CALETA, VALLAS as VALLAS_CALETA } from '../puerto/sitios/caleta-plano';
import * as DUNAS from '../puerto/sitios/dunas-plano';

export type Pueblo = 'mogan' | 'agaete' | 'la-restinga' | 'orchilla' | 'valverde' | 'la-caleta' | 'las-palmas' | 'dunas';
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
  sitio?: 'restinga' | 'orchilla' | 'valverde' | 'caleta' | 'agaete' | 'vegueta' | 'dunas';
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
   * `desnivel` baja el horizonte pintado: el mar queda lejos, abajo.
   */
  cuesta?: { desnivel: number };
  /** Bruma propia: distancia a la que empieza la niebla y a la que ya lo cubre todo. */
  bruma?: [number, number];
  /** Altura del suelo en un lugar que no es de losas ni rampas, como unas dunas: manda sobre `suelos`. */
  cota?: (x: number, z: number) => number;
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
};
