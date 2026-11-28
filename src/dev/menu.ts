import type Phaser from 'phaser';
import { ISLAS, type IslaId } from '../data/islas';
import { PUEBLOS } from '../data/pueblos';
import { iniciarOrquestador } from '../sistemas/Orquestador';
import { SaveManager } from '../sistemas/SaveManager';

/** Mapas de detalle en tiles y la isla desde la que se entra a cada uno. */
const MAPAS: [string, IslaId][] = [
  ['pueblo', 'gran-canaria'],
  ['dunas', 'gran-canaria'],
  ['roque-nublo', 'gran-canaria'],
  ['las-palmas', 'gran-canaria'],
  ['isleta', 'gran-canaria'],
  ['jameos', 'lanzarote'],
  ['timanfaya', 'lanzarote'],
  ['betancuria', 'fuerteventura'],
  ['garajonay', 'la-gomera'],
];

/** Escenas que necesitan el HUD de Phaser; las vistas 3D lo duermen ellas mismas. */
const CON_HUD = new Set(['Island', 'Detail', 'TravelMap']);

/**
 * Salta a cualquier localización sin pasar por el juego: para desarrollo y pruebas.
 * También queda en `window.irA(escena, datos)` para los agentes.
 */
export function montarMenu(game: Phaser.Game): void {
  function irA(escena: string, datos: object): void {
    // Mientras se cargan los recursos no hay adónde saltar.
    if (game.scene.isActive('Boot') || game.scene.isActive('Preload')) return;
    // Desde el título aún no hay partida ni orquestador.
    if (!game.registry.get('partida')) {
      game.registry.set('partida', SaveManager.cargar() ?? SaveManager.nueva());
      iniciarOrquestador(game);
    }
    for (const s of game.scene.getScenes(true)) if (s.scene.key !== 'UI') game.scene.stop(s.scene.key);
    if (CON_HUD.has(escena)) {
      if (game.scene.isSleeping('UI')) game.scene.wake('UI');
      else if (!game.scene.isActive('UI')) game.scene.run('UI');
    }
    game.scene.start(escena, datos);
  }

  const destinos: Record<string, [string, () => void][]> = {
    'Pueblos 3D': Object.entries(PUEBLOS).map(([id, p]) => [p.nombre, () => irA('Puerto', { pueblo: id })]),
    Islas: Object.values(ISLAS).map((i) => [i.nombre, () => irA('Island', { islaId: i.id })]),
    'Mapas de tiles': MAPAS.map(([mapaId, islaId]) => [
      `${mapaId} (${ISLAS[islaId].nombre})`,
      () => {
        // Se vuelve a la isla por el punto del mismo nombre, o por donde se llega a ella.
        const pois = (game.cache.tilemap.get(`map-${islaId}`)?.data?.layers ?? []).flatMap(
          (l: { objects?: { name: string; x: number; y: number }[] }) => l.objects ?? [],
        );
        const p = pois.find((o: { name: string }) => o.name === mapaId) ?? pois.find((o: { name: string }) => o.name === 'spawn');
        irA('Detail', { mapaId, retorno: { islaId, x: p?.x ?? 0, y: p?.y ?? 0 } });
      },
    ]),
  };

  const selector = document.createElement('select');
  selector.setAttribute('aria-label', 'Ir a una localización (desarrollo)');
  selector.style.cssText =
    'position:fixed;z-index:10;left:50%;top:4px;transform:translateX(-50%);max-width:46vw;padding:3px 6px;' +
    'font:12px system-ui;color:#fff5da;background:#173e42d9;border:1px solid #f8efd25e;border-radius:6px;opacity:.75';
  selector.add(new Option('Ir a…', ''));
  const acciones: (() => void)[] = [];
  for (const [grupo, lista] of Object.entries(destinos)) {
    const og = document.createElement('optgroup');
    og.label = grupo;
    for (const [nombre, ir] of lista) {
      og.append(new Option(nombre, String(acciones.length)));
      acciones.push(ir);
    }
    selector.append(og);
  }
  selector.addEventListener('change', () => {
    const ir = acciones[Number(selector.value)];
    selector.value = '';
    selector.blur(); // devuelve el teclado al juego
    ir?.();
  });
  document.body.append(selector);
  Object.assign(window, { irA });
}
