import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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

/** Trazos de cada letra del rótulo, de 0 a 1: u de izquierda a derecha y v de abajo arriba. */
const LETRAS: Record<string, [number, number, number, number][]> = {
  A: [
    [0, 0, 0.5, 1],
    [0.5, 1, 1, 0],
    [0.24, 0.42, 0.76, 0.42],
  ],
  R: [
    [0, 0, 0, 1],
    [0, 1, 0.8, 1],
    [0.8, 1, 0.8, 0.5],
    [0, 0.5, 0.8, 0.5],
    [0.35, 0.5, 0.9, 0],
  ],
  M: [
    [0, 0, 0, 1],
    [0, 1, 0.5, 0.42],
    [0.5, 0.42, 1, 1],
    [1, 1, 1, 0],
  ],
  S: [
    [1, 1, 0, 1],
    [0, 1, 0, 0.5],
    [0, 0.5, 1, 0.5],
    [1, 0.5, 1, 0],
    [1, 0, 0, 0],
  ],
};

/**
 * Ferry de Naviera Armas, como el Volcán de Tindaya que cruza de Playa Blanca a Corralejo: casco y
 * superestructura blancos con una raya roja sobre otra gris, el rótulo ARMAS en grandes letras rojas
 * separadas, obra viva roja, dos torres de chimenea blancas a popa con los escapes negros y el
 * banderín de la casa (azul y amarillo, cruz blanca y el emblema rojo), y la rampa de popa levantada,
 * con sus paneles verdes. Va en un grupo propio porque cabecea; se monta a lo largo de +z, de popa
 * (z = −8) a proa (z = 8), y la vista lo gira hacia `rumbo`.
 */
