import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Sitio } from './carta';
import { extremo, caminoExtremo } from './extremos';
import { referencia, maquetaVisita } from './maquetas';
import { paseable } from './recintos';
import { CARTA, VISITAS } from '../data/dialogos';
import '../puerto/puerto.css';

export async function pasear(
  sitio: Sitio,
  heroe: HTMLCanvasElement,
  volver: () => void,
  isla: () => void,
  ciudad: () => void,
) {
  const caleta = sitio === 'la-caleta',
    ficha = VISITAS[sitio];
  const renderer = new T.WebGLRenderer({ antialias: true });
  const nuevo = sitio === 'orchilla' || sitio === 'la-restinga';
  const maqueta = await (nuevo ? extremo(sitio) : maquetaVisita(caleta)).catch((error) => {
    renderer.dispose();
    renderer.forceContextLoss();
    throw error;
  });
  const { scene } = maqueta;
  const geo = referencia(caleta);
  const root = document.createElement('section');
  root.className = 'puerto visita';
  root.innerHTML = `<header><span class="marca">CanaryQuest</span><div class="acciones"><button data-carta>${CARTA.titulo}</button><button data-isla>${CARTA.isla}</button></div></header>
  <aside><small>${ficha.zona}</small><h1>${ficha.nombre}</h1></aside><footer><article><p>${ficha.descripcion}</p>${nuevo ? '' : '<small>'+CARTA.ortofoto+'</small>'}${sitio !== 'las-palmas' ? '' : '<button data-ciudad>' + CARTA.pasear + ' ↗</button>'}</article><details><summary aria-label="${CARTA.controles}">?</summary><p>${CARTA.ayuda}</p></details></footer>`;
  root.prepend(renderer.domElement);
  document.body.append(root);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', ficha.nombre);
  root.querySelector('[data-carta]')!.addEventListener('click', volver);
  root.querySelector('[data-isla]')!.addEventListener('click', isla);
  root.querySelector('[data-ciudad]')?.addEventListener('click', ciudad);
  renderer.setPixelRatio(Math.min(1.6, devicePixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  const camara = new T.PerspectiveCamera(38, 1, 0.15, 180);
  const orbita = new OrbitControls(camara, canvas);
  orbita.enablePan = false;
  orbita.enableDamping = true;
  orbita.minDistance = 12;
  orbita.maxDistance = 55;
  orbita.minPolarAngle = 0.34;
  orbita.maxPolarAngle = 1.22;
  camara.position.set(...((caleta ? [13, 20, 22] : [4, 12, 25]) as [number, number, number]));
  const textura = new T.CanvasTexture(heroe);
  textura.colorSpace = T.SRGBColorSpace;
  textura.magFilter = T.NearestFilter;
  const jugador = new T.Sprite(new T.SpriteMaterial({ map: textura }));
  jugador.center.set(0.5, 0);
  jugador.scale.set(1.15, 2.3, 1);
  const inicio = nuevo ? [0, sitio === 'orchilla' ? 5 : 0] : geo.mundo(caleta ? [385, 328] : [368, 308]);
  jugador.position.set(inicio[0], 0.14, inicio[1]);
  scene.add(jugador);
  const teclas = new Set<string>(),
    eventos = new AbortController(),
    op = { signal: eventos.signal };
  function ajustar() {
    renderer.setSize(root.clientWidth, root.clientHeight, false);
    camara.aspect = root.clientWidth / root.clientHeight;
    camara.updateProjectionMatrix();
  }
  ajustar();
  window.addEventListener('resize', ajustar, op);
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.code === 'Escape') volver();
      else if (
        ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(
          e.code,
        )
      ) {
        e.preventDefault();
        teclas.add(e.code);
      }
    },
    op,
  );
  window.addEventListener('keyup', (e) => teclas.delete(e.code), op);
  window.addEventListener('blur', () => teclas.clear(), op);
  const rayo = new T.Raycaster(),
    plano = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const inicioToque = new T.Vector2();
  let arrastre = false,
    destino: T.Vector3 | null = null;
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (!e.isPrimary) {
        arrastre = true;
        return;
      }
      inicioToque.set(e.clientX, e.clientY);
      arrastre = false;
    },
    op,
  );
  canvas.addEventListener(
    'pointermove',
    (e) => {
      if (Math.hypot(e.clientX - inicioToque.x, e.clientY - inicioToque.y) > 6) arrastre = true;
    },
    op,
  );
  const libre = (x: number, z: number) => nuevo ? caminoExtremo(sitio,x,z) : paseable(caleta, geo.foto(x, z));
  canvas.addEventListener(
    'pointerup',
    (e) => {
      if (!e.isPrimary || arrastre) return;
      const b = canvas.getBoundingClientRect();
      rayo.setFromCamera(
        new T.Vector2(
          ((e.clientX - b.left) / b.width) * 2 - 1,
          1 - ((e.clientY - b.top) / b.height) * 2,
        ),
        camara,
      );
      const p = rayo.ray.intersectPlane(plano, new T.Vector3());
      if (p && libre(p.x, p.z)) destino = p;
    },
    op,
  );
  let previo = performance.now(),
    t = 0;
  renderer.setAnimationLoop((ahora: number) => {
    const dt = Math.min((ahora - previo) / 1000, 0.05);
    previo = ahora;
    t += dt;
    const pos = jugador.position;
    const h =
      Number(teclas.has('KeyD') || teclas.has('ArrowRight')) -
      Number(teclas.has('KeyA') || teclas.has('ArrowLeft'));
    const v =
      Number(teclas.has('KeyS') || teclas.has('ArrowDown')) -
      Number(teclas.has('KeyW') || teclas.has('ArrowUp'));
    const a = orbita.getAzimuthalAngle();
    let dx = h * Math.cos(a) + v * Math.sin(a),
      dz = -h * Math.sin(a) + v * Math.cos(a);
    if (h || v) destino = null;
    else if (destino) {
      dx = destino.x - pos.x;
      dz = destino.z - pos.z;
      if (Math.hypot(dx, dz) < 0.04) destino = null;
    }
    const n = Math.hypot(dx, dz);
    if (n > 0.001) {
      const paso = Math.min(dt * 4, n);
      let mueve = false;
      if (libre(pos.x + (dx / n) * paso, pos.z) && dx !== 0) {
        pos.x += (dx / n) * paso;
        mueve = true;
      }
      if (libre(pos.x, pos.z + (dz / n) * paso) && dz !== 0) {
        pos.z += (dz / n) * paso;
        mueve = true;
      }
      if (!mueve) destino = null;
    }
    pos.y = 0.14 + (n > 0.07 ? Math.abs(Math.sin(t * 12)) * 0.07 : 0);
    const mx = (pos.x * 0.4 - orbita.target.x) * dt * 3,
      mz = (pos.z * 0.45 - orbita.target.z) * dt * 3;
    orbita.target.x += mx;
    camara.position.x += mx;
    orbita.target.z += mz;
    camara.position.z += mz;
    orbita.update();
    maqueta.actualizar(t);
    renderer.render(scene, camara);
  });
  return () => {
    eventos.abort();
    renderer.setAnimationLoop(null);
    orbita.dispose();
    textura.dispose();
    scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of [o.material].flat()) m.dispose();
      }
    });
    jugador.material.dispose();
    maqueta.limpiar();
    renderer.dispose();
    renderer.forceContextLoss();
    root.remove();
  };
}
