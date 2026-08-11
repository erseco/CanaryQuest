# CanaryQuest — Plan de implementación: Vertical Slice jugable

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un juego jugable de principio a fin en navegador (escritorio y móvil): título → mapa de viaje → isla de Gran Canaria → pueblo → misión completa del pastor del Roque Nublo, con combate, diálogos, HUD y guardado.

**Architecture:** Phaser 3 con escenas parametrizadas: las vistas de isla usan ilustraciones como fondo con colisiones de polígonos (formato Tiled), los pueblos usan tilemaps Tiled 32 px. La lógica de misiones/guardado/viajes es TypeScript puro sin dependencia de Phaser, testeable con Vitest.

**Tech Stack:** Phaser 3.90.x · TypeScript strict · Vite 7 · Vitest · assets: ilustraciones propias + Tuxemon 32px extruido (CC-BY-SA) + atlas "misa" + audio BrowserQuest (CC-BY-SA 3.0)

## Global Constraints

- Motor: **Phaser 3.90.x** — decisión cerrada, no cambiar.
- Tiles: **32 px** — decisión cerrada.
- Resolución base **960×540**, `pixelArt: true`, `Scale.FIT`, `autoCenter: CENTER_BOTH`.
- Textos del juego **en español**; identificadores de código en inglés o español coherente (elegir español para datos de juego: `islas`, `misiones`).
- `vite.config.ts` con `base: './'` (el build debe funcionar en cualquier subruta).
- Commit al final de **cada tarea** (mensajes sin atribución de IA).
- Nada de librerías extra sin justificar (ni grid-engine, ni RPGJS: lecciones de intentos previos).
- El slice usa **Gran Canaria** (su ilustración existe); La Graciosa queda para cuando exista su ilustración.

---

### Task 1: Scaffold del proyecto

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/scenes/BootScene.ts`

**Interfaces:**
- Produces: comando `npm run dev` sirviendo un canvas Phaser negro con texto "CanaryQuest"; `npm test` corre Vitest; `npm run build` genera `dist/` estático.

- [ ] **Step 1:** `package.json` con deps: `phaser@^3.90.0`; devDeps: `typescript@~5.9`, `vite@^7`, `vitest@^3`. Scripts: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test` (`vitest run`), `test:watch`.
- [ ] **Step 2:** `tsconfig.json` strict, `"types": ["vite/client"]`, target ES2022, module ESNext, moduleResolution bundler.
- [ ] **Step 3:** `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1600 },
});
```

