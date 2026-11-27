import * as T from 'three';

export type Extremo = 'orchilla';

export function caminoExtremo(_sitio: Extremo, x: number, z: number) {
  return Math.abs(x) < 15 && z > -7 && z < 12 && (z > 0 || x < -7 || x > 7);
}

export async function extremo(sitio: Extremo) {
  const faro = sitio === 'orchilla';
  const scene = new T.Scene();
  const cielo = new T.Color(faro ? '#f2ccb1' : '#a7d9e3');
  scene.background = cielo;
  scene.fog = new T.Fog(cielo, 38, 100);
  scene.add(new T.HemisphereLight(0xffefd6, 0x889ca6, 1.8));
  const sol = new T.DirectionalLight(0xffdfab, 2.1);
  sol.position.set(-18, 22, 13);
  sol.castShadow = true;
  Object.assign(sol.shadow.camera, { left: -26, right: 26, top: 23, bottom: -23 });
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.normalBias = 0.025;
  scene.add(sol);
  const piso = await new T.TextureLoader().loadAsync(
    import.meta.env.BASE_URL + 'assets/puerto/' + (faro ? 'basalto' : 'adoquin') + '.webp',
  );
  piso.wrapS = piso.wrapT = T.RepeatWrapping;
  piso.repeat.set(12, 8);
  piso.colorSpace = T.SRGBColorSpace;
  const materiales = new Map<string, T.MeshStandardMaterial>();
  function pieza(
    g: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    let mat = materiales.get(color);
    if (!mat) {
      mat = new T.MeshStandardMaterial({ color, flatShading: true, roughness: 0.84 });
      materiales.set(color, mat);
    }
    const mesh = new T.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  const caja = new T.BoxGeometry(),
    roca = new T.IcosahedronGeometry(1, 0),
    cilindro = new T.CylinderGeometry(0.5, 0.5, 1, 8);
  const mar = pieza(caja, '#318c9b', 0, -2, 0, 180, 1, 180);
  mar.castShadow = false;
  const suelo = pieza(
    caja,
    faro ? '#977761' : '#deccad',
    0,
    -0.65,
    faro ? -3 : -12,
    45,
    1.3,
    faro ? 39 : 27,
  );
  suelo.material.map = piso;
  function casa(x: number, z: number, w: number, h: number, tono: string) {
    pieza(caja, '#f5e3c4', x, h / 2, z, w, h, 3.7);
    pieza(caja, tono, x, h, z, w + 0.25, 0.23, 4);
    pieza(caja, tono, x, 0.92, z + 1.88, 0.82, 1.84, 0.12);
    for (const lado of [-1, 1]) {
      pieza(caja, tono, x + lado * w * 0.32, h * 0.58, z + 1.89, 0.85, 0.99, 0.14);
      pieza(caja, '#607c86', x + lado * w * 0.32, h * 0.58, z + 2, 0.56, 0.72, 0.07);
    }
  }
  let linterna: T.Mesh | undefined;
  const barcos: T.Mesh[] = [];
  if (faro) {
    casa(0, -4, 10, 2.7, '#807169');
    const torre = new T.CylinderGeometry(1.15, 1.67, 1, 8);
    pieza(torre, '#807771', 0, 5, -5, 1, 10, 1);
    for (const y of [3.2, 6.7, 9.75])
      pieza(cilindro, '#b2a295', 0, y, -5, y > 9 ? 3.6 : 2.9, 0.23, y > 9 ? 3.6 : 2.9);
    linterna = pieza(cilindro, '#ffdb88', 0, 10.65, -5, 2, 1.55, 2);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      pieza(cilindro, '#555851', Math.cos(a), 10.65, -5 + Math.sin(a), 0.09, 1.6, 0.09);
    }
    pieza(new T.ConeGeometry(1.45, 1.15, 8), '#50685d', 0, 12, -5, 1, 1, 1);
    for (let i = 0; i < 84; i++) {
      const x = Math.sin(i * 12.3) * 21,
        z = Math.cos(i * 7.2) * 17 - 3;
      if (caminoExtremo(sitio, x, z) || (Math.abs(x) < 6 && Math.abs(z + 4) < 4)) continue;
      pieza(roca, i % 2 ? '#604d46' : '#755749', x, 0.19, z, 1.25, 0.67, 1.14);
    }
  }
  return {
    scene,
    actualizar: (t: number) => {
      if (linterna)
        (linterna.material as T.MeshStandardMaterial).emissive
          .setRGB(1, 0.78, 0.36)
          .multiplyScalar(1.8 * Math.pow(Math.max(0, Math.cos((t * Math.PI * 2) / 5)), 24));
      barcos.forEach((b, i) => {
        b.position.y = (i % 2 ? -0.35 : -0.96) + 0.075 * Math.sin(t + Math.floor(i / 2));
      });
    },
    limpiar: () => {
      piso.dispose();
      sol.shadow.dispose();
    },
  };
}
