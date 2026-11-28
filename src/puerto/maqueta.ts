import { persona } from './persona';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { cargarRecursos } from './recursos';
import { PUEBLOS, type Pueblo } from '../data/pueblos';
import { INICIO, PASTOR, alturaPaseo } from './paseo';
import { trazarRestinga } from './sitios/restinga';
import { trazarOrchilla } from './sitios/orchilla';
import { trazarValverde } from './sitios/valverde';
import { trazarCaleta } from './sitios/caleta';
import { trazarAgaete } from './sitios/agaete';
import { trazarVegueta } from './sitios/vegueta';
import { trazarPlayaBlanca } from './sitios/playa-blanca';
import { trazarSanSebastian } from './sitios/san-sebastian';

/** Piezas del taller con las que se monta cualquier lugar: las usan los trazados de `sitios/`. */
export interface Taller {
  pieza: (
    forma: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rx?: number,
    ry?: number,
    rz?: number,
  ) => void;
  superficie: (
    forma: T.BufferGeometry,
    material: T.MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    escala: number,
    giro?: number,
  ) => T.Mesh;
  casa: (x: number, z: number, w: number, h: number, d: number, tinte: string, base?: number) => T.Mesh;
  farol: (x: number, z: number) => void;
  maceta: (x: number, z: number) => void;
  /** Laderas trianguladas de fondo entre x0 y x1, a partir de la z `frente`. */
  relieve: (x0: number, x1: number, frente: number) => void;
  azar: () => number;
  /** Cristales que se encienden de noche: x, y, z, ancho, alto, fondo. */
  ventanas: number[][];
  formas: Record<'caja' | 'esfera' | 'poste' | 'piramide', T.BufferGeometry>;
  materiales: Record<'cal' | 'adoquin' | 'basalto' | 'teja', T.MeshStandardMaterial>;
  blanco: string;
  madera: string;
}
/** Lo que un trazado propio devuelve además de sus piezas: dónde van los barcos. */
export interface Sitio {
  /** Barcos a flote, que cabecean: modelo, x, z y, si va alineado con un muelle, su rumbo. */
  amarres: [number, number, number, number?][];
  /** Barcos en tierra: modelo, x, y, z y giro. */
  enSeco: [number, number, number, number, number][];
  /** Barco de línea hecho con piezas propias: pasa a ser el barco 0, el que se toca para embarcar. */
  ferry?: T.Group;
}

