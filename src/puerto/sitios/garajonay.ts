import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PUEBLOS } from '../../data/pueblos';
import { alturaPaseo, transitable } from '../paseo';
import type { Sitio, Taller } from '../maqueta';
import { losa, terreno } from './terreno';

type Rect = [number, number, number, number];
const ARRIBA = new T.Vector3(0, 1, 0);

/**
 * Parque Nacional de Garajonay (La Gomera), trazado sobre la ortofoto PNOA y comprimido a escala de
 * maqueta, con el norte hacia −z. Al noroeste, el claro de la Laguna Grande; al sur, el Alto de
 * Garajonay con su mirador redondo y las aras; al este, el Contadero en la carretera dorsal y, bosque
 * abajo hacia el nordeste, la ermita de Lourdes de El Cedro junto a su arroyo. Al norte del claro, el
 * corazón del bosque. Lo que da carácter al lugar es la laurisilva: copas cerradas, troncos con musgo,
 * barbas de liquen y la bruma que entra y sale; más arriba, el fayal-brezal y, en la cumbre, el brezo.
 * Las zonas pisables están en `PUEBLOS.garajonay.plano.suelos`; si se mueve un sendero, hay que mover
 * allí su rectángulo.
 */
export function trazarGarajonay(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { adoquin, basalto, teja } = t.materiales;
  const { suelos, vallas = [] } = PUEBLOS.garajonay.plano;
  const paseo = (x: number, z: number) => alturaPaseo(x, z, 'garajonay');
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const entre = (a: number, b: number) => a + azar() * (b - a);

  // --- El relieve: una cumbre que cae hacia todas partes hasta hundirse en el mar de nubes ---
  /** Distancia a la cima, en el centro del mirador. */
  const cima = (x: number, z: number) => Math.hypot(x - 4, z - 26);
  const altura = terreno(
    t,
    'garajonay',
    [-62, -56, 60, 54],
    (x, z) =>
      7.2 -
      0.17 * cima(x, z) -
      // El barranco de El Cedro, que se ahonda hacia el norte camino de Hermigua.
      3.5 * Math.exp(-((x - 39) ** 2) / 30) * Math.min(1, Math.max(0, (2 - z) / 12)) -
      Math.max(0, x - 42) * 0.8 -
      Math.max(0, -z - 40) * 0.5 -
      Math.max(0, -x - 42) * 0.45 -
      Math.max(0, z - 38) * 0.6 +
      Math.sin(x * 0.21 + z * 0.13) * 0.8 +
      Math.sin(x * 0.07 - z * 0.17) * 1.2,
    tenido(basalto, '#86b65a'),
    1.4,
  );

  /** Distancia al suelo pisable más cercano: los árboles se apartan de los senderos. */
  const cerca = (x: number, z: number) =>
    Math.min(
      ...suelos!.map(({ r }) => Math.hypot(x - Math.min(Math.max(x, r[0]), r[2]), z - Math.min(Math.max(z, r[1]), r[3]))),
    );
  const ocupado: Rect[] = [...vallas];
  /** El claro de la Laguna Grande, algo más ancho que su suelo pisable. */
  const enClaro = (x: number, z: number) => ((x + 23) / 14.2) ** 2 + ((z + 1) / 9.8) ** 2 < 1;
  const libre = (x: number, z: number, holgura: number) =>
    !ocupado.some(([a, b, c, d]) => x > a - holgura && x < c + holgura && z > b - holgura && z < d + holgura);

  // --- Vegetación: va en una malla aparte que se abre en torno al viajero si tapa la vista ---
  const ramas: T.BufferGeometry[] = [];
  const tronco = new T.CylinderGeometry(0.42, 0.5, 1, 6);
  function colocar(forma: T.BufferGeometry, color: string, matriz: T.Matrix4) {
    const geo = forma.index ? forma.toNonIndexed() : forma.clone();
    geo.deleteAttribute('uv');
    geo.applyMatrix4(matriz);
    const rgb = new T.Color(color);
    const colores = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colores.length; i += 3) rgb.toArray(colores, i);
    geo.setAttribute('color', new T.BufferAttribute(colores, 3));
    ramas.push(geo);
  }
  const brote = (forma: T.BufferGeometry, color: string, x: number, y: number, z: number, w: number, h: number, d: number, rx = 0, ry = 0, rz = 0) =>
    colocar(
      forma,
      color,
      new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(w, h, d)),
    );
  /** Un palo de a a b: tronco, rama o vara. */
  function palo(a: T.Vector3, b: T.Vector3, grosor: number, color: string) {
    const dir = b.clone().sub(a);
    colocar(
      tronco,
      color,
      new T.Matrix4().compose(
        a.clone().add(b).multiplyScalar(0.5),
        new T.Quaternion().setFromUnitVectors(ARRIBA, dir.clone().normalize()),
        new T.Vector3(grosor, dir.length(), grosor),
      ),
    );
  }
  const liquen = ['#a3b08c', '#94a37e', '#b3bb9d'];
  /** Barbas de capuchino: hebras de liquen que cuelgan de las ramas. */
  function barbas(x: number, y: number, z: number, n: number, ancho: number) {
    for (let k = 0; k < n; k++) {
      const largo = entre(0.35, 0.9);
      brote(piramide, liquen[k % 3], x + entre(-ancho, ancho), y - largo / 2, z + entre(-ancho, ancho), 0.05, largo, 0.05, Math.PI, azar() * 3);
    }
  }
  const COPAS = {
    laurel: ['#2c4825', '#36552b', '#253f20', '#3e6033'],
    til: ['#223b1e', '#2b4624', '#263f21', '#31502a'],
    vinatigo: ['#31502a', '#2b4624', '#4b4a2a', '#385a31'],
    faya: ['#3f5c2e', '#4a6834', '#3a542b', '#52703a'],
  };
  /** Árbol de laurisilva: tronco con musgo, ramas abiertas y copa cerrada de manojos. */
  function laurisilva(x: number, z: number, alto: number, especie: keyof typeof COPAS, detalle: boolean) {
    const y0 = altura(x, z) - 0.15;
    const grosor = alto * 0.07 + 0.2;
    const inclina = new T.Vector3(entre(-0.5, 0.5), 0, entre(-0.5, 0.5));
    const base = new T.Vector3(x, y0, z),
      medio = new T.Vector3(x, y0 + alto * 0.5, z).add(inclina),
      horca = new T.Vector3(x, y0 + alto * 0.68, z).addScaledVector(inclina, 1.4);
    palo(base, medio, grosor, '#4d5a32'); // el pie, forrado de musgo
    palo(medio, horca, grosor * 0.85, '#544c40');
    // Almohadillas de musgo pegadas al tronco.
    for (let k = 0; detalle && k < 2; k++) {
      const a = azar() * Math.PI * 2,
        h = entre(0.4, alto * 0.45);
      brote(esfera, k ? '#5b7f30' : '#4b6e2a', x + Math.cos(a) * grosor * 0.3 + inclina.x * (h / alto) * 2, y0 + h, z + Math.sin(a) * grosor * 0.3 + inclina.z * (h / alto) * 2, grosor * 0.45, grosor * 0.6, grosor * 0.45);
    }
    const copa = COPAS[especie];
    const brazos = detalle ? 4 : 2;
    for (let i = 0; i < brazos; i++) {
      const a = (i / brazos) * Math.PI * 2 + azar();
      const radio = alto * entre(0.22, 0.32);
      const punta = new T.Vector3(horca.x + Math.cos(a) * radio, y0 + alto * entre(0.82, 0.94), horca.z + Math.sin(a) * radio);
      if (detalle) palo(horca, punta, grosor * 0.45, i % 2 ? '#544c40' : '#56663a');
      // Cada rama acaba en dos o tres manojos apretados: la copa de la laurisilva parece una coliflor.
      for (let j = 0; j < (detalle ? 3 : 2); j++) {
        const r = alto * entre(0.13, 0.18);
        brote(esfera, copa[(i + j) % 4], punta.x + entre(-0.8, 0.8), punta.y + r * entre(0, 0.8), punta.z + entre(-0.8, 0.8), r * 1.2, r * 0.8, r * 1.15, 0, azar() * 3);
      }
      if (detalle) barbas(punta.x, punta.y - 0.3, punta.z, 3, 0.9);
    }
    // Remate de la copa, más alto y oscuro, y algún manojo bajo.
    const r = alto * 0.17;
    brote(esfera, copa[3], horca.x, y0 + alto * 1.0, horca.z, r * 1.3, r * 0.8, r * 1.3, 0, azar() * 3);
    if (detalle) {
      brote(esfera, copa[(azar() * 4) | 0], horca.x + entre(-1, 1), y0 + alto * 0.76, horca.z + entre(-1, 1), r * 0.9, r * 0.6, r * 0.9);
      barbas(horca.x, y0 + alto * 0.7, horca.z, 2, 0.5);
    }
  }
  /** Faya del fayal-brezal: tronco retorcido y forrado de musgo, del que salen varios pies. */
  function faya(x: number, z: number, alto: number, detalle: boolean) {
    const y0 = altura(x, z) - 0.15;
    const pies = detalle ? 2 + ((azar() * 2) | 0) : 1;
    for (let p = 0; p < pies; p++) {
      let punto = new T.Vector3(x + entre(-0.3, 0.3), y0, z + entre(-0.3, 0.3));
      const a = azar() * Math.PI * 2;
      for (let k = 1; k <= 3; k++) {
        const siguiente = new T.Vector3(
          punto.x + Math.cos(a + k * 1.3) * 0.45 + Math.cos(a) * 0.3,
          y0 + (alto * 0.78 * k) / 3,
          punto.z + Math.sin(a + k * 1.3) * 0.45 + Math.sin(a) * 0.3,
        );
        palo(punto, siguiente, 0.3 - k * 0.05, k < 3 ? '#5e7836' : '#545c40');
        punto = siguiente;
      }
      // Copa ancha y baja, de varios manojos, que baja por el tronco.
      const r = alto * entre(0.17, 0.21);
      for (let j = 0; j < (detalle ? 4 : 2); j++)
        brote(esfera, COPAS.faya[(p + j) % 4], punto.x + entre(-1, 1), punto.y - j * r * 0.35 + entre(0, 0.4), punto.z + entre(-1, 1), r * 1.3, r * 0.8, r * 1.25, 0, azar() * 3);
      if (detalle) barbas(punto.x, punto.y - r * 0.3, punto.z, 4, r * 0.7);
    }
  }
  /** Brezo arbóreo: tallo fino y copa en penachos estrechos, de hoja menuda y gris de liquen. */
  function brezo(x: number, z: number, alto: number, detalle: boolean) {
    const y0 = altura(x, z) - 0.15;
    const ladeo = new T.Vector3(entre(-0.4, 0.4), 0, entre(-0.4, 0.4));
    palo(new T.Vector3(x, y0, z), new T.Vector3(x, y0 + alto * 0.55, z).add(ladeo), 0.18, '#5b5040');
    const capas = detalle ? 4 : 2;
    for (let k = 0; k < capas; k++) {
      const s = 1 - k / (capas + 1);
      brote(
        esfera,
        k === capas - 1 ? '#6f7f5c' : k % 2 ? '#3c5634' : '#4a6440',
        x + ladeo.x * (1 + k * 0.3),
        y0 + alto * (0.45 + (0.5 * k) / capas),
        z + ladeo.z * (1 + k * 0.3),
        alto * 0.2 * s + 0.3,
        alto * 0.2,
        alto * 0.2 * s + 0.3,
        0,
        azar() * 3,
      );
    }
  }

  // Árboles singulares del corazón del bosque: un til viejo de tronco enorme y viñátigos a su alrededor.
  function tilViejo(x: number, z: number) {
    const y0 = altura(x, z) - 0.2;
    // Raíces en contrafuerte, todas con musgo.
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      palo(new T.Vector3(x + Math.cos(a) * 1.7, y0, z + Math.sin(a) * 1.7), new T.Vector3(x, y0 + 1.6, z), 0.42, '#5f7b35');
    }
    palo(new T.Vector3(x, y0, z), new T.Vector3(x + 0.3, y0 + 6, z - 0.2), 1.25, '#5a6a3a');
    palo(new T.Vector3(x + 0.3, y0 + 6, z - 0.2), new T.Vector3(x + 0.1, y0 + 9, z + 0.3), 0.9, '#57513f');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const punta = new T.Vector3(x + Math.cos(a) * 4.2, y0 + entre(10, 12), z + Math.sin(a) * 4.2);
      palo(new T.Vector3(x + 0.1, y0 + 8.5, z + 0.3), punta, 0.42, '#5c5546');
      for (let j = 0; j < 3; j++)
        brote(esfera, COPAS.til[(i + j) % 4], punta.x + entre(-1.4, 1.4), punta.y + entre(0, 1.2), punta.z + entre(-1.4, 1.4), 2, 1.3, 1.9, 0, azar() * 3);
      barbas(punta.x, punta.y - 0.4, punta.z, 5, 1.6);
    }
    brote(esfera, COPAS.til[1], x, y0 + 12.8, z, 2.8, 1.6, 2.8);
    ocupado.push([x - 1.6, z - 1.6, x + 1.6, z + 1.6]);
  }
  tilViejo(-11, -29);
  for (const [x, z, alto] of [
    [-24.6, -34.6, 10.5],
    [-9.4, -34.8, 11],
    [-28.6, -27.4, 9.5],
    [-28.8, -21.5, 9],
    [-5.6, -22.4, 9.5],
    [-15.2, -35.2, 10],
  ]) {
    laurisilva(x, z, alto, x < -20 ? 'vinatigo' : 'til', true);
    ocupado.push([x - 1.5, z - 1.5, x + 1.5, z + 1.5]);
  }

  // --- El bosque: laurisilva abajo y al norte, fayal-brezal arriba y brezo bajo en la cumbre ---
  // Claros que no son sendero: el mirador, la ermita, el restaurante y la caseta de información.
  ocupado.push([-2, 20, 10, 32], [24, -38, 38, -30], [-36, 7, -26, 14], [-39, 1.8, -35.8, 5]);
  const arbustos: [number, number, number][] = [];
  for (let gx = -60; gx < 58; gx += 3.4)
    for (let gz = -54; gz < 52; gz += 3.4) {
      const x = gx + entre(0, 3.4),
        z = gz + entre(0, 3.4);
      const y = altura(x, z),
        d = cerca(x, z);
      if (y < -7.5 || d < 1.3 || enClaro(x, z) || !libre(x, z, 1)) continue;
      // Lejos de los senderos basta la masa del bosque, sin detalle.
      const detalle = d < 13;
      if (!detalle && azar() < 0.35) continue;
      const enCumbre = cima(x, z) < 12;
      if (enCumbre) {
        // Brezal de cumbre: matas apretadas y algún brezo que se levanta.
        for (let k = 0; k < 3; k++) arbustos.push([x + entre(-1.2, 1.2), z + entre(-1.2, 1.2), entre(0.7, 1.4)]);
        if (azar() < 0.3) brezo(x, z, entre(2.2, 3.4), detalle);
        continue;
      }
      // El fayal-brezal ocupa lo alto y lo seco: el sur y las lomas.
      const seco = z > 6 || y > 2.2 || x < -38;
      if (seco) {
        if (azar() < 0.5) faya(x, z, entre(3.6, 5.6), detalle);
        else brezo(x, z, entre(3.4, 6), detalle);
        if (detalle && azar() < 0.6) arbustos.push([x + entre(-1.5, 1.5), z + entre(-1.5, 1.5), entre(0.6, 1)]);
      } else {
        const tipo = azar();
        laurisilva(x, z, entre(6.5, 9.5), tipo < 0.45 ? 'laurel' : tipo < 0.8 ? 'til' : 'vinatigo', detalle);
      }
    }
  // Orla del claro de la Laguna Grande: fayas y laureles altos que lo cierran.
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2;
    const x = -23 + Math.cos(a) * entre(15, 16.5),
      z = -1 + Math.sin(a) * entre(10.2, 11.3);
    if (cerca(x, z) < 1.3 || !libre(x, z, 0.8)) continue;
    if (k % 3) laurisilva(x, z, entre(7, 9), k % 2 ? 'laurel' : 'til', true);
    else faya(x, z, entre(4.5, 5.5), true);
  }

  // --- Monte bajo: brezo de cumbre, helechos, musgo, piedras y troncos caídos ---
  for (const [x, z, s] of arbustos) {
    if (cerca(x, z) < 0.7) continue;
    const y = altura(x, z);
    pieza(esfera, '#4b6237', x, y + 0.35 * s, z, 0.9 * s, 0.55 * s, 0.85 * s, 0, azar() * 3);
    pieza(esfera, azar() < 0.5 ? '#5f6f45' : '#6b7b4d', x + 0.3 * s, y + 0.55 * s, z - 0.2 * s, 0.6 * s, 0.4 * s, 0.6 * s);
  }
  /** Helecho: frondas que se abren desde el centro y caen. */
  function helecho(x: number, z: number, s: number) {
    const y = altura(x, z);
    const verde = azar() < 0.5 ? '#5f8f35' : '#6f9e3c';
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + azar();
      pieza(esfera, k % 2 ? verde : '#527f2f', x + Math.cos(a) * 0.42 * s, y + 0.32 * s, z + Math.sin(a) * 0.42 * s, 0.12 * s, 0.05 * s, 0.6 * s, 0.55, -a + Math.PI / 2, 0);
    }
  }
  for (let i = 0; i < 900; i++) {
    const x = entre(-48, 46),
      z = entre(-44, 30);
    const d = cerca(x, z),
      y = altura(x, z);
    if (d < 0.5 || d > 9 || y < -7 || enClaro(x, z) || !libre(x, z, 0.3) || cima(x, z) < 12) continue;
    const umbrio = z < 6 && y < 2.2;
    const r = azar();
    if (umbrio && r < 0.55) helecho(x, z, entre(0.8, 1.5));
    else if (r < 0.75) pieza(esfera, umbrio ? '#5d7c36' : '#6e7f4a', x, y + 0.08, z, entre(0.4, 0.9), 0.18, entre(0.4, 0.9), 0, azar() * 3);
    else if (r < 0.92) pieza(esfera, umbrio ? '#61733f' : '#7d7466', x, y + 0.15, z, entre(0.3, 0.6), entre(0.25, 0.45), entre(0.3, 0.6), azar(), azar() * 3);
    else {
      // Tronco caído, verde de musgo.
      const largo = entre(2, 3.6),
        giro = azar() * Math.PI;
      pieza(poste, '#5e7a36', x, y + 0.18, z, 0.32, largo, 0.32, Math.PI / 2, giro, 0);
    }
  }

  // --- Firme de los senderos, con troncos atravesados en las cuestas y barandillas de madera ---
  const tierra = '#7d5638',
    sendaBosque = '#5f4b35',
    tabla = '#6e5a43';
  suelos!.forEach((s, i) => {
    if (i === 0 || i === 11) return; // el claro y el mirador tienen su propio suelo
    const color = i === 7 ? '#4f4e4c' : i === 6 ? '#7c7770' : i === 4 ? '#9c958a' : i < 6 ? sendaBosque : tierra;
    losa(t, s, color, 0.02);
  });
  /** Traviesas de tronco a lo ancho de una cuesta, cada `paso`. */
  function traviesas([x0, z0, x1, z1]: Rect, eje: 'x' | 'z', paso: number) {
    if (eje === 'z')
      for (let z = z0 + paso / 2; z < z1; z += paso) pieza(poste, '#4e3d2c', (x0 + x1) / 2, paseo((x0 + x1) / 2, z) + 0.02, z, 0.16, x1 - x0, 0.16, 0, 0, Math.PI / 2);
    else for (let x = x0 + paso / 2; x < x1; x += paso) pieza(poste, '#4e3d2c', x, paseo(x, (z0 + z1) / 2) + 0.02, (z0 + z1) / 2, 0.16, z1 - z0, 0.16, Math.PI / 2, 0, 0);
  }
  traviesas(suelos![1].r, 'z', 1.6);
  traviesas(suelos![3].r, 'x', 1.8);
  traviesas(suelos![5].r, 'z', 1.1);
  traviesas(suelos![8].r, 'z', 1.5);
  /** Barandilla de troncos a lo largo de una línea, siguiendo la altura del sendero de al lado. */
  function barandilla(x0: number, z0: number, x1: number, z1: number, suelo: (x: number, z: number) => number) {
    const largo = Math.hypot(x1 - x0, z1 - z0),
      n = Math.ceil(largo / 2.2);
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n,
        z = z0 + ((z1 - z0) * k) / n,
        y = suelo(x, z);
      pieza(poste, tabla, x, y + 0.5, z, 0.12, 1, 0.12);
      if (k === n) continue;
      const xs = x0 + ((x1 - x0) * (k + 1)) / n,
        zs = z0 + ((z1 - z0) * (k + 1)) / n,
        ys = suelo(xs, zs);
      for (const h of [0.5, 0.92]) {
        const a = new T.Vector3(x, y + h, z),
          b = new T.Vector3(xs, ys + h, zs);
        const dir = b.clone().sub(a);
        const q = new T.Quaternion().setFromUnitVectors(ARRIBA, dir.clone().normalize());
        const e = new T.Euler().setFromQuaternion(q);
        pieza(poste, tabla, (x + xs) / 2, (y + ys) / 2 + h, (z + zs) / 2, 0.08, dir.length(), 0.08, e.x, e.y, e.z);
      }
    }
  }
  barandilla(-8, -30.15, 26, -30.15, (x) => paseo(x, -28));
  barandilla(-8, -26.35, 26, -26.35, (x) => paseo(x, -28));
  barandilla(-22.15, -23.6, -22.15, -8.4, (_x, z) => paseo(-20, z));
  barandilla(-18.35, -23.6, -18.35, -8.4, (_x, z) => paseo(-20, z));
  barandilla(33.65, -23.6, 33.65, -2.4, (_x, z) => paseo(31.7, z));

  // --- Laguna Grande: el claro de tierra roja, el corro de piedras, mesas, fogones y el restaurante ---
  const disco = new T.CylinderGeometry(1, 1, 1, 28);
  pieza(disco, '#8b6a4a', -23, -0.06, -1, 13.2, 0.12, 8.6);
  for (const [x, z, rx, rz] of [
    [-17, -5, 3.2, 2],
    [-27.5, 3.5, 2.6, 1.6],
    [-31, -6, 2.4, 1.4],
    [-20, 3, 2, 1.8],
    [-24.5, -6.8, 2.2, 1],
  ])
    pieza(disco, '#71844a', x, 0.005, z, rx, 0.02, rz);
  // Corro de piedras, con un menhir algo más alto.
  for (let k = 0; k < 13; k++) {
    const a = (k / 13) * Math.PI * 2;
    pieza(esfera, k % 3 ? '#a58a6a' : '#b39878', -30 + Math.cos(a) * 2.4, 0.18, -3.6 + Math.sin(a) * 2.4, 0.32, entre(0.25, 0.4), 0.28, 0, a);
  }
  pieza(caja, '#9c8263', -30.4, 0.55, -3.9, 0.45, 1.1, 0.35, 0.05, 0.4, 0.06);
  // Gara y Jonay: dos figuras talladas en tronco, de pie y mirando al claro.
  for (const [x, mujer] of [
    [-28.2, true],
    [-26.8, false],
  ] as [number, boolean][]) {
    const z = 1.8,
      veta = mujer ? '#7a5638' : '#6b4a33';
    for (const s of [-0.13, 0.13]) pieza(poste, veta, x + s, 0.5, z, 0.2, 1, 0.2);
    pieza(poste, mujer ? '#8a6a4a' : veta, x, 1.32, z, 0.5, 0.75, 0.32);
    pieza(caja, '#a8794c', x - 0.05, 1.3, z + 0.13, 0.08, 0.7, 0.04); // la veta clara de la madera
    for (const s of [-0.29, 0.29]) pieza(poste, veta, x + s, 1.3, z, 0.11, 0.85, 0.11, 0, 0, s * 0.15);
    pieza(esfera, veta, x, 1.95, z, 0.2, 0.27, 0.2);
    if (mujer) pieza(caja, '#5e4029', x, 1.85, z - 0.08, 0.36, 0.42, 0.12);
  }
  // Mesas y bancos de madera, y fogones de piedra, en la orla del claro.
  for (const [x, z, giro] of [
    [-20, 7.4, 0],
    [-16.8, 7.4, 0],
    [-30, -9.4, 0],
    [-26.5, -9.4, 0],
    [-15, -9.3, 0],
    [-35.4, -4.5, Math.PI / 2],
    [-35.4, 1.5, Math.PI / 2],
  ]) {
    const y = altura(x, z);
    pieza(caja, '#7b5d40', x, y + 0.72, z, 1.8, 0.08, 0.8, 0, giro);
    for (const s of [-1, 1]) {
      const [dx, dz] = giro ? [s * 0.75, 0] : [0, s * 0.75];
      pieza(caja, '#6d5139', x + dx, y + 0.42, z + dz, giro ? 0.3 : 1.8, 0.07, giro ? 1.8 : 0.3);
      const [px, pz] = giro ? [0, s * 0.65] : [s * 0.65, 0];
      pieza(caja, '#5c4431', x + px, y + 0.36, z + pz, 0.1, 0.72, 0.1);
    }
  }
  for (const [x, z] of [
    [-33.4, 7.6],
    [-12.8, -9.6],
  ]) {
    const y = altura(x, z);
    pieza(caja, '#8a7d6e', x, y + 0.45, z, 1.3, 0.9, 1);
    pieza(caja, '#3a3430', x, y + 0.92, z, 0.9, 0.06, 0.6);
    pieza(caja, '#8a7d6e', x, y + 1.3, z - 0.32, 0.4, 0.8, 0.36);
  }
  // Dos coches en el aparcamiento, junto a la carretera.
  for (const [z, color] of [
    [3.9, '#d9d6cf'],
    [-5.9, '#9b2f2a'],
  ] as [number, string][]) {
    pieza(caja, color, -13.5, 0.42, z, 1.3, 0.5, 2.6);
    pieza(caja, color, -13.5, 0.82, z + 0.15, 1.2, 0.4, 1.4);
    pieza(caja, '#33424d', -13.5, 0.84, z + 0.15, 1.24, 0.28, 1.2);
    for (const [dx, dz] of [
      [-0.62, -0.85],
      [0.62, -0.85],
      [-0.62, 0.85],
      [0.62, 0.85],
    ])
      pieza(poste, '#2a2a2a', -13.5 + dx, 0.22, z + dz, 0.44, 0.16, 0.44, 0, 0, Math.PI / 2);
  }
  // El restaurante: piedra, teja y carpintería verde, al suroeste del claro.
  const piedra = tenido(adoquin, '#9a8b7a');
  const yr = Math.min(altura(-34.5, 12.6), altura(-27.5, 12.6), 0) - 0.3;
  superficie(caja, piedra, -31, (yr + 2.6) / 2, 10.6, 7, 2.6 - yr, 4, 1.6);
  for (const lado of [-1, 1]) superficie(caja, teja, -31, 3.05, 10.6 + lado * 1.05, 7.6, 0.13, 2.45, 1.85, lado * 0.42);
  pieza(caja, '#efe6d6', -31, 2.66, 10.6, 7.1, 0.12, 4.1);
  pieza(caja, '#8a7d6e', -28.6, 3.7, 11.3, 0.5, 1.1, 0.5); // chimenea
  for (const x of [-33.6, -32, -30, -28.4]) {
    pieza(caja, '#2f6b45', x, 1.35, 8.56, 0.8, 1.05, 0.08);
    ventanas.push([x, 1.35, 8.52, 0.6, 0.85, 0.04]);
  }
  pieza(caja, '#5b3a24', -31, 0.95, 8.56, 0.9, 1.9, 0.08);
  // Terraza con barandilla de madera mirando al claro.
  pieza(caja, '#7b6a58', -31, 0.06, 7.6, 7, 0.12, 1.8);
  // El punto de información, una caseta de madera al oeste del claro.
  const yk = altura(-37.4, 3.4) - 0.2;
  pieza(caja, '#7b5a3c', -37.4, yk + 1.1, 3.4, 2.2, 2.2, 2.6);
  for (const lado of [-1, 1]) pieza(caja, '#4e3a28', -37.4 + lado * 0.6, yk + 2.5, 3.4, 1.5, 0.12, 3, 0, 0, -lado * 0.55);
  pieza(caja, '#e8dcc0', -36.27, yk + 1.3, 3.4, 0.04, 0.8, 1.3);

  // --- La maestra silbadora, a la entrada del sendero, con los dedos en la boca ---
  {
    const mx = -23.6,
      mz = -7.4,
      g = Math.PI / 4;
    const en = (u: number, y: number, w: number): [number, number, number] => [
      mx + u * Math.cos(g) + w * Math.sin(g),
      y,
      mz - u * Math.sin(g) + w * Math.cos(g),
    ];
    const parte = (forma: T.BufferGeometry, color: string, u: number, y: number, w: number, a: number, b: number, c: number, rx = 0, rz = 0) => {
      const [x, py, z] = en(u, y, w);
      pieza(forma, color, x, py, z, a, b, c, rx, g, rz);
    };
    for (const s of [-0.09, 0.09]) parte(caja, '#2b2420', s, 0.05, 0.04, 0.12, 0.1, 0.22);
    parte(poste, '#a8322b', 0, 0.42, 0, 0.6, 0.66, 0.56); // falda roja
    parte(poste, '#efe6d2', 0, 0.2, 0, 0.62, 0.06, 0.58); // y su lista blanca
    parte(poste, '#2a2626', 0, 0.98, 0, 0.42, 0.48, 0.32); // corpiño
    parte(poste, '#f1ece0', 0, 1.16, 0, 0.3, 0.1, 0.26);
    parte(esfera, '#d39a6e', 0, 1.36, 0.02, 0.15, 0.18, 0.15); // cara
    parte(esfera, '#f1ece0', 0, 1.4, -0.03, 0.18, 0.2, 0.17); // pañuelo
    parte(poste, '#c9a865', 0, 1.56, -0.01, 0.44, 0.04, 0.44); // sombrero
    parte(poste, '#c9a865', 0, 1.62, -0.01, 0.22, 0.12, 0.22);
    parte(poste, '#f1ece0', -0.25, 0.92, 0, 0.1, 0.46, 0.1, 0, 0.12); // brazo caído
    parte(poste, '#f1ece0', 0.22, 1.08, 0.12, 0.1, 0.34, 0.1, -0.9, 0); // brazo que sube a la boca
    parte(poste, '#f1ece0', 0.12, 1.26, 0.2, 0.09, 0.26, 0.09, 0, 0.9);
    parte(caja, '#d39a6e', 0.04, 1.3, 0.16, 0.06, 0.06, 0.06);
  }

  // --- Carretera dorsal: asfalto con sus marcas, que sigue al este más allá del Contadero ---
  const [c0, , c1] = suelos![7].r;
  for (let x = c0 + 0.6; x < c1; x += 2.4) pieza(caja, '#e9e4d8', x, paseo(x, -1.25) + 0.012, -1.25, 1.2, 0.02, 0.1, 0, 0, Math.atan2(2.5, c1 - c0));
  for (const z of [-2.75, 0.25]) pieza(caja, '#d8d3c8', (c0 + c1) / 2, 1.27, z, c1 - c0, 0.02, 0.08, 0, 0, Math.atan2(2.5, c1 - c0));
  for (let x = 36; x < 64; x += 2) {
    const y = altura(x, -0.25);
    pieza(caja, '#4f4e4c', x + 1, y + 0.05, -0.25, 2.05, 0.12, 3.6);
    if (((x - 36) / 2) % 2 === 0) pieza(caja, '#e9e4d8', x + 1, y + 0.12, -0.25, 1.2, 0.02, 0.1);
  }
  // El Contadero: postes de los senderos, un panel y la valla de troncos sobre el barranco.
  for (const [x, z] of [
    [22.4, 3.4],
    [28.2, 3.5],
    [34.2, -1.5],
  ]) {
    pieza(poste, '#6b4f36', x, 3.4, z, 0.14, 1.9, 0.14);
    for (const [dy, giro] of [
      [0.6, 0.5],
      [0.3, -0.9],
    ])
      pieza(caja, '#d9c9a4', x + 0.3 * Math.cos(giro), 3.8 + dy, z - 0.3 * Math.sin(giro), 0.7, 0.16, 0.05, 0, giro);
  }
  pieza(caja, '#5b4430', 35, 3.4, 3.6, 0.1, 1.8, 0.1);
  pieza(caja, '#5b4430', 33.4, 3.4, 3.6, 0.1, 1.8, 0.1);
  pieza(caja, '#3f5a3a', 34.2, 3.8, 3.62, 1.6, 0.9, 0.06);

  // --- Alto de Garajonay: el mirador redondo de mampostería y las aras en el centro ---
  const cx = 4,
    cz = 26,
    ya = 6;
  pieza(disco, '#8e5f3f', cx, ya - 0.06, cz, 5.4, 0.12, 5.4);
  // Muro bajo con su albardilla, abierto al oeste (pista de la Laguna Grande) y al este (Contadero).
  const huecos: [number, number][] = [
    [2.86, 3.53],
    [-0.72, 0],
  ];
  const sillares: T.BufferGeometry[] = [];
  for (let k = 0; k < 40; k++) {
    const a = ((k + 0.5) / 40) * Math.PI * 2 - Math.PI;
    const aa = a < -Math.PI / 2 ? a + Math.PI * 2 : a; // ángulo de 0 a 2π, sin cortes en los huecos
    if (huecos.some(([h0, h1]) => aa > h0 && aa < h1)) continue;
    const x = cx + Math.cos(a) * 5.3,
      z = cz + Math.sin(a) * 5.3;
    sillares.push(new T.BoxGeometry(0.5, 1.3, 0.86).rotateY(-a).translate(x, ya + 0.25, z));
    pieza(caja, '#7a6a58', x, ya + 0.94, z, 0.62, 0.1, 0.9, 0, -a);
  }
  const muro = mergeGeometries(sillares);
  superficie(muro, tenido(adoquin, '#a89480'), 0, 0, 0, 1, 1, 1, 1.1);
  for (const g of [...sillares, muro]) g.dispose();
  // Las aras: un corro de piedras y, en medio, tres lajas de basalto de pie.
  for (let k = 0; k < 15; k++) {
    const a = (k / 15) * Math.PI * 2;
    pieza(esfera, k % 3 ? '#b49a74' : '#8a7c6c', cx + Math.cos(a) * 1.55, ya + 0.15, cz + Math.sin(a) * 1.55, entre(0.25, 0.4), entre(0.2, 0.32), entre(0.25, 0.35), 0, a);
  }
  for (const [dx, dz, h, giro] of [
    [-0.3, 0, 1.1, 0.2],
    [0.25, -0.15, 0.95, -0.3],
    [0.1, 0.3, 0.8, 0.9],
  ])
    pieza(caja, '#4d4845', cx + dx, ya + h / 2, cz + dz, 0.5, h, 0.3, 0.04, giro, 0.05);
  // Paneles del mirador, sobre postes.
  for (const [a, giro] of [
    [-1.1, -1.1],
    [0.9, 2.2],
  ]) {
    const x = cx + Math.cos(a) * 4.6,
      z = cz + Math.sin(a) * 4.6;
    pieza(poste, '#5b4430', x, ya + 0.45, z, 0.08, 0.9, 0.08);
    pieza(caja, '#3f5a3a', x, ya + 0.95, z, 0.9, 0.5, 0.05, -0.5, giro);
  }
  // Brezo bajo en la loma de la cumbre, y tierra roja asomando.
  for (let i = 0; i < 18; i++) {
    const a = azar() * Math.PI * 2,
      r = entre(6.5, 11);
    const x = cx + Math.cos(a) * r,
      z = cz + Math.sin(a) * r;
    if (cerca(x, z) < 0.6) continue;
    pieza(disco, '#8a5d3e', x, altura(x, z) + 0.03, z, entre(0.8, 1.6), 0.04, entre(0.6, 1.2));
  }

  // --- Ermita de Nuestra Señora de Lourdes, en el bosque de El Cedro ---
  {
    const ex = 31,
      ez = -34.6,
      yb = -4.5,
      blanco = '#f2efe7';
    pieza(caja, '#8f877c', ex, yb - 0.1, ez, 5.6, 0.4, 3.8);
    pieza(caja, blanco, ex, yb + 1.6, ez, 5.2, 3.2, 3.4);
    // Testero triangular del frente y del fondo, bajo el tejado a dos aguas.
    const prisma = new T.CylinderGeometry(1, 1, 1, 3);
    pieza(prisma, blanco, ex, yb + 3.2 + 0.47, ez, 5.2 / Math.sqrt(3), 3.4, 1.4 / 1.5, -Math.PI / 2);
    prisma.dispose();
    for (const lado of [-1, 1]) pieza(caja, '#b5603c', ex + lado * 1.35, yb + 3.98, ez, 3.05, 0.14, 3.9, 0, 0, -lado * 0.5);
    // Puerta verde en arco, la placa y el farolillo.
    const frente = ez + 1.72;
    pieza(caja, '#2f7a45', ex, yb + 1.05, frente, 1.1, 2.1, 0.08);
    pieza(disco, '#2f7a45', ex, yb + 2.1, frente, 0.55, 0.08, 0.55, Math.PI / 2);
    pieza(caja, '#245f36', ex, yb + 1.05, frente + 0.04, 0.04, 2, 0.04);
    pieza(caja, '#b9b3a8', ex + 1.6, yb + 2.2, frente, 0.7, 0.45, 0.05);
    // Espadaña con su campana sobre el caballete.
    pieza(caja, blanco, ex, yb + 4.75, ez + 1.4, 0.9, 1.3, 0.3);
    pieza(caja, '#3a3633', ex, yb + 4.7, ez + 1.4, 0.48, 0.66, 0.34);
    pieza(piramide, '#4f6b3c', ex, yb + 4.62, ez + 1.4, 0.22, 0.34, 0.22);
    pieza(piramide, blanco, ex, yb + 5.55, ez + 1.4, 0.55, 0.3, 0.2, 0, Math.PI / 4);
    // Sacristía más baja al este, con su ventanuco verde.
    pieza(caja, blanco, ex + 3.7, yb + 1.2, ez + 0.2, 2.4, 2.4, 3);
    for (const lado of [-1, 1]) pieza(caja, '#b5603c', ex + 3.7, yb + 2.62, ez + 0.2 + lado * 0.75, 2.6, 0.12, 1.75, lado * 0.42);
    pieza(caja, '#2f7a45', ex + 3.7, yb + 1.5, ez + 1.72, 0.6, 0.6, 0.06);
    ventanas.push([ex + 3.7, yb + 1.5, ez + 1.75, 0.42, 0.42, 0.03]);
    // Dos escalones de piedra hasta la puerta y la explanada enlosada.
    for (let k = 0; k < 2; k++) pieza(caja, '#8f877c', ex, yb + 0.06 + k * 0.12, -32.4 - k * 0.25, 3.6 - k * 0.4, 0.14, 0.6);
    for (const [x, z] of [
      [27, -24.8],
      [35, -24.8],
    ])
      pieza(caja, '#8f877c', x, yb + 0.25, z, 2, 0.5, 0.6);
  }
  // El arroyo de El Cedro: baja del Contadero hacia el norte, por el fondo del barranco, entre piedras.
  const agua = new T.MeshStandardMaterial({ color: '#5d8f8a', roughness: 0.15, metalness: 0.1, emissive: '#16403c', emissiveIntensity: 0.4 });
  const cauce: T.BufferGeometry[] = [];
  for (let z = -3; z > -58; z -= 1.2) {
    const x = 38.6 + Math.sin(z * 0.23) * 0.9 + Math.max(0, -z - 30) * 0.08;
    const y = altura(x, z) + 0.06;
    cauce.push(new T.BoxGeometry(1.1, 0.06, 1.35).translate(x, y, z));
    for (const s of [-1, 1]) pieza(esfera, azar() < 0.5 ? '#5d6a45' : '#6b6a5d', x + s * entre(0.6, 0.9), y + 0.05, z + entre(-0.4, 0.4), entre(0.2, 0.4), entre(0.15, 0.3), entre(0.2, 0.4));
  }
  const arroyo = mergeGeometries(cauce);
  superficie(arroyo, agua, 0, 0, 0, 1, 1, 1, 2).castShadow = false;
  for (const g of [...cauce, arroyo]) g.dispose();

  // --- La copa del bosque, con su recorte: se abre en torno a la línea que va de la cámara al viajero ---
  const objetivo = { value: new T.Vector3(0, -999, 0) };
  const follaje = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: T.DoubleSide });
  follaje.onBeforeCompile = (s) => {
    s.uniforms.objetivoCorte = objetivo;
    s.vertexShader =
      'varying vec3 vMundo;\n' +
      s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader =
      'varying vec3 vMundo;\nuniform vec3 objetivoCorte;\n' +
      'float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }\n' +
      s.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        vec3 eje = objetivoCorte - cameraPosition;
        float k = dot(vMundo - cameraPosition, eje) / dot(eje, eje);
        float r = length(vMundo - cameraPosition - eje * k);
        float trama = bayer2(gl_FragCoord.xy * 0.5) * 0.25 + bayer2(gl_FragCoord.xy);
        // Como en una maqueta cortada: las copas que quedan entre la cámara y el viajero, y las de su
        // alrededor, se quitan por encima de su cabeza; los troncos y el suelo del bosque se siguen viendo.
        bool delante = k < 0.62 + 0.06 * trama || (k < 0.96 && r < (2.6 + 2.2 * k) * (0.85 + 0.15 * trama));
        if (delante && vMundo.y > objetivoCorte.y + 1.4 + trama * 0.5) discard;`,
      );
  };
  const bosque = mergeGeometries(ramas);
  for (const g of ramas) g.dispose();
  const copa = superficie(bosque, follaje, 0, 0, 0, 1, 1, 1, 4);
  bosque.dispose();
  tronco.dispose();
  // La vista mira a un punto 5 por encima del viajero: es el primero del eje de la cámara que queda
  // a esa altura sobre un suelo pisable.
  const adelante = new T.Vector3(),
    punto = new T.Vector3();
  copa.onBeforeRender = (_r, _s, camara) => {
    camara.getWorldDirection(adelante);
    for (let k = 4; k < 160; k += 0.5) {
      punto.copy(camara.position).addScaledVector(adelante, k);
      if (!transitable(punto.x, punto.z, 'garajonay')) continue;
      const suelo = paseo(punto.x, punto.z);
      if (punto.y - 5 > suelo) continue;
      objetivo.value.set(punto.x, suelo + 1, punto.z);
      return;
    }
  };

  // --- La bruma: jirones que entran y salen entre los árboles, y el mar de nubes a sus pies ---
  const reloj = () => performance.now() / 1000;
  function jirones(color: string, opacidad: number, puntos: [number, number, number, number][]) {
    const material = new T.MeshStandardMaterial({ color, transparent: true, opacity: opacidad, depthWrite: false, roughness: 1 });
    // Bordes que se desvanecen: la bruma es más tenue donde se mira de canto.
    material.onBeforeCompile = (s) => {
      s.fragmentShader = s.fragmentShader.replace(
        '#include <opaque_fragment>',
        'diffuseColor.a *= pow(abs(dot(normal, normalize(vViewPosition))), 1.8);\n#include <opaque_fragment>',
      );
    };
    const piezas = puntos.map(([x, y, z, s]) => {
      const g = new T.IcosahedronGeometry(1, 2);
      g.setAttribute('normal', g.attributes.position.clone()); // esfera suave: la normal es la posición
      g.scale(s * entre(1.4, 2.2), s * entre(0.35, 0.55), s * entre(0.9, 1.4));
      g.rotateY(azar() * 3);
      return g.translate(x, y, z);
    });
    const geo = mergeGeometries(piezas);
    const malla = superficie(geo, material, 0, 0, 0, 1, 1, 1, 8);
    malla.castShadow = malla.receiveShadow = false;
    for (const g of [...piezas, geo]) g.dispose();
    return { malla, material };
  }
  const bancos: [number, number, number, number][][] = [[], []];
  for (let i = 0, n = 0; i < 400 && n < 46; i++) {
    const x = entre(-44, 44),
      z = entre(-42, 34);
    const y = altura(x, z);
    if (y < -6 || cerca(x, z) > 10) continue;
    bancos[n++ % 2].push([x, y + entre(1.2, 3.6), z, entre(1.8, 3.4)]);
  }
  bancos.forEach((puntos, i) => {
    const { malla, material } = jirones('#eef0ea', 0.34, puntos);
    malla.onBeforeRender = () => {
      const s = reloj() * (i ? 0.045 : 0.032) + i * 2;
      malla.position.set(Math.sin(s) * 6, Math.sin(s * 0.7) * 0.4, Math.cos(s * 0.8) * 3);
      // La niebla entra y sale: se espesa y se aclara despacio.
      material.opacity = 0.22 + 0.16 * (0.5 + 0.5 * Math.sin(s * 2.3 + 1));
    };
  });
  // Mar de nubes: una lámina en la que se hunde la isla, con lomos de nube encima.
  // Sin niebla: el mar de nubes queda blanco hasta el horizonte, y la isla asoma de él.
  const nube = new T.MeshStandardMaterial({ color: '#ffffff', emissive: '#4a4d55', roughness: 1, fog: false });
  const lamina = new T.CircleGeometry(82, 48).rotateX(-Math.PI / 2).translate(0, -9, 0);
  const mar = superficie(lamina, nube, 0, 0, 0, 1, 1, 1, 20);
  mar.castShadow = mar.receiveShadow = false;
  lamina.dispose();
  const lomos: T.BufferGeometry[] = [];
  for (let i = 0; i < 70; i++) {
    const a = azar() * Math.PI * 2,
      r = entre(44, 76);
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (altura(x, z) > -6) continue;
    const g = new T.IcosahedronGeometry(1, 2);
    g.setAttribute('normal', g.attributes.position.clone());
    g.scale(entre(5, 11), entre(1, 2.2), entre(4, 8)).translate(x, -9 + entre(-0.5, 0.6), z);
    lomos.push(g);
  }
  const nubes = mergeGeometries(lomos);
  const relieveNubes = superficie(nubes, nube, 0, 0, 0, 1, 1, 1, 20);
  relieveNubes.castShadow = relieveNubes.receiveShadow = false;
  for (const g of [...lomos, nubes]) g.dispose();
  // Velo de bruma por delante del horizonte pintado: espeso abajo, donde se juntan el mar de nubes y el
  // cielo, y abierto arriba. Toma el color del cielo de la escena, de día y de noche.
  const velo = new T.ShaderMaterial({
    uniforms: { color: { value: new T.Color() } },
    vertexShader: 'varying float vAlto; void main() { vAlto = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:
      'uniform vec3 color; varying float vAlto; void main() { gl_FragColor = vec4(color, 0.96 * (1.0 - smoothstep(-6.0, 24.0, vAlto))); \n#include <colorspace_fragment>\n}',
    transparent: true,
    depthWrite: false,
    side: T.BackSide,
  });
  const telon = new T.Mesh(new T.CylinderGeometry(78, 78, 72, 48, 1, true).translate(0, 22, 0), velo);
  telon.onBeforeRender = (_r, escena) => {
    if (escena.background instanceof T.Color) velo.uniforms.color.value.copy(escena.background);
  };
  // Cuelga del mar de nubes: la maqueta solo da `superficie`, que pide un material estándar.
  mar.add(telon);

  // --- El Teide al este-nordeste, asomando sobre el mar de nubes: se ve desde el mirador del Alto ---
  // Silueta azulada y lisa, como se ve un monte a sesenta kilómetros; se apaga de noche con el cielo.
  const teide = new T.MeshStandardMaterial({ color: '#000000', roughness: 1, fog: false });
  const [teideDia, teideNoche, cieloDia, cieloNoche] = ['#b4b2c4', '#1c2438', '#efd6b9', '#344e70'].map((c) => new T.Color(c));
  // Lejos y pequeño para lo que es: el cilindro del horizonte no deja ponerlo más allá.
  const perfil = [
    [13.5, -10],
    [12, -7.6],
    [9, -3.6],
    [6, -1.8],
    [3, -1.2],
    [2.2, -0.6],
    [1.1, 1.3],
    [0.01, 2],
  ].map(([r, y]) => new T.Vector2(r, y));
  const cono = new T.LatheGeometry(perfil, 28);
  const picoViejo = new T.ConeGeometry(3, 2.4, 20).translate(-1.5, -2.4, 4);
  for (const [g, x, z] of [
    [cono, 75, 3],
    [picoViejo, 75, 3],
  ] as [T.BufferGeometry, number, number][]) {
    const m = superficie(g, teide, x, -1, z, 1, 1, 1, 10);
    m.castShadow = m.receiveShadow = false;
    m.onBeforeRender = (_r, escena) => {
      if (!(escena.background instanceof T.Color)) return;
      const dia = T.MathUtils.clamp((escena.background.r - cieloNoche.r) / (cieloDia.r - cieloNoche.r), 0, 1);
      teide.emissive.copy(teideNoche).lerp(teideDia, dia);
    };
    g.dispose();
  }

  // Un lugar de interior no tiene barcos: los de la maqueta quedan fondeados lejos de la vista.
  disco.dispose();
  return {
    amarres: [
      [0, 0, -400],
      [1, 0, -400],
      [2, 0, -400],
    ],
    enSeco: [],
  };
}
