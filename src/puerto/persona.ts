import * as T from 'three';
export function persona(x: number, z: number, pastor: boolean) {
  const grupo = new T.Group(),
    camisa = pastor ? '#c89860' : '#187d99';
  const poste = new T.CylinderGeometry(0.48, 0.55, 1, 9),
    esfera = new T.IcosahedronGeometry(1, 0),
    caja = new T.BoxGeometry();
  function pieza(
    g: T.BufferGeometry,
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
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ color, flatShading: true, roughness: 1 }));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    grupo.add(m);
  }
  for (const dx of [-0.12, 0.12]) {
    pieza(poste, '#354357', dx, 0.25, 0, 0.16, 0.46, 0.17);
    pieza(esfera, '#694830', dx, 0.09, 0.06, 0.13, 0.1, 0.17);
    pieza(poste, camisa, dx * 2, 0.7, 0, 0.13, 0.48, 0.15, 0, 0, dx);
  }
  pieza(poste, camisa, 0, 0.69, 0, 0.49, 0.54, 0.37);
  pieza(esfera, '#d5996a', 0, 1.12, 0, 0.22, 0.26, 0.21);
  pieza(esfera, pastor ? '#d0a568' : '#513f33', 0, 1.32, -0.02, 0.23, 0.13, 0.22);
  if (pastor) {
    pieza(poste, '#cfa667', 0, 1.32, 0, 0.68, 0.07, 0.65);
    pieza(poste, '#805c42', 0.32, 0.65, 0.1, 0.045, 1.3, 0.045);
  } else pieza(caja, '#d07b40', 0, 0.75, -0.21, 0.34, 0.38, 0.17);
  grupo.position.set(x, 0, z);
  return grupo;
}
