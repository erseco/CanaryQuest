import { persona } from './persona';
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { cargarRecursos } from './recursos';
import { PUEBLOS, type Pueblo } from '../data/pueblos';
import { INICIO, PASTOR, alturaPaseo } from './paseo';

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
  const blanco = '#fff1d0',
    madera = '#77513b',
    piedra = '#c9a685';
  // Relieve de barranco, con laderas trianguladas y estratos de basalto y almagre.
  for (let fila = 0; fila < 3; fila++) {
    const vertices: number[] = [];
    const crestas: T.Vector3[][] = [];
    for (let i = 0; i < 22; i++) {
      const x = i * 2.6 - 27;
      const cima =
        (3 + fila * 1.6 + 2.4 * Math.sin(i * 0.72 + fila) + azar() * 2) *
        (0.55 + Math.min(0.55, Math.abs(x - 1) / 19));
      crestas.push(
        [0, 0.35, 0.64, 1].map(
          (k, j) =>
            new T.Vector3(x + azar() * 1.2, -0.6 + cima * k, -9 - fila * 4 - j * 1.6 - azar() * 1.4),
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
    superficie(geo, basalto, 0, 0, 0, 1, 0.62, 1, 7.5);
    geo.dispose();
  }
  // Dos orillas de mampostería y un paseo de losas.
  for (const lado of [-1, 1]) {
    const x = lado * 8.3;
    pieza(caja, '#977860', x, -0.76, -4.2, 13.4, 1.35, 15.8);
    superficie(caja, adoquin, x, -0.09, -4.2, 13.4, 0.18, 15.8, 3.4);
    for (let i = 0; i < 17; i++) {
      pieza(caja, i % 2 ? '#c9ac8c' : '#b79b80', x - 6.4 + i * 0.8, -0.38, 3.73, 0.76, 0.49, 0.13);
      pieza(caja, '#ebd4af', x - 6.4 + i * 0.8, 0.02, 3.68, 0.78, 0.13, 0.35);
    }
  }
  for (let i = -8; i <= 8; i++) {
    const x = i * 0.25,
      y = alturaPaseo(x, 1);
    pieza(caja, '#e2c99c', x, y - 0.11, 1, 0.26, 0.22, 1.8);
    for (const z of [0.08, 1.92]) {
      pieza(caja, piedra, x, y + 0.17, z, 0.26, 0.48, 0.15);
      pieza(caja, blanco, x, y + 0.43, z, 0.26, 0.07, 0.21);
    }
  }
  superficie(caja, adoquin, 0, -0.09, -8.65, 3.3, 0.18, 7.1, 3.4);
  const fachadas: T.Mesh[] = [];
  const ventanas: number[][] = [];
  function casa(x: number, z: number, w: number, h: number, d: number, tinte: string, base = 0) {
    const frente = z + d / 2;
    fachadas.push(superficie(caja, cal, x, base + h / 2, z, w, h, d, 2.6));
    pieza(caja, tinte, x, base + 0.14, z, w + 0.03, 0.28, d + 0.04);
    pieza(caja, '#ebc8a1', x, base + h + 0.04, z, w + 0.14, 0.15, d + 0.14);
    pieza(caja, '#ba8060', x, base + h + 0.13, z, w - 0.1, 0.1, d - 0.1);
    for (const sign of [-1, 1]) {
      pieza(caja, blanco, x, base + h + 0.21, z + (sign * d) / 2, w, 0.32, 0.14);
      pieza(caja, blanco, x + (sign * w) / 2, base + h + 0.21, z, 0.14, 0.32, d);
    }
    if (h < 2.9 || base > 0) {
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
    pieza(caja, tinte, x, base + 0.63, frente + 0.03, 0.68, 1.26, 0.11);
    pieza(caja, madera, x, base + 0.58, frente + 0.1, 0.47, 1.16, 0.07);
    for (const s of [-1, 1]) {
      const wx = x + s * w * 0.31;
      for (const y of h > 2.7 ? [0.91, h - 0.78] : [0.91]) {
        pieza(caja, tinte, wx, y + base, frente + 0.05, 0.61, 0.83, 0.1);
        ventanas.push([wx, y + base, frente + 0.11, 0.38, 0.58, 0.05]);
        pieza(caja, madera, wx, y + base, frente + 0.15, 0.04, 0.62, 0.035);
        pieza(caja, blanco, wx, y + base - 0.44, frente + 0.12, 0.78, 0.11, 0.27);
      }
    }
    if (h > 2.7) {
      pieza(caja, madera, x, base + h - 1.12, frente + 0.26, w * 0.82, 0.13, 0.65);
      pieza(caja, tinte, x, base + h - 0.63, frente + 0.55, w * 0.82, 0.09, 0.09);
      for (let i = -4; i <= 4; i++)
        pieza(caja, tinte, x + i * w * 0.09, base + h - 0.89, frente + 0.55, 0.045, 0.47, 0.05);
    }
    for (let i = 0; i < 140; i++) {
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
  }
  for (const c of PUEBLOS[pueblo].casas) casa(c.x, c.z, c.ancho, c.alto, c.fondo, c.color);
  if (pueblo === 'agaete') {
    // La ermita y sus torres azules marcan el paseo de Las Nieves.
    for (const x of [-3, -0.2]) {
      pieza(caja, blanco, x, 2.45, -6.8, 0.85, 4.9, 1.1);
      pieza(caja, '#1f5893', x, 4.15, -6.21, 0.37, 0.72, 0.08);
      pieza(piramide, '#31669c', x, 5.24, -6.8, 0.86, 0.85, 0.86, 0, Math.PI / 4);
    }
  }
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
  for (const [x, z, h] of [
    [-9.3, 0, 3.6],
    [9.2, 0, 4.4],
    [-2.5, -4.7, 4.1],
    [5, -5.5, 4.8],
    [-9, -8.5, 4],
  ])
    palmera(x, z, h);
  for (let i = 0; i < 36; i++) {
    const x = (azar() - 0.5) * 35,
      z = -9 - azar() * 2.5;
    pieza(esfera, i % 2 ? '#818956' : '#667c50', x, 0.55, z, 0.6 + azar(), 0.7 + azar(), 0.65);
  }
  for (const x of [-8.5, -3, 3, 8.5]) {
    pieza(poste, '#345558', x, 0.95, 3.42, 0.095, 1.9, 0.095);
    pieza(caja, '#375759', x, 1.92, 3.42, 0.32, 0.09, 0.32);
    ventanas.push([x, 2.08, 3.42, 0.23, 0.31, 0.23]);
    pieza(piramide, '#345558', x, 2.32, 3.42, 0.31, 0.25, 0.31, 0, Math.PI / 4);
  }
  // Guirnalda entre fachadas sobre el canal.
  for (let i = 0; i <= 22; i++) {
    const x = -3 + i * 0.27,
      y = 3.12 + 0.034 * x * x;
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
  ]) {
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
  // Escalinata desde el canal hacia las viviendas altas.
  for (let i = 0; i < 9; i++) {
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
    const lado = i % 2 ? 1 : -1,
      z = -9 + azar() * 10,
      x = lado * (15.2 + azar() * 3.1);
    const r = 0.34 + azar() * 0.83;
    pieza(esfera, i % 3 ? '#8b7a69' : '#aa9680', x, -0.69, z, r, 0.46 + azar() * 0.58, r * 0.84);
  }
  for (let i = 0; i < 125; i++) {
    const x = (azar() - 0.5) * 37,
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
  hornear(escena);
  for (const [x, y, z, w, h, d] of ventanas) pieza(caja, '#ffc572', x, y, z, w, h, d);
  hornear(escena, cristal);
  const barcos = recursos.barcos.map((modelo, i) => {
    const limites = new T.Box3().setFromObject(modelo);
    const tamano = limites.getSize(new T.Vector3()),
      centro = limites.getCenter(new T.Vector3());
    const escala = [pueblo === 'agaete' ? 7.2 : 3.55, 4.65, 2.4][i] / Math.max(tamano.x, tamano.z);
    modelo.position.set(-centro.x, -limites.min.y, -centro.z);
    modelo.traverse((obj) => {
      if (obj instanceof T.Mesh) obj.castShadow = obj.receiveShadow = true;
    });
    const barco = new T.Group();
    barco.add(modelo);
    barco.scale.setScalar(escala);
    barco.position.set([-5.25, 6.6, -9.3][i], -0.85, [pueblo === 'agaete' ? 6.65 : 5.5, 6, 6.8][i]);
    escena.add(barco);
    return barco;
  });
  const jugador = persona(INICIO.x, INICIO.z, false),
    pastor = persona(PASTOR.x, PASTOR.z, true);
  escena.add(jugador, pastor);
  for (const geo of [caja, esfera, poste, piramide]) geo.dispose();
  return { jugador, pastor, barcos, cristal, fachadas };
}
