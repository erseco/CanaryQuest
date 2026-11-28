import * as T from 'three';
import { PUEBLOS } from '../../data/pueblos';
import type { Sitio, Taller } from '../maqueta';

type Rect = [number, number, number, number];

/**
 * Vegueta (Las Palmas de Gran Canaria): la plaza de Santa Ana y las calles que la rodean,
 * trazadas sobre la ortofoto PNOA y el callejero de OpenStreetMap, giradas 30° para que el eje
 * de la plaza corra de oeste a este y comprimidas a escala de maqueta (una unidad, unos 3 m).
 * Norte hacia −z. La catedral cierra la plaza por el este y las Casas Consistoriales por el
 * oeste; la Casa Regental y el Palacio Episcopal la flanquean por el norte, y la calle del
 * Castillo por el sur. A espaldas de la catedral quedan el Pilar Nuevo y la Casa de Colón; al
 * oeste, la plazoleta del Espíritu Santo. Las zonas pisables están en
 * `PUEBLOS['las-palmas'].plano.suelos`: si se mueve una calle, hay que moverla también allí.
 */
export function trazarVegueta(t: Taller): Sitio {
  const { pieza, superficie, farol, azar, ventanas, blanco } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, teja } = t.materiales;
  const suelos = PUEBLOS['las-palmas'].plano.suelos!;
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
  // Formas propias: tambor octogonal, media naranja, arco de medio punto, frontón y la enjuta
  // de cantería que rodea un arco (rectángulo con el medio punto vaciado).
  const octogono = new T.CylinderGeometry(0.5, 0.5, 1, 8);
  const disco = new T.CylinderGeometry(0.5, 0.5, 1, 16);
  const cupula = new T.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const arco = new T.CylinderGeometry(0.5, 0.5, 1, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  const fronton = new T.CylinderGeometry(1, 1, 1, 3)
    .rotateX(-Math.PI / 2)
    .translate(0, 0.5, 0)
    .scale(1 / Math.sqrt(3), 1 / 1.5, 1);
  const hexagono = new T.CylinderGeometry(0.5, 0.5, 1, 6);
  const contorno = new T.Shape().moveTo(-0.5, 0).lineTo(-0.38, 0);
  contorno.absarc(0, 0, 0.38, Math.PI, 0, true);
  contorno.lineTo(0.5, 0).lineTo(0.5, 0.55).lineTo(-0.5, 0.55).closePath();
  const enjuta = new T.ExtrudeGeometry(contorno, { depth: 1, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -0.5);
  const aro = new T.TorusGeometry(0.5, 0.06, 4, 14, Math.PI);

  /**
   * Plano de una fachada: `u` corre a lo largo de ella, `v` sale hacia la calle e `y` sube.
   * `giro` 0 mira al sur (+z), π al norte, π/2 al este y −π/2 al oeste.
   */
  const euler = new T.Euler(),
    local = new T.Euler(),
    cuaternion = new T.Quaternion();
  function frente(cx: number, cz: number, giro: number) {
    const c = Math.cos(giro),
      s = Math.sin(giro),
      deLado = Math.abs(s) > 0.5;
    const en = (u: number, v: number) => [cx + u * c + v * s, cz - u * s + v * c];
    return {
      d(forma: T.BufferGeometry, color: string, u: number, y: number, v: number, w: number, h: number, f: number, rx = 0, rz = 0) {
        const [x, z] = en(u, v);
        euler.setFromQuaternion(cuaternion.setFromEuler(local.set(rx, giro, rz, 'YXZ')), 'XYZ');
        pieza(forma, color, x, y, z, w, h, f, euler.x, euler.y, euler.z);
      },
      /** Cristal que se enciende de noche. */
      luz(u: number, y: number, v: number, w: number, h: number, f = 0.05) {
        const [x, z] = en(u, v);
        ventanas.push(deLado ? [x, y, z, f, h, w] : [x, y, z, w, h, f]);
      },
    };
  }
  type Frente = ReturnType<typeof frente>;
  const ocupado: Rect[] = suelos.map(({ r }) => r);

  const tea = '#5b3a24',
    canteria = '#80786e',
    hierro = '#2c2f2e',
    oscuro = '#2c2927';
  const paleta = ['#e2b45c', '#d98b5f', '#efe0bf', '#9dbaa8', '#c96f55', '#e8cd88', '#a9bad0', '#e3a69c', '#f3eee3'];
  const postigos = ['#3e6b4d', '#6b4632', '#3f5f7a', '#7a2f2a'];
  const puertas = ['#4a3122', '#2f4d3a', '#6b2f24', '#3b4f66'];
  const elige = <C>(lista: C[]) => lista[Math.floor(azar() * lista.length)];

  // --- Piezas de las casas de Vegueta ---
  /** Zócalo, esquinas de sillares alternos y cornisa. */
  function lienzo(p: Frente, ancho: number, alto: number, piedra = canteria, cornisa = blanco) {
    p.d(caja, piedra, 0, 0.21, 0.03, ancho + 0.04, 0.42, 0.07);
    for (const s of [-1, 1])
      for (let k = 0, y = 0.42; y < alto - 0.3; k++, y += 0.38) {
        const w = k % 2 ? 0.22 : 0.34;
        p.d(caja, piedra, s * (ancho / 2 - w / 2 + 0.01), y + 0.18, 0.04, w, 0.36, 0.08);
      }
    p.d(caja, cornisa, 0, alto - 0.08, 0.07, ancho + 0.14, 0.18, 0.16);
  }
  /** Ventana de guillotina con los postigos abiertos, poyo de piedra y, abajo, reja. */
  function ventana(p: Frente, u: number, y: number, w: number, h: number, postigo: string, reja = false, marco = blanco) {
    p.d(caja, marco, u, y, 0.03, w + 0.16, h + 0.16, 0.07);
    p.luz(u, y, 0.07, w, h);
    p.d(caja, marco, u, y, 0.1, 0.035, h, 0.02);
    p.d(caja, marco, u, y + h * 0.08, 0.1, w, 0.035, 0.02);
    for (const s of [-1, 1]) p.d(caja, postigo, u + s * (w * 0.75 + 0.1), y, 0.06, w / 2, h, 0.035);
    p.d(caja, '#8c8378', u, y - h / 2 - 0.1, 0.1, w + 0.32, 0.07, 0.2);
    if (reja) for (let k = -2; k <= 2; k++) p.d(caja, hierro, u + (k * w) / 5, y, 0.14, 0.025, h + 0.1, 0.025);
  }
  /** Balcón canario de tea: suelo sobre canes, balaustres torneados, pies derechos y tejadillo. */
  function balcon(p: Frente, u: number, y0: number, ancho: number, k = 1) {
    const fondo = 0.6,
      v = 0.66;
    p.d(caja, '#3a2a1f', u, y0 + 0.85 * k, 0.03, ancho * 0.5, 1.6 * k, 0.05);
    p.luz(u, y0 + 0.9 * k, 0.06, ancho * 0.38, 1.3 * k);
    p.d(caja, tea, u, y0, fondo / 2 + 0.05, ancho + 0.1, 0.1, fondo + 0.1);
    for (let i = 0; i <= 4; i++) p.d(caja, tea, u - ancho / 2 + (i * ancho) / 4, y0 - 0.13, 0.3, 0.08, 0.16, 0.55);
    const n = Math.max(6, Math.round(ancho / 0.15));
    for (let i = 0; i <= n; i++) p.d(poste, tea, u - ancho / 2 + (i * ancho) / n, y0 + 0.36 * k, v, 0.05, 0.56 * k, 0.05);
    for (const s of [-1, 1]) {
      for (let i = 1; i < 4; i++) p.d(poste, tea, u + (s * ancho) / 2, y0 + 0.36 * k, 0.05 + (i * fondo) / 4, 0.05, 0.56 * k, 0.05);
      p.d(caja, tea, u + (s * ancho) / 2, y0 + 0.68 * k, fondo / 2 + 0.05, 0.08, 0.07, fondo);
    }
    p.d(caja, tea, u, y0 + 0.68 * k, v, ancho + 0.1, 0.08, 0.1);
    for (const i of [-0.5, 0, 0.5]) p.d(caja, tea, u + i * ancho, y0 + 1.2 * k, v, 0.07, 1.0 * k, 0.07);
    p.d(caja, tea, u, y0 + 1.72 * k, v, ancho + 0.12, 0.09, 0.09);
    p.d(caja, '#9a4c34', u, y0 + 1.84 * k, fondo / 2 + 0.08, ancho + 0.36, 0.07, fondo + 0.32, 0.3);
  }
  /** Puerta de madera con marco y dintel de cantería. */
  function puerta(p: Frente, u: number, h: number, color = elige(puertas), piedra = canteria) {
    p.d(caja, piedra, u, h / 2, 0.04, 1.1, h + 0.1, 0.08);
    p.d(caja, color, u, h / 2 - 0.02, 0.08, 0.78, h - 0.1, 0.04);
    p.d(caja, piedra, u, h + 0.1, 0.06, 1.25, 0.14, 0.12);
  }
  /** Portada de arco de medio punto: hoja de madera, jambas y enjuta de piedra. */
  function portada(p: Frente, u: number, ancho: number, alto: number, piedra: string, madera = '#4a3122') {
    const w = ancho / 0.76;
    p.d(caja, madera, u, alto / 2, 0.03, ancho, alto, 0.06);
    p.d(arco, madera, u, alto, 0.03, ancho, ancho, 0.06);
    p.d(enjuta, piedra, u, alto, 0.08, w, w, 0.12);
    for (const s of [-1, 1]) p.d(caja, piedra, u + s * (ancho + w) / 4, alto / 2, 0.08, (w - ancho) / 2, alto, 0.12);
  }
  function farolPared(p: Frente, u: number, y: number) {
    p.d(caja, hierro, u, y + 0.22, 0.13, 0.04, 0.04, 0.26);
    p.d(caja, hierro, u, y + 0.08, 0.27, 0.2, 0.04, 0.2);
    p.luz(u, y - 0.08, 0.27, 0.15, 0.24, 0.15);
    p.d(piramide, hierro, u, y + 0.17, 0.27, 0.17, 0.14, 0.17, 0, Math.PI / 4);
  }
  /** Tejado de teja a dos aguas, con la cumbrera de este a oeste. */
  function tejado(x: number, z: number, w: number, d: number, h: number) {
    for (const lado of [-1, 1])
      superficie(caja, teja, x, h + 0.3 + d * 0.06, z + lado * d * 0.25, w + 0.3, 0.13, d * 0.57, 1.85, lado * 0.24);
  }
  /** Azotea con pretil, aljibe o placa solar. */
  function azotea(x: number, z: number, w: number, d: number, h: number) {
    for (const s of [-1, 1]) {
      pieza(caja, blanco, x, h + 0.16, z + (s * d) / 2, w, 0.32, 0.12);
      pieza(caja, blanco, x + (s * w) / 2, h + 0.16, z, 0.12, 0.32, d);
    }
    pieza(caja, '#d8d2c6', x, h + 0.04, z, w - 0.1, 0.06, d - 0.1);
    if (azar() > 0.5) pieza(poste, '#ece8df', x - w * 0.22, h + 0.45, z - d * 0.2, 0.7, 0.8, 0.7);
    else pieza(caja, '#2c4a6e', x + w * 0.1, h + 0.32, z, 1.1, 0.05, 0.7, 0.35);
  }
  /**
   * Casa canaria de Vegueta, de una o dos plantas: muros de color, cantería en zócalo, esquinas
   * y portada, ventanas con postigos y, a menudo, un balcón de tea en la planta alta.
   */
  function casona(r: Rect, alto: number, giro: number, color = elige(paleta), conBalcon = azar() > 0.3) {
    const [x0, z0, x1, z1] = r,
      cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    ocupado.push(r);
    superficie(caja, tenido(cal, color), cx, alto / 2, cz, x1 - x0, alto, z1 - z0, 2.6);
    const deLado = Math.abs(Math.sin(giro)) > 0.5;
    const ancho = deLado ? z1 - z0 : x1 - x0,
      fondo = deLado ? x1 - x0 : z1 - z0;
    const p = frente(cx + (Math.sin(giro) * fondo) / 2, cz + (Math.cos(giro) * fondo) / 2, giro);
    const postigo = elige(postigos);
    lienzo(p, ancho, alto, canteria, azar() > 0.5 ? blanco : canteria);
    const lado = azar() > 0.5 ? 1 : -1,
      pu = ancho < 3.3 ? 0 : lado * ancho * 0.24,
      hp = Math.min(2.05, alto * 0.5);
    puerta(p, pu, hp);
    if (ancho >= 3.3) ventana(p, -lado * ancho * 0.24, hp * 0.62, 0.56, 0.86, postigo, true);
    farolPared(p, lado * (ancho / 2 - 0.5), Math.min(2.5, alto - 0.9));
    const planta = Math.min(2.2, alto * 0.53);
    if (alto > 3.2) {
      const libre = alto - planta - 0.25,
        yv = planta + libre * 0.5;
      if (conBalcon && ancho >= 3) {
        balcon(p, 0, planta + 0.05, Math.min(2.4, ancho * 0.5), Math.min(1, libre / 1.9));
        if (ancho >= 5) for (const s of [-1, 1]) ventana(p, s * ancho * 0.36, yv, 0.5, libre * 0.6, postigo);
      } else for (const s of ancho >= 3.3 ? [-1, 1] : [0]) ventana(p, s * ancho * 0.24, yv, 0.56, libre * 0.62, postigo);
    }
    if (alto >= 3 && azar() > 0.45) tejado(cx, cz, x1 - x0, z1 - z0, alto);
    else azotea(cx, cz, x1 - x0, z1 - z0, alto);
    // Trasera: ventanas sencillas, que también se ven desde lo alto.
    const q = frente(cx - (Math.sin(giro) * fondo) / 2, cz - (Math.cos(giro) * fondo) / 2, giro + Math.PI);
    for (const y of alto > 3.2 ? [1.3, planta + 0.9] : [1.3])
      for (const s of ancho >= 3.3 ? [-1, 1] : [0]) {
        q.d(caja, blanco, s * ancho * 0.24, y, 0.03, 0.62, 0.86, 0.06);
        q.luz(s * ancho * 0.24, y, 0.06, 0.46, 0.7);
      }
  }
  /** Fila de casas a lo largo de una calle, de x0 a x1, con la fachada hacia `giro`. */
  function fila(cortes: number[], z0: number, z1: number, giro: number, altos: number[]) {
    for (let i = 0; i + 1 < cortes.length; i++) casona([cortes[i], z0, cortes[i + 1], z1], altos[i % altos.length], giro);
  }
  function arbol(x: number, z: number, h: number, r: number) {
    pieza(poste, '#6b5440', x, h / 2, z, 0.3, h, 0.3);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4,
        d = i ? r * 0.55 : 0;
      pieza(esfera, ['#3f6b3d', '#4f7d45', '#5e8a4c'][i % 3], x + Math.cos(a) * d, h + 0.2 + (i % 3) * 0.25, z + Math.sin(a) * d, r * 0.62, r * 0.48, r * 0.62);
    }
  }
  function naranjo(x: number, z: number) {
    pieza(poste, '#6b5440', x, 0.8, z, 0.12, 1.6, 0.12);
    pieza(esfera, '#3d6a3a', x, 2.6, z, 0.85, 0.75, 0.85);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.1;
      pieza(esfera, '#f08a24', x + Math.cos(a) * 0.62, 2.45 + (i % 3) * 0.25, z + Math.sin(a) * 0.62, 0.08, 0.08, 0.08);
    }
  }

  // --- Suelo: la ciudad entera sobre un firme gris; las calles, empedradas; la plaza, enlosada ---
  pieza(caja, '#8c8479', 4, -0.1, 8, 230, 0.12, 200);
  const empedrado = tenido(adoquin, '#a39a90'),
    losas = tenido(cal, '#a4a9ad');
  suelos.forEach(({ r: [x0, z0, x1, z1], y = 0, y2 }) => {
    if (y2 !== undefined) {
      // Gradas entre los perros, de la plaza a la calle.
      for (let k = 0; k < 2; k++) pieza(caja, '#aaa49b', x0 + 0.28 + k * 0.55, 0.05 - k * 0.025, (z0 + z1) / 2, 0.55, 0.1 - k * 0.05, z1 - z0);
    } else if (y > 0) superficie(caja, losas, (x0 + x1) / 2, y / 2, (z0 + z1) / 2, x1 - x0, y, z1 - z0, 2.4);
    else superficie(caja, empedrado, (x0 + x1) / 2, -0.03, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0, 1.5);
  });

  // --- Plaza de Santa Ana: losas con juntas de basalto, bordillo, alcorques, bancos y farolas ---
  for (let k = 1; k < 6; k++) pieza(caja, '#8d877f', 0.1, 0.152, 1 + k * 1.7, 26.2, 0.012, 0.05);
  for (let x = -10.8; x < 13; x += 2.2) pieza(caja, '#8d877f', x, 0.152, 6.1, 0.05, 0.012, 10.2);
  pieza(caja, '#6f6a64', 0.1, 0.08, 1.12, 26.2, 0.17, 0.24);
  pieza(caja, '#6f6a64', 0.1, 0.08, 11.08, 26.2, 0.17, 0.24);
  pieza(caja, '#6f6a64', -12.88, 0.08, 6.1, 0.24, 0.17, 10.2);
  for (const [x, z] of PUEBLOS['las-palmas'].plano.palmeras) if (z > 0 && z < 12) pieza(octogono, '#5f5a55', x, 0.16, z, 1.3, 0.04, 1.3);
  const banco = (x: number, z: number, s: number) => {
    pieza(caja, '#7a5a3f', x, 0.55, z, 1.5, 0.07, 0.42);
    pieza(caja, '#7a5a3f', x, 0.82, z - s * 0.2, 1.5, 0.32, 0.06);
    for (const dx of [-0.62, 0.62]) pieza(caja, hierro, x + dx, 0.45, z, 0.07, 0.6, 0.46);
  };
  for (const x of [-5.8, 1.4, 8.6]) banco(x, 2.3, 1);
  for (const x of [-9.4, -2.2, 5]) banco(x + 0.3, 9.9, -1);
  for (const x of [-9.4, -2.2, 5]) farol(x, 1.5);
  for (const x of [-5.8, 1.4, 8.6]) farol(x + 0.3, 10.7);
  for (const [x, z] of [
    [-13.7, 1.5],
    [-13.7, 10.7],
    [16.9, -0.6],
    [16.9, 12.8],
    [-36.3, 7.6],
    [-28.6, 18.4],
    [34.2, 2.1],
    [44.4, 8.4],
  ])
    farol(x, z);

  // --- Los ocho perros, de hierro pintado como bronce, a los lados de las gradas y mirando a la catedral ---
  for (const z of [1.6, 2.6, 3.6, 4.5, 7.7, 8.6, 9.6, 10.6]) {
    const x = 12.95,
      y = 0.67,
      c = '#4a5444',
      o = '#37402f';
    pieza(caja, '#a39d94', x, 0.38, z, 0.62, 0.46, 0.62);
    pieza(caja, '#b8b2a8', x, 0.64, z, 0.7, 0.06, 0.7);
    pieza(esfera, c, x - 0.12, y + 0.17, z, 0.2, 0.18, 0.17);
    pieza(poste, c, x + 0.02, y + 0.36, z, 0.21, 0.5, 0.18, 0, 0, -0.45);
    for (const s of [-1, 1]) {
      pieza(poste, c, x + 0.14, y + 0.17, z + s * 0.07, 0.06, 0.34, 0.06);
      pieza(caja, c, x + 0.17, y + 0.02, z + s * 0.07, 0.1, 0.04, 0.07);
      pieza(esfera, c, x - 0.06, y + 0.06, z + s * 0.1, 0.14, 0.08, 0.06);
      pieza(caja, o, x + 0.18, y + 0.66, z + s * 0.075, 0.07, 0.15, 0.025, s * 0.2);
    }
    pieza(esfera, c, x + 0.2, y + 0.73, z, 0.13, 0.12, 0.1);
    pieza(caja, c, x + 0.32, y + 0.69, z, 0.15, 0.08, 0.08);
    pieza(caja, c, x - 0.24, y + 0.03, z + 0.1, 0.22, 0.04, 0.045, 0, 0.7);
  }

  // --- Catedral de Santa Ana: fachada neoclásica de cantería gris entre dos torres, tres naves
  // con bóvedas blancas por fuera y el cimborrio sobre el crucero ---
  const fx = 18.4,
    fz = 6.1,
    piedra = tenido(cal, '#8792a0'),
    gris = '#8b8b89',
    claro = '#aeaeab',
    sombra = '#5c5c5a';
  ocupado.push([17.4, -0.6, 34.6, 15]);
  for (let k = 0; k < 3; k++) pieza(caja, claro, fx - 0.15 - k * 0.3, 0.075 * (3 - k), fz, 0.3, 0.15 * (3 - k), 13.4);
  for (const s of [-1, 1]) {
    const tx = fx + 1.4,
      tz = fz + s * 5.25;
    superficie(caja, piedra, tx, 2.95, tz, 2.8, 5.9, 2.8, 2.2);
    pieza(caja, claro, tx, 0.62, tz, 2.95, 0.34, 2.95);
    pieza(caja, claro, tx, 5.95, tz, 3.05, 0.22, 3.05);
    superficie(caja, piedra, tx, 7.3, tz, 2.5, 2.5, 2.5, 2.2);
    pieza(caja, claro, tx, 8.6, tz, 2.75, 0.2, 2.75);
    pieza(caja, gris, tx, 9.65, tz, 2.2, 1.9, 2.2);
    pieza(caja, claro, tx, 10.65, tz, 2.45, 0.18, 2.45);
    // Ventanas al oeste y hacia fuera, y huecos de campanas en las cuatro caras del campanario.
    for (const [hx, hz, giro] of [
      [fx - 0.02, tz, Math.PI / 2],
      [tx, tz + s * 1.42, 0],
    ]) {
      for (const [y, h] of [
        [3.3, 1.5],
        [7.1, 1.0],
      ]) {
        pieza(caja, oscuro, hx, y, hz, 0.55, h, 0.05, 0, giro);
        pieza(arco, oscuro, hx, y + h / 2, hz, 0.55, 0.55, 0.05, 0, giro);
        ventanas.push(giro ? [hx - 0.03, y, hz, 0.04, h - 0.2, 0.4] : [hx, y, hz + s * 0.03, 0.4, h - 0.2, 0.04]);
      }
    }
    for (const [dx, dz] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const giro = dx ? Math.PI / 2 : 0;
      pieza(caja, oscuro, tx + dx * 1.11, 9.4, tz + dz * 1.11, 0.8, 1.05, 0.05, 0, giro);
      pieza(arco, oscuro, tx + dx * 1.11, 9.92, tz + dz * 1.11, 0.8, 0.8, 0.05, 0, giro);
      pieza(cupula, '#8a6a3a', tx + dx * 1.15, 9.3, tz + dz * 1.15, 0.24, 0.38, 0.24);
    }
    for (const dx of [-1, 1])
      for (const dz of [-1, 1]) {
        pieza(caja, claro, tx + dx * 1.05, 10.95, tz + dz * 1.05, 0.26, 0.42, 0.26);
        pieza(esfera, claro, tx + dx * 1.05, 11.3, tz + dz * 1.05, 0.16, 0.18, 0.16);
      }
    // Cupulín sobre tambor octogonal, con linterna y cruz.
    pieza(octogono, gris, tx, 11.15, tz, 1.75, 0.8, 1.75);
    pieza(cupula, '#7c7873', tx, 11.55, tz, 0.86, 0.95, 0.86);
    for (const [dx, dz] of [
      [-0.15, -0.15],
      [0.15, -0.15],
      [-0.15, 0.15],
      [0.15, 0.15],
    ])
      pieza(caja, claro, tx + dx, 12.72, tz + dz, 0.06, 0.45, 0.06);
    ventanas.push([tx, 12.72, tz, 0.24, 0.36, 0.24]);
    pieza(cupula, gris, tx, 12.95, tz, 0.24, 0.24, 0.24);
    pieza(caja, sombra, tx, 13.48, tz, 0.05, 0.62, 0.05);
    pieza(caja, sombra, tx, 13.6, tz, 0.3, 0.05, 0.05);
  }
  // Cuerpo central: abajo, tres puertas entre columnas pareadas; arriba, el gran vano con el
  // rosetón; y un frontón con la cruz.
  superficie(caja, piedra, fx + 1.3, 4.6, fz, 2.6, 9.2, 7.7, 2.2);
  const cat = frente(fx, fz, -Math.PI / 2);
  for (const [u, ancho, alto] of [
    [0, 1.5, 3.1],
    [-2.55, 0.95, 2.3],
    [2.55, 0.95, 2.3],
  ]) {
    cat.d(caja, oscuro, u, 0.45 + alto / 2, 0.01, ancho + 0.25, alto, 0.03);
    portada(cat, u, ancho, 0.45 + alto, claro, '#4b3524');
  }
  for (const u of [-3.45, -1.75, -1.2, 1.2, 1.75, 3.45]) {
    cat.d(caja, claro, u, 0.75, 0.25, 0.5, 0.6, 0.5);
    cat.d(poste, claro, u, 2.95, 0.25, 0.4, 3.8, 0.4);
    cat.d(caja, claro, u, 4.95, 0.25, 0.56, 0.2, 0.56);
  }
  cat.d(caja, claro, 0, 5.2, 0.28, 7.9, 0.35, 0.56);
  cat.d(caja, gris, 0, 5.47, 0.32, 8.1, 0.18, 0.64);
  // Balaustrada del segundo cuerpo, bajo el vano.
  cat.d(caja, claro, 0, 5.62, 0.22, 2.9, 0.1, 0.4);
  for (let k = -6; k <= 6; k++) cat.d(poste, claro, k * 0.22, 5.9, 0.3, 0.09, 0.45, 0.09);
  cat.d(caja, claro, 0, 6.16, 0.3, 2.9, 0.08, 0.16);
  cat.d(caja, oscuro, 0, 6.65, 0.02, 2.7, 2.1, 0.04);
  cat.d(arco, oscuro, 0, 7.7, 0.02, 2.7, 2.7, 0.04);
  cat.d(aro, claro, 0, 7.7, 0.06, 3.0, 3.0, 1.6);
  for (const s of [-1, 1]) cat.d(caja, claro, s * 1.5, 6.65, 0.06, 0.18, 2.1, 0.2);
  // Rosetón: anillo de piedra, tracería y cristal.
  cat.d(disco, claro, 0, 7.55, 0.05, 1.9, 0.06, 1.9, Math.PI / 2);
  cat.d(disco, oscuro, 0, 7.55, 0.08, 1.55, 0.04, 1.55, Math.PI / 2);
  cat.luz(0, 7.55, 0.1, 1.15, 0.5, 0.03);
  cat.luz(0, 7.55, 0.1, 0.5, 1.15, 0.03);
  for (let k = 0; k < 4; k++) cat.d(caja, claro, 0, 7.55, 0.13, 1.5, 0.05, 0.03, 0, (k * Math.PI) / 4);
  cat.d(disco, claro, 0, 7.55, 0.14, 0.32, 0.05, 0.32, Math.PI / 2);
  for (const u of [-3.45, -1.85, 1.85, 3.45]) {
    cat.d(poste, claro, u, 7.3, 0.22, 0.32, 3.4, 0.32);
    cat.d(caja, claro, u, 9.05, 0.22, 0.46, 0.16, 0.46);
  }
  cat.d(caja, claro, 0, 9.28, 0.28, 8.0, 0.26, 0.58);
  cat.d(fronton, gris, 0, 9.4, 0.15, 7.6, 1.2, 0.4);
  const rampa = Math.atan2(1.2, 3.8);
  for (const s of [-1, 1]) cat.d(caja, claro, s * 1.9, 10.0, 0.3, 4.05, 0.18, 0.3, 0, -s * rampa);
  cat.d(caja, sombra, 0, 11.0, 0.2, 0.08, 0.8, 0.08);
  cat.d(caja, sombra, 0, 11.15, 0.2, 0.42, 0.08, 0.08);
  for (const s of [-1, 1]) cat.d(esfera, claro, s * 3.8, 9.6, 0.2, 0.18, 0.22, 0.18);
  // Naves: muros de cantería con contrafuertes y pináculos, ventanales apuntados.
  superficie(caja, piedra, 26.5, 3.4, fz, 11, 6.8, 13, 2.6);
  for (const x of [22.2, 24.8, 27.4, 30, 31.7])
    for (const s of [-1, 1]) {
      pieza(caja, gris, x, 3.0, fz + s * 6.85, 0.6, 6.0, 0.7);
      pieza(piramide, claro, x, 7.25, fz + s * 6.85, 0.42, 0.9, 0.42, 0, Math.PI / 4);
    }
  for (const x of [23.5, 26.1, 28.7, 30.85])
    for (const s of [-1, 1]) {
      const z = fz + s * 6.53;
      pieza(caja, oscuro, x, 4.2, z, 0.75, 2.2, 0.06);
      pieza(piramide, oscuro, x, 5.55, z, 0.53, 0.5, 0.06, 0, Math.PI / 4);
      ventanas.push([x, 4.2, z + s * 0.02, 0.55, 2.0, 0.04]);
    }
  // Cubierta blanca: azotea con las bóvedas asomando en cuadrícula, como se ven desde el aire.
  pieza(caja, '#e8e6df', 26.5, 6.86, fz, 11.1, 0.12, 13.1);
  for (const s of [-1, 1]) {
    pieza(caja, claro, 26.5, 7.02, fz + s * 6.5, 11.1, 0.3, 0.16);
    pieza(caja, claro, 21.05 + (s + 1) * 5.45, 7.02, fz, 0.16, 0.3, 13.1);
  }
  for (const x of [22.4, 24.6, 29.3, 31.3]) for (const dz of [-4.3, 0, 4.3]) pieza(esfera, '#f4f2ec', x, 6.92, fz + dz, 1.0, 0.42, 1.85);
  for (const dz of [-4.3, 4.3]) pieza(esfera, '#f4f2ec', 26.95, 6.92, fz + dz, 1.0, 0.42, 1.85);
  // Cimborrio: tambor octogonal con ventanales, cúpula y linterna.
  const cx = 26.95;
  pieza(octogono, gris, cx, 7.95, fz, 4.4, 2.2, 4.4);
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) * Math.PI) / 4,
      x = cx + Math.sin(a) * 2.05,
      z = fz + Math.cos(a) * 2.05;
    pieza(caja, oscuro, x, 7.95, z, 0.55, 1.2, 0.06, 0, a);
    ventanas.push([x, 7.95, z, 0.3, 0.9, 0.3]);
    pieza(caja, claro, cx + Math.sin(k * Math.PI / 4) * 2.2, 7.95, fz + Math.cos(k * Math.PI / 4) * 2.2, 0.22, 2.2, 0.22);
  }
  pieza(octogono, claro, cx, 9.12, fz, 4.75, 0.18, 4.75);
  pieza(cupula, '#8a8680', cx, 9.2, fz, 2.15, 2.0, 2.15);
  for (const [dx, dz] of [
    [-0.28, -0.28],
    [0.28, -0.28],
    [-0.28, 0.28],
    [0.28, 0.28],
  ])
    pieza(caja, claro, cx + dx, 11.55, fz + dz, 0.08, 0.75, 0.08);
  ventanas.push([cx, 11.55, fz, 0.48, 0.6, 0.48]);
  pieza(cupula, gris, cx, 11.92, fz, 0.42, 0.38, 0.42);
  pieza(caja, sombra, cx, 12.55, fz, 0.06, 0.6, 0.06);
  pieza(caja, sombra, cx, 12.65, fz, 0.3, 0.06, 0.06);
  // Cabecera poligonal.
  pieza(hexagono, gris, 32, 3.0, fz, 3.2, 6.0, 7.2);
  pieza(hexagono, claro, 32, 6.05, fz, 3.4, 0.2, 7.5);
  // Al sur, el patio de los Naranjos tras su muro, con la puerta gótica, y el Museo Diocesano.
  const crema = tenido(cal, '#ece0c8');
  superficie(caja, crema, 24.4, 1.6, 14.8, 11.6, 3.2, 0.4, 2.6);
  superficie(caja, crema, 18.8, 1.6, 13.8, 0.4, 3.2, 2.4, 2.6);
  pieza(caja, claro, 24.4, 3.25, 14.8, 11.8, 0.12, 0.55);
  const patio = frente(25.5, 15, 0);
  patio.d(enjuta, claro, 0, 2.2, 0.06, 1.45, 1.45, 0.14);
  patio.d(caja, claro, 0, 1.1, 0.06, 1.5, 2.2, 0.1);
  patio.d(caja, '#4b3524', 0, 1.05, 0.12, 1.0, 2.1, 0.04);
  patio.d(arco, '#4b3524', 0, 2.1, 0.12, 1.0, 1.0, 0.04);
  pieza(caja, '#b9b2a6', 24.4, 0.02, 13.7, 11.4, 0.04, 2.1);
  for (const x of [20.8, 23, 28.2]) naranjo(x, 13.7);
  superficie(caja, crema, 32.3, 2.1, 13.8, 4.6, 4.2, 2.4, 2.6);
  superficie(caja, crema, 33.3, 2.1, 11.2, 2.6, 4.2, 2.8, 2.6);
  tejado(32.3, 13.8, 4.6, 2.4, 4.2);
  tejado(33.3, 11.2, 2.6, 2.8, 4.2);
  const museo = frente(34.6, 12, Math.PI / 2);
  for (const u of [-2.4, 1.3]) {
    ventana(museo, u, 2.9, 0.5, 0.9, '#3e6b4d');
    ventana(museo, u, 1.2, 0.5, 0.8, '#3e6b4d', true);
  }
  portada(museo, -0.7, 0.9, 1.9, canteria);
  // Al norte, el solar de la ampliación sin terminar, donde asoman los restos de la primera ciudad.
  pieza(caja, '#86786a', 26, -0.02, -2.9, 15.5, 0.06, 4.6);
  ocupado.push([17.4, -5.4, 33.6, -0.6]);
  for (let i = 0; i < 16; i++) {
    const largo = 0.6 + azar() * 1.8;
    pieza(caja, '#8f8579', 19 + azar() * 13, 0.15 + azar() * 0.2, -4.8 + azar() * 3.6, i % 2 ? largo : 0.3, 0.3 + azar() * 0.5, i % 2 ? 0.3 : largo);
  }
  for (let x = 18; x <= 33; x += 1.5) pieza(caja, hierro, x, 0.5, -5.2, 0.05, 1.0, 0.05);
  pieza(caja, hierro, 25.5, 0.95, -5.2, 15, 0.05, 0.05);

  // --- Casas Consistoriales: soportal de nueve arcos, balcones de hierro, reloj y estatuas ---
  const muroCC = tenido(cal, '#efe2c2'),
    piedraCC = '#9a948b';
  ocupado.push([-28, 1, -17, 11.2]);
  superficie(caja, muroCC, -23.3, 3.1, 6.1, 9.4, 6.2, 10.2, 2.6);
  superficie(caja, muroCC, -17.8, 4.55, 6.1, 1.6, 3.3, 10.2, 2.6);
  const cc = frente(-17, 6.1, Math.PI / 2);
  for (let i = 0; i < 10; i++) cc.d(caja, piedraCC, -4.95 + i * 1.1, 1.15, -0.2, 0.34, 2.3, 0.36);
  for (let i = 0; i < 9; i++) cc.d(enjuta, piedraCC, -4.4 + i * 1.1, 2.3, -0.2, 1.1, 1.1, 0.36);
  cc.d(caja, piedraCC, 0, 2.95, -0.1, 10.2, 0.12, 0.28);
  // Dentro del soportal, puertas y ventanas en el muro del fondo.
  const fondoCC = frente(-18.6, 6.1, Math.PI / 2);
  for (const u of [-3.3, 0, 3.3]) portada(fondoCC, u, 0.9, 1.6, piedraCC, '#4b3524');
  for (const u of [-4.4, -1.65, 1.65, 4.4]) ventana(fondoCC, u, 1.35, 0.5, 0.8, '#4b3524', true);
  for (let i = 0; i < 9; i++) {
    const u = -4.4 + i * 1.1,
      grande = i === 4;
    cc.d(caja, blanco, u, 4.3, 0.03, grande ? 0.74 : 0.62, 1.55, 0.06);
    cc.luz(u, 4.3, 0.07, grande ? 0.56 : 0.44, 1.35);
    cc.d(caja, piedraCC, u, 3.52, 0.25, grande ? 1.6 : 0.82, 0.08, 0.5);
    cc.d(caja, hierro, u, 3.86, 0.48, grande ? 1.6 : 0.82, 0.04, 0.03);
    for (let k = -2; k <= 2; k++) cc.d(caja, hierro, u + k * (grande ? 0.38 : 0.19), 3.7, 0.48, 0.025, 0.3, 0.025);
    cc.d(caja, piedraCC, u, 5.2, 0.08, grande ? 0.95 : 0.8, 0.1, 0.16);
  }
  for (const s of [-1, 1]) cc.d(caja, piedraCC, s * 5.0, 4.55, 0.04, 0.3, 3.3, 0.08);
  cc.d(caja, piedraCC, 0, 6.12, 0.15, 10.5, 0.22, 0.4);
  cc.d(caja, '#e7d8b5', 0, 6.5, -0.05, 10.2, 0.55, 0.2);
  // Frontón central con el reloj, y sobre el pretil las cuatro estatuas: Comercio, Arte,
  // Navegación y Agricultura.
  cc.d(fronton, piedraCC, 0, 6.23, 0.05, 3.6, 1.05, 0.3);
  cc.d(disco, blanco, 0, 6.62, 0.22, 0.56, 0.04, 0.56, Math.PI / 2);
  cc.d(caja, oscuro, 0.06, 6.67, 0.25, 0.03, 0.2, 0.02, 0, -0.6);
  cc.d(caja, oscuro, -0.04, 6.6, 0.25, 0.03, 0.14, 0.02, 0, 1.1);
  const marmol = '#e4dfd4';
  for (const u of [-4.2, -2.6, 2.6, 4.2]) {
    cc.d(caja, piedraCC, u, 6.98, -0.05, 0.46, 0.42, 0.46);
    cc.d(poste, marmol, u, 7.55, -0.05, 0.34, 0.72, 0.3);
    cc.d(poste, marmol, u, 8.06, -0.05, 0.26, 0.32, 0.22);
    cc.d(caja, marmol, u, 8.2, -0.05, 0.38, 0.1, 0.18);
    cc.d(esfera, marmol, u, 8.38, -0.05, 0.11, 0.13, 0.11);
    for (const s of [-1, 1]) cc.d(caja, marmol, u + s * 0.17, 7.95, -0.04, 0.06, 0.4, 0.06);
  }
  // Azotea gris con su pretil y la claraboya en pirámide.
  pieza(caja, '#cfcac0', -22.55, 6.24, 6.1, 10.9, 0.08, 10.1);
  for (const s of [-1, 1]) {
    pieza(caja, '#e7d8b5', -22.55, 6.45, 6.1 + s * 5.05, 10.9, 0.5, 0.16);
    pieza(caja, '#e7d8b5', -27.95, 6.45, 6.1, 0.16, 0.5, 10.2);
  }
  pieza(piramide, '#9fb5bb', -23.3, 6.65, 6.1, 2.6, 0.8, 2.6, 0, Math.PI / 4);
  // Fachadas laterales: a la calle del Castillo, a Doramas y a la plazoleta del Espíritu Santo.
  for (const [x, z, giro, ancho] of [
    [-23.3, 11.2, 0, 9.4],
    [-23.3, 1, Math.PI, 9.4],
    [-28, 6.1, -Math.PI / 2, 10.2],
  ]) {
    const p = frente(x, z, giro);
    lienzo(p, ancho, 6.2, piedraCC, piedraCC);
    const n = Math.round(ancho / 1.6);
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) * 1.6;
      ventana(p, u, 1.5, 0.55, 1.0, '#4b3524', true, piedraCC);
      p.d(caja, blanco, u, 4.3, 0.03, 0.62, 1.5, 0.06);
      p.luz(u, 4.3, 0.07, 0.44, 1.3);
      p.d(caja, piedraCC, u, 3.52, 0.22, 0.8, 0.08, 0.42);
      p.d(caja, hierro, u, 3.84, 0.42, 0.8, 0.04, 0.03);
      for (let k = -2; k <= 2; k++) p.d(caja, hierro, u + k * 0.19, 3.7, 0.42, 0.025, 0.3, 0.025);
    }
  }

  // --- Lado norte: Casa Regental y Palacio Episcopal ---
  // Casa Regental: dos plantas, portada renacentista de columnas con escudo.
  ocupado.push([-13, -6.6, -1.5, -1.6]);
  superficie(caja, tenido(cal, '#e8d2a0'), -7.25, 2.5, -4.1, 11.5, 5.0, 5, 2.6);
  tejado(-7.25, -4.1, 11.5, 5, 5.0);
  const reg = frente(-7.25, -1.6, 0);
  lienzo(reg, 11.5, 5.0, canteria, blanco);
  portada(reg, 0, 1.25, 2.3, canteria, '#3f2c20');
  for (const s of [-1, 1]) {
    reg.d(poste, canteria, s * 1.05, 1.5, 0.2, 0.26, 2.9, 0.26);
    reg.d(caja, canteria, s * 1.05, 0.12, 0.2, 0.4, 0.24, 0.4);
    reg.d(caja, canteria, s * 1.05, 3.0, 0.2, 0.36, 0.16, 0.36);
  }
  reg.d(caja, canteria, 0, 3.2, 0.2, 2.6, 0.26, 0.4);
  reg.d(fronton, canteria, 0, 3.33, 0.15, 2.4, 0.55, 0.3);
  reg.d(caja, '#9d968c', 0, 4.15, 0.1, 0.55, 0.6, 0.1);
  reg.d(esfera, '#9d968c', 0, 4.5, 0.1, 0.18, 0.12, 0.08);
  for (const u of [-4.3, -2.4, 2.4, 4.3]) ventana(reg, u, 1.45, 0.62, 1.0, '#6b4632', true);
  for (const u of [2.4, 4.3]) ventana(reg, u, 3.75, 0.62, 1.05, '#6b4632');
  balcon(reg, -3.35, 2.7, 2.6, 1);
  farolPared(reg, 5.2, 2.6);
  // Palacio Episcopal: fachada de una planta con portada mudéjar (arco con alfiz y escudo),
  // patio con palmera y una crujía alta al fondo.
  const piedraPE = '#8b7f71',
    muroPE = tenido(cal, '#f2eadb');
  ocupado.push([-1.5, -11.4, 13.2, -1.6]);
  superficie(caja, muroPE, 5.85, 2.0, -3.0, 14.7, 4.0, 2.8, 2.6);
  tejado(5.85, -3.0, 14.7, 2.8, 4.0);
  superficie(caja, muroPE, 5.85, 2.6, -9.9, 14.7, 5.2, 3.0, 2.6);
  tejado(5.85, -9.9, 14.7, 3.0, 5.2);
  for (const x of [-0.45, 12.15]) {
    superficie(caja, muroPE, x, 2.0, -6.4, 2.1, 4.0, 4.0, 2.6);
    pieza(caja, '#b46a4c', x, 4.08, -6.4, 2.2, 0.16, 4.1);
  }
  pieza(caja, '#c9c1b2', 5.85, 0.01, -6.4, 10.4, 0.04, 4.0);
  const obispo = frente(5.85, -1.6, 0);
  lienzo(obispo, 14.7, 4.0, piedraPE, blanco);
  portada(obispo, 0.15, 1.3, 2.3, piedraPE, '#3c3227');
  obispo.d(caja, piedraPE, 0.15, 3.32, 0.15, 2.3, 0.12, 0.06);
  for (const s of [-1, 1]) obispo.d(caja, piedraPE, 0.15 + s * 1.1, 2.76, 0.15, 0.12, 1.2, 0.06);
  obispo.d(caja, '#9d968c', 0.15, 3.65, 0.1, 0.5, 0.42, 0.08);
  for (const u of [-5.6, -3.0, 3.3, 5.9]) ventana(obispo, u, 1.7, 0.66, 1.15, '#2f4d3a', true);
  farolPared(obispo, -1.6, 2.7);
  farolPared(obispo, 1.9, 2.7);
  const fondoPE = frente(5.85, -8.4, 0);
  for (const u of [-5.5, -3, -0.5, 2, 4.5]) {
    fondoPE.d(caja, blanco, u, 1.4, 0.03, 0.7, 1.4, 0.06);
    fondoPE.luz(u, 1.4, 0.06, 0.5, 1.2);
    ventana(fondoPE, u, 3.9, 0.55, 0.95, '#2f4d3a');
  }

  // --- Calles de Vegueta: casas de colores con balcones de tea ---
  // Calle Doramas, al oeste de la Casa Regental, y su remate.
  fila([-27, -22.6, -18.2, -13], -6, -1.6, 0, [4.4, 4.0, 4.6]);
  casona([-31.5, -3.5, -27, 2.5], 4.2, Math.PI / 2, '#e3a69c');
  // Calle del Castillo, frente a la plaza: casas terreras de azotea, que dejan ver la plaza desde
  // el sur, y en el centro el archivo en la casa de Viera y Clavijo.
  fila([-23.6, -20.2, -17, -11, -5.6], 14.2, 18.2, Math.PI, [2.6, 2.5, 2.7, 2.6]);
  fila([5, 9.2, 13.2], 14.2, 18.2, Math.PI, [2.6, 2.7]);
  ocupado.push([-5.6, 14.2, 5, 18.4]);
  superficie(caja, tenido(cal, '#efe3c6'), -0.3, 1.7, 16.3, 10.6, 3.4, 4.2, 2.6);
  azotea(-0.3, 16.3, 10.6, 4.2, 3.4);
  const viera = frente(-0.3, 14.2, Math.PI);
  lienzo(viera, 10.6, 3.4, canteria, canteria);
  portada(viera, 0, 1.0, 1.75, canteria, '#3f2c20');
  viera.d(caja, canteria, 0, 2.95, 0.12, 0.4, 0.4, 0.1);
  for (const s of [-1, 1]) {
    balcon(viera, s * 2.8, 1.85, 2.2, 0.75);
    ventana(viera, s * 2.8, 1.1, 0.6, 0.8, '#3e6b4d', true);
    ventana(viera, s * 4.5, 2.6, 0.5, 0.7, '#3e6b4d');
    ventana(viera, s * 4.5, 1.1, 0.5, 0.7, '#3e6b4d', true);
  }
  const traseraViera = frente(-0.3, 18.4, 0);
  for (const u of [-3.5, -1.2, 1.2, 3.5]) {
    traseraViera.d(caja, blanco, u, 2.3, 0.03, 0.6, 0.8, 0.06);
    traseraViera.luz(u, 2.3, 0.06, 0.44, 0.64);
  }
  // Calle del Espíritu Santo, al sur de la catedral, y el callejón que sube al Pilar Nuevo.
  fila([13.2, 17.6, 21.8, 26.2, 30.4], 17.6, 21.6, Math.PI, [2.6, 2.8, 2.5, 2.7]);
  casona([38, 9, 42.2, 13.2], 4.2, -Math.PI / 2);
  casona([38, 13.2, 42.2, 17.6], 3.8, -Math.PI / 2);
  casona([42.2, 9, 46.4, 13.2], 4.0, Math.PI);
  // Plazoleta de Francisco María de León, con sus laureles.
  ocupado.push([30.4, 17.6, 38, 23]);
  pieza(caja, '#9b9285', 34.2, 0.04, 20.3, 7.6, 0.08, 5.4);
  arbol(32.4, 19.8, 2.6, 2.4);
  arbol(36, 20.8, 2.4, 2.2);
  // Lado este del Pilar Nuevo.
  casona([45, 1.5, 49.4, 5.5], 4.4, -Math.PI / 2, '#a9bad0', true);
  casona([45, 5.5, 49.4, 9], 4.0, -Math.PI / 2, '#e2b45c');
  // Torre de la catedral vista desde la calle Obispo Codina: casa que cierra la calle al norte.
  casona([13.2, -7.6, 18.4, -3], 4.6, 0, '#e8cd88', true);
  // Casas al norte del solar de la catedral.
  fila([18.4, 22.6, 26.8, 31, 35], -9.6, -5.4, 0, [4.4, 4.8, 4.2, 4.6]);

  // --- Pilar Nuevo y Casa de Colón ---
  // Pilar: pila octogonal con su columna.
  pieza(octogono, '#9d958a', 40.5, 0.28, 5.5, 1.5, 0.56, 1.5);
  pieza(octogono, '#5d96a2', 40.5, 0.55, 5.5, 1.3, 0.04, 1.3);
  pieza(poste, '#a8a094', 40.5, 0.95, 5.5, 0.22, 1.0, 0.22);
  pieza(esfera, '#a8a094', 40.5, 1.5, 5.5, 0.2, 0.14, 0.2);
  // Casa de Colón: muros blancos, gran portada de piedra labrada y balcones de tea.
  ocupado.push([35, -5, 45, 1.5]);
  superficie(caja, tenido(cal, '#f4ecdb'), 40, 2.7, -1.75, 10, 5.4, 6.5, 2.6);
  azotea(40, -1.75, 10, 6.5, 5.4);
  const colon = frente(40, 1.5, 0),
    dorada = '#b39d78';
  lienzo(colon, 10, 5.4, dorada, dorada);
  portada(colon, 0, 1.4, 2.4, dorada, '#3f2c20');
  for (const u of [-1.55, -1.15, 1.15, 1.55]) {
    colon.d(caja, dorada, u, 0.25, 0.22, 0.32, 0.5, 0.32);
    colon.d(poste, dorada, u, 1.9, 0.22, 0.22, 2.8, 0.22);
    colon.d(caja, dorada, u, 3.36, 0.22, 0.3, 0.14, 0.3);
  }
  colon.d(caja, dorada, 0, 3.6, 0.24, 3.7, 0.32, 0.48);
  colon.d(caja, dorada, 0, 4.35, 0.12, 2.1, 1.2, 0.2);
  colon.d(caja, '#3a2a1f', 0, 4.3, 0.23, 0.7, 0.9, 0.04);
  colon.luz(0, 4.3, 0.26, 0.5, 0.75);
  for (const s of [-1, 1]) {
    colon.d(poste, dorada, s * 0.55, 4.3, 0.28, 0.12, 0.95, 0.12);
    colon.d(esfera, dorada, s * 1.45, 3.95, 0.3, 0.16, 0.2, 0.16);
    balcon(colon, s * 3.1, 2.75, 2.3, 1);
    ventana(colon, s * 3.1, 1.3, 0.62, 0.95, '#3e6b4d', true, dorada);
  }
  colon.d(caja, '#9d8d70', 0, 5.0, 0.18, 0.6, 0.5, 0.1);
  farolPared(colon, -4.72, 2.4);
  farolPared(colon, 4.72, 2.4);
  const colonOeste = frente(35, -1.75, -Math.PI / 2);
  balcon(colonOeste, 0, 2.75, 2.4, 1);
  ventana(colonOeste, 0, 1.3, 0.62, 0.95, '#3e6b4d', true, dorada);
  for (const s of [-1, 1]) ventana(colonOeste, s * 2.3, 3.9, 0.55, 1.0, '#3e6b4d', false, dorada);

  // --- Plazoleta del Espíritu Santo: templete sobre la fuente, laureles y la ermita ---
  const tx = -32.5,
    tz = 13;
  pieza(octogono, '#bdb5a8', tx, 0.15, tz, 2.6, 0.3, 2.6);
  pieza(octogono, '#a59d90', tx, 0.55, tz, 1.7, 0.5, 1.7);
  pieza(octogono, '#5d96a2', tx, 0.78, tz, 1.5, 0.04, 1.5);
  pieza(poste, '#bdb5a8', tx, 1.1, tz, 0.18, 0.7, 0.18);
  pieza(cupula, '#bdb5a8', tx, 1.45, tz, 0.25, 0.12, 0.25);
  for (const dx of [-0.95, 0.95])
    for (const dz of [-0.95, 0.95]) {
      pieza(poste, '#ebe4d6', tx + dx, 1.55, tz + dz, 0.2, 2.5, 0.2);
      pieza(caja, '#ebe4d6', tx + dx, 2.85, tz + dz, 0.3, 0.12, 0.3);
    }
  pieza(caja, '#ebe4d6', tx, 3.0, tz, 2.3, 0.26, 2.3);
  pieza(cupula, '#d6cdbd', tx, 3.12, tz, 1.05, 0.85, 1.05);
  pieza(piramide, '#bdb5a8', tx, 4.2, tz, 0.16, 0.45, 0.16);
  arbol(-35.6, 9.4, 2.4, 2.3);
  arbol(-35.6, 16.8, 2.5, 2.2);
  arbol(-29.4, 8.4, 2.2, 1.9);
  fila([-37, -32.6, -28], 2.5, 7, 0, [4.4, 4.8]);
  casona([-41.4, 7, -37, 11.5], 4.4, -Math.PI / 2, '#a9bad0', true);
  casona([-41.4, 11.5, -37, 16], 4.0, -Math.PI / 2, '#d98b5f');
  casona([-41.4, 16, -37, 19.6], 3.8, -Math.PI / 2, '#e8cd88');
  fila([-37, -32.4, -28], 19, 22.6, Math.PI, [2.6, 2.5]);
  // Ermita del Espíritu Santo: blanca, portada de piedra y espadaña con su campana.
  ocupado.push([-28, 14.2, -23.6, 19]);
  superficie(caja, tenido(cal, '#f6f1e6'), -25.8, 1.9, 16.6, 4.4, 3.8, 4.8, 2.6);
  tejado(-25.8, 16.6, 4.4, 4.8, 3.8);
  const ermita = frente(-28, 16.6, -Math.PI / 2);
  lienzo(ermita, 4.8, 3.8, canteria, blanco);
  portada(ermita, 0, 1.1, 2.0, canteria, '#5a3a25');
  ermita.d(caja, blanco, 0, 4.4, -0.15, 1.3, 1.3, 0.3);
  ermita.d(fronton, blanco, 0, 5.05, -0.15, 1.3, 0.45, 0.3);
  ermita.d(caja, oscuro, 0, 4.35, 0.02, 0.5, 0.6, 0.02);
  ermita.d(arco, oscuro, 0, 4.65, 0.02, 0.5, 0.5, 0.02);
  ermita.d(cupula, '#8a6a3a', 0, 4.2, 0.03, 0.18, 0.3, 0.06);
  ermita.d(caja, sombra, 0, 5.75, -0.15, 0.05, 0.4, 0.05);
  ermita.d(caja, sombra, 0, 5.8, -0.15, 0.22, 0.05, 0.05);

  // --- Más allá, la ciudad: manzanas de casas sencillas hasta el horizonte ---
  const choca = ([a, b, c, d]: Rect) => ocupado.some(([x0, z0, x1, z1]) => a < x1 + 0.5 && c > x0 - 0.5 && b < z1 + 0.5 && d > z0 - 0.5);
  for (let bx = -66; bx < 78; bx += 15.6)
    for (let bz = -42; bz < 58; bz += 11.6)
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 2; j++) {
          const x = bx + i * 4.4 + 2.2,
            z = bz + j * 4.6 + 2.3;
          if (((x - 5) / 72) ** 2 + ((z - 8) / 52) ** 2 > 1 || choca([x - 2.2, z - 2.3, x + 2.2, z + 2.3])) continue;
          // Delante de la cámara, las casas bajan para no tapar las calles.
          const h = z > 17 && z < 32 ? 2.4 + azar() * 0.8 : 2.8 + azar() * 2.6;
          pieza(caja, elige(paleta), x, h / 2, z, 4.3, h, 4.5);
          if (azar() > 0.5) {
            for (const lado of [-1, 1]) pieza(caja, lado > 0 ? '#a95a3e' : '#9a4f37', x, h + 0.3, z + lado * 1.1, 4.5, 0.12, 2.5, lado * 0.26);
          } else {
            for (const s of [-1, 1]) {
              pieza(caja, blanco, x, h + 0.14, z + s * 2.2, 4.3, 0.28, 0.12);
              pieza(caja, blanco, x + s * 2.1, h + 0.14, z, 0.12, 0.28, 4.5);
            }
            if (azar() > 0.6) pieza(poste, '#ece8df', x - 1, h + 0.4, z - 0.8, 0.6, 0.7, 0.6);
          }
          for (const s of [-1, 1])
            for (const y of h > 3.4 ? [1.2, h - 1.1] : [1.2]) {
              pieza(caja, '#efe7d6', x + s * 1.1, y, z + 2.26, 0.62, 0.84, 0.06);
              if (azar() > 0.55) ventanas.push([x + s * 1.1, y, z + 2.3, 0.44, 0.66, 0.04]);
              else pieza(caja, '#3a4448', x + s * 1.1, y, z + 2.29, 0.44, 0.66, 0.03);
            }
        }

  for (const g of [octogono, disco, cupula, arco, fronton, hexagono, enjuta, aro]) g.dispose();
  return { amarres: [], enSeco: [] };
}
