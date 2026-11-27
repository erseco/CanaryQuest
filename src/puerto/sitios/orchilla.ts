import * as T from 'three';
import { PUEBLOS } from '../../data/pueblos';
import type { Sitio, Taller } from '../maqueta';
import { losa, terreno } from './terreno';

/**
 * Punta de Orchilla (El Hierro): el faro de cantería gris y la casa del farero sobre el malpaís,
 * la pista de tierra que baja revolviendo hasta el embarcadero y la senda al monumento del
 * antiguo meridiano cero, asomado al acantilado del oeste. Norte hacia −z; el mar queda al sur
 * y al oeste. Las zonas pisables y sus rampas están en `PUEBLOS.orchilla.plano.suelos`.
 */
export function trazarOrchilla(t: Taller): Sitio {
  const { pieza, superficie, relieve, azar, ventanas, blanco, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { basalto, cal } = t.materiales;
  const tenido = (color: string, base = basalto) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const lava = tenido('#5a575c'),
    canteria = tenido('#8f8d8a', cal);
  const suelos = PUEBLOS.orchilla.plano.suelos!;

  // --- Malpaís: sube del mar a la explanada, sigue ganando altura al norte y cae en acantilado al oeste ---
  const altura = terreno(
    t,
    'orchilla',
    [-42, -22, 42, 21],
    (x, z) =>
      (z < -6 ? 3.4 + (-6 - z) * 0.14 : 3.4 - (z + 6) * 0.26) -
      Math.max(0, -26 - x) * 0.9 +
      Math.sin(x * 0.45 + z * 0.3) * 0.25 +
      Math.sin(x * 0.17 - z * 0.52) * 0.3,
    lava,
  );
  relieve(-54, 60, -22);
  const cono = new T.ConeGeometry(1, 1, 9);
  pieza(cono, '#6f4438', 26, 6.4, -17, 9, 5.6, 8);
  pieza(cono, '#5d3a31', -16, 6.2, -19.5, 7, 4.2, 6);
  cono.dispose();
  // Firme: tierra apisonada en la explanada y la plazoleta, pista rojiza en las rampas.
  suelos.forEach((s, i) => {
    if (i === 5) return;
    const llano = i === 0 || i === 7;
    losa(t, s, llano ? '#a8957f' : '#8a6c56', 0.3);
    // Piedras sueltas a los dos lados de la pista, como las que la bordean de verdad.
    const [x0, z0, x1, z1] = s.r,
      largo = Math.max(x1 - x0, z1 - z0),
      porX = x1 - x0 > z1 - z0;
    for (let k = 0; k < (llano ? 0 : largo * 1.6); k++) {
      const a = azar() * largo,
        lado = k % 2 ? -0.1 : 0.1,
        x = porX ? x0 + a : k % 2 ? x0 + lado : x1 + lado,
        z = porX ? (k % 2 ? z0 + lado : z1 + lado) : z0 + a;
      // En los cruces el borde de un tramo cae dentro de otro: ahí no se ponen.
      if (suelos.some((o, j) => j !== i && x > o.r[0] + 0.2 && x < o.r[2] - 0.2 && z > o.r[1] + 0.2 && z < o.r[3] - 0.2)) continue;
      const r = 0.12 + azar() * 0.16;
      pieza(esfera, k % 3 ? '#6b5f58' : '#877a70', x, altura(x, z) + 0.12, z, r, r * 0.8, r);
    }
  });
  for (let i = 0; i < 230; i++) {
    const x = -40 + azar() * 80,
      z = -21 + azar() * 33,
      y = altura(x, z);
    // Ni en el agua ni sobre los caminos.
    if (y < -0.7 || suelos.some(({ r }) => x > r[0] - 0.8 && x < r[2] + 0.8 && z > r[1] - 0.8 && z < r[3] + 0.8)) continue;
    if (i % 5 === 0) {
      // Tabaibas y verodes: lo poco verde que agarra en la lava.
      pieza(esfera, i % 2 ? '#8a9a5b' : '#6f8452', x, y + 0.22, z, 0.3 + azar() * 0.25, 0.28, 0.32);
    } else {
      const r = 0.3 + azar() * 0.8;
      pieza(esfera, azar() > 0.4 ? '#3f3a39' : '#55494a', x, y + 0.05, z, r, 0.4 + azar() * 0.5, r * 0.85);
    }
  }

  // --- El faro: torre de cantería gris, galería con barandilla, linterna y cúpula ---
  const y0 = 3.2,
    fx = -4.5,
    fz = -9.1,
    cima = y0 + 8.9;
  pieza(poste, '#5f5a56', fx, y0 + 0.35, fz, 3.7, 0.7, 3.7);
  pieza(poste, '#7d7873', fx, y0 + 4.8, fz, 2.75, 8.2, 2.75);
  for (const dy of [2.6, 4.9, 7.2]) {
    pieza(poste, '#99948d', fx, y0 + dy, fz, 2.92 - dy * 0.04, 0.14, 2.92 - dy * 0.04);
    ventanas.push([fx, y0 + dy + 1, fz + 1.4 - dy * 0.025, 0.26, 0.6, 0.1]);
  }
  pieza(caja, blanco, fx, y0 + 1.35, fz + 1.5, 0.95, 1.75, 0.14);
  pieza(caja, '#4a3b30', fx, y0 + 1.25, fz + 1.56, 0.66, 1.5, 0.08);
  pieza(poste, '#99948d', fx, cima + 0.1, fz, 3.6, 0.2, 3.6);
  const aro = new T.TorusGeometry(1.62, 0.04, 5, 18);
  pieza(aro, blanco, fx, cima + 0.95, fz, 1, 1, 1, Math.PI / 2);
  for (let k = 0; k < 9; k++) {
    const a = (k * Math.PI * 2) / 9;
    pieza(caja, blanco, fx + Math.cos(a) * 1.62, cima + 0.58, fz + Math.sin(a) * 1.62, 0.06, 0.76, 0.06);
  }
  pieza(poste, '#e9e6de', fx, cima + 0.42, fz, 2, 0.45, 2);
  ventanas.push([fx, cima + 1.3, fz, 1.2, 1.3, 1.2]);
  for (const [dx, dz] of [
    [-0.62, -0.62],
    [0.62, -0.62],
    [-0.62, 0.62],
    [0.62, 0.62],
  ])
    pieza(caja, blanco, fx + dx, cima + 1.3, fz + dz, 0.08, 1.35, 0.08);
  pieza(poste, blanco, fx, cima + 2, fz, 1.9, 0.12, 1.9);
  pieza(esfera, '#e9e6de', fx, cima + 2.2, fz, 0.92, 0.62, 0.92);
  pieza(poste, '#3a3a3a', fx, cima + 3, fz, 0.07, 0.7, 0.07);

  // --- Casa del farero: tres alas de piedra en U, con patio al sur y azoteas ---
  const alas: [number, number, number, number, string][] = [
    [2.6, -11.3, 9, 2.6, '#e8e5dc'],
    [-0.6, -8.25, 2.6, 3.5, '#8a8a8c'],
    [5.8, -8.25, 2.6, 3.5, '#e8e5dc'],
  ];
  for (const [x, z, w, d, azotea] of alas) {
    superficie(caja, canteria, x, y0 + 1.4, z, w, 2.8, d, 2.2);
    pieza(caja, blanco, x, y0 + 2.86, z, w + 0.24, 0.16, d + 0.24);
    pieza(caja, azotea, x, y0 + 2.96, z, w - 0.2, 0.08, d - 0.2);
  }
  // Huecos enmarcados en blanco hacia el patio y hacia el sur.
  const hueco = (x: number, z: number, lateral = false) => {
    pieza(caja, blanco, x, y0 + 1.5, z, lateral ? 0.1 : 0.8, 1.2, lateral ? 0.8 : 0.1);
    ventanas.push([x, y0 + 1.5, z + (lateral ? 0 : 0.04), lateral ? 0.14 : 0.52, 0.9, lateral ? 0.52 : 0.14]);
  };
  for (const x of [-0.6, 5.8]) hueco(x, -6.48);
  for (const x of [1.4, 3.8]) hueco(x, -9.98);
  for (const z of [-9, -7.6]) {
    hueco(-1.92, z, true);
    hueco(7.12, z, true);
  }
  pieza(caja, blanco, 2.6, y0 + 1.15, -9.97, 1, 2.3, 0.1);
  pieza(caja, '#4a3b30', 2.6, y0 + 1.05, -9.92, 0.7, 2, 0.08);
  pieza(caja, '#22344d', -0.6, y0 + 3.08, -8.3, 1.8, 0.05, 2.3, 0.18);
  // Murete del patio con su cancela.
  for (const x of [1.25, 3.95]) pieza(caja, '#8f8a84', x, y0 + 0.4, -6.5, 1.1, 0.8, 0.22);
  pieza(caja, '#4a3b30', 2.6, y0 + 0.45, -6.5, 1.5, 0.7, 0.06);

  // --- Monumento al Meridiano Cero: monolito con su esfera y la línea del meridiano en el suelo ---
  const mx = -22,
    mz = -8.7,
    my = 2.2;
  pieza(caja, '#4d4744', mx, my + 0.1, mz, 2.4, 0.2, 2.4);
  pieza(caja, '#5a534f', mx, my + 0.3, mz, 1.8, 0.2, 1.8);
  pieza(caja, '#d9d2c2', mx, my + 1.75, mz, 0.8, 2.7, 0.8);
  pieza(caja, '#8a6a2f', mx, my + 1.5, mz + 0.42, 0.55, 0.75, 0.04);
  const meridiano = new T.TorusGeometry(0.6, 0.035, 5, 20);
  pieza(meridiano, '#3d4a55', mx, my + 3.85, mz, 1, 1, 1);
  pieza(meridiano, '#3d4a55', mx, my + 3.85, mz, 1, 1, 1, 0, Math.PI / 2);
  pieza(meridiano, '#8a6a2f', mx, my + 3.85, mz, 1, 1, 1, Math.PI / 2);
  pieza(poste, '#3d4a55', mx, my + 3.5, mz, 0.06, 0.9, 0.06);
  pieza(caja, '#efe9da', mx, my + 0.015, -8.75, 0.16, 0.03, 5.3);
  pieza(caja, '#6d6763', -23.9, my + 0.35, -8.75, 0.3, 0.7, 5.4);
  meridiano.dispose();
  aro.dispose();

  // --- Embarcadero: el muellito de hormigón, con peldaños al agua y escala de baño ---
  pieza(caja, '#9a948a', 0, -0.6, 14.5, 4, 1.8, 5);
  pieza(caja, '#b9b3a8', 0, 0.31, 14.5, 4.1, 0.06, 5.1);
  for (let k = 0; k < 3; k++) pieza(caja, '#9a948a', -2.35 - k * 0.6, -0.1 - k * 0.3, 15.4, 0.7, 0.3, 2.2);
  for (const x of [1, 1.45]) pieza(caja, '#7c8791', x, -0.2, 17.06, 0.05, 1.7, 0.05);
  for (let k = 0; k < 5; k++) pieza(caja, '#7c8791', 1.22, 0.4 - k * 0.3, 17.06, 0.45, 0.04, 0.04);
  for (const [x, z] of [
    [-1.5, 13],
    [1.5, 13.2],
    [-1.4, 16.4],
  ]) {
    pieza(poste, '#5b3f33', x, 0.52, z, 0.24, 0.42, 0.24);
    pieza(poste, '#3b2a24', x, 0.74, z, 0.32, 0.06, 0.32);
  }
  // Indicadores de madera en los cruces.
  for (const [x, z, y, giro] of [
    [5.4, 0.4, 2, 0.4],
    [-9.4, -6.9, 3.2, -0.5],
    [-7.4, 9.4, 0.3, 0.2],
  ]) {
    pieza(poste, madera, x, y + 0.6, z, 0.1, 1.2, 0.1);
    pieza(caja, madera, x, y + 1.05, z, 0.9, 0.22, 0.05, 0, giro);
    pieza(piramide, '#5f4532', x, y + 1.28, z, 0.1, 0.12, 0.1);
  }
  // Un bote amarrado al muellito, un pesquero fondeado y un velero mar adentro.
  return {
    amarres: [
      [2, 3.3, 14.6],
      [0, -7, 16.6],
      [1, 10, 19],
    ],
    enSeco: [],
  };
}