export function ferry(x: number, z: number, rumbo: number): T.Group {
  const partes: T.BufferGeometry[] = [];
  const caja = new T.BoxGeometry(),
    esfera = new T.IcosahedronGeometry(1, 1),
    poste = new T.CylinderGeometry(0.48, 0.55, 1, 9),
    cuna = proa();
  function parte(
    forma: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rx = 0,
    rz = 0,
  ) {
    const geo = forma.index ? forma.toNonIndexed() : forma.clone();
    geo.deleteAttribute('uv');
    geo.deleteAttribute('normal');
    geo.applyMatrix4(
      new T.Matrix4().compose(
        new T.Vector3(x, y, z),
        new T.Quaternion().setFromEuler(new T.Euler(rx, 0, rz)),
        new T.Vector3(w, h, d),
      ),
    );
    const rgb = new T.Color(color);
    const colores = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < colores.length; i += 3) rgb.toArray(colores, i);
    geo.setAttribute('color', new T.BufferAttribute(colores, 3));
    partes.push(geo);
  }
  const casco = '#f4f3ee',
    rojo = '#c3282d',
    gris = '#8d9196',
    cristal = '#22303d',
    azul = '#1f3f8f',
    amarillo = '#e6b52c';
  /**
   * Trazo plano sobre un costado (x = lado · borde): u avanza hacia la derecha de quien lo mira desde
   * fuera, que en estribor es hacia popa y en babor hacia proa; así ninguna letra sale del revés.
   */
  function trazo(lado: number, borde: number, zc: number, y0: number, ancho: number, alto: number, grueso: number, color: string, [u0, v0, u1, v1]: number[]) {
    const za = zc - lado * (u0 - 0.5) * ancho,
      zb = zc - lado * (u1 - 0.5) * ancho;
    const ya = y0 + v0 * alto,
      yb = y0 + v1 * alto;
    const dz = zb - za,
      dy = yb - ya;
    parte(caja, color, lado * borde, (ya + yb) / 2, (za + zb) / 2, 0.03, grueso, Math.hypot(dz, dy) + grueso, Math.atan2(-dy, dz));
  }

  // --- Casco: del agua (y = 0,19) a la cubierta principal, con la proa afilada ---
  parte(caja, casco, 0, 0.62, -1.75, 3.6, 2.15, 12.5);
  parte(cuna, casco, 0, 0.62, 4.5, 1.8, 1.075, 3.5);
  // Obra viva roja asomando en la flotación.
  parte(caja, '#9e2a24', 0, 0.16, -1.75, 3.64, 0.22, 12.5);
  parte(cuna, '#9e2a24', 0, 0.16, 4.5, 1.84, 0.11, 2.2);
  // Raya roja sobre otra gris a lo largo de los costados, bajo la cubierta.
  for (const lado of [-1, 1]) {
    parte(caja, rojo, lado * 1.81, 1.52, -1.75, 0.04, 0.08, 12.4);
    parte(caja, gris, lado * 1.81, 1.42, -1.75, 0.04, 0.05, 12.4);
  }
  // El rótulo ARMAS, letras rojas bien separadas, legible en los dos costados.
  for (const lado of [-1, 1])
    [...'ARMAS'].forEach((letra, i) => {
      const ancho = letra === 'M' ? 0.78 : 0.62,
        zc = -1.2 - lado * (i - 2) * 2.05;
      for (const t of LETRAS[letra]) trazo(lado, 1.815, zc, 0.42, ancho, 0.82, 0.13, rojo, t);
    });
  // Rampa de popa levantada, con sus nervios y los dos paneles verdes, entre las dos aletas.
  parte(caja, casco, 0, 1.45, -8.06, 2.5, 2.1, 0.1);
  for (const dx of [-1.25, -0.42, 0.42, 1.25]) parte(caja, '#dcdad3', dx, 1.35, -8.12, 0.06, 1.9, 0.04);
  for (const dx of [-0.66, 0.66]) parte(caja, '#2f5d3a', dx, 2.2, -8.14, 1.12, 0.42, 0.04);
  for (const lado of [-1, 1]) parte(caja, casco, lado * 1.55, 2.2, -7.75, 0.5, 1.1, 0.6);

  // --- Cubierta de pasaje, con su franja de ventanas y las rayas de la casa en lo alto ---
  parte(caja, casco, 0, 2.22, -1.3, 3.3, 1.05, 10.3);
  for (const lado of [-1, 1]) {
    parte(caja, cristal, lado * 1.66, 2.22, -0.9, 0.04, 0.42, 8.6);
    parte(caja, rojo, lado * 1.66, 2.68, -1.3, 0.04, 0.06, 10.3);
    parte(caja, gris, lado * 1.66, 2.61, -1.3, 0.04, 0.04, 10.3);
  }
  parte(caja, cristal, 0, 2.22, 3.81, 2.8, 0.42, 0.04);
  // Barandilla blanca de la cubierta abierta de popa.
  for (const lado of [-1, 1]) parte(caja, '#ffffff', lado * 1.6, 3.05, -4.2, 0.05, 0.05, 4.5);
  parte(caja, '#ffffff', 0, 3.05, -6.4, 3.2, 0.05, 0.05);
  // Puente de mando blanco a proa, con ventanales corridos y alerones.
  parte(caja, casco, 0, 3.15, 0.85, 2.9, 0.8, 4.7);
  parte(caja, cristal, 0, 3.27, 3.21, 2.5, 0.34, 0.04);
  for (const lado of [-1, 1]) {
    parte(caja, cristal, lado * 1.46, 3.27, 1.4, 0.04, 0.34, 3);
    parte(caja, casco, lado * 1.7, 3.42, 2.85, 0.6, 0.14, 0.5);
    parte(caja, rojo, lado * 1.46, 3.52, 0.85, 0.04, 0.05, 4.7);
  }
  parte(caja, casco, 0, 3.75, 0.2, 1.8, 0.4, 2);
  parte(poste, '#e9e6de', 0, 4.55, 0.4, 0.1, 1.3, 0.1);
  parte(caja, '#e9e6de', 0, 5.05, 0.4, 0.9, 0.06, 0.12);
  // Balsas y botes salvavidas naranjas en los costados.
  for (const lado of [-1, 1])
    for (const zb of [-3.9, -2.4]) parte(esfera, '#e8742a', lado * 1.5, 2.92, zb, 0.2, 0.17, 0.5);

  // --- Dos torres de chimenea a popa, con los escapes negros y el banderín de la casa ---
  for (const lado of [-1, 1]) {
    const tx = lado * 1.12,
      tz = -6.35;
    parte(caja, casco, tx, 3.85, tz, 0.78, 2.2, 1.15);
    parte(caja, rojo, tx, 4.9, tz, 0.8, 0.07, 1.17);
    parte(caja, gris, tx, 4.82, tz, 0.8, 0.04, 1.17);
    for (const dz of [-0.22, 0.22]) parte(poste, '#1f1d1c', tx, 5.15, tz + dz, 0.16, 0.5, 0.16);
    // Banderín de dos puntas: azul y amarillo en cuarteles, cruz blanca y el disco rojo del emblema.
    const bx = lado * 1.525;
    for (const [u0, u1, v0, v1, color] of [
      [0.56, 1, 0.53, 1, azul],
      [0.56, 1, 0, 0.47, amarillo],
      [0, 0.5, 0.6, 0.86, amarillo],
      [0, 0.5, 0.14, 0.4, azul],
    ] as [number, number, number, number, string][]) {
      const zc = tz - lado * ((u0 + u1) / 2 - 0.5) * 0.95;
      parte(caja, color, bx, 3.75 + ((v0 + v1) / 2) * 0.62, zc, 0.02, (v1 - v0) * 0.62, (u1 - u0) * 0.95);
    }
    parte(poste, '#ffffff', bx + lado * 0.01, 4.06, tz - lado * 0.03, 0.34, 0.02, 0.34, 0, Math.PI / 2);
    parte(poste, '#b3262b', bx + lado * 0.02, 4.06, tz - lado * 0.03, 0.24, 0.02, 0.24, 0, Math.PI / 2);
    parte(poste, '#ffffff', bx + lado * 0.03, 4.06, tz - lado * 0.03, 0.12, 0.02, 0.12, 0, Math.PI / 2);
  }

  const malla = new T.Mesh(
    mergeGeometries(partes),
    new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75 }),
  );
  for (const geo of [...partes, caja, esfera, poste, cuna]) geo.dispose();
  malla.castShadow = malla.receiveShadow = true;
  const grupo = new T.Group();
  grupo.add(malla);
  grupo.position.set(x, -1.03, z);
  // Más alto que las casas del pueblo, como se ve desde el paseo.
  grupo.scale.y = 1.25;
  grupo.userData.rumbo = rumbo;
  return grupo;
}
