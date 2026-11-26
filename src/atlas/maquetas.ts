import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLAZA, SOLARIUM, VASOS, type XY } from './recintos';

// Ambos escenarios conservan el plano horizontal de la ortofoto. La plaza gira
// hacia su eje longitudinal para que las fachadas enfrentadas se puedan modelar en metros de juego.
export function referencia(caleta: boolean) {
  const cx = caleta ? 426 : 410,
    cy = caleta ? 303 : 295,
    unidad = caleta ? 8 : 11;
  const a = caleta ? 1 : 0.393919,
    b = caleta ? 0 : 0.919145;
  return {
    mundo: ([u, v]: XY): XY => [
      ((u - cx) * a + (v - cy) * b) / unidad,
      (-(u - cx) * b + (v - cy) * a) / unidad,
    ],
    foto: (x: number, z: number): XY => [cx + (x * a - z * b) * unidad, cy + (x * b + z * a) * unidad],
  };
}

export async function maquetaVisita(caleta: boolean) {
  const scene = new T.Scene();
  const luz = new T.HemisphereLight(0xfff2d6, 0x91a3b0, 1.7);
  const sol = new T.DirectionalLight(0xffdfaf, 2.3);
  sol.position.set(-20, 34, 14);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, far: 110 });
  sol.shadow.normalBias = 0.045;
  scene.add(luz, sol);
  scene.background = new T.Color(caleta ? '#b5d9df' : '#eed5bc');
  scene.fog = new T.Fog(scene.background, 40, 105);
  const geo = referencia(caleta),
    loader = new T.TextureLoader();
  const orto = await loader.loadAsync(
    import.meta.env.BASE_URL + 'assets/visitas/' + (caleta ? 'caleta' : 'vegueta') + '-pnoa.webp',
  );
  orto.colorSpace = T.SRGBColorSpace;
  orto.anisotropy = 4;
  const cielo = await loader.loadAsync(import.meta.env.BASE_URL + 'assets/puerto/horizonte.webp');
  cielo.colorSpace = T.SRGBColorSpace;
  cielo.wrapS = T.MirroredRepeatWrapping;
  cielo.repeat.x = 4;
  const adoquin = await loader.loadAsync(import.meta.env.BASE_URL + 'assets/puerto/adoquin.webp');
  adoquin.colorSpace = T.SRGBColorSpace;
  adoquin.wrapS = adoquin.wrapT = T.RepeatWrapping;
  adoquin.repeat.set(0.4, 0.4);
  adoquin.anisotropy = 4;
  const horizonte = new T.Mesh(
    new T.CylinderGeometry(88, 88, 50, 72, 1, true),
    new T.MeshBasicMaterial({ map: cielo, side: T.BackSide, fog: false }),
  );
  horizonte.position.y = 16;
  scene.add(horizonte);
  const ancho = caleta ? 850 : 900,
    alto = caleta ? 590 : 600;
  const terreno = new T.BufferGeometry();
  const puntos: XY[] = [
    [0, 0],
    [0, alto],
    [ancho, alto],
    [ancho, 0],
  ];
  terreno.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      puntos.flatMap((p) => {
        const [x, z] = geo.mundo(p);
        return [x, -0.05, z];
      }),
      3,
    ),
  );
  terreno.setAttribute('uv', new T.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 1, 1], 2));
  terreno.setIndex([0, 1, 2, 0, 2, 3]);
  terreno.computeVertexNormals();
  const base = new T.Mesh(
    terreno,
    new T.MeshStandardMaterial({ map: orto, roughness: 1, side: T.DoubleSide, color: 0xf3deca }),
  );
  base.receiveShadow = true;
  scene.add(base);
  const bloques: T.BufferGeometry[] = [];
  const box = new T.BoxGeometry(),
    esfera = new T.SphereGeometry(1, 10, 8),
    tubo = new T.CylinderGeometry(0.49, 0.51, 1, 12);
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
    const g = forma.index ? forma.toNonIndexed() : forma.clone();
    g.deleteAttribute('uv');
    g.scale(w, h, d);
    g.applyQuaternion(new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)));
    g.translate(x, y, z);
    const rgb = new T.Color(color),
      tintas = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < tintas.length; i += 3) rgb.toArray(tintas, i);
    g.setAttribute('color', new T.BufferAttribute(tintas, 3));
    bloques.push(g);
  }
  function suelo(poly: XY[], material: T.Material, y: number) {
    const fig = new T.Shape(
      poly.map((p) => {
        const [x, z] = geo.mundo(p);
        return new T.Vector2(x, -z);
      }),
    );
    const g = new T.ShapeGeometry(fig);
    g.rotateX(-Math.PI / 2);
    const m = new T.Mesh(g, material);
    m.position.y = y;
    m.receiveShadow = true;
    scene.add(m);
  }
  const agua = new T.ShaderMaterial({
    uniforms: { tiempo: { value: 0 }, profundo: { value: 0 } },
    vertexShader:
      'varying vec3 p;void main(){p=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
    fragmentShader: `varying vec3 p;uniform float tiempo;uniform float profundo;
    void main(){float a=sin(p.x*1.5+sin(p.z*2.3+tiempo*.5)+tiempo*.55);float b=cos(p.z*2.4+sin(p.x*.78-tiempo*.4));
      vec3 c=mix(vec3(.045,.57,.58),vec3(.012,.18,.25),profundo);
      c+=.09*a+.06*b+vec3(.15,.19,.15)*smoothstep(.52,.87,a*b);
      gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }`,
    side: T.DoubleSide,
  });
  const oceano = agua.clone();
  oceano.uniforms.profundo.value = 1;
  const piedra = '#9d907e',
    cal = '#f4e4bf',
    canteria = '#857e75',
    madera = '#805c42';
  // Huecos, carpintería y jardineras en el plano de cada fachada.
  function fachada(x: number, z: number, h: number, giro: number, tinte: string) {
    function detalle(forma: T.BufferGeometry, color: string, u: number, y: number, v: number, w: number, alto: number, fondo: number) {
      pieza(forma, color, x + u * Math.cos(giro) + v * Math.sin(giro), y,
        z - u * Math.sin(giro) + v * Math.cos(giro), w, alto, fondo, 0, giro);
    }
    detalle(box, tinte, 0, .86, .04, .78, 1.72, .12);
    detalle(box, piedra, 0, .09, .18, 1.05, .18, .38);
    for (const u of [-1.25, 1.25]) {
      detalle(box, tinte, u, h*.59, .06, .98, 1.02, .14);
      detalle(box, '#547b85', u, h*.59, .14, .58, .82, .04);
      detalle(box, cal, u, h*.59, .18, .045, .82, .04);
      detalle(box, '#965e48', u, h*.59-.54, .18, .98, .18, .32);
      for (let j=0;j<5;j++) {
        detalle(esfera, '#507949', u-.37+j*.18, h*.59-.41, .21, .16,.15,.14);
        detalle(esfera, j%2 ? '#d65b80' : '#b53563', u-.34+j*.17, h*.59-.32, .29, .11,.10,.09);
      }
    }
  }
  if (caleta) {
    // El océano sigue la costa del recorte. Los vasos mantienen sus contornos por separado.
    suelo(
      [
        [0, 584],
        [83, 471],
        [222, 440],
        [247, 389],
        [333, 369],
        [373, 398],
        [427, 386],
        [477, 357],
        [508, 318],
        [563, 299],
        [618, 327],
        [704, 303],
        [780, 325],
        [850, 313],
        [1800, 350],
        [1800, 1600],
        [-900, 1600],
      ],
      oceano,
      -0.01,
    );
    suelo(SOLARIUM, new T.MeshStandardMaterial({ map: adoquin, color: '#e2c4a5', roughness: 1 }), 0.02);
    for (const vaso of VASOS) {
      suelo(vaso, agua, 0.055);
      vaso.forEach((p, i) => {
        const [x, z] = geo.mundo(p),
          [u, v] = geo.mundo(vaso[(i + 1) % vaso.length]);
        pieza(
          box,
          '#d6c9b5',
          (x + u) / 2,
          0.11,
          (z + v) / 2,
          0.16,
          0.18,
          Math.hypot(u - x, v - z) + 0.04,
          0,
          Math.atan2(u - x, v - z),
        );
      });
    }
    // Escaleras, pasamanos y duchas en la plataforma, mar al sureste.
    for (const p of [
      [443, 243],
      [404, 340],
    ] as XY[]) {
      const [x, z] = geo.mundo(p);
      for (const dx of [-0.25, 0.25]) pieza(tubo, '#c7d5ce', x + dx, 0.47, z, 0.065, 0.92, 0.065);
      for (let j = 0; j < 3; j++) pieza(box, '#d5dcd5', x, 0.12 + j * 0.22, z, 0.53, 0.045, 0.065);
    }
    for (const [u, v] of [
      [338, 280],
      [355, 306],
      [365, 270],
    ]) {
      const [x, z] = geo.mundo([u, v]);
      pieza(tubo, '#786955', x, 0.92, z, 0.1, 1.82, 0.1);
      pieza(tubo, '#c1ae8c', x, 1.85, z, 1.6, 0.12, 1.6);
    }
    for (const [u, v, w, d, h] of [
      [623, 133, 4, 5, 2.6],
      [670, 126, 6, 5, 3.3],
      [751, 151, 5, 7, 3],
      [616, 230, 3, 2, 1.7],
      [155, 224, 3, 4, 2.2],
    ]) {
      const [x, z] = geo.mundo([u, v]);
      pieza(box, cal, x, h / 2, z, w, h, d);
      pieza(box, '#c59577', x, h + 0.08, z, w + 0.18, 0.16, d + 0.18);
      fachada(x,z+d/2,h,0,'#378b86');
    }
    // Basalto a lo largo de la rompiente, fuera del paseo y de los vasos.
    for (let i=0;i<54;i++) {
      const u=180+i*9, v=430-(u-180)*.27+Math.sin(i*.83)*10;
      const [x,z]=geo.mundo([u,v]);
      if (u>325 && u<516) continue;
      pieza(esfera, i%3 ? '#5b5650' : '#776958',x,.12,z,.8+(i%3)*.28,.48+(i%4)*.14,.9,0,i);
    }
  } else {
    suelo(PLAZA, new T.MeshStandardMaterial({ map: adoquin, color: '#e8d3af', roughness: 1 }), 0.02);
    for (let i = -13; i <= 13; i++) pieza(box, '#ab9d88', 0, 0.032, i, 8.7, 0.016, 0.035);
    // Fachada de la catedral al este-noreste de la plaza y dos campanarios.
    pieza(box, canteria, 0, 3.0, -16.4, 10.3, 6, 6.4);
    for (const x of [-4.1, 4.1]) {
      pieza(box, '#938a7c', x, 4.7, -14.1, 2.25, 9.4, 2.55);
      for (const y of [3.7, 6.0, 7.8, 9.3]) pieza(box, cal, x, y, -14.1, 2.5, 0.17, 2.81);
      for (const dx of [-0.77, 0.77])
        for (const dz of [-0.78, 0.78]) pieza(tubo, canteria, x + dx, 10, -14.1 + dz, 0.34, 1.4, 0.34);
      pieza(esfera, '#817f78', x, 10.7, -14.1, 1.22, 0.95, 1.22);
      pieza(tubo, canteria, x, 11.73, -14.1, 0.16, 0.8, 0.16);
    }
    for (const x of [-2, 0, 2]) {
      pieza(box, madera, x, 1.03, -13.13, 1.28, 2.1, 0.21);
      pieza(esfera, madera, x, 2.04, -13.12, 0.65, 0.61, 0.12);
      for (const dx of [-0.78, 0.78]) pieza(tubo, '#b2ada0', x + dx, 2.55, -12.98, 0.27, 5.1, 0.29);
    }
    pieza(tubo, '#645f55', 0, 4.65, -13.04, 1.58, 0.19, 1.58, Math.PI / 2);
    pieza(tubo, '#eadbc0', 0, 4.65, -12.9, 1.12, 0.16, 1.12, Math.PI / 2);
    for (let j = 0; j < 4; j++)
      pieza(box, piedra, 0, 0.09 * j, -12.58 - j * 0.22, 10.5, 0.18 * j + 0.05, 0.4);
    // Ayuntamiento frente a la catedral, galería porticada hacia la plaza.
    pieza(box, '#d7bf97', 0, 2.55, 14.6, 10, 5.1, 3.4);
    for (let i = -3; i <= 3; i++) {
      const x = i * 1.25;
      pieza(box, '#524e44', x, 1.18, 12.82, 0.78, 2, 0.09);
      pieza(esfera, '#524e44', x, 2.13, 12.82, 0.4, 0.45, 0.09);
      pieza(box, '#55676a', x, 3.64, 12.81, 0.66, 1.0, 0.1);
    }
    for (const y of [2.77, 4.98, 5.28]) pieza(box, cal, 0, y, 14.6, 10.4, 0.18, 3.7);
    // Casas de los laterales, con patios de paso y balcones.
    for (const lado of [-1, 1])
      for (let i = 0; i < 5; i++) {
        const z = -9.7 + i * 4.6,
          x = lado * 8.3,
          h = 3.3 + (i % 3) * 0.4;
        pieza(box, [cal, '#debd94', '#c49a78'][i % 3], x, h / 2, z, 4.2, h, 4.4);
        pieza(box, '#ad6f51', x, h + 0.11, z, 4.4, 0.22, 4.55);
        fachada(x-lado*2.1,z,h,-lado*Math.PI/2,['#368381','#647a4e','#925841'][i%3]);
      }
    for (const lado of [-1, 1])
      for (let i = 0; i < 5; i++) {
        const x = lado * 4.2,
          z = -8 + i * 4.2;
        pieza(tubo, madera, x, 1.9, z, 0.29, 3.8, 0.29);
        for (let j = 0; j < 12; j++) {
          const a = j * 2.4;
          pieza(
            esfera,
            j % 2 ? '#74925d' : '#497955',
            x + 0.7 * Math.sin(a),
            3.95,
            z + 0.7 * Math.cos(a),
            0.24,
            0.18,
            1.14,
            0.22,
            a,
          );
        }
      }
    for (const lado of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const x = lado * (1.62 + i * 0.78),
          z = -10.9;
        pieza(box, piedra, x, 0.15, z, 0.67, 0.29, 0.82);
        pieza(esfera, '#4f554a', x, 0.55, z, 0.21, 0.36, 0.28);
        pieza(esfera, '#4f554a', x, 0.89, z + 0.18, 0.17, 0.19, 0.17);
        for (const dx of [-0.13, 0.13]) pieza(box, '#4f554a', x + dx, 0.34, z + 0.2, 0.08, 0.28, 0.1);
      }
  }
  const decor = new T.Mesh(
    mergeGeometries(bloques),
    new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }),
  );
  decor.castShadow = decor.receiveShadow = true;
  scene.add(decor);
  for (const g of [...bloques, box, esfera, tubo]) g.dispose();
  return {
    scene,
    geo,
    actualizar: (tiempo: number) => {
      agua.uniforms.tiempo.value = tiempo;
      oceano.uniforms.tiempo.value = tiempo;
    },
    limpiar: () => {
      agua.dispose();
      oceano.dispose();
      orto.dispose();
      cielo.dispose();
      adoquin.dispose();
      sol.shadow.dispose();
    },
  };
}
