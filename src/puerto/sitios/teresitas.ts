import * as T from 'three';
import type { Sitio, Taller } from '../maqueta';
import { losa } from './terreno';
import {
  BORDE,
  LARGO,
  ROMPEOLAS,
  CASTILLO,
  BARRANCO,
  COFRADIA,
  CALLES,
  CALLE,
  MUELLE,
  KIOSCOS,
  KIOSCO,
  VARADAS,
  PALMERAS,
  arena,
  cuesta,
  enPlaya,
  enMuelle,
  muestrear,
  type Punto,
} from './teresitas-plano';

/**
 * Playa de Las Teresitas y San Andrés (Santa Cruz de Tenerife), trazadas sobre la ortofoto PNOA.
 * La playa es una media luna de arena rubia entre dos espigones, con el rompeolas exento delante
 * y, detrás, el paseo azul, la carretera, la hilera de palmeras del aparcamiento y los riscos de
 * Anaga, que suben a pico. A la izquierda, pasada la cofradía y la boca del barranco, el castillo
 * en ruinas y las casas de colores de San Andrés. Lo pisable está en `teresitas-plano.ts`.
 */
export function trazarTeresitas(t: Taller): Sitio {
  const { pieza, superficie, farol, azar, ventanas, blanco, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const hormigon = tenido(cal, '#c9c2b6'),
    asfalto = tenido(cal, '#5c5f63'),
    cantera = tenido(adoquin, '#cdbfa6');
  const suave = (v: number) => {
    const k = Math.min(1, Math.max(0, v));
    return k * k * (3 - 2 * k);
  };
  /** Malla de triángulos con un color: se hornea con las demás piezas. */
  const malla = (vertices: number[], color: string) => {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    pieza(geo, color, 0, 0, 0, 1, 1, 1);
    geo.dispose();
  };
  /** Ejes de la playa en `s`: punto, tangente (a lo largo) y normal (hacia el mar). */
  const marco = (s: number, d = 0) => {
    const [x, z] = enPlaya(s, d),
      [ax, az] = enPlaya(s - 0.4, d),
      [bx, bz] = enPlaya(s + 0.4, d);
    const l = Math.hypot(bx - ax, bz - az),
      ux = (bx - ax) / l,
      uz = (bz - az) / l;
    return { x, z, ux, uz, nx: -uz, nz: ux, giro: -Math.atan2(uz, ux) };
  };
  /** Pieza puesta en los ejes de un marco: `a` a lo largo de la playa, `n` hacia el mar. */
  const enMarco = (
    m: ReturnType<typeof marco>,
    forma: T.BufferGeometry,
    color: string,
    a: number,
    y: number,
    n: number,
    w: number,
    h: number,
    d: number,
    rx = 0,
  ) => pieza(forma, color, m.x + a * m.ux + n * m.nx, y, m.z + a * m.uz + n * m.nz, w, h, d, rx, m.giro);

  // --- Cintas que siguen la curva de la playa: arena, paseo, carretera, mediana y aparcamiento ---
  /** Franja entre dos distancias al paseo, de `s0` a `s1`, con su altura según la distancia. */
  function cinta(cortes: number[], altura: (d: number, s: number) => number, color: string, s0 = 0, s1 = LARGO) {
    const filas = [s0, ...BORDE.map((m) => m.s).filter((s) => s > s0 + 0.05 && s < s1 - 0.05), s1];
    const vertices: number[] = [];
    for (let i = 1; i < filas.length; i++)
      for (let j = 1; j < cortes.length; j++) {
        const p = (s: number, d: number) => {
          const [x, z] = enPlaya(s, d);
          return [x, altura(d, s), z];
        };
        const a = p(filas[i - 1], cortes[j - 1]),
          b = p(filas[i], cortes[j - 1]),
          c = p(filas[i - 1], cortes[j]),
          d = p(filas[i], cortes[j]);
        vertices.push(...a, ...c, ...b, ...b, ...c, ...d);
      }
    malla(vertices, color);
  }
  // Arena rubia: seca junto al paseo, más oscura y húmeda donde llegan las olas.
  const rizo = (d: number, s: number) => (d > 0.3 && d < 5 ? 0.022 * Math.sin(s * 1.9 + d * 2.6) : 0);
  const playa = (d: number, s: number) => arena(d) + rizo(d, s);
  cinta([0, 0.8, 1.7, 2.6, 3.5, 4.4, 5.3], playa, '#ecd49c');
  cinta([5.3, 6.1, 6.8], playa, '#dcbd84');
  cinta([6.8, 7.6, 8.6, 10], playa, '#c2a273');
  // Paseo azul, con bordillo blanco hacia la arena y hacia la carretera.
  cinta([-3, -1.5, 0], () => 0.012, '#5c9fcd');
  cinta([-0.14, 0.02], () => 0.035, '#eef0ec');
  cinta([-3.16, -3], () => 0.09, '#e6e2d8');
  // Carretera, mediana de picón con palmeras, aparcamiento y muro al pie del risco.
  cinta([-6.2, -4.7, -3.16], () => 0.006, '#4c5055', 9, LARGO - 1);
  cinta([-7.3, -6.2], () => 0.1, '#d6d0c4', 9, LARGO - 1.5);
  cinta([-7.15, -6.35], () => 0.13, '#83503d', 9.2, LARGO - 1.7);
  cinta([-11.3, -9.3, -7.3], () => 0.006, '#585c60', 9, LARGO - 1.5);
  cinta([-11.8, -11.3], () => 0.35, '#c8bfae', 9, LARGO - 1.5);
  // Rayas de la carretera, pasos de cebra y plazas del aparcamiento.
  for (let s = 10; s < LARGO - 2; s += 1.8) enMarco(marco(s, -4.7), caja, '#f1efe7', 0, 0.015, 0, 0.8, 0.02, 0.1);
  for (const s of [14, 26.5, 38, 50.5])
    for (let k = 0; k < 6; k++) enMarco(marco(s, -3.5 - k * 0.5), caja, '#f4f2ea', 0, 0.016, 0, 1.3, 0.02, 0.26);
  for (let s = 9.6; s < LARGO - 2; s += 1.3)
    for (const d of [-8.4, -10.2]) enMarco(marco(s, d), caja, '#e9e6dc', 0, 0.014, 0, 0.06, 0.02, 1.6);
  // Coches aparcados, de morro a la mediana o al muro.
  const tonosCoche = ['#d8d8d4', '#2d3f5c', '#8a1f24', '#3b3d41', '#c9c2b2', '#6d7d8c', '#f0f0ec', '#244a36'];
  for (let s = 10.25; s < LARGO - 2.5; s += 1.3)
    for (const d of [-8.3, -10.3]) {
      if (azar() < 0.3) continue;
      const m = marco(s, d),
        color = tonosCoche[Math.floor(azar() * tonosCoche.length)];
      enMarco(m, caja, color, 0, 0.36, 0, 0.82, 0.45, 1.75);
      enMarco(m, caja, '#26313a', 0, 0.74, d > -9 ? 0.05 : -0.05, 0.74, 0.34, 0.95);
      enMarco(m, caja, color, 0, 0.93, d > -9 ? 0.05 : -0.05, 0.76, 0.06, 0.9);
    }
  // Farolas del paseo.
  for (let s = 6; s < LARGO - 1; s += 7) {
    const [x, z] = enPlaya(s, -2.75);
    farol(x, z);
  }

  // Alcorques de arena al pie de las palmeras de la playa, que quedan a la altura del paseo.
  for (const [x, z] of PALMERAS.slice(-12)) {
    pieza(poste, '#cfb27a', x + 0.15, -0.25, z, 1, 0.55, 1);
    pieza(poste, '#e0c487', x + 0.15, 0.03, z, 0.95, 0.04, 0.95);
  }
  // Aparcamiento grande del extremo suroeste, entre el barranco y la playa, y la carretera que
  // llega del puente.
  superficie(caja, asfalto, -30.35, -0.06, 2.65, 5.5, 0.08, 15.3, 5);
  superficie(caja, asfalto, -25.55, -0.06, 0.5, 4.1, 0.08, 11, 5);
  superficie(caja, tenido(cal, '#4c5055'), -28.5, -0.03, 1, 9.2, 0.08, 2, 5);
  for (const [x, z] of [
    [-32, -3.4], [-30.7, -3.4], [-29.4, -3.4], [-26.8, -3.4], [-25.5, -3.4], [-32, -1.2], [-29.4, -1.2],
    [-28.1, -1.2], [-25.5, -1.2], [-30.7, 3.4], [-29.4, 3.4], [-28.1, 3.4], [-32, 5.6], [-30.7, 5.6],
  ]) {
    const color = tonosCoche[Math.floor(azar() * tonosCoche.length)];
    pieza(caja, color, x, 0.36, z, 0.82, 0.45, 1.75);
    pieza(caja, '#26313a', x, 0.74, z, 0.74, 0.34, 0.95);
  }

  // --- Kioscos: cubos blancos de remate azul, terraza de madera y pérgola de placas solares ---
  for (const s of KIOSCOS) {
    const m = marco(s, KIOSCO.d),
      { largo: w, fondo: d } = KIOSCO;
    // Tarima de madera sobre la arena, que baja hasta enterrarse por el lado del mar.
    enMarco(m, caja, '#b48a5e', 0, -0.25, 0.55, w + 0.8, 0.7, d + 1.6);
    enMarco(m, caja, blanco, 0, 1.25, 0, w, 2.3, d);
    enMarco(m, caja, '#2f86c2', 0, 2.08, 0, w + 0.04, 0.3, d + 0.04);
    enMarco(m, caja, '#f6f5f0', 0, 2.42, 0.1, w + 0.6, 0.14, d + 0.7);
    // Mostrador abierto al mar, con toldo de rayas.
    enMarco(m, caja, '#2a3640', 0, 1.45, d / 2, w * 0.62, 0.8, 0.04);
    enMarco(m, caja, '#c9a27a', 0, 1.02, d / 2 + 0.16, w * 0.68, 0.08, 0.34);
    const [x, z] = enPlaya(s, KIOSCO.d + d / 2 + 0.03);
    ventanas.push([x, 1.45, z, 0.5, 0.6, 0.5]);
    for (let k = 0; k < 6; k++)
      enMarco(m, caja, k % 2 ? '#f6f3ea' : '#2f86c2', -w * 0.3 + k * w * 0.12, 1.98, d / 2 + 0.32, w * 0.12, 0.05, 0.7, 0.35);
    // Terraza: dos mesas con sombrilla blanca y sus taburetes.
    for (const a of [-0.75, 0.75]) {
      enMarco(m, poste, '#efece4', a, 0.45, d / 2 + 1, 0.55, 0.06, 0.55);
      enMarco(m, poste, '#9a9892', a, 0.25, d / 2 + 1, 0.06, 0.45, 0.06);
      enMarco(m, poste, '#efece4', a, 1.1, d / 2 + 1, 0.04, 1.6, 0.04);
      enMarco(m, piramide, '#fbfaf6', a, 1.95, d / 2 + 1, 0.95, 0.35, 0.95);
      for (const b of [-0.42, 0.42]) enMarco(m, poste, '#2f86c2', a + b, 0.22, d / 2 + 1, 0.22, 0.4, 0.22);
    }
    // Pérgola de placas solares sobre el paseo, a la espalda del kiosco.
    const pergola = -d / 2 - 1.35;
    for (const a of [-1.3, 1.3])
      for (const n of [pergola - 1.05, pergola + 1.05]) enMarco(m, poste, '#8b9095', a, 1.3, n, 0.08, 2.6, 0.08);
    enMarco(m, caja, '#9aa0a5', 0, 2.62, pergola, w, 0.08, 2.3);
    for (const a of [-0.95, 0, 0.95]) enMarco(m, caja, '#1f3557', a, 2.7, pergola, 0.9, 0.04, 2.15, 0.12);
  }

  // --- Sombrillas azules en filas frente a la orilla ---
  const cono = new T.ConeGeometry(1, 1, 8);
  for (const [s0, n] of [
    [12.2, 5],
    [25.5, 4],
    [52, 4],
  ])
    for (let k = 0; k < n; k++)
      for (const [fila, d] of [3.7, 5.1].entries()) {
        const m = marco(s0 + k * 1.45 + fila * 0.4, d),
          y = arena(d);
        enMarco(m, poste, '#e8e4d8', 0, y + 1, 0, 0.05, 2, 0.05);
        enMarco(m, cono, fila ? '#3c5aa6' : '#4d6cb8', 0, y + 1.95, 0, 0.95, 0.32, 0.95);
        for (const a of [-0.35, 0.35]) enMarco(m, caja, '#f5f2ea', a, y + 0.16, 0.2, 0.42, 0.07, 1.3, -0.12);
      }
  cono.dispose();

  // --- Rompeolas: escollera de piedra oscura a ras del agua, con la espuma por fuera ---
  const piedras = ['#4b4541', '#5b544e', '#3f3a37', '#6a625a', '#544c45'];
  const escollera = (puntos: ReturnType<typeof muestrear>, ancho: number, alto: number) => {
    for (const p of puntos)
      for (let k = -1; k <= 1; k++) {
        const r = 0.32 + azar() * 0.3,
          n = (k * ancho) / 2 + (azar() - 0.5) * 0.3;
        pieza(
          esfera,
          piedras[Math.floor(azar() * piedras.length)],
          p.x - n * p.tz + (azar() - 0.5) * 0.3,
          alto - Math.abs(k) * 0.25 + (azar() - 0.5) * 0.15,
          p.z + n * p.tx + (azar() - 0.5) * 0.3,
          r * 1.2,
          r * 0.75,
          r,
          azar(),
          azar() * 3,
          azar(),
        );
      }
  };
  const rompeolas = muestrear(ROMPEOLAS, 0.5);
  escollera(rompeolas, 0.9, -0.55);
  for (const [i, p] of rompeolas.entries()) {
    if (i % 2) continue;
    const n = 1 + azar() * 0.6;
    pieza(esfera, '#f2f5f3', p.x - n * p.tz, -0.81, p.z + n * p.tx, 0.5 + azar() * 0.5, 0.04, 0.22, 0, -Math.atan2(p.tz, p.tx));
  }
  // Espigón de la punta de los Órganos, de bloques más gruesos.
  escollera(muestrear([[30.8, 7.6], [27.5, 12.6], [24.7, 17.4]], 0.45), 1.3, -0.3);
  // Escollera de la avenida de San Andrés y su dique exento.
  escollera(muestrear([[-70, 18.2], [-37.4, 18.2]], 0.5), 1, -0.6);
  escollera(muestrear([[-61, 24.6], [-52, 23.6], [-44, 22.6]], 0.45), 1, -0.5);

  // --- Muelle de la cofradía: losa de hormigón con norais, escollera por fuera y farolillo ---
  const giroMuelle = -Math.atan2(MUELLE.dir[1], MUELLE.dir[0]);
  const enMuelleP = (t: number, lado: number): Punto => {
    const [x, z] = enMuelle(t);
    return [x - lado * MUELLE.dir[1], z + lado * MUELLE.dir[0]];
  };
  {
    const [x, z] = enMuelle(MUELLE.largo / 2 - 0.6);
    pieza(caja, '#958d82', x, -0.72, z, MUELLE.largo + 1.2, 1.44, MUELLE.ancho, 0, giroMuelle);
    pieza(caja, '#bdb6aa', x, -0.02, z, MUELLE.largo + 1.2, 0.06, MUELLE.ancho - 0.1, 0, giroMuelle);
  }
  escollera(muestrear([enMuelleP(-0.5, -1.75), enMuelleP(MUELLE.largo + 0.4, -1.75)], 0.45), 0.7, -0.45);
  for (let k = 0; k < 5; k++) {
    const [x, z] = enMuelleP(1 + k * 2, 1.05);
    pieza(poste, '#2f3336', x, 0.17, z, 0.2, 0.34, 0.2);
    pieza(poste, '#2f3336', x, 0.36, z, 0.26, 0.05, 0.26);
  }
  {
    const [x, z] = enMuelle(MUELLE.largo - 0.2);
    for (let j = 0; j < 4; j++)
      pieza(poste, j % 2 ? blanco : '#2e8b57', x, 0.35 + j * 0.55, z, 0.5 - j * 0.04, 0.55, 0.5 - j * 0.04);
    ventanas.push([x, 2.5, z, 0.24, 0.3, 0.24]);
    pieza(piramide, '#2e8b57', x, 2.85, z, 0.28, 0.28, 0.28, 0, Math.PI / 4);
  }

  // --- Explanada y cofradía de pescadores, en la boca del barranco ---
  pieza(caja, '#958d82', -30.4, -0.75, 13.2, 5.6, 1.4, 5.8);
  superficie(caja, hormigon, -30.4, -0.03, 13.2, 5.6, 0.08, 5.8, 4);
  {
    const [x0, z0, x1, z1] = COFRADIA,
      cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    pieza(caja, blanco, cx, 1.5, cz, x1 - x0, 3, z1 - z0);
    pieza(caja, '#1f5f9a', cx, 0.2, cz, x1 - x0 + 0.04, 0.4, z1 - z0 + 0.04);
    pieza(caja, '#1f5f9a', cx, 2.75, cz, x1 - x0 + 0.04, 0.22, z1 - z0 + 0.04);
    pieza(caja, blanco, cx, 3.1, cz, x1 - x0 + 0.2, 0.2, z1 - z0 + 0.2);
    // Puertas azules del almacén hacia la playa, y ventanas.
    for (const z of [cz - 1.6, cz + 1.6]) {
      pieza(caja, '#1f5f9a', x1 + 0.03, 0.95, z, 0.06, 1.7, 1.3);
      pieza(caja, madera, x1 + 0.05, 0.95, z, 0.04, 1.5, 0.04);
    }
    for (const z of [cz - 1.6, cz, cz + 1.6]) {
      pieza(caja, '#1f5f9a', x1 + 0.03, 2.2, z, 0.06, 0.6, 0.8);
      ventanas.push([x1 + 0.06, 2.2, z, 0.04, 0.45, 0.6]);
    }
    // Nasas y cajas de pescado a la puerta.
    for (let k = 0; k < 5; k++) pieza(poste, k % 2 ? '#3d5a45' : '#556b4d', x1 + 0.8, 0.25, cz - 2.4 + k * 0.5, 0.42, 0.5, 0.42);
    for (let k = 0; k < 3; k++) pieza(caja, '#4e7fae', x1 + 0.6, 0.15 + k * 0.28, cz + 2.6, 0.6, 0.26, 0.42);
  }

  // --- Barranco: cauce de hormigón entre muros, seco, que se abre al mar junto al castillo ---
  const { oeste, este, mar } = BARRANCO,
    cauce = (oeste + este) / 2;
  for (const x of [oeste - 0.2, este + 0.2]) pieza(caja, '#a69f93', x, -0.5, (mar - 46) / 2, 0.4, 1.3, mar + 46);
  pieza(caja, '#8f887c', cauce, -0.85, (mar - 2 - 46) / 2, este - oeste, 0.5, mar - 2 + 46);
  pieza(caja, '#8f887c', cauce, -1.05, mar - 1, este - oeste, 0.5, 2.2, -0.12);
  for (let i = 0; i < 150; i++) {
    const r = 0.12 + azar() * 0.25;
    pieza(esfera, ['#6f675e', '#857c70', '#5d564f'][i % 3], cauce + (azar() - 0.5) * 3, -0.58, -44 + azar() * 60, r * 1.3, r * 0.6, r);
  }
  // Cañas en el cauce alto, ya dentro del valle.
  for (let i = 0; i < 30; i++)
    pieza(poste, i % 2 ? '#7f8b4c' : '#94995a', cauce + (azar() - 0.5) * 2.6, 0, -44 + azar() * 22, 0.12, 1.4 + azar(), 0.12);
  // Puente de la carretera y pasarela sobre la desembocadura.
  pieza(caja, '#a69f93', cauce, -0.25, 1, este - oeste + 0.8, 0.5, 2.2);
  pieza(caja, '#4c5055', cauce, 0.01, 1, este - oeste + 0.8, 0.04, 2);
  pieza(caja, '#a69f93', cauce, -0.25, 14.5, este - oeste + 0.8, 0.5, 2);
  superficie(caja, hormigon, cauce, 0.0, 14.5, este - oeste + 0.8, 0.06, 2, 4);
  for (const z of [0, 2, 13.55, 15.45]) {
    pieza(caja, blanco, cauce, 0.55, z, este - oeste + 0.8, 0.06, 0.08);
    for (let k = 0; k <= 4; k++) pieza(caja, blanco, oeste - 0.3 + k * 0.97, 0.27, z, 0.06, 0.55, 0.06);
  }

  // --- Castillo de San Andrés: torre redonda de mampostería, abierta del lado del barranco ---
  superficie(caja, cantera, -40.45, -0.02, 10.25, 6.1, 0.08, 6.5, 2.6);
  {
    const { x: cx, z: cz, r } = CASTILLO;
    const piedra = '#9a8b78',
      dentro = '#7f7262',
      claro = '#b8a991';
    /** Lienzo de muro curvo: arco de cilindro abierto (el ángulo cero mira a +z, el oeste a 3π/2). */
    const lienzo = (radio: number, alto: number, y: number, desde: number, arco: number, color: string, cerrado = false) => {
      const geo = new T.CylinderGeometry(radio, radio * 1.03, alto, 20, 1, !cerrado, desde, arco);
      pieza(geo, color, cx, y, cz, 1, 1, 1);
      geo.dispose();
    };
    // Escarpa de la base, entera, y el muro en pie del lado del pueblo (unos 200°).
    lienzo(r + 0.3, 0.9, 0.45, 0, Math.PI * 2, '#8b7d6b', true);
    const desde = Math.PI * 1.5 - 1.75,
      arco = 3.5;
    // En pie del todo en el centro; en los bordes rotos, el muro baja a trozos.
    for (const [a0, largo, alto] of [
      [desde, 0.3, 2.4],
      [desde + 0.3, arco - 0.65, 4.6],
      [desde + arco - 0.35, 0.35, 3.3],
    ]) {
      lienzo(r, alto, 0.9 + alto / 2, a0, largo, piedra);
      lienzo(r - 0.55, alto, 0.9 + alto / 2, a0, largo, dentro);
    }
    lienzo(r + 0.07, 0.16, 4.35, desde + 0.3, arco - 0.65, claro); // cordón
    // Del lado del barranco solo quedan los arranques del muro.
    lienzo(r, 0.8, 1.2, desde + arco, Math.PI * 2 - arco, piedra);
    lienzo(r - 0.55, 0.8, 1.2, desde + arco, Math.PI * 2 - arco, dentro);
    // Remate del muro en pie, con merlones y troneras, y los bordes rotos que bajan escalonados.
    for (let i = 0; i <= 14; i++) {
      const a = desde + (arco * i) / 14,
        x = cx + Math.sin(a) * (r - 0.27),
        z = cz + Math.cos(a) * (r - 0.27);
      if (i < 2 || i > 12) {
        // Sillares sueltos sobre los bordes rotos.
        pieza(caja, i % 2 ? piedra : dentro, x, i < 2 ? 3.4 : 4.3, z, 0.6, 0.4, 0.5, 0, a + 0.3);
        continue;
      }
      pieza(caja, claro, x, 5.55, z, 0.62, 0.1, 0.8, 0, a);
      if (i % 2) pieza(caja, piedra, x, 5.95, z, 0.6, 0.7, 0.55, 0, a);
    }
    // Ventanucos y la puerta en alto, del lado del pueblo.
    for (const [a, y, alto] of [
      [Math.PI * 1.5, 3, 1.1],
      [Math.PI * 1.15, 3.5, 0.6],
      [Math.PI * 1.85, 3.5, 0.6],
    ]) {
      const x = cx + Math.sin(a) * (r + 0.02),
        z = cz + Math.cos(a) * (r + 0.02);
      pieza(caja, '#3a332d', x, y, z, 0.5, alto, 0.1, 0, a);
      pieza(caja, claro, x, y + alto / 2 + 0.06, z, 0.66, 0.12, 0.14, 0, a);
    }
    // El suelo del piso alto, que asoma por el lado roto.
    {
      const geo = new T.CylinderGeometry(r - 0.5, r - 0.5, 0.2, 20, 1, false, desde, arco);
      pieza(geo, '#5e5246', cx, 2.6, cz, 1, 1, 1);
      geo.dispose();
    }
    // Cascotes caídos hacia el cauce.
    for (let i = 0; i < 30; i++) {
      const s = 0.2 + azar() * 0.35;
      pieza(caja, i % 2 ? piedra : '#8b7d6b', cx + 0.6 + azar() * 2.8, 0.08 + s / 3, cz - 1.8 + azar() * 3.6, s * 1.4, s, s, azar(), azar() * 3, azar());
    }
    // Cartel del Bien de Interés Cultural.
    pieza(poste, '#3b3b3b', cx - 2.4, 0.5, cz + 2.6, 0.06, 1, 0.06);
    pieza(caja, '#7a2b22', cx - 2.4, 1.05, cz + 2.6, 0.7, 0.45, 0.05, -0.2);
  }

  // --- San Andrés: avenida marítima, calles y casas de colores en bancales hacia la montaña ---
  superficie(caja, adoquin, -53.7, -0.03, 15.2, 32.6, 0.08, 3.4, 3.4);
  superficie(caja, asfalto, -90, -0.03, 15.2, 40, 0.08, 3.4, 5); // carretera hacia Santa Cruz
  pieza(caja, '#efe9dc', -73.7, 0.3, 17.15, 72.6, 0.6, 0.4);
  pieza(caja, '#d8cfbe', -73.7, 0.62, 17.15, 72.6, 0.06, 0.5);
  superficie(caja, asfalto, -52.8, -0.03, 1, 30.4, 0.08, 1.8, 5);
  for (const [x0, x1] of CALLES) {
    superficie(caja, adoquin, (x0 + x1) / 2, -0.03, 7.7, x1 - x0, 0.08, 11.6, 3.4);
    losa(t, { r: [x0, CALLE.hasta, x1, CALLE.desde], y: CALLE.alto, y2: 0 }, '#a99d8b', 0.02);
  }
  for (const x of [-66, -58, -50, -42]) farol(x, 16.6);
  // Bancales: cada fila de casas un escalón más arriba, con su muro de contención.
  const manzanas: [number, number][] = [
    [-70, -60.8],
    [-58.6, -51.6],
    [-49.4, -37.8],
  ];
  for (const [z0, z1, alto] of [
    [-9, -4.6, cuesta(-4.9)],
    [-13.9, -9, cuesta(-9.5)],
  ])
    for (const [x0, x1] of manzanas)
      pieza(caja, '#a39886', (x0 + x1) / 2, alto / 2 - 0.05, (z0 + z1) / 2, x1 - x0, alto + 0.1, z1 - z0);
  const fachadas = ['#e8b04a', '#d9694a', '#f3e6c8', '#7fae8e', '#79a8c8', '#c95f6e', '#f0d27a', '#ece9e2', '#e58f5b', '#b7cf8a'];
  const carpinterias = ['#2f5d50', '#7a4a2c', '#1f4f7a', '#f2efe6'];
  const tejadoGeo = new T.BufferGeometry();
  tejadoGeo.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      // Prisma triangular de tejado a dos aguas: 1 de largo en x, 1 de ancho en z y 1 de alto.
      [
        [-0.5, 0, -0.5], [-0.5, 1, 0], [-0.5, 0, 0.5],
        [0.5, 0, -0.5], [0.5, 0, 0.5], [0.5, 1, 0],
        [-0.5, 0, 0.5], [-0.5, 1, 0], [0.5, 1, 0], [-0.5, 0, 0.5], [0.5, 1, 0], [0.5, 0, 0.5],
        [-0.5, 0, -0.5], [0.5, 1, 0], [-0.5, 1, 0], [-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 1, 0],
      ].flat(),
      3,
    ),
  );
  tejadoGeo.computeVertexNormals();
  let numero = 0;
  /** Casa de pueblo pintada de un color, con zócalo, ventanas por planta y azotea o tejado. */
  function vivienda(x: number, z: number, w: number, h: number, d: number, base: number) {
    const n = numero++,
      color = fachadas[(n * 7 + 3) % fachadas.length],
      carpinteria = carpinterias[(n * 5 + 1) % carpinterias.length],
      teja = n % 5 === 1 || n % 5 === 3;
    const frente = z + d / 2;
    // El muro baja un poco bajo el suelo, para que no quede rendija con el terreno.
    pieza(caja, color, x, base + (h - 0.3) / 2, z, w, h + 0.3, d);
    pieza(caja, '#8e8172', x, base + 0.22, z, w + 0.04, 0.44, d + 0.04);
    pieza(caja, '#f4f1e8', x, base + h + 0.1, z, w + 0.1, 0.2, d + 0.1);
    if (teja) pieza(tejadoGeo, n % 2 ? '#b4573a' : '#a34a33', x, base + h + 0.18, z, w + 0.3, 0.95, d + 0.3);
    else {
      // Azotea con pretil, a veces un cuarto de pilas o un depósito.
      for (const s of [-1, 1]) pieza(caja, color, x, base + h + 0.4, z + (s * d) / 2, w, 0.4, 0.12);
      if (n % 3 === 0) pieza(caja, '#f1eee6', x - w * 0.22, base + h + 0.6, z - d * 0.15, 1.1, 1, 1.1);
      else pieza(poste, '#e9e6de', x + w * 0.25, base + h + 0.55, z - d * 0.2, 0.55, 0.7, 0.55);
    }
    const plantas = Math.max(1, Math.floor((h - 0.4) / 1.6));
    const huecos = Math.max(2, Math.round(w / 1.3));
    for (let p = 0; p < plantas; p++)
      for (let k = 0; k < huecos; k++) {
        const wx = x - w / 2 + ((k + 0.5) * w) / huecos,
          wy = base + 0.95 + p * 1.6;
        if (p === 0 && k === Math.floor(huecos / 2)) {
          // Puerta de madera en la planta baja.
          pieza(caja, carpinteria === '#f2efe6' ? madera : carpinteria, wx, base + 0.62, frente + 0.04, 0.62, 1.24, 0.08);
          continue;
        }
        pieza(caja, carpinteria, wx, wy, frente + 0.03, 0.56, 0.78, 0.06);
        ventanas.push([wx, wy, frente + 0.07, 0.36, 0.56, 0.04]);
        pieza(caja, '#f4f1e8', wx, wy - 0.43, frente + 0.08, 0.66, 0.08, 0.16);
        // Balcón de hierro en algunas plantas altas.
        if (p > 0 && (n + k) % 3 === 0) {
          pieza(caja, '#f4f1e8', wx, wy - 0.46, frente + 0.3, 0.9, 0.08, 0.55);
          pieza(caja, '#2b2b2b', wx, wy - 0.12, frente + 0.56, 0.9, 0.05, 0.04);
        }
      }
    // Una ventana por planta en cada costado.
    for (const s of [-1, 1])
      for (let p = 0; p < plantas; p++) pieza(caja, carpinteria, x + (s * w) / 2, base + 0.95 + p * 1.6, z, 0.06, 0.7, 0.5);
  }
  // Primera fila, a la avenida (entre ellas, las dos casas en las que se entra).
  vivienda(-67.6, 11.1, 4.4, 4.8, 4, 0);
  vivienda(-56.95, 11.1, 3.3, 5, 4, 0);
  vivienda(-46.6, 11.1, 5.4, 5.2, 4, 0);
  // Las filas de atrás, cada una más alta, para que asomen sobre la anterior.
  for (const [z, base, extra] of [
    [4.6, 0, 1],
    [-2.3, 0, 0.3],
    [-6.9, cuesta(-4.9), 0.6],
    [-11.5, cuesta(-9.5), 0.2],
  ])
    for (const [cx, w] of [
      [-67.6, 4.3],
      [-63.1, 4.3],
      [-56.9, 3.3],
      [-53.4, 3.4],
      [-47.4, 3.8],
      [-43.6, 3.6],
      [-39.8, 3.8],
    ])
      vivienda(cx, z, w, 3.4 + extra + ((cx * 3 + z) % 3 === 0 ? 1.6 : (Math.abs(cx * 7 + z) % 4) * 0.45), 4, base);
  tejadoGeo.dispose();
  // Árboles de la plaza del castillo y de la avenida.
  for (const [x, z] of [
    [-43, 8],
    [-38, 7.5],
    [-62, 16.4],
    [-46, 16.4],
  ]) {
    pieza(poste, '#6b5240', x, 0.8, z, 0.22, 1.6, 0.22);
    for (let k = 0; k < 5; k++)
      pieza(esfera, k % 2 ? '#3f6b3a' : '#4f7d43', x + (azar() - 0.5) * 1.1, 2 + azar() * 0.6, z + (azar() - 0.5) * 1.1, 0.9, 0.7, 0.9);
  }

  // --- Montañas de Anaga: riscos pardos y verdes que suben a pico detrás de todo ---
  // Pie de las laderas, de suroeste a nordeste: tras la carretera de Santa Cruz, a espaldas del
  // pueblo, el valle del barranco, detrás del aparcamiento y la punta de los Órganos.
  const pie: Punto[] = [
    [-120, 15.5],
    [-73, 13],
    [-70.5, 2.5],
    [-68.5, -13.5],
    [-58, -18.5],
    [-46, -19.5],
    [-39.8, -20.5],
    [-37.8, -46],
    [-32.6, -46],
    [-32, -19.5],
    [-29.5, -8.5],
    ...Array.from({ length: 13 }, (_, i): Punto => enPlaya(12 + i * 4, -12.5)),
    [30.5, -2.5],
    [32.8, 4.5],
    [33.8, 12.5],
    [36.5, 18.5],
    [40.5, 15.5],
    [50, 9.5],
    [70, -0.5],
    [120, -20],
  ];
  // Tierra adentro: el polígono que cierra el pie por detrás. El signo sale de estar dentro o fuera
  // de él y no del tramo más cercano, que en las esquinas salientes (la punta) se equivoca.
  const tierra: Punto[] = [...pie, [120, -200], [-120, -200]];
  const adentro = (x: number, z: number) => {
    let c = false;
    for (let i = 0, j = tierra.length - 1; i < tierra.length; j = i++) {
      const [ax, az] = tierra[i],
        [bx, bz] = tierra[j];
      if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) c = !c;
    }
    return c;
  };
  /** Distancia con signo al pie (positiva tierra adentro). */
  const alPie = (x: number, z: number) => {
    let mejor = Infinity;
    for (let i = 1; i < pie.length; i++) {
      const [ax, az] = pie[i - 1],
        [bx, bz] = pie[i];
      const dx = bx - ax,
        dz = bz - az,
        k = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      mejor = Math.min(mejor, Math.hypot(x - ax - dx * k, z - az - dz * k));
    }
    return adentro(x, z) ? mejor : -mejor;
  };
  // Orilla: lo que queda delante se hunde bajo el agua.
  const orilla: Punto[] = [
    [-120, 17.4],
    [-37.4, 17.4],
    [-33.2, 16.3],
    [-28.6, 16.1],
    ...BORDE.filter((_, i) => i % 4 === 0).map((m): Punto => [m.x, m.z]),
    [31, 7],
    [33.8, 12.5],
    [36.5, 18.5],
    [40.5, 15.5],
    [50, 9.5],
    [70, -0.5],
    [120, -20],
  ];
  const costa = (x: number) => {
    const i = orilla.findIndex(([ox]) => ox >= x);
    if (i <= 0) return orilla[Math.max(0, i)][1];
    const [ax, az] = orilla[i - 1],
      [bx, bz] = orilla[i];
    return az + ((x - ax) / (bx - ax)) * (bz - az);
  };
  const altura = (x: number, z: number) => {
    const zc = costa(x);
    let suelo = z <= zc ? -0.06 : -0.06 - 0.9 * (z - zc);
    if (x > oeste - 0.4 && x < este + 0.4 && z < mar) suelo = -0.62; // cauce del barranco
    const e = alPie(x, z);
    if (e <= 0) return suelo;
    const lejos = suave((78 - Math.hypot(x, z)) / 14);
    const cresta = Math.max(8, 17 + 6 * Math.sin(x * 0.07 + 0.5) + 4 * Math.sin(x * 0.19 + 2) + 3 * Math.sin(x * 0.41 + 1));
    const monte =
      (cresta * (1 - Math.exp(-e / 8)) +
        0.3 * Math.max(0, e - 8) +
        1.6 * Math.sin(x * 0.55 + e * 0.22) * Math.min(1, e / 5) +
        0.5 * Math.sin(x * 1.3 + z * 0.9) * Math.min(1, e / 3)) *
      lejos;
    return Math.max(suelo, monte);
  };
  {
    const paso = 1.25,
      [x0, z0, x1, z1] = [-80, -78, 80, 26];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.4) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.4) * paso;
        p.push(new T.Vector3(x, altura(x, z), z));
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
          const [u, v, w] = tri.map((k) => p[k]);
          if (Math.max(u.y, v.y, w.y) < -1 || Math.hypot(u.x, u.z) > 79) continue;
          const y = (u.y + v.y + w.y) / 3,
            cx = (u.x + v.x + w.x) / 3,
            cz = (u.z + v.z + w.z) / 3;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          const pendiente = Math.abs(normal.y),
            mancha = Math.sin(cx * 0.21 + cz * 0.12) + Math.sin(cx * 0.09 - cz * 0.19) + 0.25 * Math.sin(cx * 0.7 + cz * 0.5);
          // Tierra parda con manchas de matorral verde, más verde en lo alto y en las vaguadas;
          // en las paredes, el basalto asoma con alguna veta de almagre.
          const color =
            y < 0.25
              ? y < -0.3
                ? '#6f6556'
                : '#8a7a62'
              : pendiente < 0.45
                ? Math.sin(y * 0.7 + cx * 0.06) > 0.85
                  ? '#87594a'
                  : '#6e6053'
                : mancha + y * 0.05 > 1.1
                  ? '#5b6a40'
                  : mancha + y * 0.03 > 0.2
                    ? '#717548'
                    : '#80705a';
          if (!capas.has(color)) capas.set(color, []);
          for (const q of [u, v, w]) capas.get(color)!.push(q.x, q.y, q.z);
        }
      }
    for (const [color, vertices] of capas) malla(vertices, color);
  }
  // Tabaibas y matorral salpicando las laderas.
  for (let i = 0; i < 320; i++) {
    const x = -78 + azar() * 156,
      z = -70 + azar() * 80,
      y = altura(x, z);
    if (alPie(x, z) < 1.5 || y < 1 || Math.hypot(x, z) > 76) continue;
    const r = 0.35 + azar() * 0.55;
    pieza(esfera, i % 3 ? '#5e6b3c' : '#7b7d4a', x, y + 0.1, z, r * 1.2, r * 0.6, r);
  }

  // --- Barcas: fondeadas en el rincón suroeste de la playa y varadas en la arena ---
  const amarres: Sitio['amarres'] = [];
  for (const [i, [s, d]] of [
    [2.2, 9.6],
    [3.6, 11.4],
    [5.2, 9.4],
    [6.4, 11.8],
    [8, 10],
    [9.6, 12],
  ].entries()) {
    const [x, z] = enPlaya(s, d);
    amarres.push([i % 3 === 1 ? 2 : 0, x, z, 2.3 + (i % 2) * 0.2]);
  }
  for (const [x, z] of [
    [-52, 20.6],
    [-48.5, 20.3],
  ])
    amarres.push([0, x, z, 1.6]);
  // Un velero navega fuera del rompeolas.
  amarres.push([1, 4, 25, 0.3]);
  const enSeco: Sitio['enSeco'] = VARADAS.map(([s, d]) => {
    const m = marco(s, d);
    return [2, m.x, arena(d) + 0.02, m.z, m.giro + Math.PI / 2];
  });
  return { amarres, enSeco };
}
