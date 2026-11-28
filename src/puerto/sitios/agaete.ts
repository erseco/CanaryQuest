import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Sitio, Taller } from '../maqueta';

/**
 * Puerto de las Nieves (Agaete, Gran Canaria), trazado sobre la ortofoto PNOA y comprimido a escala
 * de maqueta. Está girado un cuarto de vuelta respecto al mapa para que el mar abierto, que en Agaete
 * queda al oeste, esté delante (+z) como en los demás pueblos: el norte real apunta a −x y el sur a +x.
 * De izquierda a derecha, por tanto de norte a sur: las Salinas, el pueblo con su playa y la ermita,
 * la dársena tras el dique, el ferry de Tenerife, el muelle viejo, la playa de las Nieves y, al pie de
 * los riscos de Tamadaba, el Dedo de Dios. Las zonas pisables están en `PUEBLOS.agaete.plano.suelos`;
 * si se mueve una pieza por la que se camina, hay que mover allí su rectángulo.
 */
export function trazarAgaete(t: Taller): Sitio {
  const { pieza, superficie, casa, farol, azar, ventanas, blanco } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, basalto } = t.materiales;
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const m = base.clone();
    m.color.set(color);
    return m;
  };
  const hormigon = tenido(cal, '#c4bdb1'),
    asfalto = tenido(cal, '#6e6b68'),
    callao = tenido(basalto, '#4b4643'),
    lava = tenido(basalto, '#4a4442');
  const anil = '#1f4f9a',
    muelle = '#8d857a',
    piedra = '#7a6f66',
    granate = '#7a2b22';
  const prisma = new T.CylinderGeometry(0.62, 1, 1, 6);

  // --- Riscos de Tamadaba y la loma de la ermita: una malla de facetas que cae a pico al mar ---
  // Pie de los riscos, desde detrás de la playa de las Nieves hacia el sur (+x) y luego mar adentro.
  const pie: [number, number][] = [
    [-6, -7.2],
    [19.5, -7.2],
    [25, -4.4],
    [38, 1],
    [50, 12],
    [62, 26],
  ];
  /** Distancia con signo al pie de los riscos (positiva tierra adentro) y avance a lo largo de él. */
  const alPie = (x: number, z: number): [number, number] => {
    let mejor = Infinity,
      signo = 1,
      avance = 0,
      recorrido = 0;
    for (let i = 1; i < pie.length; i++) {
      const [ax, az] = pie[i - 1],
        [bx, bz] = pie[i];
      const dx = bx - ax,
        dz = bz - az,
        largo = Math.hypot(dx, dz);
      const k = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (largo * largo)));
      const d = Math.hypot(x - ax - dx * k, z - az - dz * k);
      if (d < mejor) {
        mejor = d;
        signo = dx * (z - az) - dz * (x - ax) < 0 ? 1 : -1;
        avance = recorrido + k * largo;
      }
      recorrido += largo;
    }
    return [mejor * signo, avance];
  };
  const suave = (v: number) => {
    const k = Math.min(1, Math.max(0, v));
    return k * k * (3 - 2 * k);
  };
  const altura = (x: number, z: number) => {
    const [d, s] = alPie(x, z);
    // Espolones y barrancos: el pie avanza y retrocede, y la cresta gana altura hacia el sur (+x),
    // de la loma del pueblo a las paredes de Tamadaba.
    const borde = d + 1.4 * Math.sin(s * 0.62) * Math.min(1, Math.max(0, d) / 3);
    const cresta =
      (6 + 6 * suave((s - 10) / 14) + 22 * suave((s - 28) / 22) + 2 * Math.sin(s * 0.45) + 1.5 * Math.sin(s * 0.9 + 1)) *
      suave((x + 2) / 10) *
      // Lejos, el macizo baja antes de llegar al horizonte pintado.
      suave((74 - Math.hypot(x, z)) / 16);
    const riscos =
      borde > 0
        ? cresta * (1 - Math.exp(-borde / 2.2)) +
          Math.max(0, borde - 5) * 0.12 * suave((74 - Math.hypot(x, z)) / 16) +
          0.5 * Math.sin(x * 0.9 + z * 0.5) * Math.min(1, borde / 2)
        : -1.3 + borde * 0.6;
    const r = Math.hypot((x + 1) / 8, (z + 16.5) / 7);
    const loma = r < 1 ? 8 * (1 - r * r) ** 0.75 : -2;
    // Detrás del pueblo sube el valle de Agaete.
    const tras = -18.5 - z;
    const valle =
      tras > 0
        ? (Math.min(13, tras * 0.6) + 1.2 * Math.sin(x * 0.3 + z * 0.2) * Math.min(1, tras / 4)) *
          suave((74 - Math.hypot(x, z)) / 16)
        : -2;
    return Math.max(riscos, loma, valle);
  };
  {
    const paso = 1.15,
      [x0, z0, x1, z1] = [-62, -62, 74, 34];
    const nx = Math.ceil((x1 - x0) / paso),
      nz = Math.ceil((z1 - z0) / paso);
    const p: T.Vector3[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + (i + (azar() - 0.5) * 0.35) * paso,
          z = z0 + (j + (azar() - 0.5) * 0.35) * paso;
        p.push(new T.Vector3(x, altura(x, z), z));
      }
    // Estratos de basalto y almagre por alturas, y monte verde donde la ladera se tumba.
    // Del pie oscuro y húmedo a las cornisas claras, con una franja de almagre a media altura.
    const estratos = ['#564c46', '#64574f', '#706258', '#7c6c60', '#946b55', '#857565', '#8f7f6d', '#998872'];
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
          // Ni el fondo del mar ni lo que asomaría por detrás del horizonte pintado.
          if (Math.max(u.y, v.y, w.y) < -1 || Math.hypot(u.x, u.z) > 76) continue;
          const y = (u.y + v.y + w.y) / 3,
            cx = (u.x + v.x + w.x) / 3;
          normal.subVectors(v, u).cross(lado.subVectors(w, u)).normalize();
          const color =
            Math.abs(normal.y) > 0.8 && y > 2.5
              ? y > 12 ? '#5f6e45' : '#7d8052'
              : y < 0.3
                ? '#4a4340'
                : estratos[Math.min(estratos.length - 1, Math.floor((y + 0.8 * Math.sin(cx * 0.35)) / 3.4) + 1)];
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
  // Monte verde en lo alto de los riscos y callaos al pie.
  for (let i = 0; i < 260; i++) {
    const x = -4 + azar() * 74,
      z = -58 + azar() * 80,
      [d] = alPie(x, z),
      y = altura(x, z);
    if (Math.hypot(x, z) > 74 || d < 7 || y < 6) continue;
    const r = 0.5 + azar() * 0.9;
    pieza(esfera, i % 3 ? '#7d8650' : '#97965e', x, y + 0.15, z, r * 1.3, r * 0.55, r);
  }
  for (let i = 0; i < 120; i++) {
    const s = azar() * 46,
      lado = azar();
    // Repartidos a lo largo del pie: primero tras la playa y luego bajo los riscos del sur.
    const [x, z] = s < 25.5 ? [-4 + s, -7.4 - lado * 0.7] : [19.5 + (s - 25.5) * 0.93, -7.2 + (s - 25.5) * 0.4 + lado];
    const r = 0.25 + azar() * 0.5;
    pieza(esfera, azar() > 0.5 ? '#3d3532' : '#57504b', x, -0.2 + azar() * 0.25, z, r, r * 0.7, r * 0.9);
  }
  // La loma de la ermita: corona de roca oscura y la cruz en lo alto.
  pieza(prisma, '#4b3c34', -1, 8.4, -16.5, 2.6, 2, 2.2, 0, 0.4);
  pieza(prisma, '#56463c', 0.6, 7.8, -16, 1.6, 1.6, 1.4, 0, 1.1);
  pieza(caja, '#3a332f', -1, 10.3, -16.5, 0.09, 1.6, 0.09);
  pieza(caja, '#3a332f', -1, 10.7, -16.5, 0.7, 0.09, 0.09);

  // --- Suelo del pueblo, del dique y de los muelles ---
  pieza(caja, '#9c9184', -18.5, -0.72, 6.5, 23, 1.4, 13); // pueblo junto a la playa
  pieza(caja, '#9c9184', -16.5, -0.72, -9, 27, 1.4, 18); // pueblo hacia la loma
  pieza(caja, '#958a7c', -40, -0.72, -12, 20, 1.4, 12); // tierras del norte, tras las Salinas
  pieza(caja, muelle, -10, -0.75, 15.5, 40, 1.4, 5); // dique
  pieza(caja, muelle, 17.8, -0.75, 15.5, 16.4, 1.4, 4.4); // muelle del ferry
  pieza(caja, muelle, 27.75, -0.75, 15.15, 3.7, 1.4, 5); // morro
  pieza(caja, muelle, 8.8, -0.75, 8.75, 1.6, 1.4, 8.5); // contradique
  pieza(caja, muelle, -3.75, -0.75, 11.25, 6.5, 1.4, 3.5); // explanada de la estación
  pieza(caja, piedra, -5, -0.75, 0.75, 4, 1.4, 1.5); // raíz del muelle viejo, bajo la plaza
  pieza(caja, piedra, 1.75, -0.75, 0.75, 9.5, 1.4, 1.5); // muelle viejo
  pieza(poste, piedra, 7.8, -0.72, 0.75, 3.2, 1.5, 3.2);
  superficie(caja, asfalto, -10, -0.04, 15.25, 40, 0.1, 4.5, 5);
  superficie(caja, asfalto, 17.8, -0.04, 15.5, 16.4, 0.1, 4, 5);
  pieza(caja, '#77736e', 27.75, -0.03, 15.15, 3.6, 0.08, 4.9);
  superficie(caja, hormigon, 8.8, -0.03, 8.75, 1.6, 0.08, 8.5, 4);
  superficie(caja, hormigon, -3.75, -0.03, 11.25, 6.5, 0.08, 3.5, 4);
  superficie(caja, hormigon, -20.5, -0.04, 9.5, 19, 0.1, 7, 4); // explanada
  superficie(caja, hormigon, -20.5, -0.04, -0.75, 19, 0.1, 2.5, 4); // calle de atrás
  superficie(caja, hormigon, -20.75, -0.04, 2, 2.5, 0.1, 8, 4); // travesía
  superficie(caja, asfalto, -11.75, -0.03, -10, 1.5, 0.08, 16, 5); // carretera
  superficie(caja, adoquin, -9, -0.035, 4.5, 4, 0.1, 17, 3.4); // paseo
  superficie(caja, adoquin, -7, -0.045, -1.25, 8, 0.1, 5.5, 3.4); // plaza
  superficie(caja, adoquin, -2.9, -0.04, -5.75, 1.8, 0.1, 3.5, 3.4); // bajada a la playa
  superficie(caja, tenido(adoquin, '#b7a58f'), 1.75, -0.03, 0.75, 9.5, 0.08, 1.5, 2.6);
  pieza(poste, '#a39584', 7.8, -0.01, 0.75, 3, 0.06, 3);
  // Rayas de la avenida del dique y pasos de cebra.
  for (let x = -29; x < 25; x += 2.4) pieza(caja, '#e8e4da', x, 0.02, 15.4, 1.2, 0.02, 0.1);
  for (const x of [-9, 6.5])
    for (let k = 0; k < 6; k++) pieza(caja, '#efebe1', x, 0.02, 13.6 + k * 0.7, 1.6, 0.02, 0.35);
  // Carriles de embarque del ferry, pintados de amarillo.
  for (const z of [14.6, 16.2]) pieza(caja, '#e3b53c', 18, 0.025, z, 14, 0.02, 0.1);

  // --- Dique: espaldón de hormigón y escollera de bloques cúbicos hacia el mar abierto ---
  pieza(caja, '#d2c9ba', -2.25, 0.62, 17.75, 57.5, 1.35, 0.5);
  pieza(caja, '#e5ddce', -2.25, 1.33, 17.75, 57.5, 0.1, 0.7);
  for (let x = -30; x <= 25; x += 5.5) pieza(caja, '#c4bbac', x, 0.62, 17.45, 0.12, 1.3, 0.12);
  for (let fila = 0; fila < 3; fila++)
    for (let x = -31.5 + (fila % 2) * 0.6; x < 31; x += 1.25) {
      const s = 1 + azar() * 0.2;
      pieza(
        caja,
        ['#a9a49c', '#9b968f', '#b4afa6'][Math.floor(azar() * 3)],
        x + (azar() - 0.5) * 0.3,
        0.55 - fila * 0.55 + azar() * 0.15,
        18.6 + fila * 1.05 + (azar() - 0.5) * 0.3,
        s,
        s,
        s,
        (azar() - 0.5) * 0.5,
        (azar() - 0.5) * 0.6,
        (azar() - 0.5) * 0.5,
      );
    }
  for (let i = 0; i < 40; i++) {
    const a = -Math.PI * 0.4 + azar() * Math.PI * 0.95,
      r = 3 + azar() * 1.8;
    const s = 0.9 + azar() * 0.3;
    pieza(caja, '#b3ac9f', 27.8 + Math.cos(a) * r, 0.2 - (r - 3) * 0.5, 15.1 + Math.sin(a) * r, s, s, s, azar(), azar(), azar());
  }
  // Baliza roja en el morro del dique.
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#c23a2e', 28.6, 0.45 + j * 0.75, 15.4, 0.95 - j * 0.07, 0.75, 0.95 - j * 0.07);
  ventanas.push([28.6, 3.5, 15.4, 0.36, 0.44, 0.36]);
  pieza(piramide, '#c23a2e', 28.6, 3.95, 15.4, 0.42, 0.4, 0.42, 0, Math.PI / 4);
  // Bolardos y defensas del muelle del ferry.
  for (let x = 11; x <= 26; x += 3) {
    pieza(poste, '#3b3b3b', x, 0.22, 13.75, 0.3, 0.44, 0.3);
    pieza(caja, '#2b2b2b', x + 1.5, -0.3, 13.2, 0.5, 0.7, 0.25);
  }
  // Rampa por la que se sube al ferry, de la esquina del contradique a su popa.
  pieza(caja, '#7f7b75', 10.05, -0.08, 11.25, 1.3, 0.1, 2.8, 0, 0, -0.1);
  for (const z of [9.9, 12.6]) pieza(caja, '#f2c230', 10.05, 0.35, z, 1.3, 0.06, 0.06, 0, 0, -0.1);

  // --- Dársena: pantalán flotante entre el dique y el muelle viejo ---
  pieza(caja, '#5d6b72', 3.75, -0.7, 9.25, 0.9, 0.2, 7.5);
  pieza(caja, '#b7ab98', 3.75, -0.56, 9.25, 1, 0.1, 7.6);
  for (const z of [6, 8.2, 10.4, 12.6]) pieza(poste, '#55606a', 3.75, -0.4, z, 0.16, 1.2, 0.16);
  pieza(caja, '#9a9184', 3.75, -0.25, 13.2, 1, 0.08, 0.9, 0.35); // pasarela desde el dique
  // Muelle viejo: piedra, bolardos de hierro y la baliza verde de la punta.
  for (let x = -2.5; x <= 6; x += 1.7)
    for (const z of [0.05, 1.45]) {
      pieza(poste, '#2f3a36', x, 0.2, z, 0.18, 0.4, 0.18);
      pieza(poste, '#2f3a36', x, 0.4, z, 0.24, 0.05, 0.24);
    }
  for (let j = 0; j < 4; j++)
    pieza(poste, j % 2 ? blanco : '#2e8b57', 8.4, 0.4 + j * 0.6, 0.75, 0.6 - j * 0.05, 0.6, 0.6 - j * 0.05);
  ventanas.push([8.4, 2.75, 0.75, 0.26, 0.32, 0.26]);
  pieza(piramide, '#2e8b57', 8.4, 3.1, 0.75, 0.3, 0.3, 0.3, 0, Math.PI / 4);

  // --- Playas de callaos: la del puerto, bajo el paseo, y la de las Nieves, bajo los riscos ---
  pieza(caja, '#4b4643', -5, -0.63, 4.75, 4.5, 0.6, 9.5, 0, 0, -0.16);
  superficie(caja, callao, 8.25, -0.64, -5.55, 23.5, 0.6, 4.2, 3.5, 0.21);
  for (let i = 0; i < 520; i++) {
    // Cantos rodados: claros y redondos, más grandes junto al agua.
    const enNieves = i % 3 !== 0;
    const x = enNieves ? -3 + azar() * 22.5 : -7 + azar() * 4,
      z = enNieves ? -7.2 + azar() * 3.9 : azar() * 9.5;
    const y = enNieves ? 0.05 - (z + 7) * 0.215 : -(x + 7) * 0.175;
    const r = 0.07 + azar() * 0.1;
    pieza(esfera, ['#5d5853', '#77716a', '#46413e', '#8a847c'][i % 4], x, y + r * 0.3, z, r * 1.2, r * 0.6, r);
  }
  // Espuma donde rompen las olas.
  for (let i = 0; i < 60; i++) {
    const x = -2.5 + azar() * 22,
      z = -3.4 + azar() * 0.5;
    pieza(esfera, '#f1f4f1', x, -0.8, z, 0.5 + azar() * 0.6, 0.05, 0.18);
  }
  // Boyas del baño frente a la playa de las Nieves.
  for (let i = 0; i <= 14; i++) pieza(esfera, '#f0b52e', 1 + i * 1.3, -0.8, 0.6 + Math.sin(i * 0.4) * 0.6, 0.12, 0.1, 0.12);

  // --- Las Salinas: tres piscinas excavadas en la lava, con almenas de roca frente al mar ---
  // Las piscinas quedan junto al mar del norte (−x); el solárium, del lado del pueblo.
  for (const [ax, az, bx, bz] of [
    [-47, 5.5, -30, 7],
    [-47, -6, -45.5, 5.5],
    [-45.5, 0.5, -41, 1.5],
    [-45.5, -6, -30, -4.5],
    [-41, -4.5, -40, 5.5],
    [-40, -0.5, -30, 5.5],
    [-36.5, -4.5, -30, -0.5],
  ])
    superficie(caja, lava, (ax + bx) / 2, -0.7, (az + bz) / 2, bx - ax, 1.4, bz - az, 2.8);
  for (const [ax, az, bx, bz] of [
    [-45.5, 1.5, -41, 5.5],
    [-45.5, -4.5, -41, 0.5],
    [-40, -4.5, -36.5, -0.5],
  ]) {
    pieza(caja, '#2f8c8a', (ax + bx) / 2, -0.42, (az + bz) / 2, bx - ax, 0.06, bz - az);
    pieza(caja, '#58c1b6', (ax + bx) / 2, -0.38, (az + bz) / 2, bx - ax - 1.2, 0.04, bz - az - 1.2);
    // Escalerilla de acero en una esquina.
    for (const dx of [0, 0.4]) pieza(poste, '#c9cdd1', bx - 0.6 + dx, 0.1, bz - 0.12, 0.05, 1.1, 0.05);
    pieza(caja, '#c9cdd1', bx - 0.4, 0.62, bz - 0.12, 0.45, 0.05, 0.05);
  }
  // Almenas de lava que rompen las olas, a lo largo de los bordes del mar.
  for (let i = 0; i < 26; i++) {
    const enFrente = i < 14;
    const x = enFrente ? -46.3 + i * 1.08 : -46.3,
      z = enFrente ? 6.3 : 5.2 - (i - 14) * 0.9;
    const h = 0.8 + azar() * 0.9;
    pieza(prisma, i % 2 ? '#3a3331' : '#463e3b', x, h / 2 - 0.1, z, 0.42, h, 0.42, 0, azar() * 2);
  }
  // Costa de lava y espuma, de las Salinas a la raíz del dique.
  for (let i = 0; i < 90; i++) {
    const t = azar(),
      x = i % 3 ? -47.5 + t * 17.5 : -48 - azar() * 1.5,
      z = i % 3 ? 7.4 + azar() * 6 * t : -6 + azar() * 13;
    pieza(esfera, i % 4 ? '#3f3836' : '#f2f5f2', x, -0.7, z, 0.4 + azar() * 0.7, i % 4 ? 0.4 : 0.06, 0.4 + azar() * 0.6);
  }
  // Solárium de madera, con dos toallas al sol.
  for (let k = 0; k < 10; k++) pieza(caja, k % 2 ? '#b48a5e' : '#a37b51', -33, 0.03, 0.6 + k * 0.4, 4, 0.06, 0.38);
  pieza(caja, '#e0694f', -33.9, 0.08, 2.2, 0.7, 0.03, 1.6);
  pieza(caja, '#2f8f8f', -32.3, 0.08, 2.8, 0.7, 0.03, 1.6, 0, 0.3);

  // --- El pueblo: casas blancas de carpintería añil, en hileras hacia la loma ---
  const tonos = [anil, '#2a5fa8', '#1b4a8c', '#2f6db3'];
  [-28, -24.2, -20.4, -16.6].forEach((x, i) => casa(x, -9, 3.6, 3.4 + (i % 2) * 1.7, 3.2, tonos[i % 4]));
  [-29.5, -25.5, -21, -17].forEach((x, i) => casa(x, -14.6, 3.6, 3.4 + ((i + 1) % 2) * 1.7, 3, tonos[(i + 1) % 4], 0.3));
  // Al norte, junto al palmeral de las Salinas.
  [-46.5, -42.5, -38.5, -34.5].forEach((x, i) => casa(x, -9.6, 3.4, 3.4 + (i % 2) * 1.6, 3, tonos[(i + 2) % 4]));
  // Plataneras en bancales al fondo del valle.
  for (let i = 0; i < 70; i++) {
    const x = -48 + (i % 14) * 2.2 + azar() * 0.5,
      z = -11.5 - Math.floor(i / 14) * 1.6;
    if (x > -31) continue;
    pieza(esfera, i % 2 ? '#5f8a3e' : '#6f9a48', x, 0.9, z, 0.9, 0.7, 0.7);
    pieza(poste, '#8a7a55', x, 0.3, z, 0.12, 0.6, 0.12);
  }
  // Farolas del paseo y de la avenida, y las torres de luz rayadas de azul y blanco del puerto.
  for (const z of [-2.5, 2.5, 7.5, 12.4]) farol(-7.35, z);
  for (const x of [-26, -18, 2, 16, 24]) farol(x, 13.35);
  for (const [x, z] of [
    [-12.4, 12],
    [6.6, 13.7],
  ]) {
    for (let j = 0; j < 8; j++) pieza(poste, j % 2 ? blanco : anil, x, 0.3 + j * 0.6, z, 0.26, 0.6, 0.26);
    pieza(poste, anil, x, 5.1, z, 0.9, 0.1, 0.9);
    ventanas.push([x, 5.3, z, 0.6, 0.3, 0.6]);
    pieza(piramide, anil, x, 5.75, z, 0.75, 0.6, 0.75, 0, Math.PI / 4);
  }
  // Bancos del paseo mirando a la playa y pretil azul y blanco.
  for (const z of [0, 5, 10]) {
    pieza(caja, blanco, -7.6, 0.34, z, 0.45, 0.09, 1.5);
    pieza(caja, anil, -7.8, 0.6, z, 0.07, 0.4, 1.5);
  }
  pieza(caja, blanco, -7.05, 0.26, 4.75, 0.2, 0.52, 9.5);
  pieza(caja, anil, -7.05, 0.55, 4.75, 0.26, 0.06, 9.5);
  // Taquilla azul de la naviera junto a la estación marítima.
  pieza(caja, anil, 0.6, 0.6, 14, 0.9, 1.2, 0.9);
  pieza(caja, '#f1e6c8', 0.6, 1.26, 14, 1.1, 0.12, 1.1);
  ventanas.push([0.6, 0.75, 14.46, 0.5, 0.4, 0.04]);
  // Marquesina azul de la estación marítima.
  pieza(caja, anil, -3.75, 2.1, 13.35, 4.4, 0.12, 0.8);
  for (const x of [-5.7, -1.8]) pieza(poste, blanco, x, 1.05, 13.65, 0.08, 2.1, 0.08);

  // --- Ermita de Nuestra Señora de las Nieves: dos torres de cúpula roja y portada de cantería ---
  const ex = -7,
    ez = -6.6,
    frente = ez + 2.55;
  pieza(caja, '#5e5650', ex, 0.3, ez, 4.3, 0.6, 5.2);
  pieza(caja, blanco, ex, 2, ez, 4.2, 4, 5.1);
  for (const lado of [-1, 1]) pieza(caja, '#a8553d', ex + lado * 1.1, 4.53, ez - 0.25, 2.45, 0.12, 4.6, 0, 0, -lado * 0.45);
  pieza(piramide, granate, ex, 4.52, frente - 0.05, 2.45, 1.25, 0.24);
  pieza(piramide, blanco, ex, 4.5, frente - 0.01, 2.2, 1.05, 0.22);
  pieza(caja, granate, ex, 4.02, frente + 0.05, 4.3, 0.16, 0.12);
  pieza(caja, granate, ex, 2.75, frente + 0.04, 2.6, 0.1, 0.08);
  for (const dx of [-1.25, 1.25]) pieza(caja, granate, ex + dx, 2.3, frente + 0.04, 0.14, 3.4, 0.08);
  // Portada: arco de cantería gris y puerta de madera granate.
  pieza(caja, '#6c645d', ex, 1.05, frente + 0.04, 1.35, 1.5, 0.08);
  pieza(poste, '#6c645d', ex, 1.8, frente + 0.04, 1.35, 0.08, 1.35, Math.PI / 2);
  pieza(caja, '#5a231c', ex, 1, frente + 0.09, 0.9, 1.4, 0.06);
  pieza(poste, '#5a231c', ex, 1.7, frente + 0.09, 0.9, 0.06, 0.9, Math.PI / 2);
  // Tres hornacinas en arco sobre la puerta.
  for (const dx of [-0.75, 0, 0.75]) {
    pieza(caja, granate, ex + dx, 3.25, frente + 0.03, 0.46, 0.75, 0.06);
    pieza(caja, dx ? '#efe9da' : '#3b4a5a', ex + dx, 3.2, frente + 0.07, 0.32, 0.55, 0.04);
  }
  const cupula = new T.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const dx of [-2.6, 2.6]) {
    const x = ex + dx,
      z = frente - 0.5;
    pieza(caja, '#5e5650', x, 0.3, z, 1.1, 0.6, 1.1);
    pieza(caja, blanco, x, 2.9, z, 1, 4.6, 1);
    for (const y of [4.1, 5.25]) pieza(caja, granate, x, y, z, 1.12, 0.14, 1.12);
    for (const [ox, oz] of [
      [0, 0.51],
      [0.51, 0],
      [-0.51, 0],
    ]) {
      // Campanario: hueco en arco con su campana.
      pieza(caja, granate, x + ox, 4.65, z + oz, oz ? 0.5 : 0.04, 0.8, oz ? 0.04 : 0.5);
      pieza(caja, '#2e2a28', x + ox * 1.02, 4.62, z + oz * 1.02, oz ? 0.32 : 0.03, 0.62, oz ? 0.03 : 0.32);
    }
    pieza(esfera, '#a07a3a', x, 4.55, z + 0.52, 0.12, 0.16, 0.12);
    pieza(poste, blanco, x, 5.65, z, 1.05, 0.7, 1.05);
    pieza(cupula, '#9b2f25', x, 6, z, 0.5, 0.48, 0.5);
    pieza(caja, '#2f2a27', x, 6.75, z, 0.04, 0.55, 0.04);
    pieza(caja, '#2f2a27', x, 6.85, z, 0.3, 0.04, 0.04);
  }
  cupula.dispose();
  // Jardín detrás de la ermita.
  for (let i = 0; i < 24; i++) pieza(esfera, i % 2 ? '#4f7f45' : '#6b9452', ex + (azar() - 0.5) * 7.4, 0.6, ez - 3 + azar() * 1.2, 0.5, 0.6, 0.45);

  // --- Dedo de Dios: el roque de basalto al pie del risco, con su dedo caído desde 2005 ---
  const dx0 = 22.6,
    dz0 = -1.6,
    roque = ['#2f2826', '#3a312c', '#28221f'];
  for (let i = 0; i < 16; i++) {
    // Rasa de roca alrededor del pie, apenas sobre el agua.
    const a = azar() * Math.PI * 2,
      r = 1.4 + azar() * 1.6;
    pieza(esfera, i % 2 ? '#4a403a' : '#3a322e', dx0 + Math.cos(a) * r, -0.78, dz0 + Math.sin(a) * r * 0.8, 0.9 + azar() * 0.8, 0.22, 0.6 + azar() * 0.6, 0, azar() * 3);
  }
  pieza(prisma, roque[0], dx0, 0, dz0, 1.75, 1.7, 1.55, 0, 0.3);
  pieza(prisma, roque[1], dx0 + 0.1, 2.25, dz0, 1.38, 3, 1.22, 0, 0.9, 0.03);
  pieza(prisma, roque[2], dx0 - 0.05, 5, dz0 + 0.05, 0.95, 2.7, 0.85, 0.04, 0.2, -0.04);
  pieza(prisma, roque[0], dx0 - 0.25, 7, dz0, 0.5, 1.55, 0.48, 0, 1.4, 0.08);
  // El muñón del dedo, roto en diagonal, y el pulgar que sigue en pie a su lado.
  pieza(piramide, roque[1], dx0 - 0.3, 8, dz0, 0.32, 0.6, 0.3, 0.3, 0.5, 0.35);
  pieza(piramide, roque[2], dx0 + 0.45, 6.9, dz0 + 0.05, 0.3, 1.8, 0.3, 0, 0.4, -0.22);
  // El dedo caído, medio hundido junto al roque.
  pieza(prisma, '#3b322e', dx0 + 2.3, -0.62, dz0 + 1.1, 0.42, 2.8, 0.38, 0, 0.5, Math.PI / 2 - 0.12);
  for (let i = 0; i < 18; i++) {
    const a = azar() * Math.PI * 2;
    pieza(esfera, '#f1f4f1', dx0 + Math.cos(a) * 3.4, -0.8, dz0 + Math.sin(a) * 2.7, 0.5 + azar() * 0.5, 0.05, 0.2, 0, a);
  }
  prisma.dispose();

  return {
    // Barquillos y veleros a los dos lados del pantalán, botes en la dársena y una barca fondeada.
    amarres: [
      [0, 1.4, 12.1, -Math.PI / 2],
      [0, 1.4, 10.3, -Math.PI / 2],
      [1, 0.9, 8.2, -Math.PI / 2],
      [0, 6.1, 12.1, Math.PI / 2],
      [2, 5.35, 10.3, Math.PI / 2],
      [0, 6.1, 8.3, Math.PI / 2],
      [2, 0.8, 6.3, 0.3],
      [0, 2.5, 3.6, 2.6],
      [2, 13.5, 2.5, 1],
      [1, 15.5, 5.2, -0.5],
    ],
    // Dos barquillos varados en la playa del puerto.
    enSeco: [
      [0, -5.3, -0.25, 2.6, 1.75],
      [2, -5.6, -0.2, 6.8, 1.4],
    ],
    ferry: ferry(),
  };
}

