import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MASPALOMAS } from '../data/dialogos';

export function caminoDunas(x: number, z: number) {
  if (z > 18 || z < -38) return false;
  if (z >= -6) return Math.abs(x) < 4.6 ||
      (x > -13 && x < 0 && z > 12 && z < 16) ||
      (x > 0 && x < 15.5 && z > 8 && z < 10.8);
  if (z >= -13) return Math.abs(x) < 2.15;
  return Math.abs(x) < (z < -21 ? 6 : 9);
}

export async function maspalomas() {
  const scene = new T.Scene();
  scene.background = new T.Color('#abd8de');
  scene.fog = new T.FogExp2('#eacfa8', 0.012);
  scene.add(new T.HemisphereLight(0xfff0d5, 0x95a4a7, 1.7));
  const sol = new T.DirectionalLight(0xffdfa3, 2);
  sol.position.set(-24, 34, 18);
  sol.castShadow = true;
  Object.assign(sol.shadow.camera, { left: -44, right: 44, top: 50, bottom: -50, far: 115 });
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.normalBias = 0.025;
  scene.add(sol);
  const bloques: T.BufferGeometry[] = [];
  const cubo = new T.BoxGeometry(),
    bola = new T.SphereGeometry(1, 12, 8),
    poste = new T.CylinderGeometry(0.5, 0.5, 1, 10);
  function pieza(
    g: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rz = 0,
    ry = 0,
  ) {
    const geo = g.index ? g.toNonIndexed() : g.clone();
    geo.deleteAttribute('uv');
    geo.scale(w, h, d);
    geo.rotateZ(rz);
    geo.rotateY(ry);
    geo.translate(x, y, z);
    const c = new T.Color(color),
      n = geo.attributes.position.count,
      cs = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.toArray(cs, 3 * i);
    geo.setAttribute('color', new T.BufferAttribute(cs, 3));
    bloques.push(geo);
  }
  const texturas: T.Texture[] = [];
  function cartel(nombre: string, x: number, y: number, z: number, w: number, h: number, color: string) {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 768, 128);
    ctx.fillStyle = '#fff5cf';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 74px Georgia';
    ctx.fillText(nombre, 384, 65, 735);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    texturas.push(t);
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t }));
    m.position.set(x, y, z);
    scene.add(m);
  }
  const cal = '#f6e8cb',
    teja = '#b56d50',
    jade = '#326f69';
  const adoquin = await new T.TextureLoader().loadAsync(
    import.meta.env.BASE_URL + 'assets/puerto/adoquin.webp',
  );
  adoquin.colorSpace = T.SRGBColorSpace;
  adoquin.wrapS = adoquin.wrapT = T.RepeatWrapping;
  adoquin.repeat.set(6, 15);
  texturas.push(adoquin);
  const calle = new T.Mesh(
    new T.PlaneGeometry(32, 43),
    new T.MeshStandardMaterial({ map: adoquin, color: '#e5cbb2' }),
  );
  calle.rotation.x = -Math.PI / 2;
  calle.position.z = 0;
  calle.receiveShadow = true;
  scene.add(calle);
  // Jardines y manzanas de fondo cierran la avenida al girar la cámara.
  pieza(cubo,'#cab889',0,-.42,13,140,.7,72);
  for(const lado of [-1,1])for(let i=0;i<6;i++){
    const x=lado*(21+(i%2)*5), z=-12+i*7, h=3.3+(i%3);
    pieza(cubo,i%2?cal:'#e7c39c',x,h/2,z,6,h,5.8);
    pieza(cubo,teja,x,h,z,6.3,.22,6);
    for(const dz of [-1.5,0,1.5])pieza(cubo,jade,x-lado*3.03,h*.56,z+dz,.11,1.1,.83);
  }
  for(const lado of [-1,1])for(const z of [-2,1,16.9]){
    const x=lado*6.5;
    pieza(cubo,'#bd9273',x,.22,z,2.5,.44,1.1);
    for(let j=0;j<9;j++){
      const dx=(j%5-2)*.42,dz=Math.floor(j/5)*.38-.2;
      pieza(bola,'#557645',x+dx,.52,z+dz,.44,.31,.33);
      pieza(bola,j%2?'#bf4274':'#e87598',x+dx,.78,z+dz,.21,.16,.19);
    }
  }
  // Hamburguesería con mostrador abierto, toldo a rayas y terraza.
  pieza(cubo, cal, -9, 1.9, 9, 8, 3.8, 5);
  pieza(cubo, teja, -9, 3.85, 9, 8.4, 0.25, 5.4);
  pieza(cubo, '#38565a', -9, 1.75, 11.53, 6, 1.85, 0.1);
  for (let i = 0; i < 12; i++)
    pieza(cubo, i % 2 ? cal : '#b55042', -12.3 + i * 0.6, 2.9, 12, 0.61, 0.16, 1.15);
  cartel(MASPALOMAS.pepe, -9, 3.55, 11.74, 7, 0.76, '#963a31');
  for (const x of [-11, -7]) {
    pieza(poste, jade, x, 0.55, 13.3, 0.13, 1.1, 0.13);
    pieza(poste, '#d4a96a', x, 1.12, 13.3, 1.5, 0.11, 1.5);
  }
  // Escaparates del CITA, sus figuras y celosía de la torre.
  pieza(cubo, '#e6aa87', 10, 2, 3, 10, 4, 6);
  for (let i = 0; i < 5; i++) {
    pieza(cubo, jade, 6 + i * 2, 1.4, 6.05, 1.45, 2.45, 0.12);
    pieza(cubo, cal, 6 + i * 2, 2.8, 6.3, 1.8, 0.21, 0.7);
  }
  cartel(MASPALOMAS.cita, 10, 3.7, 6.1, 5, 0.95, '#345e65');
  for (const x of [6.5, 13.5]) {
    pieza(bola, '#d88e44', x, 1.65, 7.3, 0.61, 0.85, 0.48);
    pieza(bola, '#f4b896', x, 2.66, 7.3, 0.55, 0.5, 0.46);
    for (const dx of [-0.22, 0.22]) {
      pieza(bola, '#fff4db', x + dx, 2.77, 7.67, 0.13, 0.16, 0.1);
      pieza(bola, '#413d44', x + dx, 2.78, 7.76, 0.058, 0.08, 0.04);
      pieza(bola, jade, x + dx, 0.69, 7.36, 0.22, 0.42, 0.27);
    }
    pieza(bola, '#b6564c', x, 2.55, 7.79, 0.18, 0.17, 0.18);
  }
  for (const lado of [-1, 1])
    for (const frente of [-1, 1]) {
      for (let j = 0; j < 6; j++) {
        const radio = 1.43 * Math.pow(0.72, j);
        pieza(
          cubo,
          '#785345',
          10 + lado * radio,
          4.54 + j * 0.93,
          3 + frente * radio,
          0.14,
          1.12,
          0.14,
          lado * 0.2,
        );
        pieza(cubo, '#9b7360', 10, 4.52 + j * 0.93, 3 + frente * radio, 2 * radio, 0.09, 0.09);
        pieza(
          cubo,
          '#986e57',
          10 + lado * radio * 0.5,
          4.55 + j * 0.93,
          3 + frente * radio,
          0.07,
          Math.hypot(radio, 0.87),
          0.07,
          lado * Math.atan2(radio, 0.87),
        );
      }
    }
  pieza(poste, '#70534a', 10, 10.18, 3, 0.12, 1.5, 0.12);
  // Las alas del hotel enmarcan la galería pública hacia el mirador.
  for (const lado of [-1, 1]) {
    pieza(cubo, cal, lado * 9, 3, -9.5, 13.4, 6, 7);
    for (let f = 0; f < 3; f++)
      for (let k = 0; k < 7; k++) {
        const x = lado * (3.5 + k * 1.81),
          y = 1.05 + f * 1.8;
        pieza(cubo, '#507a83', x, y, -5.95, 1.3, 1.27, 0.14);
        pieza(cubo, '#fff0cf', x, y - 0.49, -5.64, 1.73, 0.44, 0.77);
      }
    pieza(cubo, teja, lado * 9, 6.1, -9.5, 13.7, 0.25, 7.4);
  }
  pieza(cubo, cal, 0, 4.9, -9.5, 4.8, 2.2, 7);
  cartel(MASPALOMAS.riu, 0, 5, -5.91, 4.4, 0.8, '#9e4743');
  for (const z of [15, 4, -3, -16])
    for (const lado of [-1, 1]) {
      const x = lado * 4.95;
      pieza(poste, '#9a7555', x, 2, z, 0.4, 4, 0.38);
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4;
        pieza(
          bola,
          i % 2 ? '#63874d' : '#427454',
          x + 0.73 * Math.sin(a),
          4.03,
          z + 0.73 * Math.cos(a),
          0.29,
          0.19,
          1.36,
          0,
          a,
        );
      }
    }
  // Dunas modeladas como crestas continuas. El sendero central queda a ras de los pies.
  const arena = new T.PlaneGeometry(140, 72, 120, 80);
  arena.rotateX(-Math.PI / 2);
  arena.translate(0, -0.06, -51);
  const pos = arena.attributes.position,
    colores = [];
  const color = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i);
    const ola = 0.5 + 0.5 * Math.sin(z * 0.39 + x * 0.14 + 1.6 * Math.sin(x * 0.1));
    const altura =
      Math.min(1, Math.max(0, (Math.abs(x) - 6) / 6), Math.max(0, (-z - 19) / 5)) * 4.2 * ola ** 2;
    pos.setY(i, altura - 0.06);
    color.set('#dca25c').lerp(new T.Color('#ffe1a0'), ola * 0.8);
    colores.push(color.r, color.g, color.b);
  }
  arena.setAttribute('color', new T.Float32BufferAttribute(colores, 3));
  arena.computeVertexNormals();
  const dunas = new T.Mesh(arena, new T.MeshStandardMaterial({ vertexColors: true }));
  dunas.receiveShadow = true;
  scene.add(dunas);
  for (let z = -19; z >= -39; z -= 3)
    for (const x of [-6.2, 6.2]) pieza(poste, '#947350', x, 0.43, z, 0.13, 0.86, 0.13);
  pieza(cubo, '#488e9b', 0, -0.4, -99, 200, 0.5, 25);
  const m = new T.Mesh(
    mergeGeometries(bloques),
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  );
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  for (const g of [...bloques, cubo, bola, poste]) g.dispose();
  return {
    scene,
    actualizar: () => {},
    limpiar: () => {
      sol.shadow.dispose();
      texturas.forEach((t) => t.dispose());
    },
  };
}
