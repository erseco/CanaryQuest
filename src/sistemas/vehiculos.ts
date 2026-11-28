import Phaser from 'phaser';

/**
 * Ferris y avión que cruzan el mapa de viajes, dibujados con el canvas 2D a doble
 * resolución y mostrados a la mitad (ESCALA_VEHICULO) para que se vean suaves.
 * Cada uno tiene su versión «-oeste», con la proa a la izquierda y los rótulos
 * sin reflejar, como el nombre pintado en las dos bandas de un barco.
 */
export const ESCALA_VEHICULO = 0.5;

/** Textura del ferry según la naviera de la línea (nombres de RUTAS_BARCO). */
const FERRY_DE: Record<string, string> = {
  'Naviera Armas': 'ferry-armas',
  'Fred. Olsen Express': 'ferry-fred-olsen',
  'Líneas Romero': 'ferry-romero',
};

export function texturaFerry(naviera: string, alOeste: boolean): string {
  return (FERRY_DE[naviera] ?? 'ferry-armas') + (alOeste ? '-oeste' : '');
}

type Ctx = CanvasRenderingContext2D;
type Rotulo = (texto: string, x: number, y: number, fuente: string, color: string, espaciado?: number) => void;

const BLANCO = '#f7f8f5';
const VENTANAS = '#223142';
const FUENTE = 'Arial, Helvetica, sans-serif';

/** Polígono relleno a partir de pares x, y. */
function poli(c: Ctx, color: string | CanvasGradient, ...p: number[]): void {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
  c.closePath();
  c.fill();
}

/** Sombra del casco sobre el agua. */
function sombraAgua(c: Ctx, x: number, y: number, rx: number): void {
  c.fillStyle = 'rgba(6, 28, 48, 0.3)';
  c.beginPath();
  c.ellipse(x, y, rx, 1.8, 0, 0, Math.PI * 2);
  c.fill();
}

/**
 * Registra dos texturas (hacia el este y `-oeste`) dibujadas en un lienzo de
 * `ancho`×`alto` unidades que se muestran a `tamano` píxeles por unidad.
 */