// La maqueta se hornea en mallas con color por vértice para dibujar el pueblo en pocas llamadas.
export function crearMaqueta(
  escena: T.Group,
  recursos: Awaited<ReturnType<typeof cargarRecursos>>,
  pueblo: Pueblo,
) {
  const mate = new T.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    side: T.DoubleSide,
  });
  const { plano, inicio = INICIO } = PUEBLOS[pueblo];
  // Extremos del muelle: el relieve del fondo, el matorral y las rocas de la costa los acompañan.
  const oeste = plano.playa ? -31 : Math.min(...plano.orillas) - 6.7,
    este = Math.max(...plano.orillas) + 6.7,
    medio = (oeste + este) / 2,
    largo = este - oeste;
  const cristal = mate.clone();
  cristal.emissive.setHex(0xffa748);
  cristal.emissiveIntensity = 0.16;
  let semilla = 241;
  const azar = () => (semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0) / 4294967296;
  const caja = new T.BoxGeometry();
  const esfera = new T.IcosahedronGeometry(1, 0);
  const poste = new T.CylinderGeometry(0.48, 0.55, 1, 9);
  const piramide = new T.ConeGeometry(1, 1, 4);
  let piezas: T.BufferGeometry[] = [];
  function pieza(
    forma: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) {
    const geo = forma.index ? forma.toNonIndexed() : forma.clone();
    geo.deleteAttribute('uv');
    geo.applyMatrix4(
      new T.Matrix4().compose(
        new T.Vector3(x, y, z),
        new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)),
        new T.Vector3(w, h, d),
      ),
    );
    const rgb = new T.Color(color);
    const colores = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colores.length; i += 3) rgb.toArray(colores, i);
    geo.setAttribute('color', new T.BufferAttribute(colores, 3));
    piezas.push(geo);
  }
  function hornear(parent: T.Object3D, material = mate) {
    const mesh = new T.Mesh(mergeGeometries(piezas), material);
    for (const geo of piezas) geo.dispose();
    piezas = [];
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const [cal, adoquin, basalto, teja] = recursos.materiales;
  // Proyección en unidades del mundo: una piedra conserva su escala en una pared larga.
  function superficie(
    forma: T.BufferGeometry,
    material: T.MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    escala: number,
    giro = 0,
  ) {
    const geo = forma.index ? forma.toNonIndexed() : forma.clone();
    geo.scale(w, h, d);
    geo.rotateX(giro);
    const pos = geo.attributes.position,
      normal = geo.attributes.normal,
      uv = [];
    for (let i = 0; i < pos.count; i++) {
      const suelo = Math.abs(normal.getY(i)) > 0.75;
      const lado = Math.abs(normal.getX(i)) > Math.abs(normal.getZ(i));
      const u = suelo || !lado ? pos.getX(i) : pos.getZ(i);
      const v = suelo ? pos.getZ(i) : pos.getY(i);
      uv.push(u / escala, v / (escala * 0.67));
    }
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    const m = new T.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    escena.add(m);
    return m;
  }
  /** Casas blancas de azotea y por plantas, sin teja ni buganvilla. */
  const blanca = plano.estilo === 'blanca';
  const blanco = blanca ? '#fbf7ee' : '#fff1d0',
    madera = '#77513b',
    piedra = '#c9a685';
  const pared = blanca ? cal.clone() : cal;
  if (blanca) pared.color.setRGB(1.5, 1.55, 1.68); // por encima de 1: aclara la cal hasta el blanco
  // Relieve de barranco, con laderas trianguladas y estratos de basalto y almagre.
  const ladera = plano.lava ? basalto.clone() : basalto;
  if (plano.lava) ladera.color.set('#5c5b61');
  function relieve(x0: number, x1: number, frente: number) {
   for (let fila = 0; fila < 3; fila++) {
    const vertices: number[] = [];
    const crestas: T.Vector3[][] = [];
    for (let i = 0; i < Math.ceil((x1 - x0) / 2.6); i++) {
      const x = x0 + i * 2.6;
      const cima =
        (3 + fila * 1.6 + 2.4 * Math.sin(i * 0.72 + fila) + azar() * 2) *
        (0.55 + Math.min(0.55, Math.abs(x - 1) / 19));
      crestas.push(
        [0, 0.35, 0.64, 1].map(
          (k, j) =>
            new T.Vector3(x + azar() * 1.2, -0.6 + cima * k, frente - fila * 4 - j * 1.6 - azar() * 1.4),
        ),
      );
    }
    for (let i = 1; i < crestas.length; i++)
      for (let j = 0; j < 3; j++) {
        const a = crestas[i - 1],
          b = crestas[i];
        for (const v of [a[j], b[j], a[j + 1], b[j], b[j + 1], a[j + 1]]) vertices.push(v.x, v.y, v.z);
      }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    superficie(geo, ladera, 0, 0, 0, 1, 0.62, 1, 7.5);
    geo.dispose();
   }
  }
  if (!plano.sitio) relieve(oeste - 12, este + 16.6, -9);
  // Dos orillas de mampostería y un paseo de losas.
  for (const x of plano.orillas) {
    pieza(caja, '#977860', x, -0.76, -4.2, 13.4, 1.35, 15.8);
    superficie(caja, adoquin, x, -0.09, -4.2, 13.4, 0.18, 15.8, 3.4);
    for (let i = 0; i < 17; i++) {
      pieza(caja, i % 2 ? '#c9ac8c' : '#b79b80', x - 6.4 + i * 0.8, -0.38, 3.73, 0.76, 0.49, 0.13);
      pieza(caja, '#ebd4af', x - 6.4 + i * 0.8, 0.02, 3.68, 0.78, 0.13, 0.35);
    }
  }
  for (const canal of plano.canales) {
    for (let i = -8; i <= 8; i++) {
      const x = canal + i * 0.25,
        y = alturaPaseo(x, 1, pueblo);
      pieza(caja, '#e2c99c', x, y - 0.11, 1, 0.26, 0.22, 1.8);
      for (const z of [0.08, 1.92]) {
        pieza(caja, piedra, x, y + 0.17, z, 0.26, 0.48, 0.15);
        pieza(caja, blanco, x, y + 0.43, z, 0.26, 0.07, 0.21);
      }
    }
    superficie(caja, adoquin, canal, -0.09, -8.65, 3.3, 0.18, 7.1, 3.4);
  }
  const fachadas: T.Mesh[] = [];
  const ventanas: number[][] = [];
  function casa(x: number, z: number, w: number, h: number, d: number, tinte: string, base = 0) {
    const frente = z + d / 2;
    const muro = superficie(caja, pared, x, base + h / 2, z, w, h, d, 2.6);
    pieza(caja, tinte, x, base + 0.14, z, w + 0.03, 0.28, d + 0.04);
    pieza(caja, blanca ? blanco : '#ebc8a1', x, base + h + 0.04, z, w + 0.14, 0.15, d + 0.14);
    // Las azoteas de La Restinga van pintadas: almagre, gris o blanco.
    const azotea = ['#b6553d', '#d6d0c4', '#c46f45', '#e4dfd4'][Math.abs(Math.round(x * 3 + z)) % 4];
    pieza(caja, blanca ? azotea : '#ba8060', x, base + h + 0.13, z, w - 0.1, 0.1, d - 0.1);
    for (const sign of [-1, 1]) {
      pieza(caja, blanco, x, base + h + 0.21, z + (sign * d) / 2, w, 0.32, 0.14);
      pieza(caja, blanco, x + (sign * w) / 2, base + h + 0.21, z, 0.14, 0.32, d);
    }
    if (blanca) {
      // Azotea: caseta de la escalera, depósito de agua y una placa solar.
      pieza(caja, blanco, x - w * 0.24, base + h + 0.68, z - d * 0.2, 1.05, 0.95, 1.05);
      pieza(caja, tinte, x - w * 0.24, base + h + 0.6, z - d * 0.2 + 0.54, 0.4, 0.75, 0.05);
      pieza(poste, '#e9e6de', x + w * 0.27, base + h + 0.6, z - d * 0.18, 0.6, 0.72, 0.6);
      pieza(caja, '#2c4a6e', x + w * 0.05, base + h + 0.42, z + d * 0.16, 0.95, 0.05, 0.6, 0.35);
    } else if (h < 2.9 || base > 0) {
      for (const lado of [-1, 1])
        superficie(
          caja,
          teja,
          x,
          base + h + 0.33 + d * 0.06,
          z + lado * d * 0.25,
          w + 0.32,
          0.13,
          d * 0.57,
          1.85,
          lado * 0.24,
        );
    } else {
      // Pérgola de azotea con vigas y sombra listada.
      for (const dx of [-0.37, 0.37])
        for (const dz of [-0.32, 0.32])
          pieza(caja, madera, x + dx * w, base + h + 0.71, z + dz * d, 0.075, 1.18, 0.075);
      for (let j = -4; j <= 4; j++)
        pieza(caja, madera, x + j * w * 0.101, base + h + 1.32, z, 0.09, 0.09, d * 0.8);
      for (const dz of [-0.32, 0.32])
        pieza(caja, madera, x, base + h + 1.25, z + dz * d, w * 0.88, 0.1, 0.11);
    }
    for (const lado of [-1, 1]) {
      const lateral = x + lado * (w / 2 + 0.02);
      for (const dz of [-0.23, 0.23]) {
        const wz = z + dz * d,
          wy = base + h * 0.57;
        pieza(caja, tinte, lateral, wy, wz, 0.1, 0.94, 0.65);
        ventanas.push([lateral + lado * 0.07, wy, wz, 0.05, 0.71, 0.41]);
        for (const s of [-1, 1]) {
          pieza(caja, tinte, lateral + lado * 0.09, wy, wz + s * 0.44, 0.07, 0.83, 0.21);
          for (let j = 0; j < 4; j++)
            pieza(
              caja,
              '#527d76',
              lateral + lado * 0.13,
              wy - 0.27 + j * 0.18,
              wz + s * 0.44,
              0.03,
              0.04,
              0.18,
            );
        }
      }
    }
    // Una fila de ventanas por planta en las casas blancas; baja y alta en las demás.
    const filas = blanca
      ? Array.from({ length: Math.floor((h - 1.36) / 1.72) + 1 }, (_, k) => 0.91 + k * 1.72)
      : h > 2.7
        ? [0.91, h - 0.78]
        : [0.91];
    pieza(caja, tinte, x, base + 0.63, frente + 0.03, 0.68, 1.26, 0.11);
    pieza(caja, madera, x, base + 0.58, frente + 0.1, 0.47, 1.16, 0.07);
    for (const s of [-1, 1]) {
      const wx = x + s * w * 0.31;
      for (const y of filas) {
        pieza(caja, tinte, wx, y + base, frente + 0.05, 0.61, 0.83, 0.1);
        ventanas.push([wx, y + base, frente + 0.11, 0.38, 0.58, 0.05]);
        pieza(caja, madera, wx, y + base, frente + 0.15, 0.04, 0.62, 0.035);
        pieza(caja, blanco, wx, y + base - 0.44, frente + 0.12, 0.78, 0.11, 0.27);
      }
    }
    if (blanca) {
      // Balcón corrido de obra en cada planta alta, con barandilla del color de la carpintería.
      for (const y of filas.slice(1)) {
        pieza(caja, blanco, x, base + y - 0.47, frente + 0.3, w * 0.88, 0.1, 0.6);
        pieza(caja, tinte, x, base + y - 0.02, frente + 0.58, w * 0.88, 0.06, 0.05);
        for (let i = -4; i <= 4; i++)
          pieza(caja, tinte, x + i * w * 0.108, base + y - 0.22, frente + 0.58, 0.04, 0.4, 0.04);
      }
    } else if (h > 2.7) {
      pieza(caja, madera, x, base + h - 1.12, frente + 0.26, w * 0.82, 0.13, 0.65);
      pieza(caja, tinte, x, base + h - 0.63, frente + 0.55, w * 0.82, 0.09, 0.09);
      for (let i = -4; i <= 4; i++)
        pieza(caja, tinte, x + i * w * 0.09, base + h - 0.89, frente + 0.55, 0.045, 0.47, 0.05);
    }
    for (let i = 0; i < (blanca ? 0 : 140); i++) {
      const t = azar(),
        esquina = i % 3 === 0;
      const fx = esquina ? x - w * 0.48 + Math.sin(t * 8) * 0.12 : x - w * 0.47 + t * w * 0.62;
      const fy = esquina ? base + t * h : base + h - 0.27 - 0.45 * Math.sin(t * Math.PI) - 0.2 * t;
      const radio = 0.075 + azar() * 0.09;
      pieza(
        esfera,
        ['#3d6846', '#608046', '#a52c5f', '#d34580', '#f17399'][i % 5],
        fx + (azar() - 0.5) * 0.3,
        fy + (azar() - 0.5) * 0.27,
        frente + 0.12 + azar() * 0.21,
        radio * 1.15,
        radio,
        radio,
      );
    }
    return muro;
  }
  function farol(x: number, z: number) {
    pieza(poste, '#345558', x, 0.95, z, 0.095, 1.9, 0.095);
    pieza(caja, '#375759', x, 1.92, z, 0.32, 0.09, 0.32);
    ventanas.push([x, 2.08, z, 0.23, 0.31, 0.23]);
    pieza(piramide, '#345558', x, 2.32, z, 0.31, 0.25, 0.31, 0, Math.PI / 4);
  }
  function maceta(x: number, z: number) {
    pieza(poste, '#a85e48', x, 0.22, z, 0.48, 0.42, 0.48);
    pieza(poste, '#cd8460', x, 0.42, z, 0.54, 0.1, 0.54);
    for (let j = 0; j < 11; j++) {
      const a = j * 2.4;
      pieza(
        esfera,
        j % 3 ? '#678952' : '#9daa65',
        x + 0.16 * Math.cos(a),
        0.62,
        z + 0.16 * Math.sin(a),
        0.08,
        0.29,
        0.09,
        0.5 * Math.sin(a),
        0,
        -0.5 * Math.cos(a),
      );
    }
  }
  for (const c of PUEBLOS[pueblo].casas) fachadas.push(casa(c.x, c.z, c.ancho, c.alto, c.fondo, c.color));
  let sitio: Sitio | undefined;
  const taller: Taller = {
    pieza,
    superficie,
    casa,
    farol,
    maceta,
    relieve,
    azar,
    ventanas,
    formas: { caja, esfera, poste, piramide },
    materiales: { cal, adoquin, basalto, teja },
    blanco,
    madera,
  };
  if (plano.sitio === 'restinga') sitio = trazarRestinga(taller);
  else if (plano.sitio === 'orchilla') sitio = trazarOrchilla(taller);
  else if (plano.sitio === 'valverde') sitio = trazarValverde(taller);
  else if (plano.sitio === 'caleta') sitio = trazarCaleta(taller);
  else if (plano.sitio === 'agaete') sitio = trazarAgaete(taller);
  else if (plano.sitio === 'vegueta') sitio = trazarVegueta(taller);
  else if (plano.sitio === 'playa-blanca') sitio = trazarPlayaBlanca(taller);
  else if (plano.sitio === 'san-sebastian') sitio = trazarSanSebastian(taller);
  else decorarCanales();
  // Lo que acompaña a un pueblo de orillas y canales: torres, toldos, puentes engalanados, costa.
  function decorarCanales() {
  if (pueblo === 'mogan') {
    // Campanario, huecos de campana y remate de teja.
    pieza(caja, '#f1d59c', -1.6, 3.2, -7, 1.58, 6.4, 1.5);
    for (const y of [3.8, 5.1, 6.4]) pieza(caja, blanco, -1.6, y, -7, 1.78, 0.16, 1.72);
    for (const dx of [-0.58, 0.58])
      for (const dz of [-0.53, 0.53]) pieza(caja, '#edd3aa', -1.6 + dx, 7, -7 + dz, 0.28, 1.2, 0.28);
    pieza(poste, '#a88043', -1.6, 6.92, -7, 0.57, 0.6, 0.57);
    pieza(piramide, '#a65f43', -1.6, 7.92, -7, 1.42, 0.92, 1.42, 0, Math.PI / 4);
    pieza(poste, '#6b513e', -1.6, 8.52, -7, 0.07, 0.55, 0.07);
  }
  for (let i = 0; i < 8; i++)
    pieza(caja, i % 2 ? '#f8e2b7' : '#cc7455', 5.77 + i * 0.4, 2.24, -0.75, 0.41, 0.085, 1.18, 0.16);
  plantar();
  for (let i = 0; i < Math.round(largo * 1.2); i++) {
    const x = medio + (azar() - 0.5) * (largo + 5),
      z = -9 - azar() * 2.5;
    pieza(esfera, i % 2 ? '#818956' : '#667c50', x, 0.55, z, 0.6 + azar(), 0.7 + azar(), 0.65);
  }
  for (const x of [-8.5, -3, 3, 8.5, 20.4, 29.6].filter((f) => f < este)) farol(x, 3.42);
  // Guirnalda entre fachadas sobre el canal.
  for (const canal of plano.canales)
    for (let i = 0; i <= 22; i++) {
      const dx = -3 + i * 0.27,
        x = canal + dx,
        y = 3.12 + 0.034 * dx * dx;
      pieza(caja, madera, x, y, -1.1, 0.28, 0.025, 0.025);
      if (i % 2 === 0)
        pieza(
          piramide,
          ['#218f92', '#da9355', '#c86365'][i % 3],
          x,
          y - 0.17,
          -1.1,
          0.18,
          0.32,
          0.035,
          0,
          0,
          Math.PI,
        );
    }
  // Flores, postigos y enseres junto al canal dan escala a las fachadas.
  for (const [x, z] of [
    [-8.8, -0.5],
    [-6.85, -0.45],
    [-5.5, -0.9],
    [-3.2, -0.7],
    [2.35, -0.65],
    [4.7, -0.7],
    [8.65, -0.5],
    [18.75, -0.6],
    [22.5, -0.75],
    [26.75, -0.7],
    [30.9, -0.55],
  ].filter(([x]) => x < este))
    maceta(x, z);
  // Escalinata desde el canal hacia las viviendas altas.
  for (let i = 0; i < (plano.canales.includes(0) ? 9 : 0); i++) {
    const z = -0.8 - i * 0.36;
    superficie(caja, adoquin, 1.98, 0.044 * i, z, 0.8, 0.1 + i * 0.087, 0.38, 2.8);
    pieza(caja, blanco, 2.45, 0.3 + i * 0.084, z, 0.15, 0.5, 0.38);
  }
  if (pueblo === 'mogan') {
    // Reloj de la plaza, con esfera de cerámica y agujas visibles en la aproximación.
    const reloj = new T.CylinderGeometry(1, 1, 1, 32);
    pieza(reloj, '#977846', -1.6, 5.78, -6.23, 0.55, 0.08, 0.55, Math.PI / 2);
    pieza(reloj, '#f5e7bd', -1.6, 5.78, -6.17, 0.45, 0.06, 0.45, Math.PI / 2);
    for (let j = 0; j < 12; j++) {
      const a = (Math.PI * j) / 6;
      pieza(
        caja,
        madera,
        -1.6 + Math.sin(a) * 0.36,
        5.78 + Math.cos(a) * 0.36,
        -6.125,
        0.035,
        0.09,
        0.016,
        0,
        0,
        -a,
      );
    }
    pieza(caja, madera, -1.51, 5.88, -6.1, 0.055, 0.3, 0.025, 0, 0, -0.7);
    pieza(caja, madera, -1.72, 5.81, -6.09, 0.26, 0.05, 0.025, 0, 0, -0.23);
    reloj.dispose();
  }
  for (const [x, z] of [
    [-8.5, -0.5],
    [3.6, -0.73],
  ]) {
    for (let i = 0; i < 6; i++)
      pieza(caja, i % 2 ? '#f4e2b5' : '#4d9993', x - 0.63 + i * 0.25, 1.65, z, 0.26, 0.05, 0.78, 0.18);
  }
  // Terraza de pescado bajo el toldo de rayas, con cestas y cajas de madera.
  for (const x of [5.88, 8.43]) pieza(poste, madera, x, 1.04, -0.16, 0.06, 2.08, 0.06);
  pieza(caja, '#9a6c49', 7.15, 0.69, -0.3, 2.6, 0.14, 0.66);
  for (const x of [5.99, 8.31]) pieza(caja, madera, x, 0.31, -0.3, 0.13, 0.65, 0.57);
  for (let i = 0; i < 19; i++)
    pieza(
      esfera,
      i % 2 ? '#89b2aa' : '#b3c8ba',
      6.03 + i * 0.12,
      0.81,
      -0.22 + azar() * 0.16,
      0.08,
      0.065,
      0.19,
    );
  for (const [x, z] of [
    [-7.7, 3.02],
    [-8.4, 2.83],
    [8.83, 2.4],
  ]) {
    pieza(caja, '#b08250', x, 0.23, z, 0.6, 0.43, 0.51);
    for (const y of [0.1, 0.32]) pieza(caja, '#d1a470', x, y, z + 0.27, 0.62, 0.07, 0.04);
  }
  for (const x of [-6.3, -4.4, 5.9, 7.6]) {
    pieza(poste, '#795c47', x, -0.24, 3.96, 0.23, 1.72, 0.23);
    for (const y of [0.23, 0.29, 0.35]) pieza(poste, '#bca479', x, y, 3.96, 0.26, 0.04, 0.26);
  }
  // Costa irregular: bolos de basalto, matorral sobre las laderas y espuma al pie.
  for (let i = 0; i < 90; i++) {
    const z = -9 + azar() * 10,
      x = i % 2 ? este + 0.2 + azar() * 3.1 : oeste - 0.2 - azar() * 3.1;
    const r = 0.34 + azar() * 0.83;
    const tono = plano.lava ? (i % 3 ? '#3f3733' : '#544842') : i % 3 ? '#8b7a69' : '#aa9680';
    pieza(esfera, tono, x, -0.69, z, r, 0.46 + azar() * 0.58, r * 0.84);
  }
  for (let i = 0; i < Math.round(largo * 4.2); i++) {
    const x = medio + (azar() - 0.5) * (largo + 7),
      z = -10 - azar() * 2.5;
    pieza(
      esfera,
      i % 3 ? '#888854' : '#957e55',
      x,
      0.22 + (-z - 10) * 0.49,
      z,
      0.22 + azar() * 0.35,
      0.3,
      0.45,
    );
  }
  // Arcos de buganvilla sobre la calle, la estampa de Mogán.
  for (const x of plano.arcos ?? []) {
    {
      const z0 = -4.28,
        z1 = -6.3;
      for (const z of [z0, z1]) pieza(caja, blanco, x, 1.3, z, 0.22, 2.6, 0.22);
      for (let k = 0; k <= 12; k++) {
        const t = k / 12,
          z = z0 + (z1 - z0) * t,
          y = 2.55 + 0.55 * Math.sin(t * Math.PI);
        pieza(caja, blanco, x, y, z, 0.2, 0.16, 0.24);
        for (let j = 0; j < 8; j++) {
          const r = 0.1 + azar() * 0.11;
          pieza(
            esfera,
            ['#3d6846', '#a52c5f', '#d34580', '#f17399', '#608046'][(k + j) % 5],
            x + (azar() - 0.5) * 0.55,
            y + 0.1 + (azar() - 0.35) * 0.34,
            z + (azar() - 0.5) * 0.2,
            r * 1.15,
            r,
            r,
          );
        }
      }
    }
  }
  if (plano.playa) {
    // Playa: la arena sale a ras del muelle y baja hasta meterse en el agua.
    const arena = cal.clone();
    arena.color.set('#f1cd92');
    superficie(caja, arena, -23, -0.76, -5, 16, 1.52, 10, 4);
    superficie(caja, arena, -23, -0.896, 3.7, 16, 0.6, 7.6, 4, 0.159);
    const cono = new T.ConeGeometry(1, 1, 10);
    for (const [i, [x, z]] of [
      [-18.4, 1.3],
      [-22, 1],
      [-25.7, 1.4],
      [-29, 1.1],
      [-20.2, 3.2],
      [-23.9, 3.4],
      [-27.5, 3.1],
    ].entries()) {
      const y = alturaPaseo(x, z, pueblo);
      pieza(poste, '#f4ead2', x, y + 0.95, z, 0.07, 1.9, 0.07);
      pieza(cono, ['#e0694f', '#f3e3b5', '#2f8f8f', '#e8a93d'][i % 4], x, y + 1.98, z, 1.08, 0.36, 1.08);
      // Hamacas a la sombra, inclinadas con la arena.
      for (const dx of [-0.5, 0.5]) {
        pieza(caja, '#fbf1d8', x + dx, y + 0.2, z + 0.25, 0.5, 0.07, 1.45, 0.159);
        pieza(caja, i % 2 ? '#4d9993' : '#e0694f', x + dx, y + 0.29, z - 0.3, 0.42, 0.06, 0.4, 0.5);
      }
    }
    cono.dispose();
    // Chiringuito: toldo de rayas y dos veladores sobre la arena.
    for (let i = 0; i < 9; i++)
      pieza(caja, i % 2 ? '#f8e2b7' : '#2f8f8f', -22.1 + i * 0.4, 2.02, -2.42, 0.41, 0.085, 1.1, 0.16);
    for (const x of [-22.1, -18.9]) pieza(poste, madera, x, 0.95, -1.95, 0.06, 1.9, 0.06);
    for (const x of [-21.6, -19.4]) {
      pieza(poste, madera, x, 0.33, -1.3, 0.07, 0.66, 0.07);
      pieza(poste, '#e9d5ab', x, 0.68, -1.3, 0.82, 0.06, 0.82);
      for (const dx of [-0.55, 0.55]) pieza(poste, '#9a6c49', x + dx, 0.2, -1.3, 0.3, 0.4, 0.3);
    }
  }
  if (plano.espigon !== undefined) {
    // Espigón de piedra con su faro en la punta.
    const ex = plano.espigon;
    pieza(caja, '#977860', ex, -0.76, 8.45, 2.2, 1.35, 9.5);
    superficie(caja, adoquin, ex, -0.09, 8.45, 2.2, 0.18, 9.5, 3.4);
    for (let i = 0; i < 12; i++)
      for (const lado of [-1, 1])
        pieza(caja, i % 2 ? '#c9ac8c' : '#ebd4af', ex + lado * 1.03, 0.03, 4.15 + i * 0.8, 0.3, 0.13, 0.78);
    for (const z of [5.4, 8.6, 11.8])
      for (const lado of [-1, 1]) {
        pieza(poste, '#795c47', ex + lado * 0.78, 0.2, z, 0.2, 0.42, 0.2);
        pieza(poste, '#bca479', ex + lado * 0.78, 0.36, z, 0.24, 0.05, 0.24);
      }
    pieza(poste, '#977860', ex, -0.72, 14.4, 4.7, 1.5, 4.7);
    pieza(poste, '#dcc7a2', ex, 0.04, 14.4, 4.4, 0.12, 4.4);
    for (let j = 0; j < 6; j++)
      pieza(poste, j % 2 ? '#c8553f' : blanco, ex, 0.41 + j * 0.62, 14.4, 1.3 - j * 0.07, 0.62, 1.3 - j * 0.07);
    pieza(poste, '#345558', ex, 3.87, 14.4, 1.7, 0.1, 1.7);
    for (const dx of [-0.3, 0.3])
      for (const dz of [-0.3, 0.3]) pieza(caja, '#345558', ex + dx, 4.25, 14.4 + dz, 0.06, 0.7, 0.06);
    ventanas.push([ex, 4.25, 14.4, 0.52, 0.62, 0.52]);
    pieza(piramide, '#345558', ex, 4.86, 14.4, 0.62, 0.56, 0.62, 0, Math.PI / 4);
  }
  }
  // Palmera canaria: hojas lanceoladas con nervadura central y punta caída.
  function palmera(x: number, z: number, h: number) {
    for (let j = 0; j < 8; j++)
      pieza(
        poste,
        j % 2 ? '#9a7952' : '#856449',
        x + 0.18 * (j / 8) ** 2,
        (h * (j + 0.5)) / 8,
        z,
        0.43 - j * 0.018,
        h / 8 + 0.025,
        0.45 - j * 0.018,
      );
    for (let j = 0; j < 15; j++) {
      const a = j * 2.4,
        largo = 1.5 + azar(),
        subida = 0.4 + azar() * 0.7;
      const vertices: number[] = [];
      const curva = (t: number) => subida * Math.sin(t * Math.PI) - 0.46 * t * t;
      for (let k = 0; k < 19; k++) {
        const t = k / 19,
          siguiente = (k + 1) / 19;
        vertices.push(
          -0.032,
          curva(t),
          t * largo,
          0.032,
          curva(t),
          t * largo,
          0,
          curva(siguiente),
          siguiente * largo,
        );
        const ancho = 0.43 * Math.sin(t * Math.PI) ** 0.6;
        for (const lado of [-1, 1])
          vertices.push(
            0,
            curva(t),
            t * largo,
            lado * ancho,
            curva(t) - ancho * 0.48,
            (t + 0.13) * largo,
            0,
            curva(siguiente),
            siguiente * largo,
          );
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      pieza(geo, j % 2 ? '#447e5b' : '#70944f', x + 0.18, h, z, 1, 1, 1, 0, a);
      geo.dispose();
    }
  }
  function plantar() {
    for (const [x, z, h] of plano.palmeras) palmera(x, z, h);
  }
  if (sitio) plantar();
  hornear(escena);
  for (const [x, y, z, w, h, d] of ventanas) pieza(caja, '#ffc572', x, y, z, w, h, d);
  hornear(escena, cristal);
  const barcos = recursos.barcos.map((modelo, i) => {
    const limites = new T.Box3().setFromObject(modelo);
    const tamano = limites.getSize(new T.Vector3()),
      centro = limites.getCenter(new T.Vector3());
    const escala = [3.55, 4.65, 2.4][i] / Math.max(tamano.x, tamano.z);
    modelo.position.set(-centro.x, -limites.min.y, -centro.z);
    modelo.traverse((obj) => {
      if (obj instanceof T.Mesh) obj.castShadow = obj.receiveShadow = true;
    });
    const barco = new T.Group();
    barco.add(modelo);
    barco.scale.setScalar(escala);
    barco.position.set([-5.25, 6.6, -9.3][i], -0.85, [5.5, 6, 6.8][i]);
    escena.add(barco);
    return barco;
  });
  // Barcos amarrados a los lados del espigón: veleros, o pesqueros donde se vive de la pesca.
  if (plano.espigon !== undefined)
    for (const [origen, x, z] of [
      [plano.lava ? 0 : 1, plano.espigon - 3.6, 10.8],
      [2, plano.espigon + 3.1, 6.1],
      [plano.lava ? 0 : 1, plano.espigon + 4.7, 10.8],
    ]) {
      const amarrado = barcos[origen].clone();
      amarrado.position.set(x, -0.85, z);
      escena.add(amarrado);
      barcos.push(amarrado);
    }
  if (sitio) {
    const usados = new Set<number>();
    for (const [origen, x, z, rumbo] of sitio.amarres) {
      const repetido = usados.has(origen);
      const barco = repetido ? barcos[origen].clone() : barcos[origen];
      usados.add(origen);
      barco.position.set(x, -0.85, z);
      barco.userData.rumbo = rumbo;
      if (repetido) {
        escena.add(barco);
        barcos.push(barco);
      }
    }
    // En tierra no cabecean: quedan fuera de `barcos`, que es lo que la vista anima.
    for (const [origen, x, y, z, giro] of sitio.enSeco) {
      const barco = barcos[origen].clone();
      barco.position.set(x, y, z);
      barco.rotation.y = giro;
      escena.add(barco);
    }
    // El barco de línea va el primero, después de usar los modelos como plantilla.
    if (sitio.ferry) {
      escena.add(sitio.ferry);
      barcos.unshift(sitio.ferry);
    }
  }
  // Tierra adentro no hay barcos: los del puerto quedarían asomando entre las losas.
  if (plano.sinMar) for (const barco of barcos) barco.visible = false;
  const jugador = persona(inicio.x, inicio.z, false),
    pastor = persona(PASTOR.x, PASTOR.z, true);
  escena.add(jugador, pastor);
  for (const geo of [caja, esfera, poste, piramide]) geo.dispose();
  return { jugador, pastor, barcos, cristal, fachadas };
}
