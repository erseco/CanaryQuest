import * as T from 'three';
import { PUEBLOS } from '../../data/pueblos';
import type { Sitio, Taller } from '../maqueta';

type Punto = [number, number];
type Rect = [number, number, number, number];

/** Estanque recortado en el suelo del parque: por el hueco asoma el agua animada de la maqueta. */
interface Estanque {
  cx: number;
  cz: number;
  rx: number;
  rz: number;
  /** Radio relativo según el ángulo: da la forma de ocho, de riñón o de charca. */
  forma: (a: number) => number;
  borde: string;
  pared: string;
}
// Entre los dos paseos, de este a oeste: orcas, delfines, el foso de los tigres y las carpas.
const ORCAS: Estanque = { cx: -25.5, cz: 4, rx: 4.17, rz: 4.6, forma: (a) => 1 + 0.32 * Math.cos(2 * a), borde: '#efe9dc', pared: '#a7d8de' };
const DELFINES: Estanque = {
  cx: -11.3,
  cz: 4,
  rx: 3.6,
  rz: 3.3,
  forma: (a) => 1 + 0.2 * Math.cos(2 * a) + 0.15 * Math.sin(a),
  borde: '#efe9dc',
  pared: '#a7d8de',
};
const FOSO: Estanque = { cx: 5.5, cz: 4, rx: 4.2, rz: 3, forma: () => 1, borde: '#8a7660', pared: '#5e5446' };
const CARPAS: Estanque = {
  cx: 17,
  cz: 4.2,
  rx: 3.9,
  rz: 2.8,
  forma: (a) => 1 + 0.1 * Math.sin(3 * a) + 0.06 * Math.cos(5 * a),
  borde: '#5b524a',
  pared: '#3f463d',
};
const HUMBOLDT: Estanque = { cx: 14.6, cz: -7.6, rx: 1.7, rz: 1.2, forma: (a) => 1 + 0.12 * Math.cos(3 * a), borde: '#d8d0c0', pared: '#8cc3c9' };
const ESTANQUES = [ORCAS, DELFINES, FOSO, CARPAS, HUMBOLDT];

/** Contorno del estanque, ensanchado `d` unidades hacia fuera. */
function contorno({ cx, cz, rx, rz, forma }: Estanque, d = 0, n = 48): Punto[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2,
      r = forma(a);
    return [cx + Math.cos(a) * (rx * r + d), cz + Math.sin(a) * (rz * r + d)];
  });
}
const dentroDe = (e: Estanque, x: number, z: number, d = 0) => {
  const a = Math.atan2((z - e.cz) / e.rz, (x - e.cx) / e.rx);
  const r = e.forma(a);
  return Math.hypot((x - e.cx) / (e.rx * r + d), (z - e.cz) / (e.rz * r + d)) < 1;
};
/** Losa de planta cualquiera, con agujeros, de y0 a y1. Los contornos van en x, z del mundo. */
function losaHueca(exterior: Punto[], huecos: Punto[][], y0: number, y1: number) {
  const plano = ([x, z]: Punto) => new T.Vector2(x, -z);
  const forma = new T.Shape(exterior.map(plano));
  for (const h of huecos) forma.holes.push(new T.Path(h.map(plano)));
  return new T.ExtrudeGeometry(forma, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 })
    .rotateX(-Math.PI / 2)
    .translate(0, y0, 0);
}
/** Sector de corona circular, para el ala curva de Planet Penguin. */
function sector(cx: number, cz: number, r0: number, r1: number, a0: number, a1: number, n = 18): Punto[] {
  const arco = (r: number, desde: number, hasta: number) =>
    Array.from({ length: n + 1 }, (_, i): Punto => {
      const a = desde + ((hasta - desde) * i) / n;
      return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
    });
  return [...arco(r1, a0, a1), ...arco(r0, a1, a0)];
}

// Teide y Pico Viejo, al suroeste del parque: con el plano girado quedan al fondo, a la derecha.
// La cámara apenas mira por encima del horizonte, así que el pico queda bajo y cerca: lo que
// cuenta es que su silueta asome entera en lo alto de la pantalla.
const TEIDE = { x: 36, z: -50 },
  PICO_VIEJO = { x: 47, z: -56 };
/** Altura del valle de La Orotava, que sube desde el borde sur del parque hasta Las Cañadas y el Teide. */
function alturaSur(x: number, z: number) {
  const dentro = -20 - z;
  if (dentro <= 0) return 0;
  let y = dentro * 0.05 + Math.sin(x * 0.37 + z * 0.29) * 0.25 * Math.min(1, dentro / 8);
  // Laderas de Tigaiga (oeste, +x) y de Santa Úrsula (este, −x), que cierran el valle.
  const lado = Math.abs(x - 8) - 24;
  if (lado > 0) y += lado * 0.12 * Math.min(1, dentro / 14);
  // Las Cañadas: un escudo ancho alrededor del pico, y el pilón del Teide, empinado, encima.
  const dT = Math.hypot(x - TEIDE.x, z - TEIDE.z);
  y = Math.max(y, 4.8 - dT * 0.12, 9.7 - dT * 1.05);
  // Pico Viejo, más bajo y con su cráter.
  const dV = Math.hypot(x - PICO_VIEJO.x, z - PICO_VIEJO.z);
  y = Math.max(y, 6.6 - dV * 0.45 - Math.max(0, 1.4 - dV) * 0.8);
  return y * Math.min(1, dentro / 3);
}

/**
 * Loro Parque (Punta Brava, Puerto de la Cruz, Tenerife), trazado sobre la ortofoto PNOA y las
 * posiciones de OpenStreetMap y comprimido para que quepa en dos paseos. Está girado media vuelta:
 * el norte real (el mar) apunta a +z y el oeste a +x, para que la cámara, que mira hacia −z, tenga
 * el Teide al fondo. A la derecha, la explanada del tren y el pabellón tailandés de la entrada;
 * entre los paseos, las carpas, el foso de los tigres, el delfinario y Orca Ocean; al sur, las
 * gradas, el café Vista Teide, Planet Penguin con los pingüinos de Humboldt, los aviarios y los
 * gorilas. Los estanques son huecos en el suelo por los que asoma el agua de la maqueta; las zonas
 * pisables están en `PUEBLOS['loro-parque'].plano.suelos`.
 */
