import * as T from 'three';
import type { Sitio, Taller } from '../maqueta';
import {
  ESCALERAS,
  FACHADA,
  MURO,
  PALMERAS,
  PASEO,
  PIE,
  ROCAS,
  SOCORRISMO,
  TERRAZAS,
  VARADAS,
  arena,
  orilla,
} from './canteras-plano';

/**
 * Playa de Las Canteras (Las Palmas de Gran Canaria), trazada sobre la ortofoto PNOA y desenrollada
 * a lo largo de x: La Puntilla con sus barcas a la izquierda (−x), Playa Grande con la muralla de
 * hoteles y apartamentos detrás del paseo, Playa Chica entre rocas y la Peña de la Vieja a la
 * derecha. Más allá, fuera del paseo que se camina, el arco de La Cícer se dobla hacia el mar hasta
 * el Auditorio Alfredo Kraus. La Barra corre en paralelo a la orilla y deja dentro una laguna
 * mansa. Las zonas pisables están en `canteras-plano.ts`: si se mueve algo por lo que se camina,
 * hay que moverlo también allí.
 */
export function trazarCanteras(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, blanco } = t;
  const { caja, esfera, poste } = t.formas;
  const { cal, adoquin } = t.materiales;
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
  const elige = <C>(lista: C[]) => lista[Math.floor(azar() * lista.length)];
  const disco = new T.CylinderGeometry(0.5, 0.5, 1, 16);
  const cupula = new T.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const cono = new T.ConeGeometry(1, 1, 10);
  /** Un gajo de sombrilla: la octava parte de un cono. */
  const gajo = new T.ConeGeometry(1, 1, 2, 1, true, 0, Math.PI / 4);

  /** Al sur de la Peña, la playa, el paseo y los edificios se doblan hacia el mar: el arco de La Cícer. */
  const desvio = (x: number) => (x > 48 ? 0.05 * (x - 48) ** 2 : 0);
  const giroArco = (x: number) => -Math.atan(x > 48 ? 0.1 * (x - 48) : 0);

  /**
   * Plano de una fachada: `u` corre a lo largo de ella, `v` sale hacia la calle e `y` sube.
   * `giro` 0 mira al mar (+z).
   */
  const euler = new T.Euler(),
    local = new T.Euler(),
    cuaternion = new T.Quaternion();
  function frente(cx: number, cz: number, giro: number) {
    const c = Math.cos(giro),
      s = Math.sin(giro);
    const en = (u: number, v: number) => [cx + u * c + v * s, cz - u * s + v * c];
    return {
      d(forma: T.BufferGeometry, color: string, u: number, y: number, v: number, w: number, h: number, f: number, rx = 0) {
        const [x, z] = en(u, v);
        // Primero el giro de la fachada y después la inclinación propia de la pieza.
        euler.setFromQuaternion(cuaternion.setFromEuler(local.set(rx, giro, 0, 'YXZ')), 'XYZ');
        pieza(forma, color, x, y, z, w, h, f, euler.x, euler.y, euler.z);
      },
      /** Cristal que se enciende de noche; solo en fachadas sin girar, que son las cercanas. */
      luz(u: number, y: number, v: number, w: number, h: number) {
        const [x, z] = en(u, v);
        if (Math.abs(giro) < 0.3) ventanas.push([x, y, z, w, h, 0.04]);
      },
    };
  }
  type Frente = ReturnType<typeof frente>;

  // --- Suelo de la ciudad, a la altura del paseo, y el muro que lo separa de la arena ---
  // El firme queda un pelo por debajo del enlosado, para que no se peleen al dibujarse.
  pieza(caja, '#8f877b', -6, PASEO - 1.02, -60, 230, 2, 110);
  pieza(caja, '#9a948a', -51, PASEO - 1.02, -4.2, 14, 2, 15.6); // plaza de La Puntilla
  // Paseo de ladrillo rojo con sus franjas claras, de La Puntilla a la Peña.
  const ladrillo = tenido(adoquin, '#c4644a');
  superficie(caja, ladrillo, 3, PASEO - 0.03, (FACHADA + MURO) / 2, 94, 0.06, MURO - FACHADA, 1.1);
  for (const z of [-4.1, -6.2, -7.7]) pieza(caja, '#ead7bf', 3, PASEO + 0.005, z, 94, 0.012, 0.09);
  for (let x = -42; x < 50; x += 3.2) pieza(caja, '#ead7bf', x, PASEO + 0.005, -5.15, 0.07, 0.012, 2.1);
  // Muro de hormigón claro con la barandilla de acero, abierta en cada escalera.
  pieza(caja, '#d8ccb3', 3, PASEO / 2 - 0.2, MURO + 0.2, 94, PASEO + 0.4, 0.4);
  pieza(caja, '#c9bc9f', 3, 0.06, PIE + 0.05, 94, 0.12, 0.1);
  const acero = '#c3c9cd';
  const hueco = (x: number) => ESCALERAS.some((e) => Math.abs(x - e) < 0.9);
  for (let x = -43.8; x <= 49.8; x += 1.25) if (!hueco(x)) pieza(poste, acero, x, PASEO + 0.48, MURO - 0.08, 0.05, 0.96, 0.05);
  for (let x = -44; x < 50; x += 0.5) {
    if (hueco(x) || hueco(x + 0.5)) continue;
    for (const y of [0.5, 0.95]) pieza(caja, acero, x + 0.25, PASEO + y, MURO - 0.08, 0.52, 0.04, 0.04);
  }
  // Escaleras a la arena, entre dos pretiles.
  for (const x of ESCALERAS) {
    const fin = arena(x, -1.4);
    for (let k = 0; k < 7; k++) {
      const z = MURO - 0.15 + k * 0.3,
        y = PASEO + ((fin - PASEO) * (k + 0.5)) / 7;
      pieza(caja, '#d2c4a8', x, (y - 0.3) / 2, z, 1.6, y + 0.3, 0.32);
    }
    for (const s of [-1, 1]) pieza(caja, '#d8ccb3', x + s * 0.88, 0.45, -2.5, 0.16, 0.9, 2.2);
  }

  // --- La arena: una malla que sigue las tiras pisables y baja bajo el agua hasta la laguna ---
  {
    const u0 = -46,
      u1 = 60,
      t1 = 17,
      paso = 1;
    const nu = Math.ceil((u1 - u0) / paso),
      nt = Math.ceil((t1 - PIE) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nt; j++)
      for (let i = 0; i <= nu; i++) {
        // Un temblor en planta da facetas suaves a la arena; la altura sigue siendo la pisable.
        const u = u0 + (i + (i && i < nu ? (azar() - 0.5) * 0.5 : 0)) * paso,
          tz = PIE + (j + (j && j < nt ? (azar() - 0.5) * 0.5 : 0)) * paso;
        p.push(new T.Vector3(u, Math.max(-2.4, arena(u, tz)), tz + desvio(u)));
      }
    const seca: number[] = [],
      mojada: number[] = [];
    for (let j = 0; j < nt; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i,
          b = a + 1,
          c = a + nu + 1,
          d = c + 1;
        for (const tri of (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]]) {
          const [q, r, s] = tri.map((n) => p[n]);
          if (Math.min(q.y, r.y, s.y) < -1.6) continue;
          const lista = (q.y + r.y + s.y) / 3 > -0.6 ? seca : mojada;
          for (const v of [q, r, s]) lista.push(v.x, v.y, v.z);
        }
      }
    for (const [lista, color] of [
      [seca, '#f4e0b6'],
      [mojada, '#cfb489'],
    ] as const) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(lista, 3));
      geo.computeVertexNormals();
      superficie(geo, tenido(cal, color), 0, 0, 0, 1, 1, 1, 3);
      geo.dispose();
    }
  }
  // Espuma de las olas que mueren en la orilla.
  for (let x = -42; x < 60; x += 0.9) {
    const z = orilla(x) + 1.05 + desvio(x) + (azar() - 0.5) * 0.4;
    if (x > 19 && x < 23) continue;
    pieza(esfera, '#f4f6f2', x, -0.83, z, 0.7 + azar() * 0.5, 0.04, 0.14 + azar() * 0.1, 0, (azar() - 0.5) * 0.3);
  }
  // Laguna: agua clara y turquesa entre la orilla y La Barra, sobre el agua del puerto.
  {
    const forma = new T.Shape();
    const borde: [number, number][] = [];
    for (let x = -43; x <= 52; x += 1) borde.push([x, orilla(x) + 0.7 + desvio(x)]);
    const barra = (x: number) => 14 + Math.sin(x * 0.11) * 0.8 + (x > 20 ? (x - 20) * 0.05 : 0);
    // Donde acaba La Barra, pasada la Peña, la laguna se estrecha hasta morir en la orilla.
    const fin = (x: number) => (x <= 38 ? barra(x) : barra(38) + ((orilla(x) + 1.2 - barra(38)) * (x - 38)) / 14);
    const fuera: [number, number][] = [];
    for (let x = 52; x >= -43; x -= 2) fuera.push([x, fin(x)]);
    [...borde, ...fuera].forEach(([x, z], i) => (i ? forma.lineTo(x, -z) : forma.moveTo(x, -z)));
    const geo = new T.ShapeGeometry(forma, 1).rotateX(-Math.PI / 2);
    const laguna = new T.MeshStandardMaterial({ color: '#41d2c4', transparent: true, opacity: 0.42, roughness: 0.3, depthWrite: false });
    const m = superficie(geo, laguna, 0, -0.815, 0, 1, 1, 1, 4);
    m.castShadow = m.receiveShadow = false;
    geo.dispose();

    // --- La Barra: losas de arenisca a flor de agua, que asoman con la bajamar, y la rompiente detrás ---
    for (let x = -40; x < 36; x += 0.7) {
      const z = barra(x) + 0.6 + (azar() - 0.5) * 0.8;
      const alta = azar() > 0.7;
      pieza(
        esfera,
        elige(['#6b5a44', '#5d4f3d', '#7a6850', '#4f4436']),
        x,
        alta ? -0.74 : -0.82,
        z,
        0.6 + azar() * 0.9,
        alta ? 0.16 : 0.08,
        0.4 + azar() * 0.5,
        0,
        azar() * 3,
      );
      if (azar() > 0.25)
        pieza(esfera, '#f6f8f5', x + (azar() - 0.5), -0.8, z + 1 + azar() * 1.1, 0.8 + azar() * 0.8, 0.05, 0.25 + azar() * 0.25, 0, (azar() - 0.5) * 0.3);
    }
  }
  // Charcos y rocas de algas en la orilla de Playa Chica, y las que la cierran.
  // Son plataformas planas de arenisca cubiertas de algas, no peñascos: apenas levantan del suelo.
  const algas = ['#5b5034', '#6b5d3a', '#4a4330', '#75663f'];
  for (const [x0, z0, x1, z1] of ROCAS)
    for (let i = 0; i < 18; i++) {
      const x = x0 + azar() * (x1 - x0),
        z = z0 + azar() * (z1 - z0 + 3);
      pieza(esfera, elige(algas), x, Math.max(-0.84, arena(x, z)) + 0.04, z, 0.6 + azar() * 0.8, 0.14 + azar() * 0.18, 0.5 + azar() * 0.7, 0, azar() * 3);
    }
  for (let i = 0; i < 30; i++) {
    const x = 17 + azar() * 21,
      z = orilla(x) + 1.8 + azar() * 6;
    pieza(esfera, elige(algas), x, -0.84, z, 0.6 + azar() * 1, 0.05 + azar() * 0.07, 0.5 + azar() * 0.7, 0, azar() * 3);
  }
  // Peña de la Vieja: basalto oscuro a unos sesenta metros de la orilla, con sus peñas menores.
  {
    const px = 40,
      pz = 13;
    const prisma = new T.CylinderGeometry(0.6, 1, 1, 7);
    pieza(prisma, '#3a312c', px, 0.1, pz, 2.4, 2, 1.9, 0, 0.4);
    pieza(prisma, '#463b34', px + 0.3, 1.3, pz - 0.1, 1.5, 1, 1.2, 0, 1.1);
    pieza(prisma, '#2f2824', px - 1.6, -0.5, pz + 0.7, 1.2, 0.9, 1, 0, 2);
    pieza(prisma, '#3a312c', px + 1.9, -0.6, pz - 0.6, 0.9, 0.7, 0.8, 0, 0.3);
    prisma.dispose();
    for (let i = 0; i < 16; i++) {
      const a = azar() * Math.PI * 2;
      pieza(esfera, '#f4f6f2', px + Math.cos(a) * 2.4, -0.82, pz + Math.sin(a) * 1.9, 0.5 + azar() * 0.5, 0.05, 0.18, 0, a);
    }
  }

  // --- Playa Grande: sombrillas de rayas azules y blancas con sus hamacas, y la caseta de socorrismo ---
  for (let x = -33; x < 16; x += 2.6) {
    if (ESCALERAS.some((e) => Math.abs(x - e) < 1.4)) continue;
    for (const z of [0.4, 3]) {
      if (azar() < 0.3) continue;
      const sx = x + (azar() - 0.5) * 0.6,
        y = arena(sx, z);
      pieza(poste, '#e9e4da', sx, y + 0.9, z, 0.05, 1.8, 0.05);
      for (let k = 0; k < 8; k++) pieza(gajo, k % 2 ? '#f4f1ea' : '#2f6fb3', sx, y + 1.86, z, 1, 0.36, 1, 0, (k * Math.PI) / 4);
      for (const dx of [-0.45, 0.45]) {
        pieza(caja, '#f7f5ef', sx + dx, y + 0.2, z + 0.5, 0.48, 0.07, 1.4, -0.06);
        pieza(caja, '#f7f5ef', sx + dx, y + 0.34, z - 0.25, 0.48, 0.06, 0.45, 0.6);
      }
    }
  }
  // Toallas de colores sueltas por la arena.
  for (let i = 0; i < 22; i++) {
    const x = -40 + azar() * 76,
      z = -1.6 + azar() * 4.5;
    if (ROCAS.some(([a, , c]) => x > a - 1 && x < c + 1)) continue;
    pieza(caja, elige(['#e0694f', '#2f8f8f', '#e8a93d', '#d34580', '#3f6fb3']), x, arena(x, z) + 0.02, z, 0.6, 0.02, 1.5, 0, (azar() - 0.5) * 0.8);
  }
  for (const [x, z] of SOCORRISMO) {
    const y = arena(x, z);
    for (const dx of [-0.4, 0.4]) for (const dz of [-0.4, 0.4]) pieza(poste, blanco, x + dx, y + 0.45, z + dz, 0.07, 0.9, 0.07);
    pieza(caja, blanco, x, y + 1.35, z, 1.2, 1, 1.2);
    for (let k = 0; k < 3; k++) pieza(caja, '#2f6fb3', x, y + 1.05 + k * 0.3, z + 0.61, 1.21, 0.1, 0.02);
    pieza(caja, '#d8402f', x, y + 1.95, z, 1.4, 0.12, 1.4);
    pieza(poste, '#d8402f', x + 0.5, y + 2.6, z - 0.5, 0.04, 1.2, 0.04);
    pieza(caja, '#f2c230', x + 0.75, y + 3, z - 0.5, 0.5, 0.3, 0.02);
  }

  // --- El paseo: farolas altas, bancos frente al mar, terrazas al pie de los edificios ---
  // Entre palmera y palmera, una farola y un banco de madera mirando a la playa.
  for (const [x] of PALMERAS.slice(0, 11)) {
    const fx = x + 2.2,
      bx = x + 5.8;
    pieza(poste, '#4c5a5c', fx, PASEO + 2.6, -3.75, 0.1, 5.2, 0.1);
    pieza(disco, '#56676a', fx, PASEO + 5.25, -3.75, 0.9, 0.08, 0.9);
    ventanas.push([fx, PASEO + 5.15, -3.75, 0.62, 0.06, 0.62]);
    if (bx > 50) continue;
    pieza(caja, '#7a5a3f', bx, PASEO + 0.42, -4.1, 1.5, 0.07, 0.42);
    pieza(caja, '#7a5a3f', bx, PASEO + 0.66, -4.32, 1.5, 0.3, 0.06);
    for (const dx of [-0.6, 0.6]) pieza(caja, '#3a3f40', bx + dx, PASEO + 0.21, -4.15, 0.07, 0.42, 0.45);
  }
  const toldos = ['#2f7a5c', '#b8452f', '#2f5f9a', '#e1a23a', '#7a2f4f'];
  for (const [x0, x1] of TERRAZAS) {
    const color = elige(toldos);
    for (let x = x0 + 0.9; x < x1 - 0.5; x += 1.8) {
      pieza(poste, '#e9e4da', x, PASEO + 0.85, -7.4, 0.05, 1.7, 0.05);
      pieza(cono, '#f6f3ec', x, PASEO + 1.7, -7.4, 0.85, 0.3, 0.85);
      pieza(poste, '#d9d4c8', x, PASEO + 0.36, -7.4, 0.55, 0.04, 0.55);
      pieza(poste, '#6b6b6b', x, PASEO + 0.18, -7.4, 0.06, 0.36, 0.06);
      for (const dx of [-0.42, 0.42]) {
        pieza(caja, color, x + dx, PASEO + 0.24, -7.4, 0.3, 0.04, 0.3);
        pieza(caja, color, x + dx * 1.25, PASEO + 0.4, -7.4, 0.04, 0.32, 0.3);
      }
    }
  }

  // --- Edificios: bloques de pisos con balcones corridos, la muralla de la primera línea ---
  const vidrio = '#33444c';
  /** Planta baja de bares y locales: escaparate, toldo y rótulo. */
  function bajos(p: Frente, ancho: number, base: number, alto: number) {
    p.d(caja, '#3b3530', 0, base + alto / 2, 0.02, ancho * 0.96, alto, 0.05);
    for (let u = -ancho / 2 + 1.2; u < ancho / 2 - 0.6; u += 1.8) {
      p.d(caja, vidrio, u, base + 0.95, 0.06, 1.3, 1.6, 0.04);
      if (azar() < 0.5) p.luz(u, base + 0.95, 0.09, 1.1, 1.3);
    }
    const toldo = elige(toldos);
    p.d(caja, toldo, 0, base + alto - 0.15, 0.55, ancho * 0.94, 0.06, 1.1, 0.25);
    p.d(caja, blanco, 0, base + alto - 0.33, 1.08, ancho * 0.94, 0.12, 0.02);
    p.d(caja, '#f1ece0', 0, base + alto + 0.15, 0.04, ancho * 0.96, 0.3, 0.08);
  }
  /** Fila de pisos: forjado que vuela en balcón, barandilla y ventanales; algunas ventanas encendidas. */
  function pisos(p: Frente, ancho: number, y0: number, n: number, alto: number, barandilla: string, vuelo = 0.5) {
    for (let k = 0; k < n; k++) {
      const y = y0 + k * alto;
      p.d(caja, '#f4f2ec', 0, y, vuelo / 2, ancho * 0.94, 0.12, vuelo);
      p.d(caja, barandilla, 0, y + 0.3, vuelo - 0.02, ancho * 0.94, 0.48, 0.04);
      p.d(caja, vidrio, 0, y + 0.72, 0.03, ancho * 0.86, 1.05, 0.04);
      for (let u = -ancho * 0.43; u <= ancho * 0.43 + 0.01; u += ancho * 0.86 / Math.max(2, Math.round(ancho / 1.4)))
        p.d(caja, '#ece7dc', u, y + 0.72, 0.06, 0.08, 1.05, 0.04);
      if (azar() < 0.22) p.luz((azar() - 0.5) * ancho * 0.7, y + 0.72, 0.07, 1.1, 0.9);
    }
  }
  /** Miradores acristalados que vuelan de la fachada, en columnas. */
  function miradores(p: Frente, ancho: number, y0: number, n: number, alto: number, marco: string) {
    const cols = Math.max(2, Math.round(ancho / 1.9)),
      w = ancho / cols;
    for (let k = 0; k < n; k++)
      for (let c = 0; c < cols; c++) {
        const u = -ancho / 2 + w * (c + 0.5),
          y = y0 + k * alto + 0.75;
        p.d(caja, marco, u, y, 0.32, w * 0.84, alto * 0.86, 0.62);
        p.d(caja, vidrio, u, y + 0.06, 0.64, w * 0.7, alto * 0.62, 0.03);
        if (azar() < 0.3) p.luz(u, y + 0.06, 0.66, w * 0.6, alto * 0.5);
      }
  }
  /** Azotea: pretil, cuarto de máquinas, depósitos, antenas y algún calentador solar. */
  function azotea(p: Frente, ancho: number, fondo: number, y: number) {
    for (const v of [0, -fondo]) p.d(caja, blanco, 0, y + 0.25, v, ancho, 0.5, 0.12);
    for (const s of [-1, 1]) p.d(caja, blanco, (s * ancho) / 2, y + 0.25, -fondo / 2, 0.12, 0.5, fondo);
    p.d(caja, '#ebe6dc', -ancho * 0.2, y + 0.8, -fondo * 0.6, Math.min(2.4, ancho * 0.35), 1.6, 1.8);
    for (let i = 0; i < 2; i++) p.d(poste, '#e3ded3', ancho * (0.1 + i * 0.18), y + 0.55, -fondo * 0.35, 0.7, 1, 0.7);
    if (azar() > 0.4) p.d(caja, '#2c4a6e', ancho * 0.25, y + 0.45, -fondo * 0.7, 1.3, 0.06, 0.9, 0.5);
    p.d(caja, '#5a5f62', -ancho * 0.35, y + 1.6, -fondo * 0.4, 0.04, 2.2, 0.04);
  }
  /**
   * Bloque de la primera línea, con la fachada al mar: `tipo` 0 de balcones corridos, 1 de miradores,
   * 2 escalonado en terrazas como los de La Cícer.
   */
  function bloque(cx: number, cz: number, giro: number, ancho: number, fondo: number, n: number, color: string, tipo: number) {
    const base = PASEO,
      alto = 1.45,
      bajo = 2.1,
      h = bajo + n * alto;
    const p = frente(cx, cz, giro);
    if (tipo === 2) {
      // Cada planta retranqueada sobre la de abajo, con su terraza.
      for (let k = 0; k <= n; k++) {
        const v = -k * 0.75,
          y = base + (k ? bajo + (k - 1) * alto : 0),
          hk = k ? alto : bajo;
        const f = fondo - k * 0.75;
        if (f < 2) break;
        p.d(caja, color, 0, y + hk / 2, v - f / 2, ancho, hk, f);
        if (k) {
          p.d(caja, '#f2ead8', 0, y + 0.3, v - 0.05, ancho * 0.96, 0.6, 0.1);
          p.d(caja, vidrio, 0, y + 0.95, v - 0.8, ancho * 0.8, 0.9, 0.04);
        } else bajos(p, ancho, base, bajo);
      }
      return;
    }
    const cuerpo = tenido(cal, color);
    if (Math.abs(giro) < 1e-6) superficie(caja, cuerpo, cx, base + h / 2, cz - fondo / 2, ancho, h, fondo, 2.6);
    else p.d(caja, color, 0, base + h / 2, -fondo / 2, ancho, h, fondo);
    bajos(p, ancho, base, bajo);
    const barandillas = ['#f4f2ec', '#a9c4cc', '#f4f2ec', '#8fb3c2'];
    if (tipo === 1) miradores(p, ancho, base + bajo, n, alto, elige(['#f4f2ec', '#dfe6e8', '#e9e1cf']));
    else pisos(p, ancho, base + bajo, n, alto, elige(barandillas));
    // Fachada al callejón: una fila de ventanas en cada medianera que asoma.
    for (const s of [-1, 1])
      for (let k = 0; k < n; k++)
        p.d(caja, vidrio, (s * (ancho + 0.02)) / 2, base + bajo + k * alto + 0.75, -fondo * 0.3, 0.04, 0.8, 0.9);
    azotea(p, ancho, fondo, base + h);
  }

  // Primera línea, de La Puntilla a la Peña: inicio y fin en x, plantas, color y tipo.
  const PRIMERA: [number, number, number, string, number][] = [
    [-44, -40.2, 4, '#f1e7d3', 0],
    [-40.2, -37.2, 6, '#e8d9b5', 0],
    [-35.4, -31, 7, '#f4f1ea', 1],
    [-31, -27.6, 5, '#d9a57c', 0],
    [-27.6, -24.4, 8, '#eef0ec', 0],
    [-22.6, -19, 5, '#e4c98f', 0],
    [-19, -15.4, 6, '#f3efe6', 1],
    [-15.4, -12.4, 4, '#c8d8dc', 0],
    [-10.6, -7.2, 7, '#efe6d6', 0],
    [8.6, 12.4, 6, '#f2efe8', 0],
    [12.4, 16, 5, '#e3b38b', 0],
    [16, 19.4, 7, '#eef0ec', 1],
    [19.4, 24.6, 10, '#e7e2d6', 1], // la esquina alta de miradores sobre Playa Chica
    [26.4, 29.4, 6, '#2f56b8', 0], // el bloque azul
    [32.6, 36.6, 7, '#f5f2ea', 0],
    [38.4, 42, 4, '#e6a78b', 0],
    [42, 45.6, 6, '#efe8d8', 1],
    [45.6, 49.6, 3, '#f3e3c4', 0],
  ];
  for (const [x0, x1, n, color, tipo] of PRIMERA) bloque((x0 + x1) / 2, FACHADA, 0, x1 - x0, 7, n, color, tipo);
  // Casa antigua de dos plantas entre los bloques, con pilastras y cornisa blancas.
  {
    const x0 = 29.4,
      x1 = 32.6,
      cx = (x0 + x1) / 2,
      h = 4.6;
    superficie(caja, tenido(cal, '#e8cf86'), cx, PASEO + h / 2, FACHADA - 3, x1 - x0, h, 6, 2.6);
    const p = frente(cx, FACHADA, 0);
    for (const u of [-1.5, 0, 1.5]) p.d(caja, blanco, u, PASEO + h / 2, 0.04, 0.22, h, 0.08);
    p.d(caja, blanco, 0, PASEO + h - 0.1, 0.06, x1 - x0 + 0.2, 0.25, 0.14);
    p.d(caja, blanco, 0, PASEO + 2.3, 0.05, x1 - x0, 0.12, 0.1);
    for (const u of [-0.75, 0.75])
      for (const y of [1.2, 3.4]) {
        p.d(caja, blanco, u, PASEO + y, 0.04, 0.8, 1.3, 0.06);
        p.d(caja, '#3e6b4d', u, PASEO + y, 0.07, 0.6, 1.1, 0.04);
        p.luz(u, PASEO + y, 0.1, 0.3, 0.8);
      }
    for (let k = -6; k <= 6; k++) p.d(poste, blanco, k * 0.24, PASEO + h + 0.3, -0.1, 0.08, 0.4, 0.08);
  }
  // Hotel Reina Isabel: zócalo ocre con la terraza bajo una carpa blanca y, encima, la lámina de
  // habitaciones con barandillas de vidrio azul y las plantas altas retranqueadas.
  {
    const x0 = -5.6,
      x1 = 6.8,
      cx = (x0 + x1) / 2,
      ancho = x1 - x0;
    const z = FACHADA;
    superficie(caja, tenido(cal, '#d9b77e'), cx, PASEO + 1.6, z - 4, ancho, 3.2, 8, 2.6);
    const p = frente(cx, z, 0);
    p.d(caja, '#cf9f68', 0, PASEO + 0.6, 0.6, ancho, 1.2, 1.2);
    for (let u = -ancho / 2 + 0.8; u < ancho / 2; u += 1.6) {
      p.d(caja, '#f3f1ea', u, PASEO + 2, 0.9, 0.06, 1.6, 0.06);
      p.d(caja, '#3b3a36', u + 0.8, PASEO + 1.9, 0.02, 1.2, 1.2, 0.04);
      if (azar() < 0.35) p.luz(u + 0.8, PASEO + 1.9, 0.05, 1, 1);
    }
    p.d(caja, '#f6f4ee', 0, PASEO + 2.9, 0.6, ancho, 0.1, 1.4, -0.12);
    const y0 = PASEO + 3.4,
      n = 7;
    superficie(caja, tenido(cal, '#e2c89a'), cx - 0.4, y0 + (n * 1.55) / 2, z - 5, ancho - 2, n * 1.55, 5.6, 2.6);
    const hab = frente(cx - 0.4, z - 2.2, 0);
    pisos(hab, ancho - 2, y0, n, 1.55, '#4a9cc4', 0.6);
    // Últimas plantas retranqueadas y el rótulo en lo alto.
    superficie(caja, tenido(cal, '#e2c89a'), cx - 0.4, y0 + n * 1.55 + 0.8, z - 5.6, ancho - 4, 1.6, 4, 2.6);
    pisos(frente(cx - 0.4, z - 3.6, 0), ancho - 4, y0 + n * 1.55, 1, 1.55, '#4a9cc4', 0.4);
    azotea(frente(cx - 0.4, z - 3.6, 0), ancho - 4, 4, y0 + n * 1.55 + 1.6);
    p.d(caja, '#f6f4ee', ancho * 0.3, y0 + n * 1.55 + 2.6, -2.4, 2.6, 0.5, 0.08);
  }
  // Segunda fila, que asoma por encima o entre las medianeras de la primera.
  for (let x = -44; x < 49; ) {
    const ancho = 3.6 + azar() * 2.6;
    if (!(x > -36.5 && x < -35) && !(x > 24 && x < 26)) {
      const n = 4 + Math.floor(azar() * 6);
      bloque(x + ancho / 2, FACHADA - 9.2, 0, ancho - 0.2, 6, n, elige(['#efe9dd', '#e7d6b8', '#dfe4e2', '#f2e2cc', '#d7b48f', '#cfd9dc']), azar() > 0.7 ? 1 : 0);
    }
    x += ancho;
  }
  // Más allá, la ciudad: manzanas de pisos hasta que se pierden en la bruma.
  for (let bx = -60; bx < 70; bx += 9)
    for (let bz = -34; bz > -92; bz -= 9) {
      const x = bx + (azar() - 0.5) * 2,
        z = bz + (azar() - 0.5) * 2;
      if (Math.hypot(x + 31, z + 44) < 6) continue; // la torre Woermann
      const h = 4 + azar() * 12,
        w = 5 + azar() * 2.5,
        d = 5 + azar() * 2.5;
      pieza(caja, elige(['#ece5d8', '#e3d2b4', '#d8dcd9', '#efe0c8', '#d6b28e', '#c9d3d6', '#e9c9a8']), x, PASEO + h / 2, z, w, h, d);
      for (const s of [-1, 1]) {
        pieza(caja, blanco, x, PASEO + h + 0.15, z + (s * d) / 2, w, 0.3, 0.1);
        pieza(caja, blanco, x + (s * w) / 2, PASEO + h + 0.15, z, 0.1, 0.3, d);
      }
      for (let y = 2.2; y < h - 0.6; y += 1.6) pieza(caja, '#4d5a60', x, PASEO + y, z + d / 2 + 0.02, w * 0.84, 0.5, 0.04);
      if (azar() > 0.5) pieza(poste, '#e3ded3', x - w * 0.2, PASEO + h + 0.5, z, 0.8, 1, 0.8);
    }
  // Torre Woermann: dos láminas de vidrio azul que se inclinan una hacia la otra, sobre los tejados.
  {
    const tx = -31,
      tz = -44;
    for (const [dx, inclina, alto] of [
      [-1.6, 0.06, 30],
      [1.6, -0.04, 26],
    ]) {
      pieza(caja, '#3d6378', tx + dx, PASEO + alto / 2, tz, 3, alto, 5, 0, 0, inclina);
      for (let y = 1.5; y < alto; y += 1.5) pieza(caja, '#7fa3b4', tx + dx + inclina * y * 0.5, PASEO + y, tz + 2.52, 3.02, 0.08, 0.03, 0, 0, inclina);
    }
  }

  // --- La Puntilla: plaza de hormigón sobre la lava, varadero, barcas varadas y nasas ---
  superficie(caja, tenido(cal, '#bdb6aa'), -51, PASEO - 0.03, -4.2, 14, 0.06, 15.6, 3);
  for (let z = -11; z < 3.6; z += 2.2) pieza(caja, '#a9a296', -51, PASEO + 0.005, z, 14, 0.012, 0.06);
  // Muro de la plaza sobre la playa y sobre las rocas.
  pieza(caja, '#cfc3a9', -44.2, PASEO / 2 - 0.2, (MURO - 0.1) / 2, 0.4, PASEO + 0.4, -MURO - 0.1);
  pieza(caja, '#cfc3a9', -44.2, PASEO / 2 - 0.2, 2.7, 0.4, PASEO + 0.4, 1.8);
  for (let z = MURO; z < 3.6; z += 1.2) if (z < -0.2 || z > 2) pieza(poste, acero, -44.2, PASEO + 0.48, z, 0.05, 0.96, 0.05);
  // Escalera de la plaza a la arena.
  for (let k = 0; k < 6; k++) {
    const x = -44.25 + k * 0.3,
      y = PASEO + ((arena(-42.6, 1) - PASEO) * (k + 0.5)) / 6;
    pieza(caja, '#d2c4a8', x, (y - 0.3) / 2, 0.9, 0.32, y + 0.3, 1.8);
  }
  // Varadero de hormigón amarillento que baja al agua.
  pieza(caja, '#cdb98a', -50.8, (PASEO - 0.6) / 2 - 0.05, 6.9, 2.4, 0.12, Math.hypot(6.6, PASEO + 0.6), Math.atan2(PASEO + 0.6, 6.6));
  for (const s of [-1, 1]) pieza(caja, '#b9a77c', -50.8 + s * 1.25, 0.05, 6.9, 0.1, 0.3, 6.6, Math.atan2(PASEO + 0.6, 6.6));
  // Coladas de lava negra alrededor de la punta, entre la plaza y el mar.
  for (let i = 0; i < 170; i++) {
    let x: number, z: number;
    if (i < 100) {
      x = -60 + azar() * 16;
      z = 3.4 + azar() * 7.5;
      if (x > -53 && x < -48.6) continue; // el varadero
    } else {
      x = -62 + azar() * 4;
      z = -16 + azar() * 22;
    }
    const r = 0.5 + azar() * 1.1;
    pieza(esfera, elige(['#2f2a28', '#3a3330', '#463d38', '#2a2523']), x, -0.5 + azar() * 0.9, z, r * 1.3, 0.4 + azar() * 0.6, r, 0, azar() * 3);
  }
  for (let i = 0; i < 50; i++) {
    const x = -61 + azar() * 17,
      z = 10.5 + azar() * 2.5;
    pieza(esfera, '#f4f6f2', x, -0.82, z, 0.6 + azar() * 0.6, 0.05, 0.2, 0, azar() * 3);
  }
  // Nasas de alambre apiladas junto a las barcas.
  const nasa = new T.CylinderGeometry(0.5, 0.5, 1, 9, 1, true);
  for (const [x, z, y] of [
    [-42.8, -2, arena(-42.8, -2)],
    [-43, -1.2, arena(-43, -1.2)],
    [-46.4, -3.4, PASEO],
    [-47.2, -3.2, PASEO],
    [-46.8, -3.3, PASEO + 0.55],
  ]) {
    pieza(nasa, '#7d6a55', x, y + 0.28, z, 1, 0.55, 1);
    pieza(disco, '#6d5c4a', x, y + 0.56, z, 1, 0.02, 1);
  }
  nasa.dispose();
  // Caseta de los pescadores, con sus banderas al viento.
  {
    const x = -55,
      z = -6;
    superficie(caja, tenido(cal, '#f3efe6'), x, PASEO + 1.3, z, 4, 2.6, 3.6, 2.6);
    pieza(caja, '#2f5f9a', x, PASEO + 0.95, z + 1.82, 1.1, 1.9, 0.05);
    for (const dx of [-1.3, 1.3]) {
      pieza(caja, '#2f5f9a', x + dx, PASEO + 1.6, z + 1.82, 0.7, 0.6, 0.05);
      ventanas.push([x + dx, PASEO + 1.6, z + 1.85, 0.5, 0.4, 0.03]);
    }
    pieza(caja, '#ede7d9', x, PASEO + 2.65, z, 4.2, 0.12, 3.8);
    for (const [dx, color] of [
      [-1.2, '#d8402f'],
      [0, '#f4f1ea'],
      [1.2, '#2f6fb3'],
    ] as const) {
      pieza(poste, '#d9d4c8', x + dx, PASEO + 4, z + 1.5, 0.05, 2.6, 0.05);
      pieza(caja, color, x + dx + 0.4, PASEO + 5, z + 1.5, 0.75, 0.5, 0.02);
    }
  }
  // La Isleta detrás de la punta: casas de dos a cuatro plantas, de colores, y la calle que sube.
  for (const [x0, x1] of [
    [-63, -56.4],
    [-52, -44],
  ])
    for (let x = x0; x < x1 - 1; ) {
      const ancho = Math.min(x1 - x, 3 + azar() * 1.8);
      const n = 1 + Math.floor(azar() * 3);
      bloque(x + ancho / 2, -12.6, 0, ancho - 0.1, 5, n, elige(['#e9c46a', '#e07a5f', '#8ab6c9', '#f1e3c6', '#c9d6a3', '#f0f0ea']), 0);
      x += ancho;
    }
  superficie(caja, tenido(cal, '#77736c'), -54.2, PASEO - 0.02, -15, 3.4, 0.05, 6.4, 4);

  // --- La Cícer: el paseo y la playa siguen en arco hacia el mar, con bloques escalonados ocres ---
  for (let x = 50; x < 60; x += 1) {
    const zm = MURO + desvio(x + 0.5),
      g = giroArco(x + 0.5),
      largo = 1.1 / Math.cos(g);
    pieza(caja, '#c4644a', x + 0.5, PASEO - 0.03, zm - 2.4, largo, 0.06, 4.8, 0, g);
    pieza(caja, '#d8ccb3', x + 0.5, PASEO / 2 - 0.2, zm + 0.2, largo, PASEO + 0.4, 0.4, 0, g);
    pieza(caja, '#8f877b', x + 0.5, PASEO - 1.02, zm - 18, largo + 0.3, 2, 30, 0, g);
    pieza(caja, acero, x + 0.5, PASEO + 0.95, zm - 0.08, largo, 0.04, 0.04, 0, g);
  }
  for (const [cx, ancho, n] of [
    [51.4, 3.6, 5],
    [55, 3.6, 7],
    [58.4, 3.2, 4],
  ])
    bloque(cx, FACHADA + desvio(cx), giroArco(cx), ancho, 6, n, elige(['#d9a35c', '#e2b06a', '#cf9550', '#e8c27e']), 2);
  pieza(poste, '#4c5a5c', 54, PASEO + 2.6, MURO - 0.45 + desvio(54), 0.1, 5.2, 0.1);
  pieza(disco, '#56676a', 54, PASEO + 5.25, MURO - 0.45 + desvio(54), 0.9, 0.08, 0.9);

  // --- Auditorio Alfredo Kraus, al final del arco: fortaleza de piedra dorada con su linterna ---
  // Su costado largo mira a la playa (+v); la entrada en uve, tierra adentro (−u), y el
  // ventanal de la sala sinfónica, al océano (+u).
  {
    const a = frente(65, 15, -2.1);
    const piedra = '#cfae7c',
      clara = '#dcc095',
      junta = '#b8976a';
    a.d(caja, '#c9b99c', -0.5, PASEO - 0.5, -1, 18, 1, 13);
    for (let k = 0; k < 4; k++) a.d(caja, '#d8c7a8', -2, PASEO - 0.12 - k * 0.25, 5.6 + k * 0.45, 11, 0.25, 0.45);
    // Sala sinfónica: el gran cubo de piedra con hiladas, y el ventanal al mar detrás del escenario.
    // Más bajo que el real, para que la linterna quepa bajo el horizonte desde la playa.
    a.d(caja, piedra, 0, PASEO + 3.2, -1.5, 10, 6.4, 7);
    for (let y = 1.3; y < 6.4; y += 1.3) a.d(caja, junta, 0, PASEO + y, 2.01, 10.02, 0.07, 0.04);
    a.d(caja, '#3f5a66', 5.02, PASEO + 3.6, -1.5, 0.05, 3.2, 4.4);
    // Cuerpo escalonado hacia el mar.
    for (let k = 0; k < 3; k++) a.d(caja, clara, 5.8 + k * 0.9, PASEO + 2 - k * 0.6, -1.5, 1.6, 4 - k * 1.2, 6 - k * 0.8);
    // Dos torres en la entrada y, entre ellas, la uve abierta con la celosía de madera.
    for (const v of [-4, 1]) {
      a.d(caja, clara, -6.2, PASEO + 4, v, 2.6, 8, 2);
      for (let y = 1.3; y < 8; y += 1.3) a.d(caja, junta, -6.2, PASEO + y, v + 1.01, 2.62, 0.07, 0.04);
    }
    a.d(caja, '#2c2a28', -7.2, PASEO + 3.6, -1.5, 0.1, 7.2, 3);
    for (let k = -4; k <= 4; k++) {
      a.d(caja, '#b8743f', -7.3, PASEO + 3.6 + k * 0.75, -1.5, 0.05, 0.07, 3, (k % 2 ? 1 : -1) * 0.5);
      a.d(caja, '#b8743f', -7.3, PASEO + 3.6, -1.5 + k * 0.33, 0.05, 7.2, 0.06);
    }
    // Linterna: tambor de vidrio verdemar y cúpula blanca, el faro que imaginó Tusquets.
    a.d(disco, '#e9e4d8', 2.2, PASEO + 6.55, -2.5, 3.2, 0.3, 3.2);
    a.d(disco, '#5fb7ad', 2.2, PASEO + 7.4, -2.5, 2.5, 1.4, 2.5);
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2;
      a.d(caja, '#e9e4d8', 2.2 + Math.cos(ang) * 1.25, PASEO + 7.4, -2.5 + Math.sin(ang) * 1.25, 0.07, 1.4, 0.07);
    }
    a.d(cupula, '#f6f4ee', 2.2, PASEO + 8.1, -2.5, 1.35, 0.95, 1.35);
    a.d(poste, '#e9e4d8', 2.2, PASEO + 9.25, -2.5, 0.05, 0.5, 0.05);
  }
  // Rocas oscuras donde acaba la playa, al pie del Auditorio.
  for (let i = 0; i < 40; i++) {
    const x = 62 + azar() * 10,
      z = 19 + azar() * 7;
    pieza(esfera, elige(['#3a3330', '#463d38']), x, -0.6 + azar() * 0.5, z, 0.8 + azar(), 0.4 + azar() * 0.5, 0.7 + azar(), 0, azar() * 3);
  }

  // --- La Isleta al fondo, tras La Puntilla: conos volcánicos pardos y rojizos ---
  const volcan = (x: number, z: number, r: number, h: number, color: string) => {
    const geo = new T.ConeGeometry(1, 1, 12, 3);
    const pos = geo.attributes.position,
      fase = azar() * 6;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Laderas irregulares, iguales en los dos vértices de la costura, y la cumbre achatada.
      const k = y > -0.49 && y < 0.49 ? 1 + 0.15 * Math.sin(Math.atan2(pos.getZ(i), pos.getX(i)) * 3 + y * 7 + fase) : 1;
      pos.setXYZ(i, pos.getX(i) * k, y > 0.49 ? 0.3 : y, pos.getZ(i) * k);
    }
    pieza(geo, color, x, h * 0.4 - 0.8, z, r, h, r);
    geo.dispose();
  };
  // Dentro del horizonte pintado, que tapa lo que queda más allá de 80 unidades.
  volcan(-70, -6, 10, 9, '#5e3a29');
  volcan(-62, -30, 12, 12, '#4f3a2e');
  volcan(-65, 17, 7, 6, '#6a3f2c');

  for (const g of [disco, cupula, cono, gajo]) g.dispose();
  return {
    // Barquillos fondeados en el remanso de La Puntilla, de proa a la mar.
    amarres: [
      [0, -42, 11.6, 1.2],
      [2, -39.6, 12.8, 0.9],
      [0, -36.4, 11.4, 1.4],
      [2, -45.6, 13.6, 1.1],
      [1, 8, 22, 0.4], // un velero fondeado fuera de la barra
    ],
    // Barcas varadas en la arena, sobre sus calzos.
    enSeco: VARADAS.map(([x, z, giro], i): [number, number, number, number, number] => [i === 1 ? 0 : 2, x, arena(x, z) + 0.05, z, Math.PI / 2 + giro]),
  };
}