- [ ] **Step 4:** `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, CSS: fondo `#0a1a3a`, `html,body { margin:0; height:100%; overflow:hidden; touch-action:none; }`, contenedor `#game` centrado.
- [ ] **Step 5:** `src/main.ts`:

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#0a1a3a',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene],
});
```

- [ ] **Step 6:** `BootScene` mínima que pinta "CanaryQuest" centrado. Verificar `npm run dev` (carga sin errores de consola) y `npm run build`.
- [ ] **Step 7:** Commit `feat: scaffold Phaser + Vite + TS`.

### Task 2: Copiar y optimizar assets + créditos

**Files:**
- Create: `public/assets/islas/*.jpg` (7, redimensionadas si >1254), `public/assets/islas/mapa-mundo.jpg`, `public/assets/titulo/archipielago-aereo.jpg`
- Create: `public/assets/tilesets/tuxemon-32px-extruido.png`, `public/assets/maps/pueblo.tmj` (desde tuxemon-town.json), `public/assets/sprites/atlas.png|json`, `public/assets/sprites/hero.png`, `public/assets/audio/*`
- Create: `docs/creditos.md`

**Interfaces:**
- Produces: claves de carga estándar: `isla-gran-canaria`, `mapa-mundo`, `titulo-fondo`, `tiles-pueblo`, `map-pueblo`, `atlas` (héroe), `audio-titulo`, `audio-overworld`, `audio-isla`, SFX `sfx-npc`, `sfx-chest`, `sfx-loot`, `sfx-teleport`, `sfx-achievement`.

- [ ] **Step 1:** Copiar desde las rutas verificadas: `canaryquest-no/src/assets/{tilesets,atlas,tilemaps/tuxemon-town.json}`, `canarias-rpg/public/assets/audio/`, `canarias-rpg/canarias-quest/main/spritesheets/characters/hero.png`. Islas desde `art/` (convertir mapa-mundo.png→jpg ~85 % con `sips` para bajar los 8 MB).
- [ ] **Step 2:** Revisar `ls` de `BrowserQuest/client/img/1/` buscando sprite de enemigo pequeño (`crab.png`, `rat.png`) y anotarlo; si no hay herbívoro para las cabras, se usará textura generada (Task 8).
- [ ] **Step 3:** `docs/creditos.md` con tabla: asset, origen, licencia (Tuxemon CC-BY-SA 4.0; BrowserQuest CC-BY-SA 3.0 — música/SFX; atlas misa de la plantilla phaser-rpg MIT; ilustraciones propias generadas con IA).
- [ ] **Step 4:** Commit `feat: assets del slice + créditos`.

### Task 3: Datos de islas y grafo de viajes (TDD)

**Files:**
- Create: `src/data/islas.ts`, `src/sistemas/viajes.ts`
- Test: `tests/viajes.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Isla {
  id: IslaId; // 'gran-canaria' | 'tenerife' | ... las 8
  nombre: string;
  ilustracion: string | null; // null → isla aún sin arte (la-graciosa)
  puerto: { x: number; y: number } | null;      // coords en la ilustración
  aeropuerto: { x: number; y: number } | null;
  mapaMundo: { x: number; y: number };          // posición en mapa-mundo.jpg (2752×1536)
}
export function destinosDesde(islaId: IslaId, medio: 'barco' | 'avion'): IslaId[];
```

- Reglas: avión conecta todas las islas con aeropuerto entre sí (La Gomera y La Graciosa sin aeropuerto); barco conecta según rutas reales simplificadas (vecinas + líneas troncales Fred Olsen/Armas). `destinosDesde` nunca incluye la isla origen.

- [ ] **Step 1:** Test: `destinosDesde('gran-canaria','avion')` incluye `tenerife` y no incluye `gran-canaria` ni `la-gomera`; `destinosDesde('la-gomera','avion')` es `[]`; `destinosDesde('la-gomera','barco')` incluye `tenerife`.
- [ ] **Step 2:** Verificar que falla. Implementar datos + función. Verificar que pasa.
- [ ] **Step 3:** Commit `feat: datos de islas y grafo de viajes`.

### Task 4: SaveManager (TDD)

**Files:**
- Create: `src/sistemas/SaveManager.ts`
- Test: `tests/saveManager.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Partida {
  version: 1;
  islaActual: IslaId;
  simbolos: IslaId[];          // islas completadas
  misiones: Record<string, { estado: 'pendiente' | 'activa' | 'completada'; paso: number }>;
  inventario: string[];
  corazones: number;           // máximo actual (3 inicial)
}
export const SaveManager: {
  cargar(): Partida | null;    // null si no hay o no valida
  guardar(p: Partida): void;
  nueva(): Partida;
  borrar(): void;
};
```

- [ ] **Step 1:** Tests con localStorage simulado (vitest + happy-dom o stub global): guardar→cargar roundtrip; cargar con JSON corrupto devuelve `null`; cargar con `version` distinta devuelve `null`; `nueva()` empieza en `gran-canaria` con 3 corazones.
- [ ] **Step 2:** Rojo → implementar → verde.
- [ ] **Step 3:** Commit `feat: SaveManager con validación de versión`.

### Task 5: QuestManager + misión del pastor (TDD)

**Files:**
- Create: `src/sistemas/QuestManager.ts`, `src/data/misiones.ts`
- Test: `tests/questManager.test.ts`

**Interfaces:**
- Produces:

```ts
export type PasoMision =
  | { tipo: 'hablar'; npc: string; dialogo: string }
  | { tipo: 'recoger'; item: string; cantidad: number }
  | { tipo: 'derrotar'; enemigo: string; cantidad: number }
  | { tipo: 'llegar'; poi: string };
export interface Mision { id: string; isla: IslaId; titulo: string; pasos: PasoMision[]; recompensa: string; }
export class QuestManager {
  constructor(estado: Partida['misiones']);
  activar(id: string): void;
  pasoActual(id: string): PasoMision | null;
  notificar(evento: { tipo: 'hablar'|'recoger'|'derrotar'|'llegar'; objetivo: string; cantidad?: number }): string[]; // ids de misiones que avanzaron
  estaCompletada(id: string): boolean;
  exportar(): Partida['misiones'];
}
```

- Datos: misión `pastor-roque-nublo` (Gran Canaria): hablar(pastor) → recoger(cabra ×3) → derrotar(alimaña ×1) → hablar(pastor); recompensa `simbolo-gran-canaria`. Definir también las otras 7 misiones del spec como datos (aunque el slice solo cablea esta).
- Nota: `recoger` con cantidad acumula progreso interno (contador por paso, persistido en `paso` + conteo derivado del inventario o contador propio — usar contador propio `progreso` dentro del estado de misión; ampliar `Partida.misiones[x]` con `progreso: number`).

- [ ] **Step 1:** Tests: activar pone paso 0; `notificar({tipo:'hablar',objetivo:'pastor'})` avanza; recoger 3 cabras avanza solo al llegar a 3; completar todos los pasos marca completada; notificar evento irrelevante no avanza; `exportar()`→`new QuestManager(exportado)` conserva estado.
- [ ] **Step 2:** Rojo → implementar → verde.
- [ ] **Step 3:** Commit `feat: QuestManager data-driven + 8 misiones definidas`.

### Task 6: Preload + Título + arranque de partida

**Files:**
- Create: `src/scenes/PreloadScene.ts`, `src/scenes/TitleScene.ts`
- Modify: `src/main.ts`, `src/scenes/BootScene.ts`

**Interfaces:**
- Consumes: claves de assets (Task 2), `SaveManager`.
- Produces: flujo Boot→Preload (barra de progreso; errores de carga visibles en pantalla)→Título (fondo aéreo, «Nueva partida», «Continuar» si hay guardado válido)→`TravelMapScene` o `IslandScene` según partida. Música de título con botón 🔊/🔇 persistente (registry + localStorage `cq-mute`).

- [ ] **Step 1:** Implementar escenas; teclado (flechas+Enter) y click/tap en botones.
- [ ] **Step 2:** Probar en navegador: nueva partida llega a IslandScene (stub temporal con texto), continuar aparece solo con guardado.
- [ ] **Step 3:** Commit `feat: título y flujo de arranque`.

### Task 7: IslandScene — ilustración + colisiones + movimiento + POIs

**Files:**
- Create: `src/scenes/IslandScene.ts`, `src/sistemas/Jugador.ts`, `public/assets/maps/islas/gran-canaria.tmj`

**Interfaces:**
- Consumes: `isla-gran-canaria` (1254×1254), atlas `misa` (frames `misa-front|back|left|right`-walk de la plantilla), datos de POIs.
- Produces: clase `IslandScene extends Phaser.Scene` con `init({ islaId })`; `Jugador` reutilizable (sprite + física + `moverHacia(x,y)` tap-to-move + cursores/WASD, 8 direcciones, 120 px/s, animaciones 4 direcciones); POIs como zonas circulares que emiten `poi-activado` al solaparse (puerto, aeropuerto, pueblo, roque-nublo, dunas).
- Colisiones: `gran-canaria.tmj` formato Tiled JSON hand-made: `imagelayer` con la ilustración + `objectgroup` "colisiones" con polígonos de la costa/montañas (coordenadas estimadas de la ilustración, refinables en Tiled) + `objectgroup` "pois" con puntos nombrados. En Phaser: crear `Phaser.Geom.Polygon` por objeto y bloquear movimiento si el punto destino del jugador cae fuera del polígono andable (modelo: 1 polígono grande "isla" andable + N polígonos bloqueantes).
- Cámara: follow con lerp 0.08, bounds = tamaño de la ilustración, zoom 1.

- [ ] **Step 1:** Autorar `gran-canaria.tmj` con polígono costero grosero (12-20 vértices sobre la ilustración) + 4-6 POIs con coordenadas reales mirando la imagen.
- [ ] **Step 2:** Implementar `Jugador` (tap-to-move: caminar en línea recta al objetivo, cancelar al llegar/colisionar) y la escena. Tap sobre POI = caminar hasta él y activarlo.
- [ ] **Step 3:** Probar en navegador: caminar por la isla, no poder entrar al mar, activar el POI del pueblo muestra un log.
- [ ] **Step 4:** Commit `feat: vista de isla con ilustración, colisiones y POIs`.

### Task 8: DetailScene (pueblo) + NPC pastor + cabras y alimaña en la isla

**Files:**
- Create: `src/scenes/DetailScene.ts`, `src/sistemas/Npc.ts`, `src/sistemas/Enemigo.ts`
- Modify: `src/scenes/IslandScene.ts` (spawns de cabras/alimaña), `public/assets/maps/pueblo.tmj` (añadir objetos `entrada`, `npc-pastor`)

**Interfaces:**
- Consumes: `map-pueblo` (tuxemon-town), `tiles-pueblo` extruido, atlas héroe.
- Produces: `DetailScene` con `init({ mapaId, retorno: { islaId, x, y } })`; capas Tiled con `setCollisionByProperty({ collides: true })`; objeto `salida` que devuelve a la isla; `Npc` (sprite estático con `interactuar()` → evento `dialogo`); `Enemigo` (patrulla horizontal 60 px/s, persigue a radio 120 px, `recibirGolpe(knockback)`, muere a 1 golpe); cabras = sprites recogibles (textura `cabra` generada 24×24 con Graphics si no hay sprite mejor) que al tocarlas emiten `recoger:cabra`.

- [ ] **Step 1:** Implementar DetailScene con el tilemap tuxemon: entrar desde el POI pueblo, salir de vuelta a la isla en la posición de retorno.
- [ ] **Step 2:** Colocar al pastor (frame del `hero.png` RPG-Maker o atlas) con indicador «!». Cabras (3) y alimaña (1) en IslandScene cerca de las dunas.
- [ ] **Step 3:** Probar: entrar/salir del pueblo conserva estado; enemigo persigue y hace daño (log).
- [ ] **Step 4:** Commit `feat: pueblo con tilemap, NPC, cabras y alimaña`.

### Task 9: Diálogos + HUD + combate + táctil

**Files:**
- Create: `src/scenes/UIScene.ts`, `src/sistemas/DialogueBox.ts`, `src/sistemas/TouchControls.ts`
- Modify: `Jugador.ts` (espada + recibir daño), `Enemigo.ts`, escenas

**Interfaces:**
- Produces: `UIScene` overlay siempre activa tras el título: corazones (♥ ×3, medios), título de misión activa, botón pausa/mute; `DialogueBox` (caja inferior, typewriter 30 cps, avance con Espacio/tap, cola de líneas); espada: tecla Espacio/botón táctil B → arco de 90° delante del jugador 250 ms (hitbox arcade), golpea `Enemigo`; daño al jugador: ½ corazón + invulnerabilidad 1 s parpadeando; muerte → fade y reaparecer en entrada de escena con corazones llenos. `TouchControls`: pad virtual izquierda + botón B derecha, visibles solo si `this.sys.game.device.input.touch`.
- Eventos de juego vía `game.events`: `dialogo(lineas: string[])`, `dano(medio: number)`, `recoger(item)`, `derrotado(enemigo)`.

- [ ] **Step 1:** Implementar DialogueBox y UIScene; hablar con el pastor muestra sus líneas.
- [ ] **Step 2:** Implementar espada + daño + muerte/respawn.
- [ ] **Step 3:** Probar teclado y modo táctil (emulación táctil de devtools).
- [ ] **Step 4:** Commit `feat: diálogos, HUD, combate y controles táctiles`.

### Task 10: Cablear la misión + guardado + TravelMapScene

**Files:**
- Create: `src/scenes/TravelMapScene.ts`, `src/data/dialogos.ts`
- Modify: escenas para conectar QuestManager/SaveManager

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: partida completa: Título → (nueva) IslandScene Gran Canaria → pueblo → hablar pastor (activa misión, diálogos según estado) → recoger 3 cabras → derrotar alimaña → volver al pastor → recompensa `simbolo-gran-canaria` + SFX achievement → ir al puerto/aeropuerto abre TravelMapScene (fondo mapa-mundo, islas seleccionables con cursor/tap según `destinosDesde`, animación de sprite barco/avión — triángulo/elipse generada si no hay sprite — moviéndose entre islas, ~2 s) → llegar a otra isla muestra "🚧 Próximamente" y vuelta. Autosave en cada transición y avance de misión.
- Diálogos del pastor en `src/data/dialogos.ts`: variantes por estado (sin activar / en curso-cabras / en curso-alimaña / lista para entregar / completada), en español canario suave («mi niño», «chacho»).

- [ ] **Step 1:** Implementar TravelMapScene con las 8 islas del mapa (posiciones de `islas.ts`), bloqueando las que no tienen arte con cartel «Próximamente».
- [ ] **Step 2:** Cablear misión + autosave; probar el flujo completo de la misión.
- [ ] **Step 3:** Commit `feat: misión del pastor completa + viajes + autosave`.

### Task 11: Verificación jugable + build + documentación

**Files:**
- Create: `AGENTS.md`, `docs/arquitectura.md`, `docs/decisiones.md`, `docs/como-anadir-contenido.md`, `docs/prompts-assets.md`
- Modify: lo que surja del playtest

**Interfaces:**
- Produces: `npm run build` limpio; playthrough completo verificado en navegador (desktop + emulación móvil); docs en español: arquitectura (diagrama de escenas + sistemas), decisiones (ADRs: Phaser/32px/híbrido/sin-grid-engine), receta para añadir isla/misión/mapa, prompts de assets pendientes (La Graciosa, héroe canario, ATR Binter, ferry, alimaña, 8 símbolos guanches), créditos completos.

- [ ] **Step 1:** Playtest completo con el navegador (flujo de misión + guardado + recarga + móvil). Arreglar lo roto.
- [ ] **Step 2:** `npm run build` + `npm run preview` verificado.
- [ ] **Step 3:** Escribir docs + AGENTS.md.
- [ ] **Step 4:** Commit `docs: arquitectura, decisiones y guías` y commit final del slice.

---

## Self-review

- **Cobertura del spec:** título ✓ (T6), mapa de viaje ✓ (T10), vista de isla híbrida ✓ (T7), detalle tilemap ✓ (T8), combate ✓ (T9), diálogos ✓ (T9), misiones ✓ (T5/T10), inventario → representado como items de misión + `Partida.inventario` (suficiente para el slice; UI de inventario completa queda para fase 2, anotado en docs), guardado ✓ (T4/T10), audio ✓ (T2/T6), táctil ✓ (T9), docs español ✓ (T11), La Graciosa pospuesta por falta de arte (anotado; el tutorial pasa a fase 2).
- **Placeholders:** ninguno pendiente; los dos assets sin fuente (cabra, barco/avión) tienen fallback concreto (textura generada) y prompt documentado en T11.
- **Consistencia de tipos:** `Partida.misiones[x]` incluye `progreso` (añadido en T5, coherente con T4 — el test de roundtrip de T4 debe incluirlo).
