import * as T from 'three';
import type { Sitio, Taller } from '../maqueta';

/**
 * La Restinga (El Hierro), trazada sobre la ortofoto PNOA y comprimida a escala de maqueta.
 * Norte hacia −z, como en los demás pueblos: la avenida marítima corre de oeste a este, la bahía
 * queda delante y el dique rompeolas la cierra por el sur, con la bocana abierta al oeste.
 * Las zonas pisables están en `PUEBLOS['la-restinga'].plano.suelos`; si se mueve una pieza
 * por la que se camina, hay que mover allí su rectángulo.
 */
export function trazarRestinga(t: Taller): Sitio {
  const { pieza, superficie, casa, farol, maceta, relieve, azar, ventanas, blanco, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, basalto } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const hormigon = tenido(cal, '#b7b6b2'),
    asfalto = tenido(cal, '#6a6663'),
    arena = tenido(cal, '#57504c'),
    lava = tenido(basalto, '#51555d');
  const azul = '#2f6fb3',
    muelle = '#8f8377';
  const roca = (x: number, y: number, z: number, r: number) =>
    pieza(esfera, azar() > 0.4 ? '#3f3733' : '#544842', x, y, z, r, 0.45 + azar() * 0.5, r * 0.85);

  // --- El pueblo: la avenida y, por detrás, dos bancales de calles que suben hacia la lava ---
  pieza(caja, muelle, -8.5, -0.76, -2.15, 43, 1.35, 11.7);
  superficie(caja, adoquin, -8.5, -0.09, -2.15, 43, 0.18, 11.7, 3.4);
  superficie(caja, hormigon, -8.5, 0.1, -11, 43, 1.2, 6, 4);
  superficie(caja, hormigon, -8.5, 0.9, -17, 43, 1.2, 6, 4);
  const tonos = ['#2f6f9f', '#3c8d7a', '#b8863b', '#1f6f8b', '#8a6a52'];
  [-27.4, -21.6, -16, -10.4, -4.8, 0.9, 6.4, 11].forEach((x, i) =>
    casa(x, -11.2, 4.2 + (i % 3) * 0.3, 3.6 + ((i * 7) % 4) * 0.6, 3.6, tonos[i % 5], 0.7),
  );
  [-24.6, -18.8, -13, -7.2, -1.5, 4.2, 9.8].forEach((x, i) =>
    casa(x, -17.2, 4.4 + (i % 2) * 0.4, 3.4 + ((i * 5) % 4) * 0.55, 3.6, tonos[(i + 2) % 5], 1.5),
  );
  // Malpaís alrededor y, al fondo, las coladas y un cono volcánico rojizo.
  relieve(-48, 56, -20);
  const cono = new T.ConeGeometry(1, 1, 9);
  pieza(cono, '#7b4b3c', 32, 2.5, -15.5, 10, 6.4, 9);
  pieza(cono, '#693f33', 44, 1.7, -11, 7, 4.6, 7);
  superficie(caja, lava, -38, -0.5, -4, 16, 0.9, 30, 5);
  superficie(caja, lava, 44, -0.5, 4, 14, 0.9, 46, 5);
  for (let i = 0; i < 46; i++) {
    const oeste = i % 2 === 0;
    roca(oeste ? -45 + azar() * 14 : 37.5 + azar() * 13, 0.12, -18 + azar() * (oeste ? 27 : 44), 0.5 + azar() * 0.9);
  }

  // --- Avenida marítima: pretil blanco con pasamanos azul, farolas, bancos y terrazas ---
  for (const [x0, x1] of [
    [-30, -19.4],
    [-16.6, -0.15],
  ]) {
    pieza(caja, blanco, (x0 + x1) / 2, 0.26, 3.58, x1 - x0, 0.52, 0.22);
    pieza(caja, azul, (x0 + x1) / 2, 0.57, 3.58, x1 - x0, 0.06, 0.28);
  }
  for (const x of [-26, -20.5, -14, -8.5, -3, 3, 8.5]) farol(x, 3.2);
  for (const x of [-23, -10.6, -5.6, 5.6]) {
    pieza(caja, blanco, x, 0.34, 2.7, 1.5, 0.09, 0.45);
    pieza(caja, blanco, x, 0.62, 2.48, 1.5, 0.4, 0.07);
    for (const dx of [-0.6, 0.6]) pieza(caja, blanco, x + dx, 0.16, 2.7, 0.1, 0.32, 0.4);
  }
  for (const x of [-24.7, -14.3, -9.6, 0.5, 6.3]) maceta(x, -2.85);
  // Veladores de la tasca y del bar, bajo sombrillas blancas y azules.
  const sombrilla = new T.ConeGeometry(1, 1, 8);
  for (const [i, x] of [-28.2, -25.8, -8.1, -5.7].entries()) {
    pieza(poste, '#e9e6de', x, 0.95, -0.9, 0.06, 1.9, 0.06);
    pieza(sombrilla, i % 2 ? azul : blanco, x, 1.98, -0.9, 0.95, 0.32, 0.95);
    pieza(poste, '#e9e6de', x, 0.62, -0.9, 0.75, 0.05, 0.75);
    for (const dx of [-0.5, 0.5]) pieza(poste, madera, x + dx, 0.2, -0.9, 0.26, 0.4, 0.26);
  }
  sombrilla.dispose();

  // --- Orilla de lava bajo la avenida, al oeste de la rampa ---
  superficie(caja, lava, -15.1, -0.75, 7.13, 29.8, 0.6, 7, 5, 0.13);
  for (let i = 0; i < 80; i++) {
    const x = -30.5 + azar() * 29,
      z = 4.2 + azar() * 5.6;
    if (Math.abs(x + 18) < 1.7) continue; // el muelle viejo pasa por aquí
    roca(x, -0.1 - (z - 4) * 0.12, z, 0.35 + azar() * 0.7);
  }

  // --- Playa de arena negra, rampa de hormigón y pantalán flotante ---
  superficie(caja, arena, 8, -0.82, 7.37, 10, 0.6, 7.5, 4, 0.14);
  superficie(caja, hormigon, 1.2, -0.82, 7.37, 2.4, 0.6, 7.5, 4, 0.14);
  pieza(caja, '#5d6b72', 1.2, -0.82, 14.5, 1.2, 0.2, 10.7);
  pieza(caja, '#a39a8e', 1.2, -0.67, 14.5, 1.4, 0.14, 11);
  pieza(caja, '#5d6b72', -1.5, -0.82, 13, 4, 0.2, 0.9);
  pieza(caja, '#a39a8e', -1.5, -0.67, 13, 4.2, 0.14, 1.1);
  for (const z of [10, 13.4, 16.8, 19.7])
    for (const lado of [-1, 1]) pieza(poste, '#5a4a3f', 1.2 + lado * 0.78, -0.25, z, 0.14, 1.5, 0.14);

  // --- Muelle viejo, al oeste: el primer abrigo del pueblo ---
  pieza(caja, muelle, -18, -0.76, 10.4, 2.4, 1.35, 13.4);
  superficie(caja, hormigon, -18, -0.09, 10.4, 2.4, 0.18, 13.4, 4);
  pieza(poste, muelle, -18, -0.72, 17.1, 2.6, 1.5, 2.6);
  pieza(poste, '#c2bbae', -18, 0.03, 17.1, 2.5, 0.1, 2.5);
  for (const z of [7, 11, 15])
    for (const lado of [-1, 1]) pieza(poste, '#5a4a3f', -18 + lado * 0.95, 0.2, z, 0.2, 0.42, 0.2);
  pieza(poste, '#b5533c', -18, 0.7, 17.5, 0.2, 1.3, 0.2);
  ventanas.push([-18, 1.48, 17.5, 0.2, 0.24, 0.2]);

  // --- Explanada del puerto, al este: varadero, pórtico elevador y nave de la cofradía ---
  pieza(caja, '#8a7f76', 25, -0.76, 13.45, 24, 1.35, 33.1);
  superficie(caja, hormigon, 25, -0.09, 13.45, 24, 0.18, 33.1, 5);
  superficie(caja, asfalto, 27, 0.01, 8.75, 15, 0.04, 11.5, 5);
  for (let i = 0; i <= 6; i++)
    for (const z of [3, 14.5]) pieza(caja, '#d9d4c8', 19.5 + i * 2.5, 0.3, z, 0.08, 0.6, 0.08);
  for (const z of [3, 14.5]) pieza(caja, azul, 27, 0.58, z, 15, 0.05, 0.05);
  for (const x of [19.5, 34.5]) pieza(caja, azul, x, 0.58, 8.75, 0.05, 0.05, 11.5);
  // Foso del pórtico: dos espigones cortos y el pórtico azul que saca los barcos del agua.
  for (const z of [15.4, 18.6]) {
    pieza(caja, '#8a7f76', 11.2, -0.5, z, 3.6, 1, 0.8);
    for (const x of [10, 12.4]) {
      pieza(caja, azul, x, 1.7, z, 0.28, 3.4, 0.28);
      pieza(poste, '#2b2b2b', x, 0.17, z, 0.4, 0.34, 0.4, Math.PI / 2);
    }
    pieza(caja, azul, 11.2, 3.45, z, 2.7, 0.24, 0.24);
  }
  for (const x of [10, 12.4]) pieza(caja, azul, x, 3.45, 17, 0.3, 0.3, 3.6);
  for (const z of [16.3, 17.7]) pieza(caja, '#30353a', 11.2, 2.3, z, 2.2, 2.1, 0.05);
  // Nave de la cofradía: paredes blancas, cubierta azul a dos aguas y portones.
  pieza(caja, '#eceae3', 29, 1.5, 19, 10, 3, 5);
  pieza(caja, azul, 29, 3.25, 17.72, 10.4, 0.14, 2.75, -0.2);
  pieza(caja, azul, 29, 3.25, 20.28, 10.4, 0.14, 2.75, 0.2);
  for (const x of [26.4, 31.6]) pieza(caja, '#2a5a8f', x, 1.2, 21.53, 2.6, 2.4, 0.08);
  for (const x of [25, 27.6, 30.4, 33]) ventanas.push([x, 2.4, 16.47, 0.9, 0.5, 0.06]);

  // --- Dique rompeolas: muelle de asfalto, muro alto y escollera de bloques al mar abierto ---
  pieza(caja, '#6f6862', 6.5, -0.76, 28.2, 61, 1.35, 4.4);
  superficie(caja, asfalto, 6.5, -0.09, 28, 61, 0.18, 4, 5);
  pieza(caja, '#c9c2b5', 6.5, 0.02, 26.12, 61, 0.1, 0.3);
  pieza(caja, '#cfc8bb', 6.5, 1.25, 30.4, 61, 2.5, 0.8);
  pieza(caja, '#e2dccf', 6.5, 2.55, 30.4, 61, 0.12, 1);
  for (let x = -22; x <= 36; x += 4.5) pieza(caja, '#c4bdb0', x, 0.9, 29.9, 0.4, 1.8, 0.5);
  for (let x = -21; x <= 34; x += 6) {
    pieza(poste, '#5a4a3f', x, 0.2, 26.45, 0.22, 0.42, 0.22);
    pieza(poste, '#2b2b2b', x, 0.4, 26.45, 0.28, 0.05, 0.28);
  }
  for (const x of [-17.5, -12.4, -7.3]) {
    pieza(caja, '#eeebe4', x, 0.62, 29.35, 4.2, 1.2, 0.9);
    pieza(caja, azul, x, 0.62, 28.88, 4.2, 0.18, 0.03);
  }
  // Morro del dique, con su baliza verde.
  pieza(poste, '#6f6862', -24, -0.72, 28.2, 7, 1.5, 7);
  pieza(poste, '#6a6663', -24, 0.03, 28.2, 6.6, 0.1, 6.6);
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#2e8b57', -25.2, 0.45 + j * 0.7, 28.2, 0.9 - j * 0.08, 0.7, 0.9 - j * 0.08);
  ventanas.push([-25.2, 3.3, 28.2, 0.36, 0.44, 0.36]);
  pieza(piramide, '#2e8b57', -25.2, 3.75, 28.2, 0.4, 0.42, 0.4, 0, Math.PI / 4);
  for (let i = 0; i < 360; i++) {
    // Los primeros rodean el morro; el resto se apila contra el muro, más bajos mar adentro.
    let x: number, z: number, lejos: number;
    if (i < 80) {
      const a = Math.PI * (0.5 + azar()),
        r = 3.7 + azar() * 3;
      x = -24 + Math.cos(a) * r;
      z = 28.2 + Math.sin(a) * r;
      lejos = r - 3.7;
    } else {
      x = -24 + azar() * 62;
      lejos = azar() * 4;
      z = 31 + lejos;
    }
    const s = 0.75 + azar() * 0.55;
    pieza(
      caja,
      ['#4a4744', '#5b5753', '#3e3b39'][i % 3],
      x,
      0.75 - lejos * 0.42 + azar() * 0.3,
      z,
      s,
      s,
      s,
      azar() * 1.6,
      azar() * 1.6,
      azar() * 1.6,
    );
  }
  cono.dispose();

  // Barcos en seco del varadero, sobre calzos, y dos botes varados en la playa.
  const enSeco: Sitio['enSeco'] = [
    [2, 5.3, -0.22, 5.5, 0.5],
    [2, 10.6, -0.3, 6.1, -0.4],
  ];
  [21, 24.2, 27.4, 30.6, 33.6].forEach((x, i) =>
    [5.7, 11.6].forEach((z, j) => {
      for (const dz of [-0.9, 0.9]) pieza(caja, madera, x, 0.2, z + dz, 1.3, 0.4, 0.22);
      enSeco.push([[0, 2, 0, 1, 2][(i + j * 2) % 5], x, 0.4, z, (i + j) % 2 ? 0.08 : -0.06]);
    }),
  );
  return {
    // Pesqueros y botes a los lados del pantalán, un velero fondeado y la lancha de salvamento en el dique.
    amarres: [
      [0, 3.7, 12.3],
      [2, -0.7, 10.6],
      [1, -9.5, 13],
      [0, 3.7, 17],
      [2, -1.4, 15.4],
      [0, -12.5, 8.8],
      [2, 3.3, 9.6],
      [0, 11.5, 24.3],
    ],
    enSeco,
  };
}