export function trazarLoroParque(t: Taller): Sitio {
  const { pieza, superficie, farol, azar, ventanas } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin } = t.materiales;
  const suelos = PUEBLOS['loro-parque'].plano.suelos!;
  const tintes = new Map<string, T.MeshStandardMaterial>();
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const clave = base.uuid + color;
    if (!tintes.has(clave)) {
      const m = base.clone();
      m.color.set(color);
      tintes.set(clave, m);
    }
    return tintes.get(clave)!;
  };
  const bola = new T.SphereGeometry(1, 9, 6);
  const cilindro = new T.CylinderGeometry(1, 1, 1, 18);
  const cono = new T.ConeGeometry(1, 1, 8);
  const triangulo = new T.CylinderGeometry(1, 1, 1, 3)
    .rotateX(-Math.PI / 2)
    .translate(0, 0.5, 0)
    .scale(1 / Math.sqrt(3), 1 / 1.5, 1);
  const elige = <C>(lista: C[]) => lista[Math.floor(azar() * lista.length)];
  /** Hornea una geometría ya colocada en el mundo. */
  const pon = (geo: T.BufferGeometry, color: string) => {
    pieza(geo, color, 0, 0, 0, 1, 1, 1);
    geo.dispose();
  };
  /**
   * Marco local para figuras y tejados: `u` hacia delante, `h` hacia arriba y `w` de lado.
   * `giro` lo orienta (0 mira a +x), `cabeceo` levanta el morro y `escala` lo agranda entero.
   */
  const matriz = new T.Matrix4(),
    cuaternion = new T.Quaternion(),
    euler = new T.Euler(),
    sitio = new T.Vector3(),
    tamano = new T.Vector3();
  function marco(x: number, y: number, z: number, giro = 0, cabeceo = 0, escala = 1) {
    const base = new T.Matrix4().compose(
      new T.Vector3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(0, giro, cabeceo, 'YZX')),
      new T.Vector3(escala, escala, escala),
    );
    return (
      forma: T.BufferGeometry,
      color: string,
      u: number,
      h: number,
      w: number,
      su: number,
      sh: number,
      sw: number,
      rx = 0,
      ry = 0,
      rz = 0,
    ) => {
      matriz.compose(sitio.set(u, h, w), cuaternion.setFromEuler(euler.set(rx, ry, rz)), tamano.set(su, sh, sw)).premultiply(base);
      pon(forma.clone().applyMatrix4(matriz), color);
    };
  }
  /** Cartel pintado en un lienzo, en un plano vertical que mira hacia `giro` (0 mira a +z). */
  function letrero(texto: string, x: number, y: number, z: number, ancho: number, alto: number, giro: number, fondo: string, tinta: string) {
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = Math.round((512 * alto) / ancho);
    const ctx = lienzo.getContext('2d')!;
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.strokeStyle = tinta;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, lienzo.width - 16, lienzo.height - 16);
    ctx.fillStyle = tinta;
    ctx.font = `700 ${Math.round(lienzo.height * 0.5)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, lienzo.width / 2, lienzo.height / 2 + 4, lienzo.width - 40);
    const mapa = new T.CanvasTexture(lienzo);
    mapa.colorSpace = T.SRGBColorSpace;
    // `superficie` proyecta las coordenadas en unidades del mundo: se reencuadran sobre el cartel.
    mapa.repeat.set(1, (0.67 * ancho) / alto);
    mapa.offset.set(0.5, 0.5);
    const placa = new T.PlaneGeometry(1, 1);
    const malla = superficie(placa, new T.MeshStandardMaterial({ map: mapa, roughness: 0.85 }), x, y, z, ancho, alto, 1, ancho);
    malla.rotation.y = giro;
    placa.dispose();
  }
  /** Cristal bajo de un recinto, sobre un murete de piedra. */
  function cristal(x0: number, x1: number, z: number) {
    pieza(caja, '#6e675f', (x0 + x1) / 2, 0.2, z, x1 - x0, 0.4, 0.3);
    pieza(caja, '#bfe0e6', (x0 + x1) / 2, 0.85, z, x1 - x0, 0.9, 0.05);
  }

  // --- Suelo: el jardín entero, con un hueco por estanque, hasta la costa al norte ---
  pon(losaHueca([[-84, -20.5], [84, -20.5], [84, 27], [-84, 27]], ESTANQUES.map((e) => contorno(e)), -1.4, 0), '#56623b');
  for (const e of ESTANQUES) {
    const fuera = contorno(e, 0.35),
      dentro = [contorno(e, -0.03)];
    pon(losaHueca(fuera, dentro, -1.4, 0), e.pared);
    pon(losaHueca(fuera, dentro, 0, 0.1), e.borde);
  }
  // Caminos: losetas de barro en la entrada y el pabellón, pavimento claro en los paseos.
  const barro = tenido(adoquin, '#c0745a'),
    paseo = tenido(adoquin, '#c9b79c'),
    tablas = '#9b7552';
  const aparte = [1, 3, 9, 11]; // escalinatas, terraza y tarima, que se dibujan aparte
  suelos.forEach(({ r: [x0, z0, x1, z1], y = 0 }, i) => {
    if (aparte.includes(i)) return;
    superficie(caja, i < 3 ? barro : paseo, (x0 + x1) / 2, y + 0.02, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0, 1.4);
  });
  // Bordillos de piedra volcánica a lo largo de los paseos.
  for (const [i, { r }] of suelos.entries()) {
    if (i < 4 || aparte.includes(i)) continue;
    const [x0, z0, x1, z1] = r;
    for (const z of [z0, z1]) pieza(caja, '#6e675f', (x0 + x1) / 2, 0.06, z, x1 - x0, 0.12, 0.12);
    for (const x of [x0, x1]) pieza(caja, '#6e675f', x, 0.06, (z0 + z1) / 2, 0.12, 0.12, z1 - z0);
  }
  // Tapia del parque: al norte, frente a la avenida, y entre la explanada y el paseo sur.
  pieza(caja, '#d9cfbf', 8, 0.5, 17.6, 86, 1, 0.4);
  pieza(caja, '#d9cfbf', 38.6, 0.5, -0.9, 20, 1, 0.3);

  // --- Explanada de la entrada: la fuente redonda, el tren y perchas con guacamayos ---
  pieza(cilindro, '#a59a8c', 44, 0.28, 9.8, 1.8, 0.56, 1.8);
  pieza(cilindro, '#5fb3c2', 44, 0.5, 9.8, 1.62, 0.08, 1.62);
  pieza(cilindro, '#b3a899', 44, 0.85, 9.8, 0.42, 0.8, 0.42);
  pieza(cilindro, '#b3a899', 44, 1.3, 9.8, 0.85, 0.14, 0.85);
  // Surtidor central y chorros en arco que caen a la taza.
  pieza(cilindro, '#e6f4f7', 44, 1.9, 9.8, 0.05, 1.2, 0.05);
  pieza(cono, '#dcf0f4', 44, 1.95, 9.8, 0.42, 0.75, 0.42);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    for (let j = 0; j < 4; j++) {
      const t = (j + 0.5) / 4;
      pieza(bola, '#e3f3f6', 44 + Math.cos(a) * (0.35 + t * 0.7), 1.3 + Math.sin(t * Math.PI) * 0.3 - t * 0.7, 9.8 + Math.sin(a) * (0.35 + t * 0.7), 0.05, 0.05, 0.05);
    }
  }
  // El tren gratuito que sube desde Puerto de la Cruz: locomotora amarilla y dos vagones abiertos.
  {
    const d = marco(49.3, 0, 5, Math.PI / 2);
    d(caja, '#f2c230', 2.1, 0.75, 0, 1.6, 1.1, 1.2);
    d(caja, '#2f3b4a', 2.3, 1.45, 0, 1.0, 0.4, 1.0);
    d(caja, '#c9342b', 2.1, 1.72, 0, 1.75, 0.1, 1.3);
    d(caja, '#3a3a3a', 2.95, 0.55, 0, 0.1, 0.5, 0.9);
    for (const u of [-1, -3.2]) {
      d(caja, '#f2c230', u, 0.55, 0, 1.9, 0.3, 1.15);
      d(caja, '#c9342b', u, 1.75, 0, 2.0, 0.08, 1.3);
      for (const s of [-0.85, 0.85]) for (const w of [-0.55, 0.55]) d(caja, '#f2c230', u + s, 1.2, w, 0.07, 1.05, 0.07);
      for (const s of [-0.5, 0.2, 0.9]) d(caja, '#7a4a2a', u + s - 0.2, 0.85, 0, 0.12, 0.35, 1.0);
    }
    for (const u of [-3.8, -2.6, -1.6, -0.4, 1.6, 2.6]) for (const w of [-0.6, 0.6]) d(cilindro, '#222', u, 0.22, w, 0.22, 0.12, 0.22, Math.PI / 2);
  }

  // --- Guacamayos: cuerpo, cabeza, pico, alas y cola larga. `giro` 0 mira a +x ---
  const especies: [string, string, string][] = [
    ['#2a6fc9', '#f3c234', '#1d4f99'], // azul y amarillo
    ['#d8322b', '#d8322b', '#2c63b8'], // macao, rojo con alas azules
    ['#c62f2a', '#c62f2a', '#2f8a4b'], // aliverde
    ['#2f3f9a', '#2f3f9a', '#26337f'], // jacinto
    ['#4a9a3f', '#4a9a3f', '#2c6fb0'], // militar, verde
  ];
  function guacamayo(x: number, y: number, z: number, giro: number, [lomo, pecho, alas]: [string, string, string]) {
    const d = marco(x, y, z, giro, 0, 0.9);
    d(bola, lomo, -0.02, 0.18, 0, 0.1, 0.2, 0.1, 0, 0, -0.25);
    d(bola, pecho, 0.04, 0.16, 0, 0.07, 0.15, 0.08, 0, 0, -0.25);
    d(bola, lomo, 0.06, 0.38, 0, 0.08, 0.08, 0.075);
    d(bola, '#f4f1ea', 0.11, 0.38, 0, 0.035, 0.045, 0.06);
    d(cono, '#2a2622', 0.15, 0.35, 0, 0.035, 0.08, 0.035, 0, 0, -2.2);
    for (const s of [-1, 1]) d(bola, alas, -0.04, 0.17, s * 0.07, 0.11, 0.16, 0.025, s * 0.15, 0, -0.3);
    d(caja, lomo, -0.16, -0.08, 0, 0.05, 0.42, 0.04, 0, 0, -0.45);
    d(caja, alas, -0.2, -0.16, 0, 0.035, 0.3, 0.03, 0, 0, -0.5);
  }
  function percha(x: number, z: number) {
    pieza(poste, '#5b4632', x, 0.8, z, 0.1, 1.6, 0.1);
    pieza(caja, '#6b5238', x, 1.62, z, 1.3, 0.08, 0.08);
    pieza(caja, '#7a7266', x, 0.06, z, 0.9, 0.12, 0.6);
  }
  percha(41, 0.5);
  guacamayo(40.6, 1.66, 0.5, Math.PI / 2, especies[0]);
  guacamayo(41.4, 1.66, 0.5, Math.PI / 2, especies[1]);
  percha(46.8, 0.5);
  guacamayo(46.4, 1.66, 0.5, Math.PI / 2, especies[2]);
  guacamayo(47.2, 1.66, 0.5, Math.PI / 2, especies[4]);

  // --- Tejado tailandés: faldones empinados, cenefa, piñones con nagas doradas y chofas ---
  interface Tejado {
    x: number;
    z: number;
    ancho: number;
    fondo: number;
    y0: number;
    alto: number;
    /** 0: cumbrera de norte a sur, con los piñones a ±z; π/2: de este a oeste. */
    giro?: number;
    teja: string;
    borde: string;
    pinon: string;
    filo: string;
    remate?: boolean;
  }
  function tejadoThai({ x, z, ancho, fondo, y0, alto, giro = 0, teja, borde, pinon, filo, remate = true }: Tejado) {
    // En el marco local la cumbrera corre por w y los faldones caen hacia ±u.
    const d = marco(x, y0, z, giro);
    const pendiente = Math.atan2(alto, ancho / 2),
      largo = Math.hypot(ancho / 2, alto) + 0.45,
      c = Math.cos(pendiente),
      s = Math.sin(pendiente);
    for (const lado of [-1, 1]) {
      const cu = (lado * c * largo) / 2,
        ch = alto - (s * largo) / 2;
      d(caja, teja, cu, ch, 0, largo, 0.14, fondo + 0.6, 0, 0, -lado * pendiente);
      const k = largo / 2 - 0.3;
      d(caja, borde, cu + lado * c * k, ch - s * k + 0.03, 0, 0.6, 0.15, fondo + 0.62, 0, 0, -lado * pendiente);
      // Hileras de teja: listones algo más oscuros a lo largo del faldón.
      for (let j = 1; j < 4; j++) {
        const kk = -largo / 2 + (j * largo) / 4.6;
        d(caja, '#2f5f3a', cu + lado * c * kk, ch - s * kk + 0.075, 0, 0.05, 0.02, fondo + 0.58, 0, 0, -lado * pendiente);
      }
    }
    d(caja, filo, 0, alto + 0.06, 0, 0.18, 0.16, fondo + 0.7);
    for (const frente of [-1, 1]) {
      const w = frente * (fondo / 2 + 0.3);
      d(triangulo, pinon, 0, 0, w, ancho, alto, 0.1);
      d(triangulo, filo, 0, alto * 0.14, w + frente * 0.06, ancho * 0.66, alto * 0.66, 0.06);
      d(caja, pinon, 0, alto * 0.3, w + frente * 0.1, ancho * 0.12, alto * 0.3, 0.03);
      for (const lado of [-1, 1])
        d(caja, filo, (lado * ancho) / 4, alto / 2, w + frente * 0.12, largo - 0.35, 0.2, 0.1, 0, 0, -lado * pendiente);
      if (remate) {
        d(cono, filo, 0, alto + 0.45, w + frente * 0.22, 0.09, 0.9, 0.09, frente * 0.55);
        for (const lado of [-1, 1]) d(cono, filo, lado * (ancho / 2 + 0.3), 0.02, w + frente * 0.12, 0.07, 0.45, 0.07, 0, 0, -lado * 0.6);
      }
    }
  }
  /** Faldón bajo alrededor de un pabellón: la segunda capa de tejado. */
  function falda(x: number, z: number, ancho: number, fondo: number, y: number, teja: string, borde: string) {
    for (const s of [-1, 1]) {
      pieza(caja, teja, x + s * (ancho / 2 + 0.45), y, z, 1.2, 0.12, fondo + 1.8, 0, 0, -s * 0.5);
      pieza(caja, borde, x + s * (ancho / 2 + 0.95), y - 0.27, z, 0.3, 0.14, fondo + 1.8, 0, 0, -s * 0.5);
      pieza(caja, teja, x, y, z + s * (fondo / 2 + 0.45), ancho + 1.8, 0.12, 1.2, s * 0.5);
      pieza(caja, borde, x, y - 0.27, z + s * (fondo / 2 + 0.95), ancho + 1.8, 0.14, 0.3, s * 0.5);
    }
  }
  const verde = '#3f7d4c',
    oro = '#d8a640',
    naranja = '#d4892c',
    granate = '#6e2a22',
    rojo = '#a8352a';

  // --- Pabellón de la entrada: podio, escalinatas, columnas rojas con cisnes de oro y tejado en cruz ---
  const pab = { x: 34, z: 5 };
  pieza(caja, '#9c4a36', pab.x, 0.19, pab.z, 8.8, 0.38, 7.6);
  superficie(caja, barro, pab.x, 0.39, pab.z, 8.2, 0.04, 7.2, 1.2);
  for (let k = 0; k < 5; k++) {
    const h = 0.08 * (k + 1);
    pieza(caja, '#a8513a', 39.6 - 0.32 * k - 0.16, h / 2, pab.z, 0.32, h, 3.2);
    pieza(caja, '#a8513a', 28.4 + 0.32 * k + 0.16, h / 2, pab.z, 0.32, h, 3.2);
  }
  const columnas: Punto[] = [];
  for (const x of [30.3, 32.3, 35.7, 37.7]) for (const z of [1.8, 8.2]) columnas.push([x, z]);
  for (const x of [30.3, 37.7]) for (const z of [3.4, 6.6]) columnas.push([x, z]);
  for (const [x, z] of columnas) {
    pieza(cilindro, rojo, x, 1.75, z, 0.17, 2.7, 0.17);
    pieza(caja, oro, x, 3.05, z, 0.42, 0.12, 0.42);
    pieza(caja, oro, x, 0.47, z, 0.4, 0.14, 0.4);
  }
  // Cisnes dorados que sostienen el alero en las columnas que miran a la explanada y al norte.
  for (const [x, z, giro] of [
    [32.3, 8.35, -Math.PI / 2],
    [35.7, 8.35, -Math.PI / 2],
    [37.85, 3.4, 0],
    [37.85, 6.6, 0],
  ]) {
    const d = marco(x, 2.55, z, giro);
    d(bola, oro, 0.1, 0, 0, 0.08, 0.35, 0.2, 0, 0, 0.3);
    d(bola, oro, 0.22, 0.34, 0, 0.05, 0.12, 0.05);
    d(cono, oro, 0.0, -0.05, 0, 0.12, 0.5, 0.04, 0, 0, 2.6);
  }
  for (const z of [1.8, 8.2]) pieza(caja, granate, pab.x, 3.25, z, 7.8, 0.3, 0.22);
  for (const x of [30.3, 37.7]) pieza(caja, granate, x, 3.25, pab.z, 0.22, 0.3, 6.6);
  // Taquillas de madera roja a los dos lados del paso, con el tambor blanco de información.
  for (const z of [2.2, 7.8]) {
    pieza(caja, '#8a2e24', pab.x, 0.95, z, 6.2, 1.1, 1.0);
    pieza(caja, '#5a1f18', pab.x, 1.55, z, 6.3, 0.1, 1.1);
    for (const dx of [-2, 0, 2]) ventanas.push([pab.x + dx, 1.2, z + (z < pab.z ? 0.52 : -0.52), 0.8, 0.5, 0.03]);
  }
  pieza(cilindro, '#f1eee6', pab.x, 1.9, 2.2, 0.8, 2.2, 0.8);
  // Tejado en cruz: dos tejados a dos aguas que se cortan, con un piñón dorado a cada lado.
  const teja = { teja: verde, borde: naranja, pinon: granate, filo: oro };
  tejadoThai({ x: pab.x, z: pab.z, ancho: 7.6, fondo: 6.8, y0: 3.4, alto: 3.4, giro: Math.PI / 2, ...teja });
  tejadoThai({ x: pab.x, z: pab.z, ancho: 6.8, fondo: 7.6, y0: 3.4, alto: 3.1, ...teja });
  // Escalón de cada piñón: un tejado más bajo y estrecho, de teja dorada.
  for (const s of [-1, 1]) {
    tejadoThai({ x: pab.x, z: pab.z + s * 4.3, ancho: 5.4, fondo: 1.2, y0: 2.95, alto: 2.5, teja: naranja, borde: verde, pinon: granate, filo: oro });
    tejadoThai({ x: pab.x + s * 4.6, z: pab.z, ancho: 5.6, fondo: 1.2, y0: 2.95, alto: 2.5, giro: Math.PI / 2, teja: naranja, borde: verde, pinon: granate, filo: oro });
  }
  falda(pab.x, pab.z, 7.8, 6.8, 3.05, '#c4622f', verde);

  // --- Pueblo tailandés: la sala sobre el estanque de las carpas ---
  pieza(caja, tablas, 17, 0.04, -0.3, 2.8, 0.08, 3.4);
  for (let k = 0; k < 6; k++) pieza(caja, '#7f5e42', 15.8 + k * 0.48, 0.085, -0.3, 0.03, 0.02, 3.4);
  for (const x of [15.75, 18.25]) for (const z of [-1.7, 1.1]) pieza(cilindro, rojo, x, 1.1, z, 0.1, 2.2, 0.1);
  tejadoThai({ x: 17, z: -0.3, ancho: 3, fondo: 2.8, y0: 2.2, alto: 1.7, giro: Math.PI / 2, ...teja });
  // Piedras del estanque, nenúfares y carpas koi asomando.
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2,
      r = CARPAS.forma(a),
      x = CARPAS.cx + Math.cos(a) * (CARPAS.rx * r + 0.45),
      z = CARPAS.cz + Math.sin(a) * (CARPAS.rz * r + 0.45);
    if (Math.abs(x - 17) < 1.8 && z < 2) continue;
    const k = 0.25 + azar() * 0.35;
    pieza(esfera, i % 3 ? '#4f4943' : '#6a625a', x, 0.1, z, k * 1.3, k * 0.7, k);
  }
  for (let i = 0; i < 16; i++) {
    const x = 13.5 + azar() * 7,
      z = 2 + azar() * 4.4;
    if (!dentroDe(CARPAS, x, z, -0.4)) continue;
    pieza(cilindro, i % 4 ? '#4f8a3e' : '#6aa04c', x, -0.8, z, 0.32 + azar() * 0.2, 0.03, 0.32 + azar() * 0.2);
    if (i % 5 === 0) pieza(bola, '#f2a7c3', x + 0.1, -0.68, z, 0.12, 0.1, 0.12);
  }
  for (const [x, z, giro, color, mancha] of [
    [15.2, 3.6, 0.4, '#f08a2c', '#f4efe6'],
    [16.6, 5.4, 2.2, '#f4efe6', '#e24b2b'],
    [18.4, 3.0, -1.1, '#f6b33a', '#f6b33a'],
    [14.4, 5.2, 3.4, '#e24b2b', '#f4efe6'],
    [19.2, 5.4, 1.4, '#2b2a28', '#f08a2c'],
    [17.4, 2.2, 0.2, '#f4efe6', '#f08a2c'],
  ] as [number, number, number, string, string][]) {
    const d = marco(x, -0.8, z, giro);
    d(bola, color, 0, 0, 0, 0.32, 0.06, 0.12);
    d(bola, mancha, 0.08, 0.02, 0, 0.12, 0.05, 0.08);
    d(cono, color, -0.36, 0, 0, 0.1, 0.14, 0.02, 0, 0, Math.PI / 2);
  }

  // --- Aviarios de los loros: tres jaulas de malla con sus perchas, al sur del paseo ---
  const malla = '#2f4a3a';
  for (const [i, x0] of [17.2, 21.1, 25].entries()) {
    const x1 = x0 + 3.6,
      z0 = -12,
      z1 = -5.8,
      alto = 3,
      xm = (x0 + x1) / 2;
    pieza(caja, '#c9b48a', xm, 0.03, (z0 + z1) / 2, 3.6, 0.06, z1 - z0);
    for (const x of [x0, xm, x1]) for (const z of [z0, z1]) pieza(caja, malla, x, alto / 2, z, 0.1, alto, 0.1);
    for (const z of [z0, (z0 + z1) / 2, z1]) pieza(caja, malla, xm, alto, z, 3.6, 0.08, 0.08);
    for (const x of [x0, x1]) pieza(caja, malla, x, alto, (z0 + z1) / 2, 0.08, 0.08, z1 - z0);
    // Malla: varillas finas al frente, en los costados y por arriba.
    for (let k = 1; k < 11; k++) pieza(caja, malla, x0 + (k * 3.6) / 11, alto / 2, z1, 0.025, alto, 0.025);
    for (const y of [1.1, 2.1]) pieza(caja, malla, xm, y, z1, 3.6, 0.03, 0.03);
    for (let k = 1; k < 7; k++) {
      pieza(caja, malla, xm, alto, z0 + (k * (z1 - z0)) / 7, 3.6, 0.025, 0.025);
      pieza(caja, malla, x0, alto / 2, z0 + (k * (z1 - z0)) / 7, 0.025, alto, 0.025);
    }
    // Rama seca de percha, con guacamayos de una o dos especies.
    pieza(poste, '#6b5440', x0 + 1.2, 1.0, -8.8, 0.1, 2, 0.1, 0.15);
    pieza(poste, '#6b5440', x0 + 1.8, 1.75, -8.7, 0.07, 1.8, 0.07, 0, 0, Math.PI / 2);
    pieza(poste, '#6b5440', x0 + 2.2, 1.15, -7.2, 0.07, 1.5, 0.07, 0, 0, Math.PI / 2 - 0.2);
    pieza(cilindro, '#a59a8c', x0 + 2.8, 0.12, -10.4, 0.35, 0.16, 0.35);
    pieza(cilindro, '#6fb3c0', x0 + 2.8, 0.2, -10.4, 0.3, 0.02, 0.3);
    const pareja = [especies[[0, 1, 3][i]], especies[[0, 2, 4][i]]];
    guacamayo(x0 + 1.3, 1.79, -8.7, Math.PI / 2, pareja[0]);
    guacamayo(x0 + 2.2, 1.79, -8.7, Math.PI / 2 - 0.3, pareja[1]);
    guacamayo(x0 + 1.9, 1.19, -7.2, Math.PI / 2 + 0.4, pareja[0]);
    for (let k = 0; k < 4; k++) pieza(esfera, elige(['#3f6b3d', '#4f7d45', '#5e8a4c']), x0 + 0.5 + azar() * 0.5, 0.45, z0 + 0.6 + azar() * 1.5, 0.5, 0.45, 0.5);
  }

  // --- Gorilas: pradera con rocas, troncos para trepar y su casa de cubierta verde ---
  pieza(caja, '#7b9a49', 34.5, 0.03, -10.5, 11.8, 0.06, 10);
  pieza(caja, '#b3a690', 35, 1.3, -14.4, 7.5, 2.6, 2.4);
  pieza(caja, '#4f8a55', 35, 2.66, -14.4, 7.8, 0.14, 2.7);
  for (const x of [32.5, 35, 37.5]) {
    pieza(caja, '#2a2522', x, 0.8, -13.18, 1.1, 1.4, 0.04);
    ventanas.push([x, 0.8, -13.16, 0.9, 1.2, 0.02]);
  }
  for (const [x, z, r] of [
    [30.6, -12.4, 1.1],
    [39.4, -9.6, 1.4],
    [32.2, -7.2, 0.7],
    [38.2, -6.8, 0.8],
    [36.6, -11.6, 0.6],
  ]) {
    pieza(esfera, '#8a7f72', x, r * 0.4, z, r * 1.2, r * 0.8, r);
    pieza(esfera, '#9c9083', x + 0.3, r * 0.75, z - 0.2, r * 0.6, r * 0.5, r * 0.55);
  }
  for (const [x, z] of [
    [31.4, -9.4],
    [33.8, -9.8],
    [31.4, -11.6],
  ])
    pieza(poste, '#6b5440', x, 1.4, z, 0.16, 2.8, 0.16);
  pieza(poste, '#6b5440', 32.6, 2.6, -9.6, 0.13, 2.5, 0.13, 0, 0, Math.PI / 2);
  pieza(poste, '#6b5440', 31.4, 2.2, -10.5, 0.12, 2.2, 0.12, Math.PI / 2);
  pieza(poste, '#6b5440', 36.6, 0.25, -8.8, 0.2, 3, 0.2, 0, 0.6, Math.PI / 2);
  // Cristal hacia la plaza tailandesa, al este del recinto.
  pieza(caja, '#6e675f', 28.75, 0.2, -10.5, 0.3, 0.4, 10);
  pieza(caja, '#bfe0e6', 28.75, 0.85, -10.5, 0.05, 0.9, 10);
  pieza(caja, '#d9cfbf', 34.4, 0.5, -5.4, 11.6, 1, 0.3);
  function gorila(x: number, z: number, giro: number, sentado: boolean, escala = 1) {
    const negro = '#2b2a2a',
      d = marco(x, 0.06, z, giro, 0, escala);
    if (sentado) {
      d(bola, negro, 0, 0.5, 0, 0.36, 0.48, 0.38);
      d(bola, '#8d8b86', -0.12, 0.58, 0, 0.2, 0.32, 0.3);
      d(bola, negro, 0.08, 1.05, 0, 0.2, 0.22, 0.2);
      d(bola, '#3d3936', 0.22, 1.0, 0, 0.09, 0.1, 0.13);
      for (const s of [-1, 1]) {
        d(bola, negro, 0.15, 0.5, s * 0.38, 0.12, 0.42, 0.12, s * 0.15);
        d(bola, negro, 0.3, 0.16, s * 0.22, 0.28, 0.13, 0.14);
      }
    } else {
      d(bola, negro, 0, 0.65, 0, 0.48, 0.32, 0.32, 0, 0, 0.25);
      d(bola, negro, 0.45, 0.8, 0, 0.18, 0.19, 0.18);
      for (const s of [-1, 1]) {
        d(bola, negro, 0.3, 0.38, s * 0.24, 0.1, 0.36, 0.1);
        d(bola, negro, -0.3, 0.3, s * 0.2, 0.12, 0.3, 0.12);
      }
    }
  }
  gorila(33.6, -9.2, Math.PI, true, 1.1);
  gorila(36, -11.2, 2.4, false);
  gorila(38.2, -6.8 + 0.1, Math.PI, true, 0.6);

  // --- Planet Penguin: tambor de hielo con cubierta de placas solares, ala curva y torre blanca ---
  const pp = { x: 6.5, z: -12.8 };
  pieza(cilindro, '#e3edf1', pp.x, 2.1, pp.z, 4.3, 4.2, 4.3);
  pieza(cilindro, '#2d5d8a', pp.x, 3.5, pp.z, 4.33, 0.55, 4.33);
  pieza(cilindro, '#cfd9df', pp.x, 4.3, pp.z, 4.5, 0.2, 4.5);
  pieza(cono, '#34465a', pp.x, 5.0, pp.z, 4.3, 1.2, 4.3);
  for (const r of [1.6, 2.8]) pieza(cilindro, '#c3ccd2', pp.x, 5.6 - r * 0.24, pp.z, r, 0.06, r);
  pon(losaHueca(sector(pp.x, pp.z, 4.25, 6.2, 0.5, 2.7), [], 0, 2.8), '#f4f6f6');
  pon(losaHueca(sector(pp.x, pp.z, 6.1, 6.28, 0.5, 2.7), [], 1.0, 2.1), '#3b6f9c');
  pon(losaHueca(sector(pp.x, pp.z, 4.25, 6.4, 0.45, 2.75), [], 2.8, 2.98), '#dfe7ea');
  for (let k = 0; k < 9; k++) {
    const a = 0.65 + k * 0.24;
    ventanas.push([pp.x + Math.cos(a) * 6.3, 1.55, pp.z + Math.sin(a) * 6.3, 0.3, 0.9, 0.3]);
  }
  // Torre redonda junto a la puerta, con remate azul.
  const torre = { x: pp.x + 3.7, z: pp.z + 3.7 };
  pieza(cilindro, '#f7f8f8', torre.x, 3.1, torre.z, 0.85, 6.2, 0.85);
  pieza(cilindro, '#2d5d8a', torre.x, 5.6, torre.z, 0.88, 0.5, 0.88);
  pieza(bola, '#dfe7ea', torre.x, 6.2, torre.z, 0.85, 0.5, 0.85);
  // Puerta y témpanos blancos a los lados.
  const fachada = pp.z + 6.2;
  pieza(caja, '#1f3550', pp.x, 1.2, fachada + 0.05, 2.6, 2.4, 0.16);
  pieza(caja, '#8fc2dc', pp.x, 1.1, fachada + 0.15, 2.2, 2.1, 0.05);
  ventanas.push([pp.x, 1.1, fachada + 0.18, 2.0, 1.9, 0.02]);
  for (const [dx, r] of [
    [-2.4, 0.75],
    [-3.2, 0.5],
    [2.4, 0.7],
    [3.1, 0.48],
  ]) {
    const x = pp.x + dx,
      z = pp.z + Math.sqrt(6.2 * 6.2 - dx * dx) + 0.1;
    pieza(esfera, '#f2f8fb', x, r * 0.8, z, r, r * 1.3, r * 0.55);
    pieza(esfera, '#cfe8f2', x + 0.2, r * 0.4, z + 0.1, r * 0.7, r * 0.6, r * 0.45);
  }
  letrero('Planet Penguin', pp.x, 3.5, fachada - 0.1, 4.6, 0.8, 0, '#1f4f8f', '#ffffff');
  // Pingüinos de Humboldt en su charca, junto a la puerta.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2,
      r = HUMBOLDT.forma(a),
      k = 0.22 + azar() * 0.22;
    pieza(esfera, i % 2 ? '#8f8a84' : '#a39d96', HUMBOLDT.cx + Math.cos(a) * (HUMBOLDT.rx * r + 0.4), 0.12, HUMBOLDT.cz + Math.sin(a) * (HUMBOLDT.rz * r + 0.4), k * 1.3, k * 0.8, k);
  }
  cristal(12.4, 16.8, -5.4);
  function pinguino(x: number, y: number, z: number, giro: number) {
    const d = marco(x, y, z, giro, 0, 0.75);
    d(bola, '#1f2226', 0, 0.32, 0, 0.17, 0.3, 0.16);
    d(bola, '#f3f1ec', 0.07, 0.3, 0, 0.12, 0.25, 0.12);
    d(bola, '#1f2226', 0.02, 0.65, 0, 0.11, 0.11, 0.1);
    d(caja, '#f3f1ec', 0.04, 0.6, 0, 0.12, 0.025, 0.2);
    d(cono, '#3a3632', 0.14, 0.64, 0, 0.03, 0.1, 0.03, 0, 0, -Math.PI / 2);
    for (const s of [-1, 1]) d(bola, '#1f2226', 0, 0.32, s * 0.15, 0.08, 0.2, 0.03, s * 0.25);
    d(caja, '#3a3632', 0.05, 0.02, 0, 0.14, 0.04, 0.16);
  }
  pinguino(12.9, 0.15, -6.6, 0.6);
  pinguino(13.3, 0.15, -6.2, 1.4);
  pinguino(16.3, 0.15, -6.5, 2.4);
  pinguino(16.6, 0.15, -8.6, 3.1);
  pinguino(14.8, -0.83, -7.8, 0.2);

  // --- Isla del Tigre: islote de hierba y rocas tras el foso, con cristal a los dos paseos ---
  const islote: Estanque = { ...FOSO, rx: 2.8, rz: 1.9 };
  pon(losaHueca(contorno(islote), [], -1.4, 0.32), '#6f8a46');
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2,
      k = 0.22 + azar() * 0.3;
    pieza(esfera, i % 2 ? '#8a7660' : '#76654f', FOSO.cx + Math.cos(a) * 2.85, 0.15, FOSO.cz + Math.sin(a) * 1.95, k * 1.3, k * 0.9, k);
  }
  pieza(esfera, '#9a8a74', 3.8, 0.7, 4.6, 1.0, 0.8, 0.7);
  pieza(esfera, '#8a7a66', 4.4, 0.5, 5.1, 0.6, 0.45, 0.5);
  pieza(poste, '#6b5440', 6.8, 0.5, 4.7, 0.15, 2, 0.15, 0, 0.4, Math.PI / 2);
  cristal(1.2, 9.8, -1.6);
  cristal(1.2, 9.8, 9.6);
  function tigre(x: number, y: number, z: number, giro: number, piel: string, raya: string, tumbado: boolean) {
    const d = marco(x, y, z, giro, 0, 0.85);
    const alto = tumbado ? 0.28 : 0.62;
    d(bola, piel, 0, alto, 0, 0.62, 0.24, 0.24);
    d(bola, '#f1ebe0', 0.05, alto - 0.12, 0, 0.5, 0.12, 0.18);
    d(bola, piel, 0.68, alto + 0.12, 0, 0.21, 0.19, 0.2);
    d(bola, '#f1ebe0', 0.84, alto + 0.07, 0, 0.09, 0.08, 0.11);
    for (const s of [-1, 1]) d(cono, piel, 0.62, alto + 0.32, s * 0.12, 0.06, 0.1, 0.05);
    for (let k = 0; k < 6; k++) d(caja, raya, -0.45 + k * 0.17, alto + 0.02, 0, 0.04, 0.5, 0.5, 0, 0, 0.12);
    d(caja, raya, 0.72, alto + 0.2, 0, 0.12, 0.03, 0.21);
    if (tumbado)
      for (const s of [-1, 1]) {
        d(bola, piel, 0.6, 0.1, s * 0.16, 0.3, 0.08, 0.08);
        d(bola, piel, -0.35, 0.12, s * 0.2, 0.25, 0.1, 0.1);
      }
    else for (const u of [-0.4, 0.4]) for (const s of [-1, 1]) d(poste, piel, u, 0.25, s * 0.14, 0.15, 0.5, 0.15);
    d(caja, piel, -0.85, alto - 0.1, 0, 0.6, 0.06, 0.06, 0, 0, 0.6);
    d(caja, raya, -1.1, alto - 0.28, 0, 0.12, 0.06, 0.07, 0, 0, 0.6);
  }
  tigre(4.6, 0.32, 3.4, -0.5, '#d9822b', '#1d1a18', true);
  tigre(6.6, 0.32, 3.0, 2.7, '#ece6da', '#3a3633', false);

  // --- Orca Ocean: estanque en forma de ocho y, al otro lado del paseo, gradas bajo la gran cubierta ---
  const gris = '#b9b4ab';
  for (let k = 0; k < 8; k++) {
    const z = -5 - k * 0.95 - 0.475,
      top = 0.25 + k * 0.38;
    pieza(caja, gris, -25.5, top / 2, z, 12, top, 0.95);
    for (const [x, w] of [
      [-29.8, 3.2],
      [-26.7, 2.4],
      [-24.3, 2.4],
      [-21.2, 3.2],
    ])
      pieza(caja, '#f0c02f', x, top + 0.13, z + 0.18, w, 0.26, 0.4);
  }
  for (const x of [-31.6, -19.4]) pieza(caja, '#a8a299', x, 1.6, -8.8, 0.3, 3.2, 7.6);
  // Público en las gradas: camisas y cabezas.
  for (let i = 0; i < 44; i++) {
    const k = Math.floor(azar() * 8),
      x = -31 + azar() * 11;
    if (Math.abs(x + 28.25) < 0.4 || Math.abs(x + 25.5) < 0.4 || Math.abs(x + 22.75) < 0.4) continue;
    const z = -5 - k * 0.95 - 0.4,
      y = 0.25 + k * 0.38 + 0.26;
    pieza(poste, elige(['#d8473c', '#2f7fbf', '#f2f2ee', '#3c9a5f', '#e09a2f', '#7d4ea0']), x, y + 0.2, z, 0.16, 0.36, 0.13);
    pieza(bola, elige(['#d5996a', '#a8724a', '#e8b98f', '#6b4630']), x, y + 0.5, z, 0.1, 0.11, 0.1);
  }
  // Cubierta: un abanico de lona blanca tendido desde un mástil alto tras las gradas.
  {
    const mastil = new T.Vector3(-25.5, 9.2, -14.2);
    const frente = Array.from({ length: 9 }, (_, i) => new T.Vector3(-32.4 + i * 1.725, i % 2 ? 4.5 : 5.3, -4.6 - Math.sin((i / 8) * Math.PI) * 0.8));
    const vertices: number[] = [];
    const tri = (a: T.Vector3, b: T.Vector3, c: T.Vector3) => vertices.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let i = 1; i < frente.length; i++) tri(mastil, frente[i - 1], frente[i]);
    tri(mastil, frente[0], new T.Vector3(-32.6, 4.2, -13.2));
    tri(mastil, new T.Vector3(-18.4, 4.2, -13.2), frente.at(-1)!);
    const lona = new T.BufferGeometry();
    lona.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    lona.computeVertexNormals();
    pon(lona, '#f7f6f2');
    pieza(poste, '#e9ece8', mastil.x, mastil.y / 2, mastil.z, 0.2, mastil.y, 0.2);
    for (const p of frente.filter((_, i) => i % 2 === 0)) pieza(poste, '#e9ece8', p.x, p.y / 2, p.z - 0.15, 0.09, p.y, 0.09);
  }
  letrero('Orca Ocean', -25.5, 4.25, -5.35, 4.2, 0.8, 0, '#0f2f52', '#ffffff');
  cristal(-31, -20.2, -1.6);
  // Repisa de salida al norte del estanque, con agua somera.
  pieza(caja, '#e6dcc4', -25.5, -0.06, 7.3, 4.4, 0.32, 1.6);
  pieza(caja, '#bcd9dc', -25.5, -0.2, 6.3, 4.4, 0.04, 0.6);
  function orca(x: number, y: number, z: number, giro: number, cabeceo: number, escala = 1) {
    const negro = '#16181b',
      d = marco(x, y, z, giro, cabeceo, escala);
    d(bola, negro, 0, 0, 0, 1.6, 0.52, 0.5);
    d(bola, negro, -1.45, 0.04, 0, 0.62, 0.24, 0.2);
    d(caja, negro, -2.05, 0.06, 0, 0.36, 0.04, 0.95, 0, 0, 0.05);
    d(bola, '#f4f4f2', 0.25, -0.2, 0, 1.25, 0.32, 0.38);
    for (const s of [-1, 1]) {
      d(bola, '#f4f4f2', 1.0, 0.14, s * 0.33, 0.28, 0.1, 0.14);
      d(bola, negro, 0.65, -0.32, s * 0.48, 0.32, 0.05, 0.22, s * 0.4);
    }
    d(bola, '#8f959b', -0.45, 0.4, 0, 0.36, 0.13, 0.32);
    d(triangulo, negro, -0.1, 0.35, 0, 0.55, 1.0, 0.07, 0, 0, 0.18);
  }
  orca(-22.6, -0.15, 3.8, 0.5, 0.95, 0.9);
  orca(-28.8, -0.72, 4.2, 2.8, 0, 0.9);
  orca(-27.2, 0.4, 7.3, -0.05, 0.05, 0.8);
  orca(-24.6, -0.74, 2.2, 3.3, 0, 0.55);
  /** Salpicadura irregular donde un animal rompe el agua. */
  function espuma(x: number, z: number, r: number) {
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + azar() * 0.6,
        d = r * (0.6 + azar() * 0.6),
        k2 = 0.12 + azar() * 0.18;
      pieza(bola, '#eef6f7', x + Math.cos(a) * d, -0.8 + azar() * 0.12, z + Math.sin(a) * d * 0.7, k2 * 1.4, 0.05 + azar() * 0.1, k2);
    }
  }
  espuma(-22.4, 3.8, 0.9);

  // --- Delfinario: gradas bajas al sur del paseo y, al norte del estanque, la roca con su cascada ---
  for (let k = 0; k < 4; k++) {
    const z = -5 - k * 0.95 - 0.475,
      top = 0.22 + k * 0.3;
    pieza(caja, gris, -11.3, top / 2, z, 9, top, 0.95);
    for (const x of [-13.8, -11.3, -8.8]) pieza(caja, '#4f86b8', x, top + 0.12, z + 0.18, 2.2, 0.24, 0.38);
  }
  // Vela blanca sobre las gradas.
  {
    const vertices = [-15.8, 3.6, -4.8, -6.8, 3.6, -4.8, -11.3, 5.4, -9.8];
    const vela = new T.BufferGeometry();
    vela.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    vela.computeVertexNormals();
    pon(vela, '#f7f6f2');
    for (const [x, y, z] of [
      [-15.8, 3.6, -4.8],
      [-6.8, 3.6, -4.8],
      [-11.3, 5.4, -9.8],
    ])
      pieza(poste, '#e9ece8', x, y / 2, z, 0.08, y, 0.08);
  }
  cristal(-15.6, -7, -1.6);
  for (let i = 0; i < 20; i++) {
    const x = -15.6 + i * 0.46 + azar() * 0.2,
      z = 7.9 + azar() * 1.2,
      h = 0.8 + Math.sin(i * 0.7) * 0.4 + azar() * 0.5;
    pieza(esfera, i % 3 ? '#b49372' : '#a3815f', x, h * 0.5, z, 0.8, h, 0.7);
  }
  pieza(caja, '#e8dcc4', -11.3, 0.02, 7.0, 5.6, 0.14, 0.9);
  pieza(caja, '#e9f6f8', -10, 0.95, 7.7, 0.6, 1.7, 0.12);
  pieza(caja, '#cfeef3', -10, 0.55, 7.6, 0.8, 1.0, 0.1);
  for (let k = 0; k < 8; k++) pieza(esfera, elige(['#3f6b3d', '#4f7d45', '#5e8a4c']), -15.2 + k * 1.2, 1.7 + azar() * 0.3, 8.9 + azar() * 0.4, 0.6, 0.4, 0.5);
  function delfin(x: number, y: number, z: number, giro: number, cabeceo: number) {
    const d = marco(x, y, z, giro, cabeceo, 0.85);
    d(bola, '#7b8894', 0, 0, 0, 0.95, 0.24, 0.24);
    d(bola, '#dfe3e5', 0.1, -0.09, 0, 0.75, 0.14, 0.18);
    d(bola, '#7b8894', 1.0, -0.04, 0, 0.24, 0.07, 0.07);
    d(triangulo, '#6d7a86', -0.1, 0.16, 0, 0.36, 0.34, 0.04, 0, 0, 0.3);
    d(caja, '#6d7a86', -1.0, 0.0, 0, 0.22, 0.03, 0.55);
    for (const s of [-1, 1]) d(bola, '#6d7a86', 0.35, -0.16, s * 0.24, 0.18, 0.03, 0.12, s * 0.4);
  }
  delfin(-12.2, 1.1, 4.4, 0.15, 0.35);
  delfin(-12, 1.15, 3.5, 0.15, 0.3);
  delfin(-8.4, -0.75, 5.2, 2.4, 0);
  delfin(-14, -0.78, 3.2, -1.2, 0);
  espuma(-13.2, 3.9, 0.6);

  // --- Café Vista Teide: terraza de tablas asomada al valle, con mesas y sombrillas ---
  pieza(caja, tablas, -3, 0.05, -7.5, 5, 0.1, 5);
  for (let k = 0; k < 6; k++) pieza(caja, '#7f5e42', -5.2 + k * 0.88, 0.105, -7.5, 0.03, 0.02, 5);
  for (let x = -5.5; x <= -0.5; x += 0.5) pieza(caja, '#e9e6df', x, 0.55, -10, 0.05, 1.0, 0.05);
  for (let z = -10; z <= -5; z += 0.5) pieza(caja, '#e9e6df', -0.5, 0.55, z, 0.05, 1.0, 0.05);
  pieza(caja, '#e9e6df', -3, 1.05, -10, 5, 0.07, 0.09);
  pieza(caja, '#e9e6df', -0.5, 1.05, -7.5, 0.09, 0.07, 5);
  for (const [x, z] of [
    [-4.4, -9],
    [-1.7, -9.1],
    [-4.3, -6.6],
    [-1.6, -6.4],
  ]) {
    pieza(cilindro, '#f1efe8', x, 0.78, z, 0.42, 0.05, 0.42);
    pieza(poste, '#9a9690', x, 1.25, z, 0.05, 2.5, 0.05);
    pieza(cono, '#f6f3ea', x, 2.35, z, 1.05, 0.42, 1.05);
    for (const s of [-1, 1]) pieza(caja, '#5f7f9a', x + s * 0.6, 0.45, z, 0.36, 0.06, 0.36);
  }
  // Quiosco del café, encalado y con tejado de teja.
  pieza(caja, '#f3efe6', -4.6, 1.3, -11.8, 3.6, 2.6, 3.2);
  for (const lado of [-1, 1]) superficie(caja, t.materiales.teja, -4.6, 2.9, -11.8 + lado * 0.8, 4, 0.13, 1.85, 1.85, lado * 0.42);
  pieza(caja, '#2a2522', -4.6, 1.2, -10.18, 2.2, 1.2, 0.05);
  ventanas.push([-4.6, 1.2, -10.15, 2.0, 1.0, 0.02]);

  // --- Faroles por los paseos ---
  for (const [x, z] of [
    [23.6, 13.4],
    [12, 13.4],
    [0.5, 13.4],
    [-12, 13.4],
    [-17, -1.7],
    [-1.6, -1.7],
    [11, -1.7],
    [23.6, -5.4],
    [28.8, 12],
  ])
    farol(x, z);

  // --- Jardín tropical: matas, helechos, platanillos y árboles entre los paseos ---
  const libre: Rect[] = [
    ...suelos.map(({ r: [a, b, c, d] }): Rect => [a - 0.35, b - 0.35, c + 0.35, d + 0.35]),
    [29.2, 0.6, 38.8, 9.4], // pabellón
    [16.8, -12.4, 29, -5.4], // aviarios
    [28.5, -16, 40.6, -5.2], // gorilas
    [0, -19.5, 13, -6.4], // Planet Penguin
    [-32, -13.5, -19, -4.6], // gradas de Orca Ocean
    [-16.2, -9.6, -6.4, -4.6], // gradas del delfinario
    [-16.2, 7.4, -6.4, 9.8], // roca del delfinario
    [-6.8, -13.8, -2.4, -9.8], // quiosco del café
    [12.2, -9.2, 17, -5.2], // pingüinos de Humboldt
    [-26.6, 6.6, -24.4, 8.4], // repisa de las orcas
    [47.8, -0.2, 50.8, 10], // tren
  ];
  const ocupado = (x: number, z: number) =>
    libre.some(([a, b, c, d]) => x > a && x < c && z > b && z < d) || ESTANQUES.some((e) => dentroDe(e, x, z, 0.8));
  const hojas = ['#3f6b3d', '#4f7d45', '#5e8a4c', '#3b5e36', '#6b9150', '#2f5531'];
  for (let i = 0; i < 1000; i++) {
    const x = -34 + azar() * 86,
      z = -19 + azar() * 36;
    if (ocupado(x, z)) continue;
    // Al norte de los paseos, ante la cámara, solo matas bajas.
    const cerca = z > 12.6;
    const r = cerca ? 0.25 + azar() * 0.2 : 0.35 + azar() * 0.55,
      tipo = cerca ? 0 : azar();
    if (tipo < 0.62) {
      // Mata redonda, a veces con flores.
      pieza(esfera, elige(hojas), x, r * 0.7, z, r * 1.2, r, r * 1.1);
      if (azar() > 0.82) pieza(bola, elige(['#e2483d', '#f2a7c3', '#f5c542', '#ff7a3a']), x + 0.2, r * 1.4, z + 0.2, 0.12, 0.1, 0.12);
    } else if (tipo < 0.8) {
      // Platanillo o ave del paraíso: hojas largas en abanico.
      for (let k = 0; k < 5; k++) {
        const a = k * 1.25 + azar();
        pieza(esfera, elige(hojas), x + Math.cos(a) * 0.35, 0.9, z + Math.sin(a) * 0.35, 0.5, 0.06, 0.16, 0, -a, 0.6);
      }
      pieza(poste, '#6f7a3c', x, 0.45, z, 0.08, 0.9, 0.08);
    } else if (tipo < 0.92) {
      // Helecho arborescente.
      pieza(poste, '#4b3a2c', x, 0.75, z, 0.12, 1.5, 0.12);
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05;
        pieza(esfera, '#4f7d45', x + Math.cos(a) * 0.45, 1.5, z + Math.sin(a) * 0.45, 0.6, 0.05, 0.16, 0, -a, -0.35);
      }
    } else if (z < -5.5) {
      // Árbol de copa ancha, solo al sur, donde no tapa los paseos ante la cámara.
      const h = 2.6 + azar() * 1.6;
      pieza(poste, '#5d4a39', x, h / 2, z, 0.26, h, 0.26);
      for (let k = 0; k < 6; k++) {
        const a = k * 2.4,
          dd = k ? 0.9 : 0;
        pieza(esfera, elige(hojas), x + Math.cos(a) * dd, h + 0.2 + (k % 3) * 0.25, z + Math.sin(a) * dd, 1.1, 0.8, 1.1);
      }
    }
  }
  // El gran ficus del pueblo tailandés, plantado en 1976.
  pieza(poste, '#6a5a4a', 22.4, 1.6, -15, 0.7, 3.2, 0.7);
  for (let k = 0; k < 9; k++) {
    const a = k * 0.7;
    pieza(esfera, elige(hojas), 22.4 + Math.cos(a) * 1.6, 3.5 + (k % 3) * 0.4, -15 + Math.sin(a) * 1.4, 1.5, 1, 1.4);
  }

  // --- Alrededores: la avenida y Punta Brava al norte, el aparcamiento al oeste ---
  const asfalto = tenido(cal, '#6e6b68');
  superficie(caja, asfalto, 20, 0.02, 20, 120, 0.06, 3, 5);
  for (let x = -38; x < 78; x += 2.4) pieza(caja, '#e8e4da', x, 0.06, 20, 1.2, 0.02, 0.1);
  superficie(caja, asfalto, 58, 0.02, 7, 14, 0.06, 18, 5);
  for (let z = -1; z < 16; z += 1.6) pieza(caja, '#e8e4da', 58, 0.06, z, 12, 0.02, 0.06);
  for (let i = 0; i < 20; i++) {
    const x = 53 + (i % 2) * 10 + (azar() - 0.5) * 0.2,
      z = -0.2 + Math.floor(i / 2) * 1.6;
    if (azar() > 0.7) continue;
    pieza(caja, elige(['#d8473c', '#2f7fbf', '#f2f2ee', '#3a3a3a', '#9aa1a8', '#e0b23a']), x, 0.35, z, 2.0, 0.5, 0.95);
    pieza(caja, '#2b3640', x - 0.1, 0.75, z, 1.1, 0.35, 0.85);
  }
  const fachadas = ['#f3efe6', '#e8d9b5', '#f0c9a0', '#d9e4e0', '#e3b6a6', '#f6f1e3', '#cfdbe8'];
  function casita(x: number, z: number, w: number, d: number, h: number, base = 0) {
    pieza(caja, elige(fachadas), x, base + h / 2, z, w, h, d);
    if (azar() > 0.45) pieza(piramide, elige(['#b8553a', '#c4673f', '#a94a33']), x, base + h + 0.55, z, w * 0.74, 1.1, d * 0.74, 0, Math.PI / 4);
    else for (const s of [-1, 1]) pieza(caja, '#f6f3ec', x, base + h + 0.12, z + (s * d) / 2, w, 0.24, 0.1);
    for (const s of [-1, 1])
      for (let y = base + 1.1; y < base + h - 0.4; y += 1.5) {
        pieza(caja, '#3a4448', x + s * w * 0.25, y, z + d / 2 + 0.02, 0.55, 0.7, 0.04);
        if (azar() > 0.6) ventanas.push([x + s * w * 0.25, y, z + d / 2 + 0.04, 0.45, 0.6, 0.03]);
        pieza(caja, '#3a4448', x + s * w * 0.25, y, z - d / 2 - 0.02, 0.55, 0.7, 0.04);
      }
  }
  for (let x = -36; x < 74; x += 4.4) if (Math.hypot(x, 24) < 76) casita(x, 24, 4, 4, 2.6 + azar() * 3.2);
  for (let z = -18; z < 18; z += 4.6) for (const x of [68, 73]) if (Math.hypot(x, z) < 76) casita(x, z, 4.2, 4.2, 2.4 + azar() * 1.8);
  // Costa de Punta Brava: lava negra que entra en el Atlántico.
  for (let i = 0; i < 70; i++) {
    const x = -50 + azar() * 120,
      z = 27.2 + azar() * 3.2,
      r = 0.6 + azar() * 1.3;
    if (Math.hypot(x, z) > 78) continue;
    pieza(esfera, i % 3 ? '#2f2b29' : '#45403c', x, -0.5 + azar() * 0.3, z, r * 1.3, r * 0.7, r);
  }

  // --- Al este, plataneras en bancales con muros de piedra y estanques de riego ---
  for (let x = -36; x > -80; x -= 1.9)
    for (let z = -19; z < 17; z += 1.9) {
      if (Math.hypot(x, z) > 77 || azar() > 0.85) continue;
      const h = 1.1 + azar() * 0.5;
      pieza(poste, '#7d8a4a', x, h / 2, z, 0.12, h, 0.12);
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + azar();
        pieza(esfera, elige(['#6f9a45', '#5c8a3c', '#83a650']), x + Math.cos(a) * 0.45, h + 0.1, z + Math.sin(a) * 0.45, 0.6, 0.07, 0.24, 0, -a, 0.35);
      }
    }
  for (const z of [-10, 2, 14]) pieza(caja, '#7e7569', -57, 0.3, z, 42, 0.6, 0.35);
  for (const [x, z] of [
    [-46, -4],
    [-62, 9],
  ]) {
    pieza(cilindro, '#8e877c', x, 0.5, z, 3.6, 1, 3.6);
    pieza(cilindro, '#233538', x, 0.98, z, 3.3, 0.06, 3.3);
  }

  // --- Al sur, el valle de La Orotava sube hacia Las Cañadas y el Teide ---
  {
    const paso = 2.2,
      [x0, z0, x1, z1] = [-84, -84, 84, -20];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (j > 0 && j < nz ? (azar() - 0.5) * 0.4 : 0)) * paso,
          z = z0 + j * paso;
        p.push(new T.Vector3(x, alturaSur(x, z), z));
      }
    const capas = new Map<string, number[]>();
    const normal = new T.Vector3(),
      lado = new T.Vector3();
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i,
          b = a + 1,
          c = a + nx + 1,
          d = c + 1;
        for (const tri of (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]]) {
          const [u, v, w] = tri.map((n) => p[n]);
          if (Math.hypot(u.x, u.z) > 79 && Math.hypot(v.x, v.z) > 79 && Math.hypot(w.x, w.z) > 79) continue;
          const y = (u.y + v.y + w.y) / 3;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          const empinado = Math.abs(normal.y) < 0.82;
          const color =
            y > 8.3
              ? '#eef0f0'
              : y > 5.8
                ? empinado
                  ? '#6d5547'
                  : '#7d6352'
                : y > 3.9
                  ? empinado
                    ? '#86684f'
                    : '#9a7b5d'
                  : y > 2.2
                    ? empinado
                      ? '#36522f'
                      : '#44653a'
                    : y > 0.4
                      ? '#6f8f45'
                      : '#7a8f50';
          if (!capas.has(color)) capas.set(color, []);
          for (const q of [u, v, w]) capas.get(color)!.push(q.x, q.y, q.z);
        }
      }
    for (const [color, vertices] of capas) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      pon(geo, color);
    }
  }
  // Nieve en la cumbre: la malla es demasiado gruesa para el pitón, que se remata aparte.
  // Con la misma pendiente que el pilón, apoyado justo encima de él.
  pieza(cono, '#f1f1ee', TEIDE.x, 9.0, TEIDE.z, 1.6, 1.68, 1.6);
  // Casas de tejas al pie del valle, por la calle Teide, y pinar en la ladera.
  for (let x = -30; x < 44; x += 4.6)
    for (const z of [-22.6, -27.2]) {
      if (azar() > 0.8) continue;
      const xx = x + (azar() - 0.5) * 0.8;
      casita(xx, z, 3.8, 3.6, 2.4 + azar() * 1.6, alturaSur(xx, z) - 0.2);
    }
  for (let i = 0; i < 160; i++) {
    const x = -70 + azar() * 140,
      z = -78 + azar() * 46,
      y = alturaSur(x, z);
    if (y < 2.2 || y > 3.8 || Math.hypot(x, z) > 77) continue;
    pieza(cono, elige(['#2f4a2b', '#38553a', '#2a4227']), x, y + 0.7, z, 0.5, 1.4, 0.5);
  }
  // Mar de nubes: jirones bajos y alargados contra las laderas, como tantas tardes en el norte de Tenerife.
  for (let i = 0; i < 9; i++) {
    const x = -40 + i * 11 + (azar() - 0.5) * 4,
      z = -40 - azar() * 10,
      y = alturaSur(x, z) + 0.9 + azar() * 0.5;
    if (Math.hypot(x, z) > 74) continue;
    for (let k = 0; k < 5; k++) pieza(bola, '#f4f1ea', x + (k - 2) * 1.9, y + (k % 2) * 0.12, z + (azar() - 0.5) * 1.5, 2.4 + azar() * 1.2, 0.3 + azar() * 0.15, 1.4);
  }

  for (const g of [bola, cilindro, cono, triangulo]) g.dispose();
  // Barcas de pesca frente a Punta Brava, en el Atlántico, a la espalda del parque.
  return {
    amarres: [
      [0, 10, 42, 0.4],
      [1, -24, 50, 1.3],
      [2, 30, 38, 2.2],
    ],
    enSeco: [],
  };
}
