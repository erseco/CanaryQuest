import * as T from 'three';
import type { CasaPuerto } from '../data/pueblos';

// Habitación abierta hacia la cámara, con un pasillo libre entre el mobiliario.
export function crearInterior() {
  const grupo = new T.Group();
  const cubo = new T.BoxGeometry(),
    jarra = new T.LatheGeometry(
      [
        new T.Vector2(0.12, 0),
        new T.Vector2(0.25, 0.12),
        new T.Vector2(0.26, 0.3),
        new T.Vector2(0.13, 0.45),
        new T.Vector2(0.14, 0.49),
      ],
      12,
    );
  const colores = new Map<string, T.MeshStandardMaterial>();
  function pieza(
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    geo: T.BufferGeometry = cubo,
  ) {
    if (!colores.has(color)) colores.set(color, new T.MeshStandardMaterial({ color, roughness: 0.94 }));
    const m = new T.Mesh(geo, colores.get(color));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.castShadow = m.receiveShadow = true;
    grupo.add(m);
    return m;
  }
  const madera = '#986c48',
    cal = '#fff0cf',
    marco = '#266c78';
  pieza('#a57550', 0, -0.23, 0, 8, 0.42, 6.5);
  for (let j = 0; j < 12; j++)
    pieza(j % 2 ? '#d5a87b' : '#dcb383', 0, -0.035, -2.75 + j * 0.5, 7.9, 0.07, 0.49);
  pieza(cal, 0, 1.5, -3.1, 8, 3, 0.18);
  pieza(cal, -4, 0.68, 0, 0.18, 1.36, 6.3);
  for (const x of [-3.8, -1.45, 1.4, 3.8]) pieza(madera, x, 1.5, -2.98, 0.13, 3, 0.14);
  pieza(madera, 0, 2.95, -2.92, 8.1, 0.17, 0.2);
  pieza(marco, -2.55, 1.95, -2.94, 1.55, 1.2, 0.13);
  pieza('#aed6ce', -2.55, 1.95, -2.84, 1.31, 0.99, 0.08);
  pieza(marco, -2.55, 1.95, -2.77, 0.07, 1.04, 0.08);
  pieza(madera, 1.6, 1.35, -2.65, 3.6, 0.12, 0.6);
  for (let i = 0; i < 7; i++)
    pieza(
      i % 2 ? '#b66c48' : marco,
      0.28 + i * 0.43,
      1.41,
      -2.63,
      0.7,
      0.86 + (i % 3) * 0.15,
      0.7,
      jarra,
    );
  const alfombra = pieza(marco, 0, 0.012, 0, 2.9, 0.025, 1.7);
  for (const x of [-1.26, 1.26]) pieza('#e8c889', x, 0.032, 0, 0.07, 0.015, 1.7);
  pieza(madera, 2.75, 0.83, -0.6, 1.5, 0.12, 1.9);
  for (const x of [2.18, 3.32]) for (const z of [-1.32, 0.12]) pieza(madera, x, 0.4, z, 0.11, 0.8, 0.11);
  pieza('#be794e', 2.7, 0.9, -0.9, 1.1, 1.3, 1.1, jarra);
  pieza(madera, -3.0, 0.34, -1.4, 1.3, 0.6, 2.4);
  const colcha = pieza('#b66a50', -3.0, 0.69, -1.16, 1.36, 0.14, 1.85);
  const almohada=pieza(cal, -3, 0.77, -2.27, 1.06, 0.2, 0.51);
  pieza(marco, 0, 0.035, 2.69, 1.5, 0.06, 0.6);
  const enseres=new T.Group();
  for(let i=0;i<5;i++)enseres.add(pieza('#cc8c59',-3.24+(i%2)*0.53,0.69,-2.15+Math.floor(i/2)*0.56,0.94,1.1+i*0.08,0.94,jarra));
  grupo.add(enseres);
  grupo.visible = false;
  return {
    grupo,
    decorar(casa: CasaPuerto) {
      alfombra.material.color.set(casa.color);
      colcha.material.color.set(casa.color);
      enseres.visible=/taller|lonja|cofradía|alfarero/i.test(casa.nombre);
      colcha.visible=almohada.visible=!enseres.visible;
    },
  };
}

export { sueloInterior } from './paseo';
