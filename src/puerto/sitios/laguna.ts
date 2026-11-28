import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Sitio, Taller } from '../maqueta';

type Rect = [number, number, number, number];
/** Hacia dónde mira una fachada; el norte es −z. */
type Lado = 'n' | 's' | 'e' | 'o';
/** Giro de una fachada: 0 mira al sur (+z), π al norte, π/2 al este y −π/2 al oeste. */
const GIRO: Record<Lado, number> = { s: 0, n: Math.PI, e: Math.PI / 2, o: -Math.PI / 2 };

/**
 * San Cristóbal de La Laguna (Tenerife): el casco de la Villa de Abajo y de la de Arriba, trazado
 * sobre la ortofoto PNOA y el callejero de OpenStreetMap y comprimido a escala de maqueta. La
 * cuadrícula real corre unos 30° girada; aquí se gira para que La Carrera vaya de sur a norte, de la
 * plaza del Adelantado (abajo, +z) a la iglesia de la Concepción (arriba, −z): la cámara mira por la
 * calle hacia la torre, como en la postal. Lo que en la ciudad queda al norte de La Carrera (la
 * catedral, Santa Catalina, el palacio de Nava, la calle San Agustín) aquí queda al este, y lo que
 * queda al sur (el Ayuntamiento, la calle Herradores), al oeste. Las calles pisables están en
 * `PUEBLOS['la-laguna'].plano.suelos`: si se mueve una calle, hay que moverla también allí.
 */
