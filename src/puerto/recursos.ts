import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function cargarRecursos() {
  const base = import.meta.env.BASE_URL + 'assets/puerto/';
  const texturas = new T.TextureLoader().setPath(base);
  const modelos = new GLTFLoader().setPath(base);
  const [materiales, barcos, horizonte] = await Promise.all([
    Promise.all(
      ['cal', 'adoquin', 'basalto', 'teja'].map(async (nombre) => {
        const mapa = await texturas.loadAsync(nombre + '.webp');
        mapa.colorSpace = T.SRGBColorSpace;
        mapa.wrapS = mapa.wrapT = T.MirroredRepeatWrapping;
        mapa.anisotropy = 4;
        return new T.MeshStandardMaterial({ map: mapa, roughness: 0.94, side: T.DoubleSide });
      }),
    ),
    Promise.all(
      ['boat-fishing-small', 'boat-sail-a', 'boat-row-small'].map(
        async (nombre) => (await modelos.loadAsync(nombre + '.glb')).scene,
      ),
    ),
    texturas.loadAsync('horizonte.webp'),
  ]);
  horizonte.colorSpace = T.SRGBColorSpace;
  horizonte.wrapS = T.MirroredRepeatWrapping;
  horizonte.repeat.x = 4;
  return { materiales, barcos, horizonte };
}
