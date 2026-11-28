import * as T from 'three';
import { PUEBLOS } from '../../data/pueblos';
import type { Sitio, Taller } from '../maqueta';
import { ferry } from './ferry';
import { losa, terreno } from './terreno';

/**
 * Playa Blanca (Yaiza, Lanzarote), trazada sobre la ortofoto PNOA y comprimida a escala de maqueta:
 * unos 25 m por unidad de oeste a este y algo más de norte a sur. Norte hacia −z, como en los demás
 * pueblos, de modo que el estrecho de La Bocaina queda delante y Fuerteventura a la espalda de la
 * cámara. De oeste a este: el puerto del ferry con su dársena pesquera, la playa del Pueblo y el
 * casco viejo con la iglesia del Carmen, el paseo sobre la lava, Playa Dorada entre sus escolleras,
 * la Marina Rubicón y la punta del Águila con el Castillo de las Coloradas. Detrás, la Montaña Roja
 * y Los Ajaches; enfrente, Lobos y la costa norte de Fuerteventura. Las zonas pisables están en
 * `PUEBLOS['playa-blanca'].plano.suelos`: si se mueve una pieza por la que se camina, hay que mover
 * allí su rectángulo.
 */
export function trazarPlayaBlanca(t: Taller): Sitio {
  const { pieza, superficie, casa, farol, azar, ventanas, blanco, madera } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, basalto } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const asfalto = tenido(cal, '#5f5c5a'),
    hormigon = tenido(cal, '#c9c3b7'),
    losetas = tenido(adoquin, '#d9947a'),
    arenaPueblo = tenido(cal, '#f2dfb4'),
    arenaDorada = tenido(cal, '#efcf8f'),
    lava = tenido(basalto, '#4a4441'),
    mamposteria = tenido(adoquin, '#5d5853');
  const verde = '#2f6e3b',
    azul = '#2a5f9e',
    muelle = '#8a8277',
    roca = ['#2f2a28', '#3d3634', '#4a4240'];
  const suave = (v: number) => {
    const k = Math.min(1, Math.max(0, v));
    return k * k * (3 - 2 * k);
  };
  const prisma = new T.CylinderGeometry(0.62, 1, 1, 6);
  const cono = new T.ConeGeometry(1, 1, 10);
  const cupula = new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const disco = new T.CylinderGeometry(1, 1, 1, 24);
  const piedra = (x: number, y: number, z: number, r: number) =>
    pieza(esfera, roca[Math.floor(azar() * 3)], x, y, z, r * (1 + azar() * 0.4), r * (0.5 + azar() * 0.4), r, 0, azar() * 3);

  // --- Fondo: los llanos del Rubicón, la Montaña Roja al noroeste y Los Ajaches al nordeste ---
  const ROJA = { x: -40, z: -44 };
  const radioRoja = (x: number, z: number) => Math.hypot(x - ROJA.x, (z - ROJA.z) * 1.1);
  const fondo = (x: number, z: number) => {
    const tras = -12.5 - z,
      lejos = suave((76 - Math.hypot(x, z)) / 9);
    const llano = -0.05 + Math.max(0, tras - 5) * 0.045 + 0.3 * Math.sin(x * 0.21 + z * 0.13) * suave((tras - 5) / 6);
    // Cono de picón con su cráter en lo alto y barranquillos en las laderas.
    const r = radioRoja(x, z);
    let roja = r < 19 ? 12 * (1 - r / 19) ** 1.25 + 0.5 * Math.sin(Math.atan2(z - ROJA.z, x - ROJA.x) * 7) * (r / 19) : 0;
    if (r < 3.6) roja -= (3.6 - r) * 0.85;
    // Los Ajaches: lomos pelados y pardos con la atalaya de Femés por encima.
    const ajaches =
      suave((x - 10) / 22) *
        suave((-z - 34) / 12) *
        (4.5 + 2 * Math.sin(x * 0.17) + 1.3 * Math.sin(x * 0.43 + z * 0.21) + Math.sin(z * 0.5)) +
      3.5 * Math.exp(-((x - 34) ** 2 + (z + 56) ** 2) / 70);
    return llano + Math.max(roja, ajaches, 0) * lejos;
  };
  {
    const paso = 1.6,
      [x0, z0, x1, z1] = [-78, -78, 78, -12];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.4) * paso,
          z = Math.min(z1, z0 + (j + (azar() - 0.5) * 0.4) * paso);
        p.push(new T.Vector3(x, fondo(x, z), z));
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
          const [u, v, w] = tri.map((n) => p[n]);
          if (Math.hypot(u.x, u.z) > 77) continue; // lo que asomaría tras el horizonte pintado
          const cx = (u.x + v.x + w.x) / 3,
            cz = (u.z + v.z + w.z) / 3,
            y = (u.y + v.y + w.y) / 3;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          const ruido = Math.sin(cx * 0.37) + Math.sin(cz * 0.41 + cx * 0.13);
          let color: string;
          if (radioRoja(cx, cz) < 19 && y > 0.5)
            color = ['#6b3428', '#7a3c2c', '#8c4934', '#9d5a3e'][Math.min(3, Math.floor(y / 3.5 + ruido * 0.4 + 0.6))];
          else if (cx > 6 && y > 1)
            color = Math.abs(normal.y) < 0.8 ? '#6e5440' : ['#8d6f50', '#9c7e5a', '#a88b66'][Math.min(2, Math.floor(y / 4))];
          else color = ruido > 0.7 ? '#2f2a29' : ruido < -0.9 ? '#6d5643' : '#4a413c';
          if (!capas.has(color)) capas.set(color, []);
          for (const q of [u, v, w]) capas.get(color)!.push(q.x, q.y, q.z);
        }
      }
    for (const [color, vertices] of capas) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      pieza(geo, color, 0, 0, 0, 1, 1, 1);
      geo.dispose();
    }
  }
  // La carretera de detrás del pueblo y las urbanizaciones de casas bajas y blancas por los llanos.
  superficie(caja, asfalto, -1, -0.02, -14.4, 94, 0.06, 1.4, 5);
  for (let x = -46; x <= 44; x += 9) pieza(caja, '#e8e4da', x, 0.02, -14.4, 1.4, 0.02, 0.08);
  function bungalow(x: number, z: number, w: number, h: number, d: number, tinte: string) {
    const y = fondo(x, z) - 0.05;
    pieza(caja, blanco, x, y + h / 2, z, w, h, d);
    pieza(caja, '#efeae0', x, y + h + 0.08, z, w + 0.12, 0.16, d + 0.12);
    for (const s of [-1, 1]) pieza(caja, tinte, x + s * w * 0.27, y + h * 0.55, z + d / 2 + 0.02, 0.5, Math.min(0.7, h * 0.32), 0.04);
    pieza(caja, tinte, x, y + 0.45, z + d / 2 + 0.02, 0.42, 0.9, 0.04);
  }
  const solares: [number, number][] = [];
  for (let fila = 0; fila < 5; fila++)
    for (let x = -70 + (fila % 2) * 2; x < 70; x += 3.6 + azar() * 1.4) solares.push([x, -17.5 - fila * 4]);
  // A los lados del pueblo, las urbanizaciones bajan hasta la costa.
  for (const z of [-3, -7.5, -12])
    for (let x = -70; x < 70; x += 3.6 + azar() * 1.4) if (x < -50 || (x > 55 && z < -2)) solares.push([x, z]);
  for (const [x, zFila] of solares) {
    const z = zFila + (azar() - 0.5) * 0.8;
    if (azar() < 0.22 || radioRoja(x, z) < 20 || Math.hypot(x, z) > 66 || fondo(x, z) > 2.2) continue;
    bungalow(x, z, 2.5 + azar() * 1.1, azar() < 0.35 ? 2.9 : 1.8, 2.3 + azar() * 0.6, azar() < 0.7 ? verde : azar() < 0.5 ? azul : madera);
    // Jardín de picón con una palmera o un cardón.
    if (azar() < 0.4) pieza(esfera, '#3f6b3a', x + 1.7, fondo(x, z) + 0.4, z + 1.6, 0.45, 0.6, 0.45);
  }

  // --- Suelo del pueblo y de los muelles: la tierra queda a ras del paseo (y = 0) ---
  pieza(caja, '#857c71', -1, -0.72, -6, 94, 1.4, 14); // casco y primeras filas, hasta z = 1
  pieza(caja, '#5a504a', -60, -0.72, -6.5, 24, 1.4, 13); // hacia Pechiguera
  pieza(caja, '#5a504a', 57.25, -0.72, -3.2, 29.5, 1.4, 19.6); // hacia Papagayo, tras la punta
  pieza(caja, '#857c71', -30, -0.72, 1.25, 16, 1.4, 0.5); // paseo del puerto
  pieza(caja, '#857c71', 10, -0.72, 1.75, 24, 1.4, 1.5); // paseo de la punta y de Playa Dorada
  pieza(caja, '#857c71', 32.25, -0.72, 3, 20.5, 1.4, 4); // muelle norte de la marina
  pieza(caja, muelle, -42, -0.75, 10.5, 8, 1.4, 19); // explanada del puerto
  pieza(caja, muelle, -32.5, -0.75, 21.75, 27, 1.4, 3.5); // muelle del ferry
  pieza(caja, muelle, -32.5, -0.75, 11.75, 11, 1.4, 1.5); // muelle de la dársena pesquera
  pieza(caja, muelle, -27.75, -0.75, 8.5, 1.5, 1.4, 5); // su codo
  pieza(caja, muelle, 25.75, -0.75, 9, 6.5, 1.4, 8); // muelle de poniente de la marina
  pieza(caja, muelle, 41.25, -0.75, 12.75, 2.5, 1.4, 15.5); // muelle de levante
  pieza(caja, muelle, 32.25, -0.75, 18.75, 20.5, 1.4, 3.5); // dique de la marina
  // Firmes: asfalto en el puerto y el dique, losetas rojizas en paseos y plazas, hormigón en los muelles.
  superficie(caja, asfalto, -42, -0.03, 9.25, 8, 0.08, 21.5, 5);
  superficie(caja, asfalto, -32.5, -0.03, 21.75, 27, 0.08, 3.5, 5);
  superficie(caja, hormigon, -32.5, -0.03, 11.75, 11, 0.08, 1.5, 4);
  superficie(caja, hormigon, -27.75, -0.03, 8.5, 1.5, 0.08, 5, 4);
  superficie(caja, losetas, -29, -0.03, 0, 18, 0.08, 3, 2.6);
  superficie(caja, losetas, -12, -0.03, -0.75, 20, 0.08, 3.5, 2.6);
  superficie(caja, losetas, -3, -0.035, -5.4, 9, 0.08, 5.8, 2.6);
  superficie(caja, losetas, 3.25, -0.03, 0.75, 10.5, 0.08, 3.5, 2.6);
  superficie(caja, losetas, 15.5, -0.03, 1.25, 15, 0.08, 2.5, 2.6);
  superficie(caja, hormigon, 32.25, -0.03, 3.75, 20.5, 0.08, 2.5, 4);
  superficie(caja, hormigon, 25.75, -0.03, 9, 6.5, 0.08, 8, 4);
  superficie(caja, hormigon, 41.25, -0.03, 12.75, 2.5, 0.08, 15.5, 4);
  superficie(caja, asfalto, 32.25, -0.03, 18.75, 20.5, 0.08, 3.5, 5);
  // Callejas del casco entre las casas, hacia la carretera.
  for (const x of [-33, -22.5, -14.4, 6.5, 20.6, 27.2])
    superficie(caja, asfalto, x, -0.02, -9.5, 1.2, 0.05, 8, 5);

  // --- Orillas de lava negra: bajan del paseo al agua entre rocas y espuma ---
  function orilla(x0: number, x1: number, z0: number, ancho: number) {
    const giro = Math.atan2(0.95, ancho),
      largo = Math.hypot(ancho, 0.95);
    const yc = -0.05 - 0.25 * Math.cos(giro) - (largo / 2) * Math.sin(giro);
    superficie(caja, lava, (x0 + x1) / 2, yc, z0 + ancho / 2, x1 - x0, 0.5, largo, 5, giro);
    for (let i = 0; i < (x1 - x0) * 3.5; i++) {
      const k = azar(),
        x = x0 + azar() * (x1 - x0);
      piedra(x, -0.15 - k * 0.8, z0 + 0.3 + k * ancho, 0.3 + azar() * 0.55);
    }
    for (let i = 0; i < (x1 - x0) * 1.2; i++)
      pieza(esfera, '#f1f4f1', x0 + azar() * (x1 - x0), -0.82, z0 + ancho * (0.85 + azar() * 0.3), 0.4 + azar() * 0.5, 0.05, 0.16);
  }
  orilla(-22, -17, 1, 2.6);
  orilla(-8.5, -2, 1, 2.6);
  orilla(-2, 9, 2.5, 2.4);
  orilla(19.5, 22.5, 2.5, 2.2);
  orilla(-38, -22, 1.5, 0.9); // pie del paseo en la dársena pesquera
  orilla(-72, -48, 0, 2.6);
  orilla(53, 72, 6.6, 2.6);
  /** Pretil de piedra volcánica, el muro bajo de bloques negros que bordea los paseos. */
  function pretil(x0: number, x1: number, z: number) {
    superficie(caja, mamposteria, (x0 + x1) / 2, 0.3, z, x1 - x0, 0.6, 0.38, 0.9);
    pieza(caja, '#5f5854', (x0 + x1) / 2, 0.63, z, x1 - x0 + 0.04, 0.07, 0.44);
  }
  pretil(-22, -17, 1.15);
  pretil(-8.5, -2, 1.15);
  pretil(-2, 9, 2.65);
  pretil(19.5, 22, 2.65);
  // Farolas, bancos de madera mirando al mar y palmeras en sus alcorques.
  for (const [x, z] of [
    [-36, 1.2],
    [-29, 1.2],
    [-22.3, 0.7],
    [-15, 0.75],
    [-10.5, 0.75],
    [-4.5, 0.7],
    [1.5, 2.2],
    [7, 2.2],
    [12, 2.2],
    [17, 2.2],
    [23.5, 4.6],
    [29.5, 4.6],
    [36, 4.6],
    [-6.6, -3],
    [0.6, -3],
    [-44, 0],
    [-39, 10],
    [-30, 22.9],
    [33, 20],
  ])
    farol(x, z);
  function banco(x: number, z: number) {
    pieza(caja, madera, x, 0.42, z, 1.5, 0.07, 0.45);
    pieza(caja, madera, x, 0.7, z - 0.22, 1.5, 0.32, 0.06);
    for (const dx of [-0.62, 0.62]) pieza(caja, '#2e2b2a', x + dx, 0.21, z, 0.08, 0.42, 0.42);
  }
  for (const [x, z] of [
    [-19.5, 0.2],
    [-5.2, 0.2],
    [3.5, 1.9],
    [-2.5, -3.4],
    [26, 4.3],
  ])
    banco(x, z);
  for (const [x, z] of [
    [-21.2, 0.4],
    [-7.9, 0.4],
    [-17.6, 0.5],
    [8.6, 0.4],
    [20.4, 0.4],
    [-6.9, -7.7],
    [0.9, -7.7],
  ])
    pieza(caja, '#3b3532', x, 0.05, z, 0.85, 0.12, 0.85);

  // --- Puerto del ferry: explanada, muelle en L, escollera y la dársena pesquera ---
  // Escollera de bloques por fuera, al oeste y al sur, con un espaldón bajo de hormigón.
  pieza(caja, '#cfc8bb', -46.25, 0.45, 11, 0.5, 0.9, 25);
  pieza(caja, '#cfc8bb', -32.6, 0.45, 23.75, 27.8, 0.9, 0.5);
  pieza(caja, '#e2dccf', -46.25, 0.95, 11, 0.62, 0.1, 25);
  pieza(caja, '#e2dccf', -32.6, 0.95, 23.75, 27.9, 0.1, 0.62);
  for (let i = 0; i < 150; i++) {
    const oeste = i < 60,
      lejos = azar() * 2.4;
    const x = oeste ? -47 - lejos : -46 + azar() * 27.5,
      z = oeste ? -1 + azar() * 25 : 24.5 + lejos;
    const s = 0.75 + azar() * 0.45;
    pieza(caja, ['#a9a49c', '#9b968f', '#b4afa6'][i % 3], x, 0.25 - lejos * 0.45, z, s, s, s, azar(), azar(), azar());
  }
  // Morro del muelle del ferry, con su baliza roja.
  pieza(poste, muelle, -19, -0.72, 21.75, 3.6, 1.5, 3.6);
  pieza(poste, '#6a6663', -19, 0.03, 21.75, 3.4, 0.08, 3.4);
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#c23a2e', -18.4, 0.45 + j * 0.7, 22.4, 0.85 - j * 0.07, 0.7, 0.85 - j * 0.07);
  ventanas.push([-18.4, 3.3, 22.4, 0.34, 0.42, 0.34]);
  pieza(piramide, '#c23a2e', -18.4, 3.72, 22.4, 0.38, 0.38, 0.38, 0, Math.PI / 4);
  // Rayas de los carriles de embarque y de los aparcamientos.
  for (const x of [-44.5, -43, -41.5, -40]) pieza(caja, '#e3b53c', x, 0.025, 14.5, 0.08, 0.02, 9);
  for (let z = 1; z < 7; z += 1.2) pieza(caja, '#e8e4da', -38.8, 0.025, z, 1.6, 0.02, 0.07);
  for (let x = -44; x < -21; x += 2.4) pieza(caja, '#e8e4da', x, 0.025, 21.9, 1.2, 0.02, 0.09);
  // Marquesina blanca sobre los carriles y taquillas de las navieras.
  for (const x of [-44.7, -39.8]) for (const z of [10.6, 14.5, 18.4]) pieza(poste, '#e9e6de', x, 1.15, z, 0.1, 2.3, 0.1);
  pieza(caja, '#f4f1ea', -42.25, 2.35, 14.5, 5.6, 0.14, 8.6);
  pieza(caja, '#c7c2b8', -42.25, 2.25, 14.5, 5.4, 0.06, 8.4);
  for (const [z, color] of [
    [8.2, '#c3282d'],
    [9.4, azul],
  ] as [number, string][]) {
    pieza(caja, '#f4f1ea', -39.2, 0.65, z, 0.95, 1.3, 0.95);
    pieza(caja, color, -39.2, 1.34, z, 1.05, 0.12, 1.05);
    pieza(caja, color, -38.72, 0.75, z, 0.04, 0.12, 0.9);
    ventanas.push([-38.71, 0.95, z, 0.04, 0.32, 0.55]);
  }
  // Rampa por la que entran los coches al ferry, con su pórtico rojo y las defensas negras.
  pieza(caja, '#77736e', -38.25, -0.1, 18, 1.2, 0.12, 3, 0, 0, -0.12);
  for (const z of [16.55, 19.45]) {
    pieza(caja, '#f2c230', -38.25, 0.25, z, 1.2, 0.06, 0.06, 0, 0, -0.12);
    pieza(caja, '#b8322b', -38.75, 1.3, z, 0.18, 2.6, 0.18);
  }
  pieza(caja, '#b8322b', -38.75, 2.55, 18, 0.18, 0.18, 3.1);
  for (const z of [15.6, 20.3]) pieza(poste, '#1f1d1c', -37.85, -0.1, z, 0.75, 1.2, 0.75, Math.PI / 2);
  for (let x = -36; x <= -21; x += 3) {
    pieza(poste, '#2b2b2b', x, 0.2, 20.25, 0.28, 0.4, 0.28);
    pieza(caja, '#1f1d1c', x + 1.5, -0.3, 19.95, 0.5, 0.7, 0.2);
  }
  // Torres de luz del puerto.
  for (const [x, z] of [
    [-45.4, 2],
    [-45.4, 19],
    [-26, 23.1],
  ]) {
    pieza(poste, '#c9cbc8', x, 2.4, z, 0.16, 4.8, 0.16);
    pieza(caja, '#4e5254', x, 4.85, z, 0.7, 0.18, 0.4);
    ventanas.push([x, 4.72, z, 0.6, 0.06, 0.3]);
  }
  // Dársena pesquera: pantalanes flotantes y la baliza verde en el codo del muelle.
  for (const x of [-35, -31.5]) {
    pieza(caja, '#5d6b72', x, -0.72, 4.75, 0.8, 0.18, 6.5);
    pieza(caja, '#b7ab98', x, -0.6, 4.75, 0.9, 0.08, 6.6);
    for (const z of [3, 5.5, 7.8]) pieza(poste, '#55606a', x + 0.5, -0.35, z, 0.14, 1.1, 0.14);
  }
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#2e8b57', -27.75, 0.4 + j * 0.55, 6.4, 0.55 - j * 0.05, 0.55, 0.55 - j * 0.05);
  ventanas.push([-27.75, 2.55, 6.4, 0.24, 0.3, 0.24]);
  pieza(piramide, '#2e8b57', -27.75, 2.88, 6.4, 0.28, 0.28, 0.28, 0, Math.PI / 4);
  for (let x = -37; x <= -29; x += 2) pieza(poste, '#2b2b2b', x, 0.2, 11.15, 0.2, 0.4, 0.2);
  // La estación marítima: marquesina sobre su puerta.
  pieza(caja, '#f4f1ea', -42.5, 2.3, 6.75, 6.2, 0.12, 1.1);
  for (const x of [-45.2, -39.8]) pieza(poste, '#e9e6de', x, 1.15, 7.2, 0.08, 2.3, 0.08);

  // --- La playa del Pueblo: arena clara al pie del casco viejo ---
  {
    const giro = Math.atan2(0.85, 5.5);
    superficie(caja, arenaPueblo, -12.75, -0.8, 4.4, 8.5, 0.6, 7, 4, giro);
    // Las dos puntas de lava que la cierran.
    for (let i = 0; i < 40; i++) {
      const oeste = i % 2 === 0;
      piedra(oeste ? -17.5 + azar() * 1.2 : -8.9 + azar() * 1.2, -0.3 - azar() * 0.5, 1.5 + azar() * 5, 0.35 + azar() * 0.6);
    }
    for (let i = 0; i < 26; i++) pieza(esfera, '#f6f8f5', -16.5 + azar() * 7.5, -0.83, 6.3 + azar() * 0.9, 0.5 + azar() * 0.6, 0.05, 0.16);
  }

  // --- Iglesia de Nuestra Señora del Carmen: blanca, con espadaña de dos campanas y cantería ---
  const cantera = '#cdb894';
  {
    const ix = -3,
      frente = -8.3,
      iz = frente - 2.5;
    pieza(caja, blanco, ix, 1.6, iz, 4.2, 3.2, 5);
    pieza(caja, '#efe9dc', ix, 3.24, iz, 4.3, 0.1, 5.1);
    // Contrafuertes escalonados en los costados.
    for (const s of [-1, 1])
      for (const z of [frente - 1.2, frente - 2.6, frente - 4]) {
        pieza(caja, blanco, ix + s * 2.25, 1.1, z, 0.34, 2.2, 0.5);
        pieza(caja, blanco, ix + s * 2.17, 2.45, z, 0.2, 0.7, 0.5);
        // Ventanas en arco entre los contrafuertes.
        pieza(caja, '#33302d', ix + s * 2.11, 2, z - 0.7, 0.04, 0.7, 0.36);
        pieza(caja, cantera, ix + s * 2.105, 2.4, z - 0.7, 0.04, 0.1, 0.5);
      }
    // Portada: arco de cantería y puerta de madera; encima, la cruz oscura.
    pieza(caja, cantera, ix, 0.95, frente + 0.03, 1.4, 1.9, 0.08);
    pieza(disco, cantera, ix, 1.9, frente + 0.03, 0.7, 0.08, 0.7, Math.PI / 2);
    pieza(caja, '#6b4a32', ix, 0.88, frente + 0.08, 0.98, 1.76, 0.06);
    pieza(disco, '#6b4a32', ix, 1.76, frente + 0.08, 0.49, 0.06, 0.49, Math.PI / 2);
    pieza(caja, '#3a2f2a', ix, 2.75, frente + 0.05, 0.08, 0.7, 0.05);
    pieza(caja, '#3a2f2a', ix, 2.88, frente + 0.05, 0.42, 0.07, 0.05);
    ventanas.push([ix + 1.05, 2.15, frente + 0.12, 0.16, 0.22, 0.16]);
    // Espadaña: tres pilares con remates, dos huecos en arco con sus campanas y la cornisa.
    const ey = 3.2,
      ez = frente - 0.2;
    pieza(caja, blanco, ix, ey + 0.2, ez, 1.9, 0.4, 0.42);
    for (const dx of [-0.78, 0, 0.78]) {
      pieza(caja, blanco, ix + dx, ey + 0.85, ez, 0.3, 0.9, 0.42);
      pieza(caja, cantera, ix + dx, ey + 1.33, ez, 0.36, 0.08, 0.46);
    }
    pieza(caja, blanco, ix, ey + 1.5, ez, 1.9, 0.26, 0.42);
    pieza(caja, cantera, ix, ey + 1.66, ez, 2, 0.07, 0.48);
    for (const dx of [-0.39, 0.39]) pieza(esfera, '#7f6331', ix + dx, ey + 0.98, ez, 0.17, 0.21, 0.17);
    for (const dx of [-0.9, 0, 0.9]) {
      pieza(caja, blanco, ix + dx, ey + 1.82, ez, 0.18, 0.26, 0.18);
      pieza(esfera, blanco, ix + dx, ey + 2.02, ez, 0.11, 0.11, 0.11);
    }
    // Atrio con su murete blanco y dos peldaños.
    for (const [x0, x1] of [
      [-5.3, -3.7],
      [-2.3, -0.7],
    ]) {
      pieza(caja, blanco, (x0 + x1) / 2, 0.28, -7.05, x1 - x0, 0.56, 0.2);
      pieza(caja, blanco, x0 === -5.3 ? x0 + 0.1 : x1 - 0.1, 0.28, -7.65, 0.2, 0.56, 1.2);
      pieza(caja, '#efe9dc', (x0 + x1) / 2, 0.59, -7.05, x1 - x0 + 0.06, 0.06, 0.26);
    }
    pieza(caja, '#e9e2d4', ix, 0.05, -7.7, 1.4, 0.1, 1.2);
  }
  // Laureles de indias de la plaza, en sus alcorques.
  for (const [x, z] of [
    [-6.6, -4.4],
    [0.6, -4.4],
  ]) {
    pieza(caja, '#3b3532', x, 0.05, z, 0.85, 0.12, 0.85);
    pieza(poste, '#6b5444', x, 0.8, z, 0.16, 1.6, 0.16);
    for (let k = 0; k < 6; k++)
      pieza(esfera, k % 2 ? '#3f6b3a' : '#527d44', x + (azar() - 0.5) * 0.9, 1.9 + azar() * 0.5, z + (azar() - 0.5) * 0.9, 0.6, 0.5, 0.6);
  }

  // --- Casas del casco y del paseo: blancas, de azotea, con carpintería verde, azul o de tea ---
  const tonos = [verde, azul, verde, madera];
  casa(-35, -3.4, 3.6, 2.7, 3.2, azul);
  casa(-23.6, -3.4, 2.8, 3.4, 3.2, madera);
  [-36.4, -32.4, -28.4, -24.4, -20.2, -16.2, -12.4].forEach((x, i) =>
    casa(x, -9.6, 3.6, 3.4 + ((i * 5) % 3) * 0.85, 3.6, tonos[i % 4]),
  );
  casa(-8.9, -10.6, 3.4, 3.4, 3.4, verde);
  casa(3.8, -8.8, 3.6, 2.7, 3.4, azul);
  casa(7.7, -3, 3.2, 3.4, 3.2, verde);
  casa(8.2, -8.8, 3.8, 4.4, 3.4, madera);
  // Detrás de Playa Dorada, apartamentos escalonados sobre la lava, con jardines de picón rojo.
  [12.5, 17].forEach((x, i) => casa(x, -6.8, 4.2, 4.2 + i * 0.8, 3.4, tonos[(i + 2) % 4]));
  pieza(caja, '#7b3f2f', 15, -0.05, -4.3, 10, 0.12, 1.4);
  for (let i = 0; i < 18; i++) pieza(esfera, i % 3 ? '#3f6b3a' : '#7a8a46', 9.8 + azar() * 10.4, 0.2, -4.3 + (azar() - 0.5) * 1, 0.3, 0.35, 0.3);
  [21.5, 25.6].forEach((x, i) => casa(x, -3.6, 3.6, 3.4 + i * 0.85, 3.2, tonos[(i + 1) % 4]));
  // Tras las tiendas de la marina, un bloque con una cúpula blanca en la azotea.
  casa(31.5, -4.4, 4.2, 3.4, 3.2, verde);
  casa(36, -4.4, 4.2, 4.2, 3.2, azul);
  pieza(cupula, '#f7f4ec', 36, 4.35, -4.4, 0.9, 0.75, 0.9);
  // Toldos y veladores de las terrazas del paseo.
  const sombrilla = new T.ConeGeometry(1, 1, 8);
  for (const [i, [x, z]] of [
    [-18, -1.5],
    [-14.3, -1.5],
    [-10.7, -1.5],
    [5.6, 0.1],
    [33.4, 3.3],
    [37.6, 3.3],
  ].entries()) {
    pieza(poste, '#e9e6de', x, 0.95, z, 0.06, 1.9, 0.06);
    pieza(sombrilla, i % 2 ? verde : '#f4efe2', x, 1.98, z, 0.95, 0.32, 0.95);
    pieza(poste, '#e9e6de', x, 0.62, z, 0.7, 0.05, 0.7);
    for (const dx of [-0.48, 0.48]) pieza(poste, madera, x + dx, 0.2, z, 0.24, 0.4, 0.24);
  }

  // --- Playa Dorada: arena dorada entre dos escolleras, con hamacas amarillas y sombrillas azules ---
  {
    // La arena baja del paseo a una orilla en media luna, que se mete hacia tierra en el centro.
    const orillaDorada = (x: number) => 8.4 - 1.5 * Math.sin((Math.PI * (x - 8.6)) / 11.4);
    const vertices: number[] = [];
    const punto = (i: number, j: number) => {
      const x = 8.6 + (i / 16) * 11.4,
        fin = orillaDorada(x) + 0.8,
        z = 2.5 + (j / 6) * (fin - 2.5);
      return [x, -0.9 * ((z - 2.5) / (orillaDorada(x) - 2.5)) - 0.02, z];
    };
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 6; j++) {
        const [a, b, c, d] = [punto(i, j), punto(i + 1, j), punto(i, j + 1), punto(i + 1, j + 1)];
        vertices.push(...a, ...c, ...b, ...b, ...c, ...d);
      }
    const media = new T.BufferGeometry();
    media.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    media.computeVertexNormals();
    superficie(media, arenaDorada, 0, 0, 0, 1, 1, 1, 4);
    media.dispose();
    // Escollera de poniente, que baja al mar y se dobla hacia el este, y la de levante.
    const escollera = (ax: number, az: number, bx: number, bz: number) => {
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) * 2.8);
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        for (let j = 0; j < 3; j++)
          piedra(ax + (bx - ax) * k + (azar() - 0.5) * 0.8, -0.3 + azar() * 0.3 - j * 0.22, az + (bz - az) * k + (azar() - 0.5) * 0.8, 0.3 + azar() * 0.28);
      }
    };
    escollera(8.4, 2.6, 8.2, 10.6);
    escollera(8.2, 10.6, 12.2, 11.2);
    escollera(20.4, 2.6, 20.6, 9.6);
    escollera(20.6, 9.6, 17.8, 10.6);
    // El islote en medio de la bocana.
    for (let i = 0; i < 9; i++) piedra(15 + (azar() - 0.5) * 1.4, -0.3 + azar() * 0.3, 11.4 + (azar() - 0.5) * 1, 0.4 + azar() * 0.3);
    for (let i = 0; i < 34; i++) {
      const x = 9.4 + azar() * 9.8;
      pieza(esfera, '#f6f8f5', x, -0.83, orillaDorada(x) + 0.15 + azar() * 0.5, 0.5 + azar() * 0.6, 0.05, 0.16);
    }
    for (const z of [3.9, 5.4])
      for (let x = 10.2; x < 19; x += 1.15) {
        const caida = 0.9 / (orillaDorada(x) - 2.5),
          y = -(z - 2.5) * caida;
        pieza(poste, '#e9e6de', x, y + 0.85, z, 0.05, 1.7, 0.05);
        pieza(sombrilla, '#2552a3', x, y + 1.72, z, 0.62, 0.24, 0.62);
        for (const dx of [-0.27, 0.27]) pieza(caja, '#f0c23a', x + dx, y + 0.14, z + 0.45, 0.38, 0.06, 1.05, caida);
      }
  }

  // --- Marina Rubicón: pantalanes, capitanía con su torrecilla de cúpula roja y el dique ---
  for (const x of [31.2, 35.4, 39.2]) {
    pieza(caja, '#5d6b72', x, -0.72, 10.25, 0.8, 0.18, 10.5);
    pieza(caja, '#b7ab98', x, -0.6, 10.25, 0.9, 0.08, 10.6);
    for (const z of [6, 9, 12, 15]) pieza(poste, '#55606a', x + 0.48, -0.25, z, 0.16, 1.3, 0.16);
    for (const z of [10.5]) pieza(caja, '#b7ab98', x, -0.6, z, 3, 0.06, 0.4);
  }
  for (let x = 23; x <= 41; x += 2.2) pieza(poste, '#2b2b2b', x, 0.2, 17.2, 0.2, 0.4, 0.2);
  for (let z = 6; z <= 16; z += 2) pieza(poste, '#2b2b2b', 39.9, 0.2, z, 0.2, 0.4, 0.2);
  {
    // Torrecilla de la capitanía: tambor blanco, balconcillo y cúpula roja.
    const tx = 26.4,
      tz = 7.7,
      ty = 3.55;
    pieza(disco, blanco, tx, ty + 0.65, tz, 0.62, 1.3, 0.62);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ventanas.push([tx + Math.sin(a) * 0.6, ty + 0.75, tz + Math.cos(a) * 0.6, 0.18, 0.4, 0.18]);
    }
    pieza(disco, '#efeae0', tx, ty + 1.35, tz, 0.8, 0.1, 0.8);
    pieza(disco, blanco, tx, ty + 1.65, tz, 0.48, 0.5, 0.48);
    pieza(cupula, '#b8352c', tx, ty + 1.9, tz, 0.5, 0.42, 0.5);
    pieza(poste, '#e9e6de', tx, ty + 2.45, tz, 0.05, 0.3, 0.05);
    // Arcos blancos sobre las ventanas de la fachada al muelle.
    for (const dx of [-1.3, 1.3]) pieza(disco, '#e4dccb', 25.2 + dx, 2.45, 10.06, 0.42, 0.05, 0.42, Math.PI / 2);
  }
  // Dique de la marina: espaldón alto por fuera, escollera de roca y el helipuerto en su punta.
  pieza(caja, '#d8d1c3', 32.25, 0.6, 20.75, 20.5, 1.2, 0.5);
  pieza(caja, '#ebe4d6', 32.25, 1.25, 20.75, 20.6, 0.1, 0.66);
  for (let i = 0; i < 120; i++) {
    const lejos = azar() * 2.6;
    piedra(22 + azar() * 21, 0.3 - lejos * 0.5, 21.5 + lejos, 0.5 + azar() * 0.5);
  }
  for (let i = 0; i < 30; i++) {
    const a = Math.PI * (0.5 + azar()),
      r = 1.8 + azar() * 1.6;
    piedra(22 + Math.cos(a) * r, 0.1 - (r - 1.8) * 0.4, 18.75 + Math.sin(a) * r * 0.9, 0.5 + azar() * 0.4);
  }
  pieza(disco, '#e8e4da', 23.5, 0.02, 18.75, 1.5, 0.02, 1.5);
  pieza(disco, '#5f5c5a', 23.5, 0.025, 18.75, 1.3, 0.02, 1.3);
  for (const [x, w, d] of [
    [23.1, 0.12, 0.9],
    [23.9, 0.12, 0.9],
    [23.5, 0.8, 0.12],
  ])
    pieza(caja, '#e8e4da', x, 0.035, 18.75, w, 0.02, d);
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#2e8b57', 22.5, 0.4 + j * 0.55, 20.05, 0.5 - j * 0.05, 0.55, 0.5 - j * 0.05);
  ventanas.push([22.5, 2.55, 20.05, 0.22, 0.3, 0.22]);
  pieza(piramide, '#2e8b57', 22.5, 2.88, 20.05, 0.26, 0.26, 0.26, 0, Math.PI / 4);
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#c23a2e', 22.9, 0.4 + j * 0.55, 12.6, 0.5 - j * 0.05, 0.55, 0.5 - j * 0.05);
  ventanas.push([22.9, 2.55, 12.6, 0.22, 0.3, 0.22]);
  pieza(piramide, '#c23a2e', 22.9, 2.88, 12.6, 0.26, 0.26, 0.26, 0, Math.PI / 4);
  for (let x = 26; x < 42; x += 1.6) pieza(caja, '#e8e4da', x, 0.025, 19.6, 0.06, 0.02, 1.4);

  // --- La punta del Águila: lava rojiza y ocre que cae al mar, y el Castillo de las Coloradas ---
  {
    const subida = PUEBLOS['playa-blanca'].plano.suelos!.find((s) => s.eje === 'x')!;
    losa(t, subida, '#9d8467', 0.2);
    // Un lomo de roca rojiza que se asoma al mar en acantilado; al norte se junta con el llano.
    const punta = (x: number, z: number) => {
      const d = Math.hypot((x - 48.8) / 5.4, (z - 12.6) / 7.4) + 0.06 * Math.sin(x * 1.7 + z * 1.3);
      const lomo = d < 1 ? 1.4 + 0.12 * Math.sin(x * 2.1 + z) : 1.4 - (d - 1) * 11;
      return Math.max(lomo, z < 6.2 ? -0.02 : -1.6);
    };
    const alto = terreno(t, 'playa-blanca', [41, 3, 58, 24], punta, tenido(basalto, '#9a5f43'), 1.1);
    superficie(caja, tenido(cal, '#b49c82'), 48.75, 1.44, 13, 5.8, 0.08, 10.2, 4);
    // Estratos del acantilado: rojo, ocre y lava oscura, con bloques caídos al pie.
    const estratos = ['#4a3a33', '#a4512f', '#b5703f', '#8c4630', '#c08a55'];
    for (let i = 0; i < 90; i++) {
      // Por el este y el sur, que es donde la punta cae al mar.
      const a = azar() * 2.5 - 0.45,
        x = 48.8 + Math.cos(a) * 5.7,
        z = 12.6 + Math.sin(a) * 7.8;
      const y = -0.7 + azar() * 1.7;
      pieza(prisma, estratos[Math.min(4, Math.floor((y + 0.7) / 0.45))], x, y, z, 0.6 + azar() * 0.7, 0.4 + azar() * 0.5, 0.6 + azar() * 0.6, 0, azar() * 3);
    }
    for (let i = 0; i < 26; i++) {
      const a = azar() * Math.PI * 1.1,
        x = 48.8 + Math.cos(a) * 6.6,
        z = 12.6 + Math.sin(a) * 8.6;
      piedra(x, -0.75, z, 0.35 + azar() * 0.45);
      pieza(esfera, '#f6f8f5', x + 0.4, -0.82, z + 0.4, 0.6 + azar() * 0.6, 0.05, 0.18);
    }
    // Tabaibas y aulagas sobre el lomo.
    for (let i = 0; i < 12; i++) {
      const x = 45.8 + azar() * 6,
        z = 16.4 + azar() * 2.2;
      pieza(esfera, i % 2 ? '#7a8a46' : '#5f7a3e', x, alto(x, z) + 0.12, z, 0.3, 0.25, 0.3);
    }
  }
  {
    // Torre troncocónica de mampostería negra con su cordón, la espadaña con la campana y la cruz,
    // la puerta en alto sobre la escalera de piedra y el puente levadizo.
    const cx = 49.3,
      cz = 12.8,
      cy = 1.5;
    const torre = new T.CylinderGeometry(1.8, 2.12, 3.6, 22);
    superficie(torre, tenido(adoquin, '#4a4846'), cx, cy + 1.8, cz, 1, 1, 1, 0.75);
    torre.dispose();
    pieza(disco, '#3a3532', cx, cy + 0.12, cz, 2.2, 0.24, 2.2);
    const cordon = new T.TorusGeometry(1.86, 0.07, 5, 28);
    pieza(cordon, '#3f3a37', cx, cy + 3.25, cz, 1, 1, 1, Math.PI / 2);
    cordon.dispose();
    pieza(disco, '#4b4541', cx, cy + 3.75, cz, 1.84, 0.3, 1.84);
    pieza(disco, '#cfc6b8', cx, cy + 3.91, cz, 1.78, 0.04, 1.78);
    // Espadaña de piedra oscura sobre el lado de la puerta.
    const ex = cx - 1.05,
      ey = cy + 3.9;
    pieza(caja, '#3f3a37', ex, ey + 0.2, cz, 0.78, 0.4, 0.42);
    for (const dx of [-0.3, 0.3]) pieza(caja, '#3f3a37', ex + dx, ey + 0.75, cz, 0.18, 0.75, 0.42);
    pieza(caja, '#3f3a37', ex, ey + 1.2, cz, 0.8, 0.16, 0.44);
    pieza(esfera, '#8a6a2e', ex, ey + 0.72, cz, 0.12, 0.16, 0.12);
    for (const dx of [-0.34, 0.34]) pieza(esfera, '#3f3a37', ex + dx, ey + 1.34, cz, 0.08, 0.1, 0.08);
    pieza(caja, '#2a2523', ex, ey + 1.58, cz, 0.05, 0.5, 0.05);
    pieza(caja, '#2a2523', ex, ey + 1.66, cz, 0.28, 0.05, 0.05);
    // Puerta en alto, con su lápida encima.
    pieza(caja, '#3b2a20', cx - 1.99, cy + 1.85, cz, 0.08, 1.05, 0.62);
    pieza(caja, '#cfc6b8', cx - 1.97, cy + 2.55, cz, 0.06, 0.24, 0.5);
    // Escalera exenta de cinco peldaños, su rellano y el puente levadizo con sus cadenas.
    for (let k = 0; k < 5; k++) pieza(caja, '#4b4541', 46 + k * 0.11, cy + 0.13 * (k + 1), cz, 0.12, 0.26 * (k + 1), 1.1);
    superficie(caja, mamposteria, 46.75, cy + 0.65, cz, 0.5, 1.3, 1.15, 0.8);
    pieza(caja, '#6b4a32', 47.15, cy + 1.32, cz, 0.36, 0.06, 0.7);
    for (const dz of [-0.3, 0.3]) pieza(caja, '#2a2523', 47.15, cy + 1.85, cz + dz, 0.03, 1.1, 0.03, 0, 0, -0.3);
  }

  // --- Enfrente, al otro lado de La Bocaina: el islote de Lobos y la costa norte de Fuerteventura ---
  // Mucho más cerca de lo que están (unos 12 km hasta Corralejo), para que entren en cuadro al mirar al
  // sur; los tonos lavados por la calima hacen de distancia. Cada uno en su rumbo real desde el pueblo.
  {
    const enRumbo = (a: number, r: number) => [Math.sin(a) * r, Math.cos(a) * r];
    // Lobos: malpaís bajo y, en su lado de poniente, la montaña de la Caldera, mordida por el mar.
    const [lx, lz] = enRumbo(0.2, 39);
    pieza(esfera, '#cbbcaa', lx, -0.8, lz, 6.5, 0.85, 3.6, 0, 0.3);
    pieza(esfera, '#d0c1af', lx - 2, -0.7, lz + 1, 3.4, 0.9, 2.4);
    pieza(cono, '#bba595', lx - 2.6, 0.9, lz + 1.4, 2.6, 2.9, 2.4);
    pieza(cono, '#c3ae9e', lx - 1.2, 0.35, lz + 0.8, 1.6, 1.6, 1.5);
    pieza(poste, '#f4f1ea', lx + 4.6, 0.1, lz - 1.3, 0.22, 0.8, 0.22);
    ventanas.push([lx + 4.6, 0.6, lz - 1.3, 0.2, 0.2, 0.2]);
    // Fuerteventura: costa baja con lomas y conos volcánicos de suroeste a sur, las dunas blancas de
    // Corralejo detrás de Lobos y el pueblo blanco junto al agua.
    const capas = new Map<string, number[]>();
    const dunas = (a: number) => a > -0.12 && a < 0.12;
    const punto = (a: number, r: number): T.Vector3 => {
      const [x, z] = enRumbo(a, r);
      const dentro = (r - 47) / 10;
      const conos = 2.6 * Math.max(0, Math.sin(a * 11 + 1.3)) ** 4;
      const y = dunas(a)
        ? -0.6 + dentro * 1.1 + 0.2 * Math.sin(a * 70 + r)
        : -0.9 + dentro * (1.8 + 1.4 * Math.sin(a * 3.1 + 2) + conos) + 0.3 * Math.sin(a * 23 + r * 0.3);
      return new T.Vector3(x, y, z);
    };
    const pasos = 60;
    for (let i = 0; i < pasos; i++)
      for (let j = 0; j < 3; j++) {
        const a0 = -0.85 + (1.05 * i) / pasos,
          a1 = -0.85 + (1.05 * (i + 1)) / pasos;
        const r0 = 47 + j * 3.4,
          r1 = r0 + 3.4;
        const [p, q, u, w] = [punto(a0, r0), punto(a1, r0), punto(a0, r1), punto(a1, r1)];
        const color = dunas((a0 + a1) / 2) ? (j ? '#f2ebdd' : '#f6f0e4') : ['#d4c2b1', '#cbb7a5', '#c1ac9a'][j];
        if (!capas.has(color)) capas.set(color, []);
        for (const v of [p, u, q, q, u, w]) capas.get(color)!.push(v.x, v.y, v.z);
      }
    for (const [color, vertices] of capas) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      pieza(geo, color, 0, 0, 0, 1, 1, 1);
      geo.dispose();
    }
    // Corralejo, casitas blancas en la orilla.
    for (let i = 0; i < 9; i++) {
      const [x, z] = enRumbo(-0.24 + i * 0.02, 47.8 + (i % 3) * 0.9);
      pieza(caja, '#f6f2ea', x, -0.2, z, 0.9, 0.9, 0.7);
    }
  }
  for (const geo of [prisma, cono, cupula, disco, sombrilla]) geo.dispose();

  return {
    // Barquillos en la dársena pesquera y veleros abarloados a los pantalanes de la Marina Rubicón.
    amarres: [
      [0, -36.3, 3.6, Math.PI / 2],
      [2, -33.8, 3.2, Math.PI / 2],
      [0, -33.7, 6.4, -Math.PI / 2],
      [2, -30.2, 4.4, Math.PI / 2],
      [0, -36.2, 7.3, Math.PI / 2],
      [1, 30, 8.2, Math.PI / 2],
      [0, 32.4, 8, -Math.PI / 2],
      [1, 32.5, 13, -Math.PI / 2],
      [1, 34.2, 12.9, Math.PI / 2],
      [0, 36.6, 12.8, -Math.PI / 2],
      [1, 36.7, 7.9, -Math.PI / 2],
      [2, 38.1, 13.2, Math.PI / 2],
      [0, -10, 9.5, 0.6],
    ],
    // Dos barquillos varados en la playa del Pueblo.
    enSeco: [
      [0, -15.2, -0.3, 3, 1.4],
      [2, -10.3, -0.25, 2.7, 1.9],
    ],
    ferry: ferry(-30, 18, Math.PI / 2),
  };
}