export function trazarLaguna(t: Taller): Sitio {
  const { pieza, superficie, azar, ventanas, farol } = t;
  const { caja, esfera, poste, piramide } = t.formas;
  const { cal, adoquin, teja } = t.materiales;
  const tintes = new Map<string, T.MeshStandardMaterial>();
  const tenido = (base: T.MeshStandardMaterial, color: string) => {
    const clave = base.uuid + color;
    if (!tintes.has(clave)) {
      const m = base.clone();
      m.color.set(color);
      tintes.set(clave, m);
    }
    return tintes.get(clave)!;
  };
  const elige = <C>(lista: C[]) => lista[Math.floor(azar() * lista.length)];

  // Formas propias: arco de medio punto, enjuta (rectángulo con el medio punto vaciado), media
  // naranja, tambor octogonal, disco, frontón, arquivolta y las mitades del ábside.
  const arco = new T.CylinderGeometry(0.5, 0.5, 1, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2);
  const contorno = new T.Shape().moveTo(-0.5, 0).lineTo(-0.38, 0);
  contorno.absarc(0, 0, 0.38, Math.PI, 0, true);
  contorno.lineTo(0.5, 0).lineTo(0.5, 0.55).lineTo(-0.5, 0.55).closePath();
  const enjuta = new T.ExtrudeGeometry(contorno, { depth: 1, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -0.5);
  const cupula = new T.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const octogono = new T.CylinderGeometry(0.5, 0.5, 1, 8);
  const disco = new T.CylinderGeometry(0.5, 0.5, 1, 16);
  const fronton = new T.CylinderGeometry(1, 1, 1, 3)
    .rotateX(-Math.PI / 2)
    .translate(0, 0.5, 0)
    .scale(1 / Math.sqrt(3), 1 / 1.5, 1);
  const aro = new T.TorusGeometry(0.5, 0.06, 4, 14, Math.PI);
  const medioCilindro = new T.CylinderGeometry(1, 1, 1, 14, 1, false, -Math.PI / 2, Math.PI);
  const medioCono = new T.ConeGeometry(1, 1, 14, 1, false, -Math.PI / 2, Math.PI);

  const piedra = '#58534d', // cantería oscura: la piedra azul de las portadas laguneras
    junta = '#433f3b',
    cornisa = '#efe8d8',
    blanco = '#f4f0e6',
    madera = '#5b3b27',
    hierro = '#2b2d2c',
    oscuro = '#2a2725',
    tejaRoja = '#a65b3e';
  const paleta = ['#d9a446', '#efe2c4', '#b8563f', '#e6c46c', '#7f9cba', '#9fb28b', '#e39b7c', '#f3eee3', '#c9785a', '#d8bd92', '#a7c0c9'];
  const carpinterias = ['#4a3424', '#3d5a3c', '#6b3326', '#2f4a5e', '#5b3b27'];

  // --- Muros y tejados: se juntan en una malla por color de cal y otra para toda la teja ---
  const muros = new Map<string, T.BufferGeometry[]>();
  const tejados: T.BufferGeometry[] = [];
  const lista = (color: string) => {
    if (!muros.has(color)) muros.set(color, []);
    return muros.get(color)!;
  };
  const muro = (color: string, x: number, y: number, z: number, w: number, h: number, d: number) =>
    lista(color).push(new T.BoxGeometry(w, h, d).translate(x, y, z));
  const triangulos = (puntos: number[][]) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(puntos.flat(), 3));
    g.computeVertexNormals();
    return g;
  };
  /** Tejado a cuatro aguas o, con `hastial`, a dos con los testeros del color del muro. */
  function tejado(x: number, y: number, z: number, w: number, d: number, alto: number, hastial?: string) {
    const largo = w >= d,
      L = Math.max(w, d) / 2,
      S = Math.min(w, d) / 2,
      r = hastial ? L : L - S;
    const p = (l: number, h: number, s: number) => (largo ? [x + l, y + h, z + s] : [x + s, y + h, z + l]);
    const faldon = [
      ...[p(-L, 0, S), p(L, 0, S), p(r, alto, 0), p(-L, 0, S), p(r, alto, 0), p(-r, alto, 0)],
      ...[p(L, 0, -S), p(-L, 0, -S), p(-r, alto, 0), p(L, 0, -S), p(-r, alto, 0), p(r, alto, 0)],
    ];
    const testeros = [p(L, 0, S), p(L, 0, -S), p(r, alto, 0), p(-L, 0, -S), p(-L, 0, S), p(-r, alto, 0)];
    if (hastial) {
      tejados.push(triangulos(faldon));
      lista(hastial).push(triangulos(testeros));
    } else tejados.push(triangulos([...faldon, ...testeros]));
  }
  /** Faldón de una sola agua entre cuatro esquinas. */
  const faldon = (a: number[], b: number[], c: number[], d: number[]) => tejados.push(triangulos([a, b, c, a, c, d]));
  function cocer(geos: T.BufferGeometry[], material: T.MeshStandardMaterial, escala: number) {
    const planas = geos.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      if (n !== g) g.dispose();
      n.deleteAttribute('uv');
      return n;
    });
    const geo = mergeGeometries(planas);
    superficie(geo, material, 0, 0, 0, 1, 1, 1, escala);
    for (const g of [...planas, geo]) g.dispose();
  }

  /** Plano de una fachada: `u` corre a lo largo de ella (a la derecha de quien la mira), `v` sale a la calle, `y` sube. */
  const euler = new T.Euler(),
    local = new T.Euler(),
    cuaternion = new T.Quaternion();
  function frente(cx: number, cz: number, giro: number) {
    const c = Math.cos(giro),
      s = Math.sin(giro),
      deLado = Math.abs(s) > 0.5;
    const en = (u: number, v: number) => [cx + u * c + v * s, cz - u * s + v * c];
    return {
      en,
      d(forma: T.BufferGeometry, color: string, u: number, y: number, v: number, w: number, h: number, f: number, rx = 0, rz = 0) {
        const [x, z] = en(u, v);
        euler.setFromQuaternion(cuaternion.setFromEuler(local.set(rx, giro, rz, 'YXZ')), 'XYZ');
        pieza(forma, color, x, y, z, w, h, f, euler.x, euler.y, euler.z);
      },
      /** Cristal que se enciende de noche. */
      luz(u: number, y: number, v: number, w: number, h: number, f = 0.05) {
        const [x, z] = en(u, v);
        ventanas.push(deLado ? [x, y, z, f, h, w] : [x, y, z, w, h, f]);
      },
    };
  }
  type Frente = ReturnType<typeof frente>;
  /** Fachada del lado `lado` del rectángulo. */
  function fachada([x0, z0, x1, z1]: Rect, lado: Lado) {
    const g = GIRO[lado],
      fondo = lado === 'e' || lado === 'o' ? x1 - x0 : z1 - z0;
    return frente((x0 + x1) / 2 + (Math.sin(g) * fondo) / 2, (z0 + z1) / 2 + (Math.cos(g) * fondo) / 2, g);
  }

  // --- Piezas de las casas laguneras ---
  /** Esquinas de sillares de cantería, a soga y tizón. */
  function esquinas(p: Frente, ancho: number, alto: number, color = piedra) {
    for (const s of [-1, 1])
      for (let k = 0, y = 0.4; y < alto - 0.35; k++, y += 0.36) {
        const a = k % 2 ? 0.2 : 0.34;
        p.d(caja, color, s * (ancho / 2 - a / 2 + 0.01), y + 0.17, 0.02, a, 0.33, 0.06);
      }
  }
  /** Puerta de dos hojas con su marco y dintel de cantería. */
  function puerta(p: Frente, u: number, alto: number, carp: string) {
    p.d(caja, piedra, u, alto / 2, 0.02, 1.1, alto + 0.08, 0.07);
    p.d(caja, carp, u, alto / 2 - 0.02, 0.06, 0.78, alto - 0.12, 0.04);
    p.d(caja, oscuro, u, alto * 0.48, 0.085, 0.02, alto * 0.8, 0.01);
    p.d(caja, piedra, u, alto + 0.08, 0.05, 1.24, 0.14, 0.11);
  }
  /** Ventana baja: marco de piedra, postigo de celosía en la mitad de abajo y poyo. */
  function ventanaBaja(p: Frente, u: number, carp: string) {
    p.d(caja, piedra, u, 1.25, 0.02, 0.8, 1.05, 0.06);
    p.luz(u, 1.34, 0.055, 0.54, 0.7);
    p.d(caja, carp, u, 1.0, 0.075, 0.58, 0.42, 0.03);
    p.d(caja, piedra, u, 0.68, 0.07, 0.9, 0.08, 0.16);
  }
  /** Ventana de guillotina de la planta alta, con balconcillo de hierro o con repisa. */
  function ventanaAlta(p: Frente, u: number, y: number, carp: string, conHierro = false) {
    p.d(caja, cornisa, u, y, 0.02, 0.76, 1.1, 0.06);
    p.luz(u, y + 0.02, 0.055, 0.52, 0.88);
    p.d(caja, carp, u, y + 0.02, 0.075, 0.56, 0.045, 0.03);
    p.d(caja, carp, u, y + 0.02, 0.075, 0.04, 0.88, 0.03);
    if (conHierro) {
      p.d(caja, hierro, u, y - 0.5, 0.2, 0.9, 0.05, 0.34);
      p.d(caja, hierro, u, y - 0.06, 0.36, 0.9, 0.035, 0.03);
      for (let k = -3; k <= 3; k++) p.d(caja, hierro, u + k * 0.13, y - 0.28, 0.36, 0.02, 0.42, 0.02);
    } else p.d(caja, piedra, u, y - 0.58, 0.06, 0.88, 0.07, 0.14);
  }
  /** Balcón cerrado de madera, el más lagunero: antepecho de cuarterones, vidriera y tejadillo. */
  function cajon(p: Frente, u: number, y0: number, ancho: number, carp: string) {
    const v = 0.55;
    for (let i = 0; i <= 3; i++) p.d(caja, madera, u - ancho / 2 + (i * ancho) / 3, y0 - 0.12, 0.28, 0.08, 0.14, 0.5);
    p.d(caja, madera, u, y0, v / 2, ancho + 0.1, 0.1, v + 0.06);
    p.d(caja, carp, u, y0 + 0.32, v, ancho, 0.54, 0.05);
    for (const s of [-1, 1]) p.d(caja, carp, u + (s * ancho) / 2, y0 + 0.75, v / 2, 0.05, 1.4, v);
    p.luz(u, y0 + 1.0, v - 0.02, ancho - 0.12, 0.7, 0.03);
    const n = Math.round(ancho / 0.32);
    for (let i = 1; i < n; i++) p.d(caja, carp, u - ancho / 2 + (i * ancho) / n, y0 + 1.0, v + 0.02, 0.035, 0.74, 0.03);
    p.d(caja, carp, u, y0 + 0.62, v + 0.02, ancho, 0.05, 0.04);
    p.d(caja, carp, u, y0 + 1.4, v / 2, ancho + 0.06, 0.08, v + 0.06);
    p.d(caja, tejaRoja, u, y0 + 1.52, v / 2 + 0.06, ancho + 0.24, 0.06, v + 0.3, 0.28);
  }
  /** Balcón abierto de tea: suelo sobre canes, balaustres torneados y pasamanos. */
  function abierto(p: Frente, u: number, y0: number, ancho: number) {
    const v = 0.55;
    p.d(caja, madera, u, y0, v / 2 + 0.03, ancho + 0.1, 0.1, v + 0.06);
    for (let i = 0; i <= 4; i++) p.d(caja, madera, u - ancho / 2 + (i * ancho) / 4, y0 - 0.12, 0.28, 0.07, 0.14, 0.5);
    const n = Math.max(6, Math.round(ancho / 0.16));
    for (let i = 0; i <= n; i++) p.d(poste, madera, u - ancho / 2 + (i * ancho) / n, y0 + 0.32, v, 0.045, 0.52, 0.045);
    p.d(caja, madera, u, y0 + 0.62, v, ancho + 0.08, 0.07, 0.08);
    for (const s of [-1, 1]) p.d(caja, madera, u + (s * ancho) / 2, y0 + 0.62, v / 2, 0.07, 0.07, v);
  }
  /** Puerta de balcón: hueco alto hasta el suelo del balcón. */
  function puertaBalcon(p: Frente, u: number, y0: number, carp: string) {
    p.d(caja, cornisa, u, y0 + 0.75, 0.02, 0.8, 1.55, 0.06);
    p.luz(u, y0 + 0.8, 0.055, 0.56, 1.3);
    p.d(caja, carp, u, y0 + 0.8, 0.075, 0.04, 1.3, 0.03);
  }
  function farolPared(p: Frente, u: number, y: number) {
    p.d(caja, hierro, u, y + 0.22, 0.13, 0.04, 0.04, 0.26);
    p.d(caja, hierro, u, y + 0.08, 0.27, 0.2, 0.04, 0.2);
    p.luz(u, y - 0.08, 0.27, 0.15, 0.24, 0.15);
    p.d(piramide, hierro, u, y + 0.17, 0.27, 0.17, 0.14, 0.17, 0, Math.PI / 4);
  }

  /**
   * Casa lagunera de una o dos plantas: cal de color, zócalo y esquinas de cantería, tejado de teja
   * a cuatro aguas y, arriba, balcón cerrado, abierto o balconcillos de hierro. Las de fondo, sin
   * labrar, solo llevan sus huecos.
   */
  function casa(r: Rect, alto: number, lado: Lado, color: string, detalle: boolean) {
    const [x0, z0, x1, z1] = r,
      cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2,
      w = x1 - x0,
      d = z1 - z0;
    const ancho = lado === 'e' || lado === 'o' ? d : w;
    muro(color, cx, alto / 2, cz, w, alto, d);
    tejado(cx, alto, cz, w + 0.4, d + 0.4, Math.min(w, d) * 0.32);
    const p = fachada(r, lado);
    const dos = alto > 3.3,
      ancha = ancho >= 3.3;
    const huecos = ancha ? [-ancho * 0.28, ancho * 0.28] : [ancho * 0.2];
    if (!detalle) {
      for (const y of dos ? [1.25, alto - 1.15] : [1.25])
        for (const u of huecos) {
          p.d(caja, '#efe8da', u, y, 0.02, 0.62, 0.86, 0.04);
          if (azar() > 0.55) p.luz(u, y, 0.04, 0.44, 0.68);
          else p.d(caja, '#3d3a36', u, y, 0.04, 0.44, 0.68, 0.03);
        }
      return;
    }
    const carp = elige(carpinterias);
    pieza(caja, piedra, cx, 0.2, cz, w + 0.04, 0.4, d + 0.04);
    pieza(caja, cornisa, cx, alto - 0.07, cz, w + 0.08, 0.14, d + 0.08);
    if (azar() > 0.4) esquinas(p, ancho, alto);
    const pu = ancha ? 0 : -ancho * 0.2;
    puerta(p, pu, Math.min(2.1, alto * 0.55), carp);
    for (const u of huecos) if (Math.abs(u - pu) > 0.7) ventanaBaja(p, u, carp);
    if (dos) {
      // Los balcones de madera piden casa alta: en las bajas no caben sobre la puerta.
      const y = alto - 1.2,
        tipo = alto >= 4.2 ? azar() : 0.6 + azar() * 0.4;
      if (tipo < 0.3) {
        cajon(p, pu, y - 0.75, ancha ? 1.7 : 1.3, carp);
        for (const u of huecos) if (Math.abs(u - pu) > 1.2) ventanaAlta(p, u, y, carp);
      } else if (tipo < 0.55 && ancha) {
        abierto(p, 0, y - 0.72, ancho * 0.74);
        for (const u of huecos) puertaBalcon(p, u, y - 0.67, carp);
      } else for (const u of ancha ? [...huecos, ...(ancho > 4.4 ? [0] : [])] : [pu, ...huecos]) ventanaAlta(p, u, y, carp, tipo < 0.8);
    }
    if (azar() > 0.55) farolPared(p, pu + (ancha ? 0.75 : 0.62), Math.min(2.6, alto - 0.8));
    // Trasera, hacia el patio: también se ve desde lo alto.
    const q = fachada(r, ({ n: 's', s: 'n', e: 'o', o: 'e' } as const)[lado]);
    for (const u of huecos) {
      q.d(caja, cornisa, -u, alto - 1.2, 0.02, 0.6, 0.8, 0.04);
      q.luz(-u, alto - 1.2, 0.04, 0.44, 0.64);
    }
  }
  /**
   * Manzana: casas en hilera por los lados que dan a la calle y, dentro, el patio con su árbol, como
   * se ve la ciudad desde el aire. `detalle`: lados de fachada labrada; `bajas`: hileras de una
   * planta, las que quedan entre la cámara y la calle.
   */
  function manzana(r: Rect, lados: Lado[], detalle: Lado[] = [], bajas: Lado[] = [], fondo = 4) {
    const [x0, z0, x1, z1] = r,
      tiene = (l: Lado) => lados.includes(l);
    const fx = Math.min(fondo, (x1 - x0) / (tiene('o') && tiene('e') ? 2 : 1)),
      fz = Math.min(fondo, (z1 - z0) / (tiene('n') && tiene('s') ? 2 : 1));
    for (const l of lados) {
      const vertical = l === 'o' || l === 'e';
      const a0 = vertical ? z0 : x0 + (tiene('o') ? fx : 0),
        a1 = vertical ? z1 : x1 - (tiene('e') ? fx : 0);
      for (let a = a0; a1 - a > 1.6; ) {
        let w = 2.8 + azar() * 1.6;
        if (a1 - a - w < 2.4) w = a1 - a;
        const b = a + w;
        const casilla: Rect =
          l === 'o' ? [x0, a, x0 + fx, b] : l === 'e' ? [x1 - fx, a, x1, b] : l === 'n' ? [a, z0, b, z0 + fz] : [a, z1 - fz, b, z1];
        const labrada = detalle.includes(l);
        // La acera de poniente de una calle que corre de norte a sur queda del lado de la cámara:
        // allí las casas son algo más bajas para no tapar al viajero.
        const alto = bajas.includes(l)
          ? 2.6 + azar() * 0.4
          : labrada
            ? elige(l === 'e' ? [3.8, 3.9, 4.0] : [4.2, 4.4, 4.6, 3.9, 4.2])
            : 3 + azar() * 1.7;
        casa(casilla, alto, l, elige(paleta), labrada);
        a = b;
      }
    }
    const px0 = x0 + (tiene('o') ? fx : 0),
      px1 = x1 - (tiene('e') ? fx : 0),
      pz0 = z0 + (tiene('n') ? fz : 0),
      pz1 = z1 - (tiene('s') ? fz : 0);
    if (px1 - px0 > 1.4 && pz1 - pz0 > 1.4) patio([px0, pz0, px1, pz1]);
  }
  /** Patio interior: tierra y huerto, con un árbol o dos. */
  function patio([x0, z0, x1, z1]: Rect) {
    pieza(caja, '#7b8558', (x0 + x1) / 2, 0.03, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0);
    const n = (x1 - x0) * (z1 - z0) > 40 ? 2 : 1;
    for (let i = 0; i < n; i++)
      arbol(x0 + (x1 - x0) * (0.3 + 0.4 * i + (azar() - 0.5) * 0.2), z0 + (z1 - z0) * (0.35 + 0.3 * azar()), 1.8 + azar() * 1.2, 1.2 + azar() * 0.8);
  }
  function arbol(x: number, z: number, h: number, r: number) {
    pieza(poste, '#6b5440', x, h / 2, z, 0.26, h, 0.26);
    for (let i = 0; i < 6; i++) {
      const a = i * 2.4,
        d = i ? r * 0.5 : 0;
      pieza(esfera, ['#3f6b3d', '#4f7d45', '#5e8a4c'][i % 3], x + Math.cos(a) * d, h + 0.2 + (i % 3) * 0.25, z + Math.sin(a) * d, r * 0.62, r * 0.5, r * 0.62);
    }
  }
  /** Árbol grande de plaza, de copa densa y oscura. */
  function frondoso(x: number, z: number) {
    pieza(poste, '#6e5c4a', x, 1.3, z, 0.5, 2.6, 0.5);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.3,
        d = i ? 1.3 : 0;
      pieza(esfera, ['#2f5a34', '#3b6a3c', '#46773f'][i % 3], x + Math.cos(a) * d, 3.4 + (i % 3) * 0.45, z + Math.sin(a) * d, 1.5, 1.05, 1.5);
    }
  }
  /** Rama recta de `desde` en la dirección (inclinación, rumbo); devuelve la punta. */
  function rama(desde: number[], inclinacion: number, rumbo: number, largo: number, grosor: number, color: string) {
    const dir = [Math.sin(inclinacion) * Math.cos(rumbo), Math.cos(inclinacion), -Math.sin(inclinacion) * Math.sin(rumbo)];
    const punta = desde.map((v, i) => v + dir[i] * largo);
    pieza(poste, color, (desde[0] + punta[0]) / 2, (desde[1] + punta[1]) / 2, (desde[2] + punta[2]) / 2, grosor, largo, grosor, 0, rumbo, -inclinacion);
    return punta;
  }
  /** Drago: tronco grueso que se abre en horquillas y, en cada punta, un penacho de hojas como espadas. */
  function drago(x: number, z: number, h: number) {
    const corteza = '#9a907f';
    pieza(poste, corteza, x, h / 2, z, 0.85, h, 0.85);
    for (let i = 0; i < 4; i++) {
      const rumbo = (i * Math.PI) / 2 + 0.4,
        codo = rama([x, h - 0.15, z], 0.6, rumbo, 1.2, 0.36, corteza);
      for (const giro of [-0.45, 0.45]) {
        const punta = rama(codo, 0.42, rumbo + giro, 0.9, 0.24, corteza);
        pieza(esfera, '#4b6b40', punta[0], punta[1] + 0.12, punta[2], 0.3, 0.22, 0.3);
        for (let k = 0; k < 13; k++)
          rama(punta, 0.25 + (k % 3) * 0.4, (k * Math.PI * 2) / 13 + i, 0.85, 0.09, k % 2 ? '#56784a' : '#6b8a55');
      }
    }
  }
  function banco(x: number, z: number, giro: number) {
    const p = frente(x, z, giro);
    p.d(caja, '#7a5a3f', 0, 0.48, 0, 1.5, 0.07, 0.42);
    p.d(caja, '#7a5a3f', 0, 0.75, -0.2, 1.5, 0.32, 0.06);
    for (const u of [-0.62, 0.62]) p.d(caja, hierro, u, 0.4, 0, 0.07, 0.56, 0.44);
  }

  // --- Suelo: todo el casco sobre un empedrado gris; las plazas, enlosadas ---
  superficie(caja, tenido(adoquin, '#a0988e'), 4, -0.05, 6, 150, 0.1, 170, 1.5);
  const losas = tenido(cal, '#a9a7a1');
  for (const [x0, z0, x1, z1] of [
    [-12, 44, 21.4, 62], // plaza del Adelantado
    [1.4, 3.6, 13.4, 6.4], // plaza de la Catedral
    [-1.4, -48.4, 6, -23.6], // plaza de la Concepción
    [-17, -48.4, -10.4, -26], // plaza del Doctor Olivera
  ])
    superficie(caja, losas, (x0 + x1) / 2, 0.0, (z0 + z1) / 2, x1 - x0, 0.04, z1 - z0, 2.4);
  // La Carrera: losas de piedra con una cinta de basalto a cada lado.
  superficie(caja, tenido(cal, '#aaa397'), 0, 0.0, 10.2, 2.8, 0.04, 67.6, 1.6);
  for (const x of [-1.25, 1.25]) pieza(caja, '#6f6a63', x, 0.025, 10.2, 0.12, 0.02, 67.6);

  // --- Plaza del Adelantado: fuente de mármol de 1870, árboles, bancos y farolas ---
  const fx = 4.7,
    fz = 53;
  for (const [w, d] of [
    [33.4, 0.24],
    [0.24, 18],
  ])
    pieza(caja, '#6f6a63', fx, 0.03, fz, w, 0.02, d);
  pieza(disco, '#6f6a63', fx, 0.025, fz, 7.6, 0.02, 7.6);
  pieza(disco, '#c9c2b6', fx, 0.035, fz, 7.2, 0.02, 7.2);
  const marmol = '#ebe7df';
  pieza(octogono, marmol, fx, 0.25, fz, 3.0, 0.5, 3.0);
  pieza(octogono, '#7fb3b8', fx, 0.47, fz, 2.64, 0.04, 2.64);
  pieza(poste, marmol, fx, 0.95, fz, 0.42, 1.1, 0.42);
  pieza(disco, marmol, fx, 1.5, fz, 1.5, 0.14, 1.5);
  pieza(disco, '#8cc0c4', fx, 1.58, fz, 1.3, 0.03, 1.3);
  pieza(poste, marmol, fx, 1.9, fz, 0.22, 0.7, 0.22);
  pieza(disco, marmol, fx, 2.25, fz, 0.8, 0.1, 0.8);
  pieza(esfera, marmol, fx, 2.55, fz, 0.16, 0.3, 0.16);
  for (const [x, z] of [
    [-9.4, 48],
    [-9.4, 53],
    [-9.4, 58],
    [18.8, 48],
    [18.8, 53],
    [18.8, 58],
  ]) {
    frondoso(x, z);
    banco(x + (x < 0 ? 1.4 : -1.4), z + 2.4, x < 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  for (const [x, z] of [
    [-11.3, 44.7],
    [20.7, 44.7],
    [-11.3, 61.3],
    [20.7, 61.3],
    [0, 57.6],
    [9.4, 57.6],
  ])
    farol(x, z);

  // --- Casas Consistoriales: cantería gris, cinco arcos abajo y balcones de hierro arriba ---
  const gris = '#8e8c86',
    grisOscuro = '#6f6d68';
  muro(gris, -6.7, 3.1, 39.5, 10.6, 6.2, 9);
  pieza(caja, '#c3beb4', -6.7, 6.23, 39.5, 10.4, 0.06, 8.8);
  for (const [x, z, giro, ancho] of [
    [-6.7, 44, 0, 10.6],
    [-1.4, 39.5, Math.PI / 2, 9],
  ] as [number, number, number, number][]) {
    const p = frente(x, z, giro),
      plaza = giro === 0,
      n = plaza ? 5 : 4,
      paso = ancho / n;
    for (let y = 0.42; y < 6; y += 0.42) p.d(caja, '#7c7a74', 0, y, 0.035, ancho, 0.02, 0.02);
    for (let i = 0; i <= n; i++) p.d(caja, grisOscuro, -ancho / 2 + i * paso, 3.1, 0.06, 0.42, 6.2, 0.12);
    for (let i = 0; i < n; i++) {
      const u = -ancho / 2 + (i + 0.5) * paso;
      if (plaza) {
        // Soportal de arcos.
        p.d(caja, oscuro, u, 1.05, 0.02, 1.3, 2.1, 0.04);
        p.d(arco, oscuro, u, 2.1, 0.02, 1.3, 1.3, 0.04);
        p.d(aro, grisOscuro, u, 2.1, 0.05, 1.45, 1.45, 1.4);
      } else {
        p.d(caja, grisOscuro, u, 1.3, 0.03, 0.8, 1.2, 0.06);
        p.luz(u, 1.3, 0.07, 0.6, 1.0);
        for (let k = -2; k <= 2; k++) p.d(caja, hierro, u + k * 0.13, 1.3, 0.1, 0.025, 1.0, 0.025);
      }
      p.d(caja, grisOscuro, u, 4.4, 0.03, 1.0, 1.75, 0.06);
      p.luz(u, 4.45, 0.07, 0.74, 1.5);
      p.d(caja, gris, u, 3.55, 0.25, 1.24, 0.08, 0.5);
      p.d(caja, hierro, u, 3.88, 0.5, 1.24, 0.05, 0.03);
      for (let k = -4; k <= 4; k++) p.d(caja, hierro, u + k * 0.14, 3.72, 0.5, 0.025, 0.32, 0.025);
      p.d(caja, grisOscuro, u, 5.4, 0.08, 1.2, 0.12, 0.16);
    }
    p.d(caja, grisOscuro, 0, 2.85, 0.1, ancho + 0.1, 0.14, 0.22);
    p.d(caja, grisOscuro, 0, 6.15, 0.12, ancho + 0.3, 0.22, 0.32);
    p.d(caja, gris, 0, 6.55, 0, ancho, 0.55, 0.22);
    for (let i = 0; i <= n; i++) {
      const u = -ancho / 2 + i * paso;
      p.d(caja, grisOscuro, u, 6.95, 0, 0.36, 0.25, 0.36);
      p.d(esfera, gris, u, 7.25, 0, 0.22, 0.28, 0.22);
    }
    if (plaza) {
      // Remate central de arco rebajado con el escudo de la ciudad.
      p.d(caja, gris, 0, 6.9, 0, 3.2, 0.9, 0.26);
      p.d(arco, gris, 0, 7.35, 0, 3.2, 1.4, 0.26);
      p.d(caja, grisOscuro, 0, 7.15, 0.15, 0.62, 0.78, 0.08);
      p.d(caja, '#b8963c', 0, 7.2, 0.2, 0.42, 0.52, 0.03);
      p.d(caja, '#c8b273', 0, 5.65, 0.14, 1.6, 0.16, 0.04);
    }
  }

  // --- Casa de los Capitanes, pared con pared en La Carrera: portada de cantería y escudo ---
  muro('#efe2c2', -3.9, 2.45, 30.5, 5, 4.9, 9);
  tejado(-3.9, 4.9, 30.5, 5.4, 9.4, 1.5);
  pieza(caja, piedra, -3.9, 0.2, 30.5, 5.04, 0.4, 9.04);
  {
    const p = frente(-1.4, 30.5, Math.PI / 2);
    esquinas(p, 9, 4.9);
    p.d(caja, cornisa, 0, 4.82, 0.08, 9.1, 0.16, 0.18);
    // Portada: pilastras, entablamento y, encima, el escudo entre volutas.
    p.d(caja, '#3f2c20', 0, 1.15, 0.03, 1.2, 2.3, 0.05);
    for (const s of [-1, 1]) {
      p.d(caja, piedra, s * 0.85, 1.3, 0.08, 0.36, 2.6, 0.16);
      p.d(caja, piedra, s * 0.85, 2.68, 0.1, 0.46, 0.16, 0.22);
    }
    p.d(caja, piedra, 0, 2.86, 0.12, 2.3, 0.22, 0.26);
    p.d(caja, piedra, 0, 3.55, 0.08, 0.9, 1.0, 0.12);
    p.d(caja, '#8b8174', 0, 3.55, 0.15, 0.6, 0.7, 0.04);
    for (const s of [-1, 1]) p.d(esfera, piedra, s * 0.7, 3.2, 0.08, 0.2, 0.3, 0.12);
    for (const u of [-3.1, -1.9, 1.9, 3.1]) ventanaBaja(p, u, '#4a3424');
    for (const u of [-3.4, -1.9, 1.9, 3.4]) ventanaAlta(p, u, 3.75, '#4a3424', true);
    farolPared(p, -2.5, 2.6);
  }
  casa([-12, 26, -6.4, 30], 2.9, 'n', '#d9a446', true);
  patio([-12, 30, -6.4, 35]);

  // --- Convento de Santa Catalina: la iglesia a la plaza, con portadas de cantería roja, y el mirador ---
  const crema = '#ebdcb2',
    roja = '#9b4a36';
  muro(crema, 5.5, 2.6, 42.2, 8.2, 5.2, 3.6);
  tejado(5.5, 5.2, 42.2, 8.6, 4.0, 1.2, crema);
  muro(crema, 2.4, 2.2, 33.2, 2.0, 4.4, 14.4);
  muro(crema, 8.6, 2.2, 34.2, 2.0, 4.4, 12.4);
  muro(crema, 5.5, 2.2, 27, 8.2, 4.4, 2.0);
  tejado(2.4, 4.4, 33.2, 2.4, 14.8, 0.8);
  tejado(8.6, 4.4, 34.2, 2.4, 12.8, 0.8);
  tejado(5.5, 4.4, 27, 8.6, 2.4, 0.8);
  pieza(caja, '#6e6a64', 1.37, 0.25, 35, 0.06, 0.5, 18);
  pieza(caja, '#6e6a64', 5.5, 0.25, 44.03, 8.2, 0.5, 0.06);
  patio([3.4, 28, 7.6, 40.4]);
  pieza(octogono, '#9d958a', 5.5, 0.3, 34.2, 0.9, 0.5, 0.9);
  {
    const p = frente(5.5, 44, 0);
    for (const u of [-2.3, 0.9]) {
      p.d(caja, '#4a2e20', u, 1.15, 0.03, 1.14, 2.3, 0.05);
      p.d(arco, '#4a2e20', u, 2.3, 0.03, 1.14, 1.14, 0.05);
      for (const s of [-1, 1]) p.d(caja, roja, u + s * 0.7, 1.15, 0.06, 0.26, 2.3, 0.14);
      p.d(enjuta, roja, u, 2.3, 0.06, 1.5, 1.5, 0.14);
      p.d(caja, roja, u, 3.28, 0.08, 1.7, 0.12, 0.18);
    }
    for (const u of [-0.7, 2.6]) {
      p.d(caja, roja, u, 3.6, 0.03, 0.8, 1.3, 0.06);
      p.d(arco, roja, u, 4.25, 0.03, 0.8, 0.8, 0.06);
      p.luz(u, 3.65, 0.07, 0.5, 1.0);
      p.d(arco, '#ffc572', u, 4.2, 0.065, 0.5, 0.5, 0.02);
    }
    farolPared(p, -3.6, 2.8);
  }
  {
    const p = frente(1.4, 35, -Math.PI / 2);
    for (const u of [-6.5, -3.5, -0.5, 2.5, 5.5]) {
      p.d(caja, piedra, u, 3.3, 0.02, 0.6, 0.6, 0.06);
      p.luz(u, 3.3, 0.05, 0.4, 0.4);
      for (let k = -1; k <= 1; k++) p.d(caja, hierro, u + k * 0.12, 3.3, 0.08, 0.02, 0.44, 0.02);
    }
    p.d(caja, '#4a2e20', 4, 1.0, 0.03, 0.9, 1.95, 0.05);
    p.d(caja, roja, 4, 2.05, 0.06, 1.15, 0.16, 0.12);
    for (const s of [-1, 1]) p.d(caja, roja, 4 + s * 0.52, 1.0, 0.06, 0.14, 2.0, 0.12);
  }
  // El mirador: un cajón de celosías de madera sobre un machón encalado, por encima del tejado.
  const mx = 8.5,
    mz = 43.05;
  muro(blanco, mx, 3.4, mz, 1.3, 6.8, 1.3);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pieza(caja, madera, mx + Math.sin(a) * 0.95, 6.7, mz + Math.cos(a) * 0.95, 0.12, 0.24, 0.5, 0, a);
  }
  pieza(caja, madera, mx, 6.86, mz, 2.5, 0.14, 2.5);
  pieza(caja, '#3a2618', mx, 7.6, mz, 2.2, 1.36, 2.2);
  for (const g of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const m = frente(mx + Math.sin(g) * 1.12, mz + Math.cos(g) * 1.12, g);
    m.luz(0, 7.62, 0.01, 1.9, 1.0, 0.02);
    for (let k = -4; k <= 4; k++) m.d(caja, '#7a5236', k * 0.23, 7.62, 0.04, 0.04, 1.18, 0.02);
    for (let j = 0; j < 6; j++) m.d(caja, '#7a5236', 0, 7.12 + j * 0.2, 0.04, 2.1, 0.035, 0.02);
    m.d(caja, madera, 0, 8.32, 0.02, 2.3, 0.1, 0.06);
  }
  tejado(mx, 8.34, mz, 2.9, 2.9, 0.9);

  // --- Palacio de Nava: cantería oscura almohadillada, portada salomónica y balcón corrido ---
  const navaPiedra = '#625a52',
    navaClara = '#7b7168';
  pieza(caja, navaPiedra, 14.1, 3.2, 40, 9, 6.4, 8);
  tejado(14.1, 6.4, 40, 8.4, 7.4, 1.5);
  for (const [lado, ancho] of [
    ['s', 9],
    ['e', 8],
  ] as [Lado, number][]) {
    const p = fachada([9.6, 36, 18.6, 44], lado),
      plaza = lado === 's';
    // Hiladas y llagas de los sillares.
    for (let k = 0, y = 0.4; y < 6.2; k++, y += 0.42) {
      p.d(caja, junta, 0, y, 0.01, ancho, 0.03, 0.02);
      for (let u = -ancho / 2 + (k % 2 ? 0.45 : 0.9); u < ancho / 2; u += 0.9) p.d(caja, junta, u, y + 0.21, 0.01, 0.03, 0.42, 0.02);
    }
    p.d(caja, '#4e4842', 0, 0.2, 0.04, ancho + 0.06, 0.4, 0.1);
    p.d(caja, navaClara, 0, 3.0, 0.08, ancho + 0.08, 0.16, 0.2);
    p.d(caja, navaClara, 0, 6.3, 0.12, ancho + 0.3, 0.22, 0.34);
    // Balaustrada de remate, con pináculos.
    p.d(caja, navaClara, 0, 6.48, 0, ancho, 0.1, 0.32);
    for (let u = -ancho / 2 + 0.2; u < ancho / 2; u += 0.24) p.d(poste, navaClara, u, 6.72, 0, 0.1, 0.38, 0.1);
    p.d(caja, navaClara, 0, 6.95, 0, ancho, 0.09, 0.3);
    for (const s of [-1, 1]) {
      p.d(caja, navaClara, s * (ancho / 2 - 0.2), 7.2, 0, 0.36, 0.5, 0.36);
      p.d(piramide, navaClara, s * (ancho / 2 - 0.2), 7.75, 0, 0.26, 0.7, 0.26, 0, Math.PI / 4);
    }
    const bajas = plaza ? [-3.8, 0.6, 2.4, 3.9] : [-2.6, -1, 1, 2.6];
    for (const u of bajas) {
      p.d(caja, navaClara, u, 1.4, 0.02, 0.9, 1.25, 0.06);
      p.luz(u, 1.4, 0.05, 0.7, 1.05);
      for (let k = -3; k <= 3; k++) p.d(caja, hierro, u + k * 0.11, 1.4, 0.1, 0.025, 1.1, 0.025);
    }
    const altas = plaza ? [-3.6, -1.9, 0.2, 2.1, 3.8] : [-2.6, -0.9, 0.9, 2.6];
    for (const u of altas) {
      p.d(caja, navaClara, u, 4.35, 0.03, 0.95, 1.85, 0.08);
      p.luz(u, 4.3, 0.08, 0.68, 1.6);
      p.d(fronton, navaClara, u, 5.32, 0.08, 1.15, 0.38, 0.16);
    }
    if (!plaza) continue;
    // Balcón corrido de hierro sobre ménsulas.
    p.d(caja, navaClara, 0, 3.32, 0.32, 8.2, 0.12, 0.6);
    for (let u = -3.9; u <= 3.9; u += 0.65) p.d(caja, navaClara, u, 3.12, 0.22, 0.14, 0.3, 0.4);
    p.d(caja, hierro, 0, 4.25, 0.6, 8.2, 0.05, 0.04);
    for (let u = -4.05; u <= 4.05; u += 0.13) p.d(caja, hierro, u, 3.8, 0.6, 0.02, 0.9, 0.02);
    // Portada de columnas salomónicas, con entablamento y escudo.
    const pu = -1.9;
    p.d(caja, '#4a3122', pu, 1.25, 0.04, 1.0, 2.5, 0.05);
    for (const s of [-1, 1]) {
      const cu = pu + s * 0.82;
      p.d(caja, navaClara, cu, 0.35, 0.2, 0.42, 0.7, 0.42);
      for (let k = 0; k < 8; k++)
        p.d(esfera, navaClara, cu + 0.05 * Math.sin(k * 1.6), 0.85 + k * 0.25, 0.2 + 0.05 * Math.cos(k * 1.6), 0.17, 0.17, 0.17);
      p.d(caja, navaClara, cu, 2.85, 0.2, 0.38, 0.16, 0.38);
    }
    p.d(caja, navaClara, pu, 3.0, 0.22, 2.3, 0.24, 0.42);
    for (const s of [-1, 1]) p.d(caja, navaClara, pu + s * 0.66, 4.35, 0.12, 0.18, 1.9, 0.18);
  }
  // El pináculo alto de la esquina.
  pieza(caja, navaClara, 18.3, 7.4, 43.7, 0.5, 0.8, 0.5);
  pieza(caja, navaClara, 18.3, 7.9, 43.7, 0.62, 0.14, 0.62);
  pieza(piramide, navaClara, 18.3, 8.5, 43.7, 0.36, 1.1, 0.36, 0, Math.PI / 4);
  // Detrás de Santa Catalina y de Nava, las casas que dan a Viana y a San Agustín.
  manzana([9.6, 26, 18.6, 36], ['n', 'e'], ['n', 'e'], ['n']);

  // --- Catedral de los Remedios: fachada neoclásica de cantería oscura y paños blancos entre dos
  // torres, cuerpo neogótico y la gran cúpula forrada de cobre ---
  const cx = 8,
    cz = 6.4,
    negro = '#4f4c48',
    blancoC = '#f1eee7',
    rosa = '#c98b7b';
  muro(blancoC, cx, 4.1, cz + 1.2, 10.8, 8.2, 2.4);
  const cat = frente(cx, cz, Math.PI);
  // Pilastras, impostas y cornisas de cantería.
  for (const u of [-5.4, -3.0, 3.0, 5.4]) cat.d(caja, negro, u, 4.1, 0.06, 0.36, 8.2, 0.14);
  for (const u of [-1.05, 1.05]) cat.d(caja, negro, u, 6.4, 0.06, 0.3, 3.0, 0.12);
  cat.d(caja, negro, 0, 0.25, 0.05, 11, 0.5, 0.12);
  cat.d(caja, negro, 0, 4.75, 0.12, 11.1, 0.4, 0.26);
  cat.d(caja, negro, 0, 8.1, 0.14, 11.2, 0.3, 0.3);
  // Pórtico de cuatro columnas toscanas y, dentro, la puerta mayor.
  cat.d(caja, '#d9d4ca', 0, 2.3, 0.02, 5.6, 4.2, 0.02);
  cat.d(caja, '#5a3a28', 0, 1.25, 0.05, 1.1, 2.5, 0.05);
  cat.d(arco, '#5a3a28', 0, 2.5, 0.05, 1.1, 1.1, 0.05);
  cat.d(aro, negro, 0, 2.5, 0.08, 1.3, 1.3, 1.2);
  for (const s of [-1, 1]) cat.d(caja, negro, s * 0.68, 1.25, 0.08, 0.16, 2.5, 0.12);
  for (const u of [-2.6, -0.95, 0.95, 2.6]) {
    cat.d(caja, negro, u, 0.35, 0.95, 0.56, 0.4, 0.56);
    cat.d(poste, negro, u, 2.4, 0.95, 0.44, 3.7, 0.44);
    cat.d(caja, negro, u, 4.32, 0.95, 0.56, 0.16, 0.56);
  }
  cat.d(caja, negro, 0, 4.62, 0.62, 6.1, 0.42, 1.0);
  for (const u of [-1.78, 1.78]) {
    cat.d(caja, hierro, u, 0.95, 0.95, 1.3, 0.05, 0.03);
    for (let k = -4; k <= 4; k++) cat.d(caja, hierro, u + k * 0.15, 0.55, 0.95, 0.025, 0.8, 0.025);
  }
  // Cuerpo alto: rosetón entre dos ventanas, frontón y cruz.
  cat.d(disco, negro, 0, 6.4, 0.04, 1.5, 0.08, 1.5, Math.PI / 2);
  cat.d(disco, '#6b5b55', 0, 6.4, 0.07, 1.2, 0.04, 1.2, Math.PI / 2);
  cat.luz(0, 6.4, 0.09, 0.85, 0.36, 0.03);
  cat.luz(0, 6.4, 0.09, 0.36, 0.85, 0.03);
  for (let k = 0; k < 4; k++) cat.d(caja, negro, 0, 6.4, 0.11, 1.2, 0.04, 0.03, 0, (k * Math.PI) / 4);
  for (const u of [-2.0, 2.0]) {
    cat.d(caja, negro, u, 6.4, 0.04, 0.9, 1.4, 0.06);
    cat.luz(u, 6.4, 0.08, 0.62, 1.1);
    for (let k = -2; k <= 2; k++) cat.d(caja, negro, u + k * 0.12, 6.4, 0.1, 0.02, 1.1, 0.02);
  }
  cat.d(fronton, '#6a6762', 0, 8.25, 0.1, 6.2, 1.4, 0.3);
  const caida = Math.atan2(1.4, 3.1);
  for (const s of [-1, 1]) cat.d(caja, negro, s * 1.55, 8.95, 0.22, 3.4, 0.16, 0.22, 0, -s * caida);
  cat.d(caja, negro, 0, 10.1, 0.15, 0.1, 0.9, 0.1);
  cat.d(caja, negro, 0, 10.2, 0.15, 0.5, 0.1, 0.1);
  for (const s of [-1, 1]) cat.d(esfera, negro, s * 3.0, 8.55, 0.12, 0.2, 0.32, 0.2);
  // Las dos torres: puerta lateral y óculo abajo, campanario de arcos y cúpula bulbosa nervada.
  for (const s of [-1, 1]) {
    const u = s * 4.2;
    cat.d(caja, '#5a3a28', u, 1.05, 0.05, 0.9, 2.1, 0.05);
    cat.d(caja, negro, u, 2.25, 0.08, 1.2, 0.3, 0.14);
    cat.d(fronton, negro, u, 2.4, 0.08, 1.3, 0.35, 0.14);
    cat.d(disco, negro, u, 3.55, 0.04, 0.9, 0.06, 0.9, Math.PI / 2);
    cat.luz(u, 3.55, 0.07, 0.5, 0.5, 0.03);
    cat.d(caja, negro, u, 6.4, 0.04, 0.8, 1.2, 0.06);
    cat.luz(u, 6.4, 0.08, 0.56, 0.95);
    const [tx, tz] = cat.en(u, -1.2);
    muro(blancoC, tx, 9.35, tz, 2.3, 2.3, 2.3);
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      pieza(caja, negro, tx + dx * 1.08, 9.35, tz + dz * 1.08, 0.3, 2.3, 0.3);
    for (const g of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const c = frente(tx + Math.sin(g) * 1.15, tz + Math.cos(g) * 1.15, g);
      c.d(caja, oscuro, 0, 9.15, 0.01, 0.95, 1.3, 0.03);
      c.d(arco, oscuro, 0, 9.8, 0.01, 0.95, 0.95, 0.03);
      c.d(cupula, '#8a6a3a', 0, 9.3, -0.3, 0.3, 0.42, 0.3);
    }
    pieza(caja, negro, tx, 10.6, tz, 2.65, 0.2, 2.65);
    pieza(octogono, '#c8a050', tx, 10.82, tz, 2.3, 0.24, 2.3);
    pieza(octogono, negro, tx, 11.15, tz, 2.0, 0.42, 2.0);
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) * Math.PI) / 4;
      frente(tx + Math.sin(a) * 0.98, tz + Math.cos(a) * 0.98, a).d(disco, '#d6d0c4', 0, 11.15, 0, 0.2, 0.04, 0.2, Math.PI / 2);
    }
    pieza(cupula, '#5d5955', tx, 11.36, tz, 1.0, 1.3, 1.0);
    pieza(octogono, '#c8a050', tx, 11.4, tz, 2.05, 0.08, 2.05);
    pieza(poste, '#5d5955', tx, 12.75, tz, 0.4, 0.45, 0.4);
    pieza(cupula, '#5d5955', tx, 12.97, tz, 0.3, 0.38, 0.3);
    pieza(esfera, '#c8a050', tx, 13.45, tz, 0.08, 0.12, 0.08);
  }
  // Naves neogóticas: muros con contrafuertes y ventanales apuntados; cubierta de bovedillas rosadas.
  const nz0 = 8.8,
    nz1 = 16.4;
  muro('#ebe6dc', cx, 3.5, (nz0 + nz1) / 2, 9.6, 7, nz1 - nz0);
  pieza(caja, '#cfa197', cx, 7.04, (nz0 + nz1) / 2, 9.7, 0.1, nz1 - nz0 + 0.1);
  for (const z of [9.7, 11.5]) for (const x of [cx - 3.1, cx, cx + 3.1]) pieza(cupula, rosa, x, 7.05, z, 1.4, 0.5, 0.8);
  for (const z of [13.3, 15.5]) for (const x of [cx - 3.5, cx + 3.5]) pieza(cupula, rosa, x, 7.05, z, 1.2, 0.45, 0.95);
  for (const z of [10.4, 12.4, 14.4, 16.2])
    for (const s of [-1, 1]) {
      pieza(caja, '#d8d2c6', cx + s * 4.95, 3.0, z, 0.5, 6.0, 0.55);
      pieza(piramide, '#d8d2c6', cx + s * 4.95, 6.4, z, 0.34, 0.8, 0.34, 0, Math.PI / 4);
    }
  for (const z of [11.4, 13.4, 15.3])
    for (const s of [-1, 1]) {
      const x = cx + s * 4.82;
      pieza(caja, oscuro, x, 3.9, z, 0.06, 2.4, 0.7);
      pieza(piramide, oscuro, x, 5.35, z, 0.06, 0.5, 0.5, 0, Math.PI / 4);
      ventanas.push([x + s * 0.02, 3.9, z, 0.04, 2.2, 0.5]);
    }
  // Cimborrio: tambor octogonal con ventanas, cúpula de cobre, linterna y la cruz de hormigón.
  const dz = 14.6;
  pieza(octogono, '#ebe6dc', cx, 7.9, dz, 4.6, 1.8, 4.6);
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) * Math.PI) / 4,
      x = cx + Math.sin(a) * 2.14,
      z = dz + Math.cos(a) * 2.14;
    pieza(caja, oscuro, x, 7.95, z, 0.5, 1.1, 0.06, 0, a);
    ventanas.push([x, 7.95, z, 0.3, 0.9, 0.3]);
  }
  pieza(octogono, '#d8d2c6', cx, 8.86, dz, 4.9, 0.16, 4.9);
  pieza(cupula, '#8d5f45', cx, 8.9, dz, 2.25, 2.4, 2.25);
  pieza(octogono, '#ebe6dc', cx, 11.55, dz, 0.9, 0.8, 0.9);
  ventanas.push([cx, 11.55, dz, 0.6, 0.5, 0.6]);
  pieza(cupula, '#8d5f45', cx, 11.95, dz, 0.5, 0.45, 0.5);
  pieza(caja, '#e6e2d8', cx, 13.0, dz, 0.14, 1.6, 0.14);
  pieza(caja, '#e6e2d8', cx, 13.35, dz, 0.75, 0.14, 0.14);
  // Girola: el ábside semicircular, poco común en Canarias, con sus contrafuertes.
  pieza(medioCilindro, '#ebe6dc', cx, 2.8, nz1, 4.6, 5.6, 4.6);
  pieza(medioCono, '#b47d6d', cx, 6.25, nz1, 4.85, 1.3, 4.85);
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + ((k + 0.5) * Math.PI) / 5,
      b = a + 0.32;
    pieza(caja, '#d8d2c6', cx + Math.sin(a) * 4.7, 2.5, nz1 + Math.cos(a) * 4.7, 0.4, 5.0, 0.5, 0, a);
    if (k < 4) {
      pieza(caja, oscuro, cx + Math.sin(b) * 4.62, 3.6, nz1 + Math.cos(b) * 4.62, 0.5, 2.0, 0.06, 0, b);
      ventanas.push([cx + Math.sin(b) * 4.64, 3.6, nz1 + Math.cos(b) * 4.64, 0.3, 1.8, 0.3]);
    }
  }
  // Plaza de la Catedral: los dos dragos ante la fachada y una verja junto a La Carrera.
  drago(3.6, 4.6, 2.3);
  drago(12.4, 4.6, 2.6);
  for (let z = 6.8; z < 20.6; z += 0.3) pieza(caja, hierro, 2.0, 0.5, z, 0.03, 1.0, 0.03);
  pieza(caja, hierro, 2.0, 1.0, 13.7, 0.05, 0.05, 13.8);
  pieza(caja, '#7b8558', 2.0, 0.03, 13.7, 1.2, 0.06, 13.8);
  manzana([1.4, 21.2, 13.4, 23.6], ['s'], ['s'], [], 2.4);
  manzana([13.4, 3.6, 18.6, 23.6], ['e', 'n'], ['e'], ['n'], 4);

  // --- Iglesia de la Concepción: tres naves de cal y teja, cantería oscura en esquinas y vanos ---
  const ivory = '#efe4c6',
    ic = -5.9;
  muro(ivory, ic, 2.8, -36, 4, 5.6, 20);
  tejado(ic, 5.6, -36, 4.5, 20.4, 1.7, ivory);
  muro(ivory, -9.15, 2.1, -36, 2.5, 4.2, 20);
  muro(ivory, -2.65, 2.1, -34.8, 2.5, 4.2, 17.6);
  faldon([-7.9, 5.3, -46.1], [-7.9, 5.3, -25.9], [-10.6, 4.2, -25.9], [-10.6, 4.2, -46.1]);
  faldon([-3.9, 5.3, -43.6], [-3.9, 5.3, -25.9], [-1.2, 4.2, -25.9], [-1.2, 4.2, -43.6]);
  pieza(caja, '#5b5650', ic, 0.25, -36, 9.04, 0.5, 20.04);
  for (const [x, z] of [
    [-10.4, -26],
    [-10.4, -46],
    [-1.4, -26],
    [-7.9, -26],
    [-3.9, -26],
  ])
    for (let k = 0, y = 0.5; y < (Math.abs(x - ic) < 2.5 ? 5.4 : 4.0); k++, y += 0.36) {
      const a = k % 2 ? 0.22 : 0.36;
      pieza(caja, piedra, x, y + 0.17, z, a + 0.06, 0.33, a + 0.06);
    }
  // Testero al sur, hacia La Carrera: óculo en lo alto.
  {
    const p = frente(ic, -26, 0);
    p.d(disco, piedra, 0, 4.7, 0.03, 0.95, 0.06, 0.95, Math.PI / 2);
    p.luz(0, 4.7, 0.06, 0.55, 0.55, 0.03);
    p.d(caja, '#d9c9a0', 0, 5.62, 0.06, 4.3, 0.1, 0.12);
  }
  // Costados: ventanas de medio punto con su arco de cantería y una portada a cada plaza.
  for (const [x, giro] of [
    [-10.4, -Math.PI / 2],
    [-1.4, Math.PI / 2],
  ] as [number, number][]) {
    const p = frente(x, -36, giro);
    for (const u of [-7, -4, 4.4, 7.2]) {
      p.d(caja, piedra, u, 2.7, 0.02, 0.8, 1.4, 0.06);
      p.d(arco, piedra, u, 3.4, 0.02, 0.8, 0.8, 0.06);
      p.luz(u, 2.75, 0.06, 0.5, 1.2);
      p.d(arco, '#ffc572', u, 3.35, 0.055, 0.5, 0.5, 0.02);
    }
    const pu = giro < 0 ? 0.6 : -0.6;
    p.d(caja, '#4a3122', pu, 1.15, 0.03, 1.2, 2.3, 0.05);
    p.d(arco, '#4a3122', pu, 2.3, 0.03, 1.2, 1.2, 0.05);
    for (const s of [-1, 1]) p.d(caja, piedra, pu + s * 0.74, 1.15, 0.06, 0.28, 2.3, 0.14);
    p.d(enjuta, piedra, pu, 2.3, 0.06, 1.6, 1.6, 0.14);
    p.d(caja, piedra, pu, 3.33, 0.08, 1.8, 0.14, 0.18);
  }
  // Portada de los pies, al norte, junto a la torre.
  {
    const p = frente(ic, -46, Math.PI);
    p.d(caja, '#4a3122', 0, 1.25, 0.03, 1.3, 2.5, 0.05);
    p.d(arco, '#4a3122', 0, 2.5, 0.03, 1.3, 1.3, 0.05);
    for (const s of [-1, 1]) p.d(caja, piedra, s * 0.8, 1.3, 0.06, 0.3, 2.6, 0.14);
    p.d(enjuta, piedra, 0, 2.5, 0.06, 1.75, 1.75, 0.14);
    p.d(disco, piedra, 0, 4.4, 0.03, 0.8, 0.06, 0.8, Math.PI / 2);
    p.luz(0, 4.4, 0.06, 0.46, 0.46, 0.03);
  }

  // --- Torre de la Concepción: sillares de piedra oscura, balcones de hierro, reloj, campanario
  // de dos arcos por cara y linterna octogonal ---
  const tx = -1.9,
    tz = -45.1,
    sillar = '#6b625a',
    moldura = '#544c45';
  pieza(caja, sillar, tx, 4.95, tz, 3, 9.9, 3);
  for (let k = 0, y = 0.33; y < 9.9; k++, y += 0.33) {
    pieza(caja, '#4d4640', tx, y, tz, 3.02, 0.025, 3.02);
    for (const g of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const c = frente(tx + Math.sin(g) * 1.5, tz + Math.cos(g) * 1.5, g);
      for (const u of k % 2 ? [-1.12, -0.37, 0.37, 1.12] : [-0.75, 0, 0.75]) c.d(caja, '#4d4640', u, y - 0.165, 0.005, 0.025, 0.33, 0.02);
    }
  }
  for (const y of [2.5, 4.6, 6.7, 8.6]) pieza(caja, moldura, tx, y, tz, 3.22, 0.16, 3.22);
  pieza(caja, moldura, tx, 0.25, tz, 3.12, 0.5, 3.12);
  for (const g of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const c = frente(tx + Math.sin(g) * 1.5, tz + Math.cos(g) * 1.5, g);
    // Ventanuco enrejado abajo y una ventana con balconcillo en cada cuerpo.
    c.d(caja, moldura, 0, 1.3, 0.02, 0.7, 0.9, 0.05);
    c.d(caja, oscuro, 0, 1.3, 0.04, 0.5, 0.7, 0.03);
    for (let k = -2; k <= 2; k++) c.d(caja, hierro, k * 0.1, 1.3, 0.07, 0.02, 0.72, 0.02);
    for (const y of [3.5, 5.6, 7.6]) {
      c.d(caja, moldura, 0, y, 0.02, 0.72, 1.12, 0.05);
      c.luz(0, y, 0.05, 0.5, 0.92);
      c.d(caja, '#4a3424', 0, y, 0.07, 0.04, 0.92, 0.02);
      c.d(caja, moldura, 0, y - 0.6, 0.18, 0.9, 0.06, 0.34);
      c.d(caja, hierro, 0, y - 0.2, 0.34, 0.9, 0.035, 0.025);
      for (let k = -3; k <= 3; k++) c.d(caja, hierro, k * 0.13, y - 0.38, 0.34, 0.02, 0.36, 0.02);
    }
    // Reloj bajo el campanario.
    c.d(disco, '#f2efe6', 0, 9.25, 0.03, 0.62, 0.04, 0.62, Math.PI / 2);
    c.d(caja, oscuro, 0.06, 9.32, 0.06, 0.03, 0.2, 0.02, 0, -0.5);
    c.d(caja, oscuro, -0.05, 9.22, 0.06, 0.03, 0.14, 0.02, 0, 1.2);
  }
  pieza(caja, moldura, tx, 9.98, tz, 3.3, 0.18, 3.3);
  // Campanario: dos arcos por cara, con su campana y antepecho de hierro.
  pieza(caja, sillar, tx, 11.0, tz, 2.84, 1.9, 2.84);
  for (const g of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const c = frente(tx + Math.sin(g) * 1.42, tz + Math.cos(g) * 1.42, g);
    for (const u of [-0.62, 0.62]) {
      c.d(caja, oscuro, u, 10.85, 0.01, 0.72, 1.2, 0.03);
      c.d(arco, oscuro, u, 11.45, 0.01, 0.72, 0.72, 0.03);
      c.d(aro, moldura, u, 11.45, 0.03, 0.86, 0.86, 0.8);
      c.d(cupula, '#8a6a3a', u, 10.95, -0.25, 0.26, 0.42, 0.26);
      c.d(caja, hierro, u, 10.55, 0.05, 0.72, 0.04, 0.03);
      for (let k = -2; k <= 2; k++) c.d(caja, hierro, u + k * 0.14, 10.4, 0.05, 0.02, 0.3, 0.02);
    }
  }
  pieza(caja, moldura, tx, 12.05, tz, 3.5, 0.3, 3.5);
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    pieza(caja, moldura, tx + Math.sin(a) * 1.6, 11.84, tz + Math.cos(a) * 1.6, 0.14, 0.14, 0.14);
  }
  // Linterna octogonal de arcos, con su cornisa.
  pieza(octogono, oscuro, tx, 12.9, tz, 1.9, 1.4, 1.9, 0, Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + Math.PI / 8;
    pieza(caja, sillar, tx + Math.sin(a) * 1.08, 12.9, tz + Math.cos(a) * 1.08, 0.3, 1.4, 0.3, 0, a);
    const b = a + Math.PI / 8;
    pieza(aro, sillar, tx + Math.sin(b) * 1.0, 13.3, tz + Math.cos(b) * 1.0, 0.56, 0.56, 0.8, 0, b);
  }
  pieza(octogono, moldura, tx, 13.7, tz, 2.6, 0.22, 2.6, 0, Math.PI / 8);
  pieza(octogono, sillar, tx, 13.9, tz, 2.3, 0.18, 2.3, 0, Math.PI / 8);

  // --- Plaza del Doctor Olivera: pilar de piedra y bancos entre las palmeras ---
  const ox = -13.7,
    oz = -37;
  pieza(disco, '#8a8279', ox, 0.08, oz, 3.0, 0.16, 3.0);
  pieza(disco, '#7a736a', ox, 0.45, oz, 2.3, 0.6, 2.3);
  pieza(disco, '#7fb3b8', ox, 0.76, oz, 2.0, 0.03, 2.0);
  pieza(poste, '#7a736a', ox, 1.0, oz, 0.34, 0.6, 0.34);
  pieza(disco, '#7a736a', ox, 1.35, oz, 1.0, 0.14, 1.0);
  pieza(poste, '#7a736a', ox, 1.55, oz, 0.16, 0.3, 0.16);
  for (const z of [-42.4, -31.6]) banco(-13.7, z, z < oz ? 0 : Math.PI);
  for (const [x, z] of [
    [-16.6, -26.6],
    [-10.8, -47.6],
    [5.4, -24.2],
    [5.4, -47.6],
  ])
    farol(x, z);

  // --- Ruinas de San Agustín: los muros y las arcadas de columnas, sin tejado ---
  const ruina = '#dcd0b6',
    piedraR = '#a39a8c';
  const rz = -7.75;
  muro(ruina, 21.65, 2.6, rz, 0.5, 5.2, 12.5);
  muro(ruina, 27.75, 2.3, rz, 0.5, 4.6, 12.5);
  for (const z of [-13.75, -1.75]) muro(ruina, 24.7, 2.3, z, 6.6, 4.6, 0.5);
  pieza(caja, '#8e8468', 24.7, 0.03, rz, 5.6, 0.06, 11.5);
  {
    const p = frente(21.4, rz, -Math.PI / 2);
    p.d(caja, oscuro, 0, 1.2, 0.02, 1.3, 2.4, 0.04);
    p.d(arco, oscuro, 0, 2.4, 0.02, 1.3, 1.3, 0.04);
    for (const s of [-1, 1]) p.d(caja, piedra, s * 0.8, 1.2, 0.06, 0.3, 2.4, 0.14);
    p.d(enjuta, piedra, 0, 2.4, 0.06, 1.9, 1.9, 0.14);
    p.d(caja, piedra, 0, 3.55, 0.08, 2.1, 0.16, 0.18);
    for (const u of [-3.6, 3.6]) {
      p.d(caja, piedra, u, 3.5, 0.02, 0.8, 1.3, 0.06);
      p.d(arco, piedra, u, 4.15, 0.02, 0.8, 0.8, 0.06);
      p.d(caja, '#c9d4dc', u, 3.5, 0.04, 0.5, 1.1, 0.03);
    }
    // Huecos del incendio: se ve el cielo por las ventanas.
    p.d(caja, '#5a5048', 0, 5.2, 0.05, 12.5, 0.08, 0.1);
  }
  for (const x of [23.7, 25.7]) {
    const p = frente(x, rz, -Math.PI / 2);
    for (let i = 0; i < 7; i++) {
      const u = -4.5 + i * 1.5;
      p.d(caja, piedraR, u, 0.15, 0, 0.5, 0.3, 0.5);
      p.d(poste, piedraR, u, 1.55, 0, 0.32, 2.5, 0.32);
      p.d(caja, piedraR, u, 2.88, 0, 0.46, 0.16, 0.46);
      if (i < 6) p.d(enjuta, ruina, u + 0.75, 2.96, 0, 1.5, 1.5, 0.36);
    }
    p.d(caja, ruina, 0, 4.1, 0, 9.9, 0.7, 0.36);
  }
  for (let i = 0; i < 14; i++) pieza(esfera, i % 2 ? '#6f8a4a' : '#86955a', 22.4 + azar() * 4.8, 0.2, -13 + azar() * 10.5, 0.4 + azar() * 0.3, 0.3, 0.4);
  casa([21.4, -1.5, 25.6, 1.2], 3.4, 'o', '#e6c46c', true);
  casa([25.6, -1.5, 28, 1.2], 3.0, 's', '#efe2c4', false);

  // --- Las manzanas de la cuadrícula ---
  // Entre La Carrera y Herradores, al oeste; entre La Carrera y San Agustín, al este.
  manzana([-12, 3.6, -1.4, 23.6], ['o', 'e', 'n', 's'], ['o', 'e', 'n', 's'], ['n']);
  manzana([-12, -14, -1.4, 1.2], ['o', 'e', 'n', 's'], ['o', 'e', 'n', 's'], ['n']);
  // Las casas frente a la catedral, de una planta, para que se vea su fachada.
  manzana([1.4, -14, 18.6, 1.2], ['o', 'e', 'n', 's'], ['o', 'e', 'n', 's'], ['n', 's']);
  manzana([-12, -23.6, -1.4, -16.4], ['o', 'e', 'n', 's'], ['o', 'e', 'n', 's'], ['n']);
  manzana([1.4, -23.6, 18.6, -16.4], ['o', 'e', 'n', 's'], ['o', 'e', 'n', 's'], ['n']);
  manzana([6, -48.4, 21.4, -26], ['o', 'e', 'n', 's'], ['o', 's']);
  manzana([-32, -48.4, -17, -26], ['o', 'e', 'n', 's'], ['e'], ['e']);
  // Más allá, la ciudad: manzanas de casas sencillas hasta perderse en la bruma.
  const columnas: [number, number][] = [
    [-52, -34.6],
    [-32, -14.8],
    [-12, -1.4],
    [1.4, 18.6],
    [21.4, 38.6],
    [41.2, 58],
  ];
  const filas: [number, number][] = [
    [-66, -50.8],
    [-48.4, -26],
    [-23.6, -16.4],
    [-14, 1.2],
    [3.6, 23.6],
    [26, 44],
    [44, 62],
    [64.4, 80],
  ];
  const nucleo = (x0: number, z0: number) =>
    (x0 >= -12 && x0 < 21 && z0 > -50 && z0 < 63) ||
    (x0 === -32 && z0 === -48.4) ||
    (x0 === 21.4 && z0 === -14) ||
    (x0 === 1.4 && z0 === 64.4);
  for (const [x0, x1] of columnas)
    for (const [z0, z1] of filas) {
      if (nucleo(x0, z0) || Math.hypot((x0 + x1) / 2 - 4, (z0 + z1) / 2 - 6) > 78) continue;
      const hasta = x1 === -14.8 && z0 >= 26 ? -12 : x1;
      // Fachadas labradas hacia las calles que se pasean: Herradores, San Agustín, la plaza y la trasera de la iglesia.
      const labradas: Lado[] = [];
      if (x1 === -14.8 && z0 > -26 && z0 < 26) labradas.push('e');
      if (hasta === -12 && z0 === 44) labradas.push('e');
      if (x0 === 21.4 && z0 > -26 && z0 <= 44) labradas.push('o');
      if (z0 === -66 && x0 > -33 && x0 < 6) labradas.push('s');
      // Al sur de la plaza, entre ella y la cámara, todo de una planta.
      manzana([x0, z0, hasta, z1], ['o', 'e', 'n', 's'], labradas, z0 > 62 ? ['o', 'e', 'n', 's'] : []);
    }
  // Detrás de las ruinas, el antiguo convento, hoy instituto.
  manzana([28, -14, 38.6, 1.2], ['o', 'e', 'n', 's']);

  // --- Ermita de San Miguel, al otro lado de la plaza: cal, portada de cantería y espadaña ---
  muro(blanco, 15.4, 1.8, 67.2, 4, 3.6, 5.6);
  tejado(15.4, 3.6, 67.2, 4.4, 6.0, 1.3, blanco);
  pieza(caja, piedra, 15.4, 0.2, 67.2, 4.04, 0.4, 5.64);
  {
    const p = frente(15.4, 64.4, Math.PI);
    esquinas(p, 4, 3.6);
    p.d(caja, '#4a3122', 0, 1.05, 0.03, 1.0, 2.1, 0.05);
    p.d(arco, '#4a3122', 0, 2.1, 0.03, 1.0, 1.0, 0.05);
    for (const s of [-1, 1]) p.d(caja, piedra, s * 0.64, 1.05, 0.06, 0.26, 2.1, 0.14);
    p.d(enjuta, piedra, 0, 2.1, 0.06, 1.4, 1.4, 0.14);
    p.d(caja, blanco, 0, 5.3, -0.1, 1.2, 1.4, 0.3);
    p.d(caja, oscuro, 0, 5.2, 0.06, 0.5, 0.6, 0.04);
    p.d(arco, oscuro, 0, 5.5, 0.06, 0.5, 0.5, 0.04);
    p.d(cupula, '#8a6a3a', 0, 5.12, -0.02, 0.18, 0.26, 0.12);
    p.d(fronton, blanco, 0, 6.0, -0.1, 1.2, 0.4, 0.3);
  }
  manzana([1.4, 64.4, 13.4, 80], ['o', 'e', 'n', 's'], ['n'], ['o', 'e', 'n', 's']);
  manzana([13.4, 70, 18.6, 80], ['e', 's', 'o'], [], ['e', 's', 'o']);

  cocer(tejados, teja, 1.85);
  for (const [color, geos] of muros) cocer(geos, tenido(cal, color), 2.6);
  // --- La bruma: velos que se espesan hacia el suelo y apagan los montes del fondo ---
  const velo = new T.CylinderGeometry(76, 76, 1, 64, 1, true);
  for (const [y0, y1, opacidad] of [
    [-3, 7, 0.62],
    [7, 13, 0.4],
    [13, 20, 0.2],
  ]) {
    const material = new T.MeshStandardMaterial({ color: '#ece4d8', transparent: true, opacity: opacidad, depthWrite: false, side: T.BackSide, roughness: 1 });
    const malla = superficie(velo, material, 0, (y0 + y1) / 2, 0, 1, y1 - y0, 1, 20);
    malla.castShadow = malla.receiveShadow = false;
  }
  velo.dispose();
  for (const g of [arco, enjuta, cupula, octogono, disco, fronton, aro, medioCilindro, medioCono]) g.dispose();
  return { amarres: [], enSeco: [] };
}