/** Cuña con la roda inclinada: proa de un casco que mira a +z. */
function proa() {
  const [a, b, c, d] = [
    [-1, -1, 0],
    [1, -1, 0],
    [1, 1, 0],
    [-1, 1, 0],
  ];
  const [e, f] = [
    [0, 1, 1],
    [0, -1, 0.45],
  ];
  const geo = new T.BufferGeometry();
  geo.setAttribute(
    'position',
    new T.Float32BufferAttribute([d, c, e, a, f, b, b, c, e, b, e, f, a, e, d, a, f, e].flat(), 3),
  );
  return geo;
}

/**
 * Ferry de la línea a Santa Cruz de Tenerife: casco blanco con franja azul y puente amarillo, como los
 * de la naviera. Va en un grupo propio porque cabecea en el agua; se monta a lo largo de +z y la vista
 * lo gira hacia `userData.rumbo`.
 */
function ferry(): T.Group {
  const partes: T.BufferGeometry[] = [];
  const caja = new T.BoxGeometry(),
    esfera = new T.IcosahedronGeometry(1, 1),
    poste = new T.CylinderGeometry(0.48, 0.55, 1, 9),
    cuna = proa();
  function parte(forma: T.BufferGeometry, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
    const geo = forma.index ? forma.toNonIndexed() : forma.clone();
    geo.deleteAttribute('uv');
    geo.deleteAttribute('normal');
    geo.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion(), new T.Vector3(w, h, d)));
    const rgb = new T.Color(color);
    const colores = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colores.length; i += 3) rgb.toArray(colores, i);
    geo.setAttribute('color', new T.BufferAttribute(colores, 3));
    partes.push(geo);
  }
  const casco = '#f4f3ee',
    franja = '#1f4e9c',
    amarillo = '#f2c230',
    cristal = '#22303d';
  // Casco: del agua (y = 0,19) a la cubierta, con la proa afilada.
  parte(caja, casco, 0, 0.62, -1.75, 3.6, 2.15, 12.5);
  parte(cuna, casco, 0, 0.62, 4.5, 1.8, 1.075, 3.5);
  parte(caja, '#1d3557', 0, 0.2, -1.75, 3.64, 0.3, 12.5);
  parte(cuna, '#1d3557', 0, 0.2, 4.5, 1.84, 0.15, 2.2);
  for (const lado of [-1, 1]) parte(caja, franja, lado * 1.81, 1.12, -1.5, 0.04, 0.26, 11.6);
  // Portalón de popa abierto, por el que entran los coches.
  parte(caja, '#2a2d31', 0, 0.95, -8.01, 2.4, 1.1, 0.04);
  // Cubierta de pasaje con su franja de ventanas.
  parte(caja, casco, 0, 2.22, -1.3, 3.3, 1.05, 10.3);
  for (const lado of [-1, 1]) parte(caja, cristal, lado * 1.66, 2.25, -1.3, 0.04, 0.45, 9.6);
  parte(caja, cristal, 0, 2.25, 3.81, 2.8, 0.45, 0.04);
  for (const lado of [-1, 1]) parte(caja, casco, lado * 1.62, 2.86, -1.3, 0.05, 0.22, 10.3);
  // Puente de mando amarillo, con alerones y ventanales.
  parte(caja, amarillo, 0, 3.15, 0.85, 2.9, 0.8, 4.7);
  parte(caja, cristal, 0, 3.25, 3.21, 2.5, 0.35, 0.04);
  for (const lado of [-1, 1]) {
    parte(caja, cristal, lado * 1.46, 3.25, 1.4, 0.04, 0.35, 3);
    parte(caja, amarillo, lado * 1.7, 3.42, 2.85, 0.6, 0.14, 0.5);
  }
  parte(caja, amarillo, 0, 3.75, 0.2, 1.8, 0.4, 2);
  parte(poste, '#e9e6de', 0, 4.55, 0.4, 0.1, 1.3, 0.1);
  parte(caja, '#e9e6de', 0, 5.05, 0.4, 0.9, 0.06, 0.12);
  // Balsas salvavidas naranjas y las chimeneas de popa.
  for (const lado of [-1, 1])
    for (const z of [-5.6, -3.4]) parte(esfera, '#e8742a', lado * 1.45, 2.95, z, 0.32, 0.28, 0.75);
  for (const lado of [-1, 1]) parte(poste, '#d9d6cf', lado * 0.8, 3.05, -6.2, 0.4, 0.6, 0.4);
  const malla = new T.Mesh(
    mergeGeometries(partes),
    new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75 }),
  );
  for (const geo of [...partes, caja, esfera, poste, cuna]) geo.dispose();
  malla.castShadow = malla.receiveShadow = true;
  const grupo = new T.Group();
  grupo.add(malla);
  // Amarrado al costado del muelle del ferry, con la popa hacia la rampa.
  grupo.position.set(18.5, -1.03, 11.25);
  // Más alto que las casas del pueblo, como se ve desde el paseo.
  grupo.scale.y = 1.25;
  grupo.userData.rumbo = Math.PI / 2;
  return grupo;
}