function lienzo(
  scene: Phaser.Scene,
  clave: string,
  ancho: number,
  alto: number,
  tamano: number,
  dibujar: (c: Ctx, rotulo: Rotulo) => void,
): void {
  for (const oeste of [false, true]) {
    const canvas = document.createElement('canvas');
    const k = tamano / ESCALA_VEHICULO;
    canvas.width = Math.ceil(ancho * k);
    canvas.height = Math.ceil(alto * k);
    const c = canvas.getContext('2d')!;
    // La versión oeste se dibuja reflejada; los rótulos no.
    c.setTransform(oeste ? -k : k, 0, 0, k, oeste ? canvas.width : 0, 0);
    const rotulo: Rotulo = (texto, x, y, fuente, color, espaciado = 0) => {
      c.save();
      c.setTransform(k, 0, 0, k, 0, 0);
      c.font = fuente;
      c.fillStyle = color;
      const anchos = [...texto].map((l) => c.measureText(l).width);
      let xl = (oeste ? canvas.width / k - x : x) - (anchos.reduce((a, b) => a + b, 0) + espaciado * (anchos.length - 1)) / 2;
      [...texto].forEach((l, i) => {
        c.fillText(l, xl, y);
        xl += anchos[i] + espaciado;
      });
      c.restore();
    };
    dibujar(c, rotulo);
    scene.textures.addCanvas(clave + (oeste ? '-oeste' : ''), canvas)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}

/**
 * Ro-ro de Naviera Armas (Volcán de Taburiente, Volcán de Tagoro): casco blanco
 * con la proa y la popa rojas barridas de gris, «ARMAS» en rojo a toda la banda,
 * botes salvavidas naranjas y la contraseña azul y amarilla en la chimenea.
 */
function ferryArmas(c: Ctx, rotulo: Rotulo): void {
  const rojo = '#e10a2f';
  const gris = '#a7b2b5';
  sombraAgua(c, 46, 31.4, 42);
  // Chimenea blanca con hollín y la contraseña de la casa (cuartelada, con el emblema rojo)
  poli(c, '#e3e8ea', 20, 13, 21.5, 3.5, 29, 3.5, 30, 13);
  poli(c, '#2b3035', 21.4, 4.2, 21.6, 2.6, 28.8, 2.6, 29, 4.2);
  poli(c, '#1f4fa3', 22.4, 6, 25.4, 6, 25.4, 7.8, 22.4, 7.8);
  poli(c, '#f2c400', 25.4, 6, 28.4, 6, 27.2, 7.8, 25.4, 7.8);
  poli(c, '#f2c400', 22.4, 7.8, 25.4, 7.8, 25.4, 9.6, 22.4, 9.6);
  poli(c, '#1f4fa3', 25.4, 7.8, 27.2, 7.8, 28.4, 9.6, 25.4, 9.6);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(25.4, 7.8, 1.1, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = rojo;
  c.beginPath();
  c.arc(25.4, 7.8, 0.6, 0, Math.PI * 2);
  c.fill();
  // Palo con el radar sobre el puente
  c.fillStyle = '#59636b';
  c.fillRect(60.2, 2.2, 0.7, 6);
  c.fillRect(58.4, 3.2, 4.3, 0.6);
  // Cubierta alta y puente de mando a proa
  poli(c, BLANCO, 15, 13, 15, 8, 63, 8, 67.5, 13);
  poli(c, '#dfe5e8', 15, 13, 15, 12.2, 67, 12.2, 67.5, 13);
  c.fillStyle = VENTANAS;
  c.fillRect(18, 9.6, 38, 1.5);
  poli(c, VENTANAS, 58, 9.4, 63.6, 9.4, 64.7, 11, 58, 11);
  // Cubierta de pasaje
  poli(c, BLANCO, 7, 20, 7, 13, 69, 13, 75.5, 20);
  c.fillStyle = VENTANAS;
  c.fillRect(10, 14.8, 60, 2.1);
  c.fillStyle = BLANCO;
  for (let x = 16; x < 70; x += 7) c.fillRect(x, 14.8, 0.8, 2.1);
  // Botes salvavidas naranjas
  c.fillStyle = '#f07a22';
  for (const x of [27, 35, 43]) {
    c.beginPath();
    c.roundRect(x, 11.4, 6, 1.9, 0.9);
    c.fill();
  }
  // Casco blanco con proa lanzada y popa de rampa
  poli(c, BLANCO, 3, 19.5, 82, 19.5, 88, 18.2, 81.5, 31, 5.5, 31, 3, 25);
  // Popa roja con su franja gris
  poli(c, rojo, 3, 19.5, 12.5, 19.5, 8.5, 31, 5.5, 31, 3, 25);
  poli(c, gris, 12.5, 19.5, 15.2, 19.5, 11.2, 31, 8.5, 31);
  // Proa roja barrida, con la ola gris del logotipo detrás
  c.fillStyle = gris;
  c.beginPath();
  c.moveTo(53, 19.5);
  c.lineTo(57.5, 19.5);
  c.quadraticCurveTo(63, 26.5, 74, 31);
  c.lineTo(69.5, 31);
  c.quadraticCurveTo(59.5, 26.5, 53, 19.5);
  c.fill();
  c.fillStyle = rojo;
  c.beginPath();
  c.moveTo(57.5, 19.5);
  c.lineTo(82, 19.5);
  c.lineTo(88, 18.2);
  c.lineTo(81.5, 31);
  c.lineTo(74, 31);
  c.quadraticCurveTo(63, 26.5, 57.5, 19.5);
  c.fill();
  // Línea de flotación roja y filete bajo la cubierta
  c.fillStyle = rojo;
  c.fillRect(5, 29.8, 76, 1.2);
  c.fillRect(12, 20.4, 46, 0.5);
  rotulo('ARMAS', 34.5, 28.1, `italic 900 8.6px ${FUENTE}`, rojo, 1.5);
}

/**
 * Trimarán de Fred. Olsen Express (Benchijigua, Bencomo): casco blanco con la
 * proa perforadora oscura, franja azul, superestructura amarilla y el nombre en azul.
 */
function ferryFredOlsen(c: Ctx, rotulo: Rotulo): void {
  const amarillo = '#f4c414';
  sombraAgua(c, 46, 31.4, 42);
  // Chimenea amarilla con la contraseña roja
  poli(c, amarillo, 12, 13, 13.5, 7.5, 20, 7.5, 22, 13);
  poli(c, '#d71e28', 14.5, 8.6, 18.6, 8.6, 18.6, 11.4, 14.5, 11.4);
  poli(c, '#f4c414', 14.5, 8.6, 15.4, 8.6, 18.6, 11.4, 17.7, 11.4);
  // Superestructura amarilla en dos alturas, con la cristalera corrida
  poli(c, amarillo, 30, 13.5, 32.5, 9, 57, 9, 63.5, 13.5);
  c.fillStyle = VENTANAS;
  c.fillRect(34.5, 10.4, 23, 1.6);
  poli(c, amarillo, 8, 20, 8, 13, 69, 13, 77.5, 20);
  poli(c, VENTANAS, 11, 15, 69.5, 15, 72.4, 17.2, 11, 17.2);
  // Casco blanco con la proa larga y afilada
  poli(c, BLANCO, 3, 19.5, 77, 19.5, 89, 23.5, 86, 31, 5, 31, 3, 26);
  c.fillStyle = '#1c3f94';
  c.fillRect(5, 29.6, 79, 1.4);
  c.fillStyle = '#39424b';
  c.beginPath();
  c.moveTo(50, 31);
  c.quadraticCurveTo(70, 28.5, 89, 23.5);
  c.lineTo(86, 31);
  c.fill();
  rotulo('FRED. OLSEN', 33, 27.4, `900 6.4px ${FUENTE}`, '#1b3a7a', 0.3);
}

/**
 * Catamarán de Líneas Romero (Órzola – Caleta de Sebo): pequeño, blanco, con el
 * casco turquesa, la franja azul y la boca de tiburón pintada en la proa.
 */
function ferryRomero(c: Ctx, rotulo: Rotulo): void {
  const rojo = '#d42a20';
  sombraAgua(c, 32, 24.4, 29);
  // Flybridge, palo y cabina con grandes ventanales
  c.fillStyle = '#59636b';
  c.fillRect(29.6, 1.5, 0.7, 5);
  poli(c, BLANCO, 17, 9, 19.5, 5.4, 38, 5.4, 41.5, 9);
  poli(c, VENTANAS, 21.5, 8, 22.5, 6.6, 37, 6.6, 38.6, 8);
  poli(c, BLANCO, 7, 15, 9.5, 9, 46, 9, 52.5, 15);
  poli(c, VENTANAS, 12, 13.6, 13.4, 10.4, 45, 10.4, 48.6, 13.6);
  // Casco: banda blanca, turquesa abajo y franja azul que sube hacia la proa
  poli(c, BLANCO, 3, 15, 56, 15, 62, 16.5, 59, 24, 5, 24, 3, 20);
  poli(c, '#2c9aa0', 3, 19.8, 60.6, 19.8, 59, 24, 5, 24);
  poli(c, '#1d4f9c', 3, 20.2, 61, 17.6, 61.5, 18.6, 3, 21.2);
  // Boca de tiburón con dientes y ojo
  poli(c, rojo, 48, 20.6, 59.8, 18.3, 59.2, 22.6);
  for (let i = 0; i < 4; i++) {
    const x = 49.5 + i * 2.5;
    poli(c, '#ffffff', x, 20.4 - i * 0.48, x + 1.3, 20.15 - i * 0.48, x + 0.8, 21.6 - i * 0.4);
    poli(c, '#ffffff', x + 0.4, 21.3 + i * 0.13, x + 1.7, 21.5 + i * 0.13, x + 1.1, 20.3 + i * 0.15);
  }
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(55.6, 17.3, 0.9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#111111';
  c.beginPath();
  c.arc(55.9, 17.3, 0.45, 0, Math.PI * 2);
  c.fill();
  rotulo('ROMERO', 22, 18.4, `900 4.2px ${FUENTE}`, rojo, 0.2);
}

/**
 * ATR 72-600 de Binter visto desde arriba, con el morro a la derecha: fuselaje
 * blanco, ala alta con las botas de deshielo, hélices de seis palas, cola en T,
 * franjas verdes y azul en la cola, carenados del tren y morro en verde Binter.
 */
function avionBinter(c: Ctx, rotulo: Rotulo): void {
  const verde = '#2e9e3e';
  const verdeClaro = '#8dc63f';
  const azul = '#2a7fd4';
  // Carenados del tren principal, verdes, a los lados del fuselaje
  c.fillStyle = verde;
  for (const y of [27.6, 36.4]) {
    c.beginPath();
    c.ellipse(28.5, y, 7, 1.9, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Fuselaje con sombreado cilíndrico
  const fus = new Path2D();
  fus.moveTo(1.5, 31);
  fus.lineTo(17, 28);
  fus.lineTo(56.5, 28);
  fus.bezierCurveTo(61, 28, 65, 29.8, 65, 32);
  fus.bezierCurveTo(65, 34.2, 61, 36, 56.5, 36);
  fus.lineTo(17, 36);
  fus.lineTo(1.5, 33);
  fus.closePath();
  const cil = c.createLinearGradient(0, 28, 0, 36);
  cil.addColorStop(0, '#c3cdca');
  cil.addColorStop(0.35, '#ffffff');
  cil.addColorStop(0.65, '#f2f5f1');
  cil.addColorStop(1, '#b4bfbc');
  c.fillStyle = cil;
  c.fill(fus);
  c.save();
  c.clip(fus);
  // Franjas de la cola en chevrón: verde, verde claro y el filete azul
  const chevron = (x0: number, w: number, color: string) =>
    poli(c, color, x0, 32, x0 + 17, 27.5, x0 + 17 + w, 27.5, x0 + w, 32, x0 + 17 + w, 36.5, x0 + 17, 36.5);
  chevron(-2, 7, verde);
  chevron(5.6, 2.8, verdeClaro);
  chevron(9.2, 0.9, azul);
  chevron(10.8, 1.4, verdeClaro);
  // Morro verde claro y parabrisas
  c.fillStyle = verdeClaro;
  c.fillRect(62.6, 27, 4, 10);
  c.restore();
  poli(c, '#23353b', 57.4, 29.5, 60.4, 30.3, 60.4, 33.7, 57.4, 34.5);
  c.fillStyle = '#7f9aa0';
  c.fillRect(57.4, 31.8, 3, 0.4);
  rotulo('Binter', 47.2, 34.2, `italic 900 6.2px ${FUENTE}`, verde);
  // Ala alta: blanca, con el borde de ataque oscuro (botas de deshielo)
  const ala = new Path2D();
  ala.moveTo(37.6, 22);
  ala.lineTo(36.9, 1.4);
  ala.quadraticCurveTo(36.6, 0.4, 35.2, 0.4);
  ala.lineTo(34.1, 0.4);
  ala.quadraticCurveTo(33.4, 0.5, 33.5, 1.4);
  ala.lineTo(31, 22);
  ala.lineTo(31, 42);
  ala.lineTo(33.5, 62.6);
  ala.quadraticCurveTo(33.4, 63.5, 34.1, 63.6);
  ala.lineTo(35.2, 63.6);
  ala.quadraticCurveTo(36.6, 63.6, 36.9, 62.6);
  ala.lineTo(37.6, 42);
  ala.closePath();
  const perfil = c.createLinearGradient(31, 0, 37.6, 0);
  perfil.addColorStop(0, '#d9e0dd');
  perfil.addColorStop(0.6, '#fafcf8');
  perfil.addColorStop(1, '#e6ece9');
  c.fillStyle = perfil;
  c.fill(ala);
  c.strokeStyle = '#4d5759';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(36.9, 2);
  c.lineTo(37.4, 22);
  c.lineTo(37.4, 42);
  c.lineTo(36.9, 62);
  c.stroke();
  // Góndolas de los motores con la tobera verde, buje y disco de la hélice
  for (const y of [21.8, 42.2]) {
    poli(c, '#eef2ee', 25.5, y - 1.2, 43.5, y - 1.9, 45, y, 43.5, y + 1.9, 25.5, y + 1.2);
    poli(c, verde, 25.5, y - 1.2, 30.5, y - 1.5, 30.5, y + 1.5, 25.5, y + 1.2);
    c.fillStyle = 'rgba(40, 52, 54, 0.3)';
    c.beginPath();
    c.ellipse(46.2, y, 0.9, 5.2, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(30, 38, 40, 0.75)';
    c.fillRect(45.9, y - 5, 0.6, 10);
    c.fillStyle = '#3a4544';
    c.beginPath();
    c.ellipse(45.6, y, 1.5, 1.1, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Deriva verde y estabilizador horizontal en lo alto (cola en T)
  poli(c, verde, 5, 31.2, 17.5, 31.6, 17.5, 32.4, 5, 32.8);
  poli(c, '#eef2ee', 10.8, 32, 7.8, 23, 5, 23, 4.2, 32, 5, 41, 7.8, 41);
  poli(c, '#4d5759', 10.8, 32, 7.8, 23, 7.3, 23, 10.1, 32, 7.3, 41, 7.8, 41);
  c.fillStyle = verdeClaro;
  c.beginPath();
  c.ellipse(7.6, 32, 3.4, 0.9, 0, 0, Math.PI * 2);
  c.fill();
}

/** Espuma suave para la estela del ferry. */
function espuma(c: Ctx): void {
  const g = c.createRadialGradient(4, 4, 0, 4, 4, 4);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 8, 8);
}

export function crearTexturasVehiculos(scene: Phaser.Scene): void {
  lienzo(scene, 'ferry-armas', 90, 34, 0.78, ferryArmas);
  lienzo(scene, 'ferry-fred-olsen', 90, 34, 0.72, ferryFredOlsen);
  lienzo(scene, 'ferry-romero', 64, 27, 0.72, ferryRomero);
  lienzo(scene, 'avion', 66, 64, 0.9, avionBinter);
  lienzo(scene, 'espuma', 8, 8, 1, espuma);
}
