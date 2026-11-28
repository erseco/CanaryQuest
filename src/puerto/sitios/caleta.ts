import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Sitio, Taller } from '../maqueta';
import { terreno } from './terreno';
import {
  ACCESO,
  ALTA,
  APARCADOS,
  BAJA,
  CALLE_ESTE,
  CARRETERA_NORTE,
  CARRETERA_OESTE,
  CASETA,
  DIAGONAL,
  JARDINERAS,
  MIRADOR,
  ORILLA,
  PARTERRES,
  RAMAL,
  SENDA,
  VASOS,
  type Paso,
  type Punto,
} from './caleta-plano';

/** Interpolación lineal en una lista de [x, valor] ordenada por x. */
function perfil(puntos: Punto[], x: number): number {
  if (x <= puntos[0][0]) return puntos[0][1];
  for (let i = 1; i < puntos.length; i++) {
    const [x1, y1] = puntos[i];
    if (x <= x1) {
      const [x0, y0] = puntos[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return puntos[puntos.length - 1][1];
}
const suave = (a: number, b: number, v: number) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
/** Distancia de un punto a un camino y altura del firme en el punto más cercano. */
function cerca(x: number, z: number, camino: Paso[]): [number, number] {
  let mejor = Infinity,
    y = 0;
  for (let i = 1; i < camino.length; i++) {
    const [ax, az, ay] = camino[i - 1],
      [bx, bz, by] = camino[i];
    const dx = bx - ax,
      dz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < mejor) {
      mejor = d;
      y = ay + (by - ay) * t;
    }
  }
  return [mejor, y];
}
/** Puntos de un camino cada `paso` unidades, con la dirección de avance en cada uno. */
function muestrear(camino: Paso[], paso = 1) {
  const puntos: { x: number; z: number; y: number; dx: number; dz: number }[] = [];
  for (let i = 1; i < camino.length; i++) {
    const [ax, az, ay] = camino[i - 1],
      [bx, bz, by] = camino[i];
    const largo = Math.hypot(bx - ax, bz - az),
      n = Math.max(1, Math.ceil(largo / paso));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) {
      const t = k / n;
      puntos.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, y: ay + (by - ay) * t, dx: (bx - ax) / largo, dz: (bz - az) / largo });
    }
  }
  // En los vértices, la dirección media de los dos tramos para que la cinta no se pellizque.
  return puntos.map((p, i) => {
    const q = puntos[Math.min(i + 1, puntos.length - 1)];
    const dx = p.dx + q.dx,
      dz = p.dz + q.dz,
      l = Math.hypot(dx, dz);
    return { ...p, dx: dx / l, dz: dz / l };
  });
}
/** Contorno desplazado hacia fuera: el bordillo de un vaso. */
function ensanchar(contorno: Punto[], d: number): Punto[] {
  let area = 0;
  contorno.forEach(([x0, z0], i) => {
    const [x1, z1] = contorno[(i + 1) % contorno.length];
    area += x0 * z1 - x1 * z0;
  });
  const s = area > 0 ? 1 : -1;
  return contorno.map(([x, z], i) => {
    const [ax, az] = contorno[(i + contorno.length - 1) % contorno.length],
      [bx, bz] = contorno[(i + 1) % contorno.length];
    const n1 = [z - az, ax - x].map((v) => (v * s) / Math.hypot(z - az, ax - x)),
      n2 = [bz - z, x - bx].map((v) => (v * s) / Math.hypot(bz - z, x - bx));
    const nx = n1[0] + n2[0],
      nz = n1[1] + n2[1],
      l = Math.hypot(nx, nz);
    const largo = d / Math.max(0.5, (nx * n1[0] + nz * n1[1]) / l);
    return [x + (nx / l) * largo, z + (nz / l) * largo];
  });
}
const centro = (contorno: Punto[]): Punto => [
  contorno.reduce((s, [x]) => s + x, 0) / contorno.length,
  contorno.reduce((s, [, z]) => s + z, 0) / contorno.length,
];
/** Losa horizontal con la forma del contorno, de `arriba` a `abajo`, con huecos opcionales. */
function losaPlana(contorno: Punto[], arriba: number, abajo: number, huecos: Punto[][] = []) {
  const forma = new T.Shape(contorno.map(([x, z]) => new T.Vector2(x, -z)));
  for (const h of huecos) forma.holes.push(new T.Path(h.map(([x, z]) => new T.Vector2(x, -z))));
  const geo = new T.ExtrudeGeometry(forma, { depth: arriba - abajo, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, abajo, 0);
  return geo;
}

/**
 * Piscinas naturales de La Caleta (Valverde, El Hierro), trazadas sobre la ortofoto PNOA.
 * La carretera baja del pueblo en serpentina hasta el aparcamiento; de allí una escalinata lleva
 * al solárium de las jardineras redondas y a la plataforma de hormigón con sus tres vasos de agua
 * turquesa, cerrada por el muro de la rompiente. Junto al vaso alto, la caseta redonda del
 * mirador; hacia el este, el paseo de la orilla y el camino de la barandilla blanca hasta las casas.
 * Lo pisable está en `caleta-plano.ts`, que también lee `PUEBLOS['la-caleta']`.
 */
export function trazarCaleta(t: Taller): Sitio {
  const { pieza, superficie, casa, azar, ventanas, blanco } = t;
  const { caja, esfera, poste } = t.formas;
  const { cal, basalto, teja } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const lava = tenido(basalto, '#4d4a4c'),
    hormigon = tenido(cal, '#6b7179'),
    losas = tenido(cal, '#b4b8bd'),
    asfalto = tenido(cal, '#55524f'),
    muroBlanco = tenido(cal, '#ffffff'),
    muroOcre = tenido(cal, '#e3ad6a');
  muroBlanco.color.setRGB(1.45, 1.45, 1.5);

  // --- Terreno: lava que sube hacia el pueblo, acantilado al oeste y costa baja al este ---
  const costa: Punto[] = [
    [-64, 56], [-49, 50], [-47.5, 40], [-44, 35], [-40, 32.5], [-34, 30], [-30, 29.5], [-27.5, 32], [-25, 32],
    [-23, 30.5], [-22.5, 26], [-21, 22.5], [-17, 21], [-12.6, 20.6], [-9.5, 22.2], [-7, 24], [-3, 23.4],
    [1, 21.8], [5, 19.3], [8.6, 15.8], [10.6, 12.6], [14, 11.6], [20, 11.9], [24.5, 11.7], [27, 12.4],
    [35, 13.3], [45, 13.7], [64, 14.3],
  ];
  // Altura del borde de la costa: acantilado al oeste, la plataforma de las piscinas y lava baja al este.
  const reborde: Punto[] = [[-64, 2.2], [-24, 2.2], [-14, 0.8], [-9, 0.3], [10, 0.3], [14, 0.5], [64, 0.6]];
  const ladera = (x: number, z: number) => {
    const d = perfil(costa, x) - z;
    if (d <= 0) return -1.4 - 0.5 * Math.min(4, -d);
    const base = 1.8 + 0.07 * Math.max(0, 20 - z) + 0.06 * Math.max(0, -5 - z) + 0.1 * Math.max(0, -35 - z);
    const ruido = 0.3 * Math.sin(x * 0.45 + z * 0.3) + 0.3 * Math.sin(x * 0.17 - z * 0.52) + 0.15 * Math.sin(x * 1.3 + z * 0.9);
    let y = Math.min(base, perfil(reborde, x) + 0.35 * d) + ruido * Math.min(1, d / 4);
    y = -1.4 + (y + 1.4) * suave(0, x < -12 ? 1.4 : 3, d);
    // La carretera que no se pisa también va encajada en la ladera.
    for (const camino of [CARRETERA_OESTE, CARRETERA_NORTE]) {
      const [dist, firme] = cerca(x, z, camino);
      if (dist < 5) y = (firme - 0.1) * (1 - suave(1.9, 5, dist)) + y * suave(1.9, 5, dist);
    }
    return y;
  };
  const altura = terreno(t, 'la-caleta', [-62, -62, 62, 54], ladera, lava, 1.5);
  /** Altura más baja bajo un rectángulo: donde apoya una casa en la pendiente. */
  const apoyo = (x: number, z: number, w: number, d: number) =>
    Math.min(...[-0.5, 0.5].flatMap((i) => [-0.5, 0.5].map((j) => altura(x + i * w, z + j * d))), altura(x, z));

  // --- Plataformas de hormigón: alta con el solárium y el vaso alto, baja con los otros dos ---
  const fondo = -1.7;
  const solarium: Punto[] = [
    [-12.6, 3.2], [-10.5, 1.6], [-8, 0.4], [-5.5, -0.3], [-1.2, -0.7], [-1.2, 10.75], [-4.4, 10.75], [-7, 12.6],
    [-12.6, 12.6],
  ];
  const vasoAlto: Punto[] = [
    [-1.2, -0.7], [1, -0.8], [4.6, -1], [6.8, 0], [8.3, 1.6], [9.4, 3], [9.4, 6.2], [13.6, 6.2], [15.4, 6.6],
    [15.4, 10.3], [11.6, 10.75], [-1.2, 10.75],
  ];
  const paseoOeste: Punto[] = [
    [-12.6, 12.6], [-8.2, 12.6], [-8.2, 15], [-7.2, 20.4], [-5.8, 23.2], [-8, 23.4], [-9.4, 21.4], [-10.6, 17.5],
    [-12, 14],
  ];
  const plataformaBaja: Punto[] = [
    [-7, 12.6], [-4.4, 10.75], [9.8, 10.75], [10.3, 12.4], [8.8, 15.2], [5.2, 18.8], [1.2, 21.2], [-3, 22.6],
    [-5.8, 23.2], [-7.2, 20.4], [-8.2, 15], [-8.2, 12.6],
  ];
  for (const [contorno, y, material] of [
    [solarium, ALTA, losas],
    [vasoAlto, ALTA, hormigon],
    [paseoOeste, BAJA, losas],
    [plataformaBaja, BAJA, hormigon],
  ] as const) {
    const geo = losaPlana(contorno, y, fondo);
    superficie(geo, material, 0, 0, 0, 1, 1, 1, 3);
    geo.dispose();
  }
  // Muro de la rompiente: un pretil de hormigón corre por el borde de la plataforma baja que da al mar.
  for (let i = 3; i < 8; i++) {
    const [ax, az] = plataformaBaja[i],
      [bx, bz] = plataformaBaja[i + 1];
    pieza(caja, '#9b978f', (ax + bx) / 2, BAJA + 0.12, (az + bz) / 2, 0.3, 0.24, Math.hypot(bx - ax, bz - az) + 0.3, 0, Math.atan2(bx - ax, bz - az));
  }
  // Gradas entre las dos plataformas, salvo donde asoma el vaso pequeño.
  for (const [x0, x1] of [
    [-4.4, 1.4],
    [5.8, 9.8],
  ])
    for (let k = 0; k < 2; k++)
      pieza(caja, '#a19d96', (x0 + x1) / 2, BAJA + ((ALTA - BAJA) * (2 - k)) / 3 - 0.1, 10.88 + k * 0.26, x1 - x0, 0.2, 0.27);
  for (let k = 0; k < 2; k++)
    pieza(caja, '#c9c3b7', -10.4, BAJA + ((ALTA - BAJA) * (2 - k)) / 3 - 0.1, 12.73 + k * 0.26, 4.4, 0.2, 0.27);

  // --- Vasos: agua turquesa que se oscurece hacia el centro, bordillo claro y escalas de baño ---
  const reloj = { value: 0 };
  // El reloj del agua y la espuma avanza con cualquier malla animada que llegue a dibujarse.
  const latir = () => {
    reloj.value = performance.now() / 1000;
  };
  const agua = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, emissive: '#0b5a63', emissiveIntensity: 0.25 });
  agua.onBeforeCompile = (s) => {
    s.uniforms.reloj = reloj;
    s.vertexShader = 'varying vec3 vSitio;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSitio = position;');
    s.fragmentShader =
      'varying vec3 vSitio;\nuniform float reloj;\n' +
      s.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec2 q = vSitio.xz * 2.3;
        float c = sin(q.x + sin(q.y * 1.3 + reloj * 0.9) + reloj * 0.6) * sin(q.y * 1.1 - sin(q.x * 0.8 - reloj * 0.7) - reloj * 0.5);
        diffuseColor.rgb += vec3(0.2, 0.25, 0.23) * smoothstep(0.3, 0.95, c);`,
      );
  };
  const somero = new T.Color('#86eef0'),
    hondo = new T.Color('#1fb4dc');
  VASOS.forEach((vaso, i) => {
    const y = i ? BAJA : ALTA;
    // Tres anillos: el borde claro, uno interior más hondo y el centro.
    const [cx, cz] = centro(vaso);
    const anillo = (k: number) => vaso.map(([x, z]) => [cx + (x - cx) * k, cz + (z - cz) * k]);
    const fuera = anillo(1),
      dentro = anillo(0.62);
    const pos: number[] = [],
      col: number[] = [];
    const punto = ([x, z]: number[], color: T.Color) => {
      pos.push(x, y + 0.03, z);
      col.push(color.r, color.g, color.b);
    };
    const medio = somero.clone().lerp(hondo, 0.75);
    vaso.forEach((_, j) => {
      const k = (j + 1) % vaso.length;
      for (const [p, c] of [
        [fuera[j], somero],
        [dentro[j], medio],
        [fuera[k], somero],
        [fuera[k], somero],
        [dentro[j], medio],
        [dentro[k], medio],
        [dentro[j], medio],
        [[cx, cz], hondo],
        [dentro[k], medio],
      ] as [number[], T.Color][])
        punto(p, c);
    });
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    // Los triángulos pueden quedar con la cara hacia abajo según el sentido del contorno.
    const normales = geo.attributes.normal;
    for (let n = 0; n < normales.count; n++) normales.setXYZ(n, 0, 1, 0);
    const lamina = superficie(geo, agua, 0, 0, 0, 1, 1, 1, 1);
    lamina.castShadow = false;
    lamina.onBeforeRender = latir;
    geo.dispose();
    const borde = losaPlana(ensanchar(vaso, 0.28), y + 0.09, y - 0.3, [vaso]);
    superficie(borde, losas, 0, 0, 0, 1, 1, 1, 2);
    borde.dispose();
  });
  agua.side = T.DoubleSide;
  // Escalas de acero inoxidable: dos pasamanos que salen de la plataforma y se meten en el agua.
  for (const [x, z, giro, y] of [
    [1.0, 4.4, Math.PI / 2, ALTA],
    [8.75, 8.2, -Math.PI / 2 - 0.3, ALTA],
    [-3.78, 17.6, Math.PI / 2, BAJA],
    [5.4, 11.9, -Math.PI / 2 - 0.5, BAJA],
  ]) {
    const fx = Math.sin(giro),
      fz = Math.cos(giro);
    for (const lado of [-0.24, 0.24]) {
      const px = x - fz * lado,
        pz = z + fx * lado;
      pieza(poste, '#cfd6d8', px - fx * 0.15, y + 0.45, pz - fz * 0.15, 0.05, 0.9, 0.05);
      pieza(poste, '#cfd6d8', px + fx * 0.1, y + 0.9, pz + fz * 0.1, 0.05, 0.5, 0.05, 0, giro - Math.PI / 2, Math.PI / 2);
      pieza(poste, '#cfd6d8', px + fx * 0.36, y + 0.55, pz + fz * 0.36, 0.05, 0.72, 0.05);
    }
  }
  // Escalera al mar al pie del paseo del oeste, con pasamanos hasta el agua.
  for (let k = 0; k < 7; k++) pieza(caja, '#a19d96', -6.9, BAJA - 0.16 * (k + 1) - 0.4, 23.45 + k * 0.34, 1.4, 0.8, 0.36);
  for (const dx of [-0.72, 0.72]) {
    pieza(caja, '#cfd6d8', -6.9 + dx, 0.38, 24.4, 0.05, 0.05, 2.3, Math.atan2(1.1, 2.2));
    for (const k of [0, 1, 2]) pieza(poste, '#cfd6d8', -6.9 + dx, 0.48 - k * 0.525, 23.4 + k * 1.05, 0.05, 0.8, 0.05);
  }
  // Toallas de los bañistas sobre la plataforma.
  for (const [x, z, color, giro] of [
    [0.2, 9.6, '#d8453b', 0.3],
    [1.9, 10.2, '#f0c84a', 0.1],
    [6.6, 13.5, '#3d7fc4', -0.4],
    [-1.6, 20.2, '#d8453b', 0.6],
    [4.2, 16.6, '#f2f1ec', -0.2],
  ] as const)
    pieza(caja, color, x, (z > 10.8 ? BAJA : ALTA) + 0.02, z, 0.7, 0.02, 1.5, 0, giro);
  // Duchas de agua dulce en los accesos.
  for (const [x, z, y] of [
    [-8.6, 1.6, ALTA],
    [10.2, 7.4, ALTA],
    [-11.2, 13.6, BAJA],
  ]) {
    pieza(caja, '#b9b4aa', x, y + 0.03, z, 0.7, 0.06, 0.7);
    pieza(poste, '#cfd6d8', x, y + 1, z, 0.07, 2, 0.07);
    pieza(caja, '#cfd6d8', x + 0.2, y + 1.98, z, 0.4, 0.05, 0.05);
    pieza(poste, '#9aa3a6', x + 0.4, y + 1.92, z, 0.16, 0.06, 0.16);
  }

  // --- Solárium: jardineras redondas, parterres de lava y el jardín de la rampa en curva ---
  const verde = ['#7f9a52', '#93a35e', '#6d8a4a', '#a3aa6a'];
  const tabaiba = (x: number, y: number, z: number, r = 0.32) => {
    for (let k = 0; k < 3; k++)
      pieza(esfera, verde[k % 4], x + (azar() - 0.5) * r, y + r * 0.6, z + (azar() - 0.5) * r, r, r * 0.75, r);
  };
  const cardon = (x: number, y: number, z: number, alto = 1.1) => {
    for (let k = 0; k < 7; k++) {
      const a = k * 2.4,
        r = k ? 0.17 : 0,
        h = alto * (0.6 + azar() * 0.4);
      pieza(poste, '#5f7d47', x + Math.cos(a) * r, y + h / 2, z + Math.sin(a) * r, 0.13, h, 0.13);
    }
  };
  const verode = (x: number, y: number, z: number) => {
    for (let k = 0; k < 5; k++) {
      const a = k * 1.26;
      pieza(esfera, '#8aa656', x + Math.cos(a) * 0.08, y + 0.1, z + Math.sin(a) * 0.08, 0.12, 0.05, 0.05, 0, a, 0.5);
    }
  };
  JARDINERAS.forEach(([x, z, r], i) => {
    pieza(poste, '#c3bcae', x, ALTA + 0.15, z, r * 2, 0.3, r * 2);
    pieza(poste, i === 3 ? '#7b5a3e' : '#2f2b29', x, ALTA + 0.31, z, r * 2 - 0.22, 0.04, r * 2 - 0.22);
    for (let k = 0; k < (i === 3 ? 2 : 3); k++) {
      const a = k * 2.1 + i;
      verode(x + Math.cos(a) * r * 0.45, ALTA + 0.3, z + Math.sin(a) * r * 0.45);
    }
    if (i === 3) tabaiba(x, ALTA + 0.32, z, 0.4);
  });
  PARTERRES.forEach(([x0, z0, x1, z1], i) => {
    // Contorno redondeado y algo irregular, de piedra de lava con picón dentro.
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2,
      rx = (x1 - x0) / 2,
      rz = (z1 - z0) / 2;
    const contorno: Punto[] = Array.from({ length: 14 }, (_, k) => {
      const a = (k / 14) * Math.PI * 2,
        f = 0.92 + 0.08 * Math.sin(k * 2.7 + i);
      return [cx + Math.cos(a) * rx * f * 1.05, cz + Math.sin(a) * rz * f * 1.05];
    });
    const y = cz > 10.9 ? BAJA : ALTA;
    const geo = losaPlana(contorno, y + 0.32, y - 0.2);
    superficie(geo, lava, 0, 0, 0, 1, 1, 1, 2);
    geo.dispose();
    pieza(esfera, '#2e2a28', cx, y + 0.3, cz, rx * 0.95, 0.06, rz * 0.95);
    for (let k = 0; k < rx * rz * 3; k++) {
      const px = cx + (azar() - 0.5) * rx * 1.4,
        pz = cz + (azar() - 0.5) * rz * 1.4;
      const tipo = k % 5;
      if (tipo === 0) cardon(px, y + 0.3, pz, 0.8 + azar() * 0.6);
      else if (tipo < 3) tabaiba(px, y + 0.3, pz, 0.22 + azar() * 0.18);
      else if (tipo === 3) verode(px, y + 0.3, pz);
      else pieza(esfera, '#3e3936', px, y + 0.35, pz, 0.25 + azar() * 0.2, 0.2, 0.25);
    }
  });
  // El camino en curva: un bordillo de basalto que rodea el vaso alto por el norte y baja al mirador.
  const curva: Paso[] = [
    [-1, 0.3, ALTA], [0.5, -0.3, ALTA], [3, -0.5, ALTA], [5.2, -0.2, ALTA], [6.5, 1.3, ALTA], [6.3, 3.2, ALTA],
    [7, 4.8, ALTA], [9, 5.8, ALTA],
  ];
  for (const p of muestrear(curva, 0.5)) pieza(caja, '#4c4642', p.x, ALTA + 0.08, p.z, 0.22, 0.16, 0.55, 0, Math.atan2(p.dx, p.dz));

  // --- Caseta redonda del mirador, con azotea, pretil blanco y escalera hasta la senda ---
  const { x: mx, z: mz, r: mr } = CASETA;
  const torre = new T.CylinderGeometry(1, 1, 1, 20);
  superficie(torre, muroBlanco, mx, (MIRADOR - 0.06 + fondo) / 2, mz, mr, MIRADOR - 0.06 - fondo, mr, 2.4);
  pieza(torre, '#9a958e', mx, MIRADOR - 0.04, mz, mr - 0.05, 0.08, mr - 0.05);
  // Pretil curvo de la azotea, abierto al norte hacia la pasarela.
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2 + Math.PI / 20;
    if (Math.abs(Math.sin(a) + 1) < 0.25) continue;
    pieza(caja, blanco, mx + Math.cos(a) * (mr - 0.07), MIRADOR + 0.28, mz + Math.sin(a) * (mr - 0.07), 0.14, 0.56, 0.66, 0, -a);
  }
  // Puerta y ventanas hacia el vaso alto.
  for (const a of [Math.PI * 0.9, Math.PI * 0.75, Math.PI * 1.05]) {
    const px = mx + Math.cos(a) * (mr + 0.02),
      pz = mz + Math.sin(a) * (mr + 0.02),
      puerta = a === Math.PI * 0.9;
    pieza(caja, puerta ? '#3f6f8f' : '#2f5f7f', px, ALTA + (puerta ? 0.6 : 0.85), pz, 0.08, puerta ? 1.2 : 0.55, puerta ? 0.75 : 0.6, 0, -a);
    if (!puerta) ventanas.push([px, ALTA + 0.85, pz, 0.1, 0.4, 0.4]);
  }
  pieza(caja, '#9a958e', 11.6, MIRADOR - 0.06, 1.8, 1.2, 0.12, 1.8); // pasarela
  for (const lado of [-1, 1]) pieza(caja, blanco, 11.6 + lado * 0.62, MIRADOR + 0.25, 1.8, 0.1, 0.5, 1.8);
  // Escalera de hormigón con pasamanos, de la senda a la plataforma.
  for (let k = 0; k < 16; k++) {
    const z0 = 0.8 + (k * 7.8) / 16,
      y = 2.25 + ((0.6 - 2.25) * (k + 0.5)) / 16;
    pieza(caja, '#b3aea5', 14.5, (y + fondo) / 2, z0 + 0.25, 1.8, y - fondo, 0.5);
  }
  for (const x of [13.55, 15.45]) {
    pieza(caja, blanco, x, 1.9, 4.7, 0.1, 0.1, 8.1, Math.atan2(1.65, 7.8));
    for (let k = 0; k <= 4; k++) pieza(poste, blanco, x, 2.2 - k * 0.41, 1 + k * 1.9, 0.06, 0.8, 0.06);
  }
  torre.dispose();

  // --- Calles: asfalto encajado en la ladera, bordillos y muretes blancos, farolas y coches ---
  /** Cinta de firme sobre un camino, con faldones para que no se vea flotar en las curvas. */
  function cinta(camino: Paso[], ancho: number, material: T.MeshStandardMaterial, alto = 0.05, escala = 4) {
    const v: number[] = [];
    const puntos = muestrear(camino, 0.8);
    const borde = (p: (typeof puntos)[number], lado: number, dy: number) => [
      p.x - p.dz * lado * ancho,
      p.y + alto + dy,
      p.z + p.dx * lado * ancho,
    ];
    for (let i = 1; i < puntos.length; i++) {
      const a = puntos[i - 1],
        b = puntos[i];
      const [al, ar, bl, br] = [borde(a, -1, 0), borde(a, 1, 0), borde(b, -1, 0), borde(b, 1, 0)];
      v.push(...al, ...bl, ...ar, ...ar, ...bl, ...br);
      for (const lado of [-1, 1]) {
        const [a0, b0, a1, b1] = [borde(a, lado, 0), borde(b, lado, 0), borde(a, lado, -0.6), borde(b, lado, -0.6)];
        v.push(...a0, ...a1, ...b0, ...b0, ...a1, ...b1);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    geo.computeVertexNormals();
    superficie(geo, material, 0, 0, 0, 1, 1, 1, escala);
    geo.dispose();
    return puntos;
  }
  /** Bordillo o murete a un lado del camino; `lado` positivo es a la derecha según se avanza. */
  function pretil(camino: Paso[], ancho: number, lado: number, alto: number, color: string, huecos: Punto[] = []) {
    const puntos = muestrear(camino, 0.8);
    for (let i = 1; i < puntos.length; i++) {
      if (huecos.some(([x, z]) => Math.hypot(puntos[i].x - x, puntos[i].z - z) < 3)) continue;
      const a = puntos[i - 1],
        b = puntos[i];
      const x = (a.x + b.x) / 2 - ((a.dz + b.dz) / 2) * lado * ancho,
        z = (a.z + b.z) / 2 + ((a.dx + b.dx) / 2) * lado * ancho;
      pieza(caja, color, x, (a.y + b.y) / 2 + alto / 2, z, 0.22, alto + 0.12, Math.hypot(b.x - a.x, b.z - a.z) + 0.05, 0, Math.atan2(b.x - a.x, b.z - a.z));
    }
  }
  const carretera = [...CARRETERA_OESTE, ...DIAGONAL.slice(1), ...CARRETERA_NORTE.slice(1)];
  const via = cinta(carretera, 1.9, asfalto);
  cinta(RAMAL, 2, asfalto);
  cinta(CALLE_ESTE, 1.5, asfalto);
  // Muretes blancos a los dos lados de la serpentina, como en la ortofoto, abiertos en los cruces.
  const cruces: Punto[] = [[16.5, -19.5], [18, -21.5], [14, -18.6]];
  pretil(carretera, 2, -1, 0.35, '#efeae0', cruces);
  pretil(carretera, 2, 1, 0.5, '#f4f0e6', [...cruces, [-19, 7], [-17.5, 5.6]]);
  pretil(CALLE_ESTE, 1.6, -1, 0.15, '#e4ded3');
  pretil(CALLE_ESTE, 1.6, 1, 0.15, '#e4ded3');
  // Raya discontinua en el eje de la carretera del pueblo.
  via.forEach((p, i) => {
    if (i % 3 === 0 && p.z < -19.6 && p.x > 15) pieza(caja, '#f1eee6', p.x, p.y + 0.07, p.z, 0.08, 0.02, 0.9, 0, Math.atan2(p.dx, p.dz));
  });
  function farola(x: number, z: number) {
    const y = altura(x, z);
    pieza(poste, '#3f4648', x, y + 1.25, z, 0.09, 2.5, 0.09);
    pieza(caja, '#3f4648', x, y + 2.5, z + 0.25, 0.08, 0.08, 0.6);
    pieza(caja, '#3f4648', x, y + 2.47, z + 0.55, 0.26, 0.1, 0.34);
    ventanas.push([x, y + 2.38, z + 0.55, 0.2, 0.06, 0.26]);
  }
  // Farolas del lado del mar, cada tanto a lo largo de la carretera, y en la calle del este.
  muestrear(carretera, 7).forEach((p, i) => {
    if (i % 2 === 0 && p.z > -40) farola(p.x - p.dz * 2.45, p.z + p.dx * 2.45);
  });
  for (const [x, z] of [
    [32, -1.7],
    [44, 1.2],
  ])
    farola(x, z);
  const coloresCoche = ['#f2f1ec', '#f2f1ec', '#c23b30', '#2f4f8f', '#d9d8d2', '#3a3a3a', '#f2f1ec', '#7d8a8f'];
  let coches = 0;
  function coche(x: number, z: number, giro: number, y = altura(x, z), furgoneta = false) {
    const color = coloresCoche[coches++ % coloresCoche.length];
    const local = (lx: number, lz: number): [number, number] => [
      x + lx * Math.cos(giro) + lz * Math.sin(giro),
      z - lx * Math.sin(giro) + lz * Math.cos(giro),
    ];
    const largo = furgoneta ? 2.3 : 1.9;
    pieza(caja, color, x, y + 0.34, z, 0.84, 0.36, largo, 0, giro);
    const [cx, cz] = local(0, furgoneta ? -0.15 : -0.12);
    pieza(caja, '#2d3940', cx, y + 0.66, cz, 0.76, 0.3, furgoneta ? 1.9 : 1.05, 0, giro);
    pieza(caja, color, cx, y + 0.83, cz, 0.78, 0.05, furgoneta ? 1.95 : 1, 0, giro);
    for (const [lx, lz] of [
      [-0.4, 0.6],
      [0.4, 0.6],
      [-0.4, -0.6],
      [0.4, -0.6],
    ]) {
      const [wx, wz] = local(lx, lz * (largo / 1.9));
      pieza(poste, '#1f1f1f', wx, y + 0.16, wz, 0.32, 0.12, 0.32, 0, giro, Math.PI / 2);
    }
  }
  // Coches aparcados en la diagonal, del lado de la montaña, y a los dos lados del ramal.
  muestrear(DIAGONAL, 2.6).forEach((p, i) => {
    if (i === 0 || i > 14 || i === 6) return;
    coche(p.x + p.dz * 1.85, p.z - p.dx * 1.85, Math.atan2(p.dx, p.dz), p.y, i % 4 === 1);
  });
  muestrear(RAMAL, 2.4).forEach((p, i) => {
    if (i < 1 || i > 6) return;
    for (const lado of i % 2 ? [-1, 1] : [1]) coche(p.x - p.dz * lado * 1.65, p.z + p.dx * lado * 1.65, Math.atan2(p.dx, p.dz), p.y);
  });
  for (const [x, z] of APARCADOS) coche(x, z, 0, 1.9);
  coche(-41.6, -3.6, 0.5);
  coche(21.3, -29, 0.3);
  coche(34, 0.2, Math.PI / 2 + 0.2);
  // Aparcamiento y escalinata al solárium.
  pieza(caja, '#6a6662', -18.75, 1.85, 8.6, 5.5, 0.1, 2.8);
  for (let k = 0; k < 8; k++) {
    const x = -16 + (k + 0.5) * (3.4 / 8),
      y = 1.9 + (ALTA - 1.9) * ((k + 0.5) / 8);
    pieza(caja, '#c9c3b7', x, (y + fondo) / 2, 8.6, 3.4 / 8 + 0.02, y - fondo, 2.4);
  }
  for (const z of [7.35, 9.85]) pieza(caja, blanco, -14.3, 1.6, z, 3.4, 0.08, 0.08, 0, 0, -Math.atan2(1.35, 3.4));

  // --- Senda del mirador, paseo de la orilla y camino de la barandilla blanca ---
  cinta(ACCESO, 0.75, losas, 0.04, 3);
  cinta(ORILLA, 0.8, losas, 0.04, 3);
  cinta(SENDA, 0.75, losas, 0.04, 3);
  pieza(caja, '#d8d2c6', 48, 3.22, 5.2, 10, 0.12, 2.4); // plaza
  // Barandilla del lado del mar: pilares blancos y pasamanos.
  for (const camino of [SENDA, ORILLA.slice(2)]) {
    const puntos = muestrear(camino, 0.9);
    for (let i = 1; i < puntos.length; i++) {
      const a = puntos[i - 1],
        b = puntos[i];
      const [ax, az] = [a.x + a.dz * 0.82, a.z - a.dx * 0.82],
        [bx, bz] = [b.x + b.dz * 0.82, b.z - b.dx * 0.82];
      pieza(caja, blanco, ax, a.y + 0.42, az, 0.12, 0.84, 0.12);
      pieza(caja, blanco, (ax + bx) / 2, (a.y + b.y) / 2 + 0.82, (az + bz) / 2, 0.08, 0.08, Math.hypot(bx - ax, bz - az), Math.atan2(a.y - b.y, Math.hypot(bx - ax, bz - az)), Math.atan2(bx - ax, bz - az));
      pieza(caja, blanco, (ax + bx) / 2, (a.y + b.y) / 2 + 0.45, (az + bz) / 2, 0.05, 0.05, Math.hypot(bx - ax, bz - az), Math.atan2(a.y - b.y, Math.hypot(bx - ax, bz - az)), Math.atan2(bx - ax, bz - az));
    }
  }
  for (let x = 43.4; x < 53; x += 0.9) {
    pieza(caja, blanco, x, 3.67, 6.35, 0.12, 0.84, 0.12);
    pieza(caja, blanco, x + 0.45, 4.07, 6.35, 0.9, 0.08, 0.08);
  }

  // --- Cancha del barrio, junto al cruce ---
  const yc = 3.45;
  pieza(caja, '#8fbea0', 12.25, yc - 0.04, -6.5, 6.5, 0.1, 6);
  for (const [x, z, w, d] of [
    [12.25, -9.2, 6, 0.06], [12.25, -3.8, 6, 0.06], [9.3, -6.5, 0.06, 5.4], [15.2, -6.5, 0.06, 5.4], [12.25, -6.5, 6, 0.06],
  ])
    pieza(caja, '#f4f4ee', x, yc + 0.02, z, w, 0.02, d);
  for (const z of [-9, -4]) {
    for (const dx of [-0.9, 0.9]) pieza(poste, blanco, 12.25 + dx, yc + 0.6, z, 0.08, 1.2, 0.08);
    pieza(caja, blanco, 12.25, yc + 1.2, z, 1.9, 0.08, 0.08);
  }
  for (let k = 0; k <= 13; k++)
    for (const z of [-9.6, -3.4]) {
      pieza(poste, '#3d5a45', 9 + k * 0.5, yc + 0.9, z, 0.05, 1.8, 0.05);
      if (k < 13) pieza(caja, '#3d5a45', 9.25 + k * 0.5, yc + 1.78, z, 0.5, 0.05, 0.05);
    }

  // --- Casas: blancas de azotea y herreñas de teja, en la ladera sobre la carretera ---
  /** Casa de muros blancos u ocres y tejado de teja a dos aguas, con zócalo de piedra en la pendiente. */
  function casaTeja(x: number, z: number, w: number, d: number, h: number, ocre = false, puerta = '#3f6b45') {
    const base = apoyo(x, z, w, d);
    pieza(caja, '#6f655c', x, base - 0.9, z, w + 0.12, 2, d + 0.12);
    superficie(caja, ocre ? muroOcre : muroBlanco, x, base + h / 2, z, w, h, d, 2.6);
    pieza(caja, ocre ? '#b98e5a' : '#d9d3c7', x, base + 0.2, z, w + 0.04, 0.4, d + 0.04);
    pieza(caja, blanco, x, base + h + 0.05, z, w + 0.2, 0.12, d + 0.2);
    for (const lado of [-1, 1])
      superficie(caja, teja, x, base + h + 0.33 + d * 0.06, z + lado * d * 0.25, w + 0.36, 0.13, d * 0.57, 1.85, lado * 0.24);
    const frente = z + d / 2;
    pieza(caja, puerta, x - w * 0.18, base + 0.6, frente + 0.04, 0.55, 1.15, 0.08);
    for (const dx of [-0.38, 0.22]) {
      if (w < 3 && dx < 0) continue;
      const wx = x + dx * w;
      pieza(caja, puerta, wx, base + h * 0.58, frente + 0.04, 0.6, 0.7, 0.08);
      ventanas.push([wx, base + h * 0.58, frente + 0.09, 0.4, 0.5, 0.04]);
    }
  }
  /** Casa blanca de azotea, la de la maqueta, apoyada en la pendiente. */
  function casaBlanca(x: number, z: number, w: number, h: number, d: number, tinte: string) {
    const base = apoyo(x, z, w, d);
    pieza(caja, '#d9d3c7', x, base - 0.9, z, w + 0.1, 2, d + 0.1);
    casa(x, z, w, h, d, tinte, base);
  }
  // Barrio del noreste, entre el cruce y la calle del este.
  casaTeja(23, -16.6, 6, 6.2, 2.8);
  casaBlanca(29.8, -12.8, 6.4, 2.6, 6.2, '#2f6f5f');
  casaBlanca(40.4, -10.6, 7, 4.6, 10.4, '#3c6f8f');
  casaTeja(23.3, 2.4, 4.4, 4.6, 2.5, true);
  casaBlanca(27.9, 2.2, 4.2, 2.2, 3, '#7a4b3a');
  casaTeja(14.8, -27.4, 7, 4.8, 2.6);
  casaBlanca(9.4, -29.6, 5, 2.6, 3, '#2f6f5f');
  casaTeja(29.6, -30, 5, 2.6, 2.4, true);
  // Barrio del noroeste: las hileras de teja sobre la horquilla y casas blancas cuesta arriba.
  for (const [i, [x, z]] of [
    [-47.5, 1.5],
    [-49, -1.5],
    [-50.5, -4.5],
    [-52, -7.5],
  ].entries())
    casaTeja(x, z, 4.6, 3, 2.6 + (i % 2) * 0.4, i === 2);
  for (const [i, z] of [-5.8, -2.8].entries()) casaTeja(-45.4, z, 3.6, 3, 2.6, i === 1);
  casaBlanca(-36.5, -25, 6, 2.8, 5, '#2f6f9f');
  casaBlanca(-39, -13.5, 5.6, 2.6, 6, '#3c8d7a');
  casaBlanca(-44, -12, 3.6, 2.2, 3, '#b8863b');
  casaTeja(-33, 4, 5, 4, 2.3);
  // A los dos lados de la carretera, junto al aparcamiento: el bar y las casas con patios verdes.
  casaBlanca(-19.6, 12.4, 6, 2.5, 3.6, '#2f6f9f');
  casaBlanca(-35.2, 13.8, 5, 2.4, 3.4, '#3c8d7a');
  casaBlanca(-30.5, 9.5, 3, 2.2, 3, '#b8863b');
  // Patios de césped artificial, sobre un murete que salva la pendiente.
  for (const [x, z, w, d] of [
    [-23.5, 14.5, 4, 3],
    [-29.5, 12.4, 4, 2.6],
  ]) {
    const base = Math.max(...[-0.5, 0.5].flatMap((i) => [-0.5, 0.5].map((j) => altura(x + i * w, z + j * d))));
    pieza(caja, '#d9d3c7', x, base - 0.9, z, w + 0.2, 2, d + 0.2);
    pieza(caja, '#5f9a6a', x, base + 0.12, z, w, 0.04, d);
  }
  // El pueblo sigue cuesta arriba, más allá de la ortofoto.
  for (const [x, z, w, d, ocre] of [
    [-20, -40, 5, 3.6, 0], [-8, -44, 4.4, 3.4, 1], [4, -40, 5.6, 3.6, 0], [34, -40, 5, 3.4, 1], [46, -32, 4.4, 3.2, 0],
    [-44, -36, 5, 3.6, 0], [12, -50, 5, 3.4, 0], [-30, -52, 4.6, 3.2, 1], [30, -54, 5, 3.4, 0],
  ] as const)
    if (ocre) casaTeja(x, z, w, d, 2.5, true);
    else casaBlanca(x, z, w, 2.4 + (Math.abs(x) % 3) * 0.6, d, ['#2f6f9f', '#3c8d7a', '#b8863b'][Math.abs(x) % 3]);

  // --- Costa: rocas negras, la punta de lava del este y la espuma de la rompiente ---
  const roca = (x: number, y: number, z: number, r: number) =>
    pieza(esfera, azar() > 0.45 ? '#34302e' : '#4a4240', x, y, z, r, 0.45 + azar() * 0.55, r * 0.85, 0, azar() * 3, 0);
  for (let i = 0; i < 300; i++) {
    const x = -60 + azar() * 120,
      zc = perfil(costa, x),
      z = zc - 1.5 + azar() * 3.2;
    // Fuera de las plataformas de las piscinas y de su escalera al mar.
    if ((x > -10 && x < 11 && z < 24) || (Math.abs(x + 6.9) < 2 && z < 27)) continue;
    roca(x, Math.max(-1.1, altura(x, z)) + 0.05, z, 0.4 + azar() * 1.1);
  }
  // Punta de lava que entra en el mar al este del paseo, y el roque del oeste.
  for (let k = 0; k < 18; k++) roca(25.6 + Math.sin(k) * 0.4 - k * 0.05, -0.55 + Math.max(0, 0.6 - k * 0.04), 12.2 + k * 0.48, 0.8 + azar() * 0.5);
  for (let k = 0; k < 14; k++) roca(-26.6 + (azar() - 0.5) * 2.4, -0.2 + azar() * 1.4, 31.5 + (azar() - 0.5) * 2.4, 0.9 + azar() * 0.6);
  // Matorral costero: tabaibas y cardones sueltos por la lava.
  for (let i = 0; i < 160; i++) {
    const x = -58 + azar() * 116,
      z = -45 + azar() * 70,
      y = altura(x, z);
    if (y < 0.3 || (x > -14 && x < 16 && z > -2 && z < 24)) continue;
    if (i % 4 === 0) cardon(x, y, z, 0.9 + azar() * 0.8);
    else tabaiba(x, y, z, 0.3 + azar() * 0.25);
  }
  const espuma = new T.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, roughness: 1, depthWrite: false });
  espuma.onBeforeCompile = (s) => {
    s.uniforms.reloj = reloj;
    s.vertexShader =
      'uniform float reloj;\nvarying float vOla;\n' +
      s.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vOla = sin(reloj * 1.6 + position.x * 0.7 + position.z * 0.4);
        transformed.y += 0.07 * vOla;`,
      );
    s.fragmentShader =
      'varying float vOla;\n' + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= 0.6 + 0.38 * vOla;');
  };
  const blancas: T.BufferGeometry[] = [];
  const mancha = (x: number, z: number, r: number) => {
    const g = esfera.clone();
    g.scale(r, 0.12, r * 0.6);
    g.rotateY(azar() * Math.PI);
    g.translate(x, -0.74, z);
    blancas.push(g);
  };
  // La rompiente: más fuerte en la costa baja del este, donde el mar entra de frente.
  for (let i = 0; i < 340; i++) {
    const x = -48 + azar() * 110;
    if (x > -8 && x < 11) continue;
    const este = x > 11 ? 1.4 : 1;
    mancha(x, perfil(costa, x) + 0.1 + azar() * 2.4 * este, (0.7 + azar() * 1.4) * este);
  }
  // Contra el muro de las piscinas rompe menos: algo de espuma al pie.
  for (let i = 0; i < 40; i++) {
    const k = 3 + azar() * 5,
      a = plataformaBaja[Math.floor(k)],
      b = plataformaBaja[Math.floor(k) + 1],
      f = k % 1;
    mancha(a[0] + (b[0] - a[0]) * f + 0.6, a[1] + (b[1] - a[1]) * f + 0.8, 0.4 + azar() * 0.6);
  }
  for (let k = 0; k < 16; k++) mancha(25.6 + (azar() - 0.5) * 3, 13 + k * 0.5, 0.5 + azar() * 0.6);
  const olas = mergeGeometries(blancas);
  for (const g of blancas) g.dispose();
  const rompiente = superficie(olas, espuma, 0, 0, 0, 1, 1, 1, 1);
  rompiente.castShadow = rompiente.receiveShadow = false;
  rompiente.onBeforeRender = latir;
  olas.dispose();

  // Un pesquero faenando frente a la costa, un velero lejos y una falúa hacia el este.
  return {
    amarres: [
      [0, 20, 32],
      [1, -16, 46],
      [2, 38, 27],
    ],
    enSeco: [],
  };
}
