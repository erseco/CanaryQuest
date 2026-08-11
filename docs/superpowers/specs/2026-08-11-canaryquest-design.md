# CanaryQuest — Documento de diseño

**Fecha:** 2026-08-11 · **Estado:** aprobado por Ernesto (conversación de diseño)

## 1. Concepto

Aventura-RPG pixel-art 2D con vista cenital (top-down), al estilo de *The Legend of Zelda: A Link to the Past* (SNES) y del juego móvil de *Stranger Things* (2017). El jugador recorre las **8 Islas Canarias** resolviendo una misión en cada isla, viajando entre ellas en **avión de Binter** o en **barco de Fred Olsen / Naviera Armas**.

- **Plataforma:** navegador web (escritorio y móvil). Build 100 % estático, sin backend: se puede servir desde cualquier hosting.
- **Controles:** flechas/WASD + ratón (click para moverse e interactuar) en escritorio; táctil (tap-to-move + botones virtuales) en móvil.
- **Idioma:** español (sin i18n en esta fase; los textos se centralizan en ficheros de datos para poder traducirlos después).

## 2. Decisiones cerradas (y por qué)

Estas decisiones se tomaron explícitamente para evitar los errores que mataron los intentos anteriores (ver §10):

| Decisión | Valor | Justificación |
|---|---|---|
| Motor | **Phaser 3 + TypeScript + Vite** | Motor maduro con soporte nativo de mapas Tiled, cámara, física arcade y entrada táctil. Es donde más código y mapas previos reutilizables existen. |
| Tamaño de tile | **32 px** | Los mejores tilesets disponibles (Pipoya, Tuxemon extruido) son de 32 px y casan con la densidad de las ilustraciones. Cerrado: no se revisita. |
| Mapas | **Híbrido** | Mapa-mundo y vistas de isla usan las ilustraciones pixel-art como fondo con colisiones invisibles; pueblos/interiores/mazmorras usan tilemaps de Tiled a 32 px. |
| Combate | **Acción simple estilo Zelda** | Espada con un botón, enemigos con IA simple, corazones de vida. |
| Alcance inicial | **8 islas, 1 misión por isla** | Estructura completa del archipiélago; el contenido de cada isla es deliberadamente pequeño. |
| Assets | **Reutilizar + prompts documentados** | Ilustraciones del usuario para fondos; tilesets/sprites/audio libres ya localizados; lo que falte se genera con IA usando prompts guardados en `docs/prompts-assets.md`. |

## 3. Historia marco

El **espíritu del Teide** se ha debilitado y los **8 símbolos guanches** que protegían el archipiélago se han perdido, uno en cada isla. Cada misión completada devuelve el símbolo de esa isla. Al reunir los 8 se abre la mazmorra final del Teide (Tenerife).

- **La Graciosa** es la isla tutorial (misión corta que enseña los controles).
- **Tenerife** es el final (requiere los otros 7 símbolos).
- Las otras 6 islas se pueden completar **en cualquier orden**.

## 4. Estructura de pantallas (escenas Phaser)

```
Boot/Preload ─► Título ─► Mapa de viaje (archipiélago)
                              │  elegir destino (puerto/aeropuerto)
                              ▼  animación de ferry o avión
                        Vista de isla  (ilustración + colisiones)
                              │  entrar en POI
                              ▼
                 Pueblo / Interior / Mazmorra  (tilemap Tiled 32 px)

           UIScene (overlay permanente: HUD + táctil)
```

1. **BootScene / PreloadScene** — carga de assets con barra de progreso.
2. **TitleScene** — fondo `art/archipielago-aereo.png`, «Nueva partida / Continuar».
3. **TravelMapScene (mapa de viaje)** — fondo `art/mapa-mundo.png`. No se camina: se elige isla destino con cursor/click/tap entre las conectadas al puerto o aeropuerto donde estás. Animación del ferry (Fred Olsen / Naviera Armas) o del ATR de Binter cruzando el mapa.
4. **IslandScene (vista de isla, una clase parametrizada por `islandId`)** — la ilustración de la isla como fondo a escala real (~1254×1254). El héroe camina sobre ella. Colisiones y POIs se definen en Tiled como capas de objetos (polígonos) sobre la imagen. POIs: pueblo, mazmorra, puerto, aeropuerto, NPCs de exterior.
5. **DetailScene (pueblos, interiores, mazmorras; parametrizada por `mapId`)** — tilemaps ortogonales de Tiled a 32 px. Capas estándar: `suelo`, `decoracion`, `colision`, `encima` + capa de objetos `entidades` (spawns, puertas, cofres, NPCs, enemigos).
6. **UIScene (overlay)** — corazones, misión activa, inventario, botón de pausa; en pantallas táctiles añade pad virtual + botón de acción/espada.

## 5. Sistemas

| Sistema | Comportamiento | Notas |
|---|---|---|
| Movimiento | 8 direcciones, ~120 px/s; cámara con lerp 0.08; tap/click-to-move (camina en línea recta hacia el objetivo y se detiene al colisionar) | Constantes heredadas de los intentos previos, ya afinadas |
| Combate | Espada de barrido (botón/tap), cooldown corto, knockback; enemigos patrullan y persiguen a radio fijo; tocar al jugador quita ½ corazón; 3 corazones iniciales; al morir se reaparece a la entrada de la sala con corazones llenos | Sin niveles ni XP: la progresión son los símbolos y objetos clave |
| Diálogos | Caja inferior con efecto máquina de escribir; avance con acción/tap; opciones simples (sí/no) cuando la misión lo pida | Textos en `src/data/dialogos/` |
| Misiones | `QuestManager` data-driven: JSON por isla con pasos de tipo `hablar`, `recoger`, `derrotar`, `llegar`; estados: no iniciada / en curso / completada | Lógica pura, testeable con Vitest |
| Inventario | Objetos clave de misión + items canarios (gofio, mojo, naife, queso de flor, miel de palma, talega, plátano) | Migrados de canarias-rpg |
| Guardado | Automático en `localStorage` al cambiar de escena y al completar pasos de misión; un solo slot | `SaveManager` puro y testeable |
| Viajes | Grafo de conexiones: ferry entre puertos vecinos, avión entre aeropuertos; ambos gratuitos (el transporte es ambientación, no fricción) | Datos en `src/data/islas.ts` |
| Audio | Música por contexto (título, mapa, isla, mazmorra) + SFX (espada, daño, cofre, misión); botón de silencio persistente | Fuente: BrowserQuest (CC-BY-SA 3.0) |

## 6. Las 8 misiones

| Isla | Misión | Estructura |
|---|---|---|
| La Graciosa | **Tutorial:** ayudar al pescador a recuperar sus aparejos | hablar → recoger ×3 → hablar |
| Gran Canaria | El pastor del Roque Nublo perdió su rebaño por las dunas de Maspalomas | hablar → encontrar 3 cabras → derrotar alimaña → hablar |
| Lanzarote | Calmar los volcanes de Timanfaya llevando agua de los Jameos del Agua | hablar → llegar (Jameos, mini-mazmorra) → recoger → llegar (cráter) |
| Fuerteventura | Recuperar el queso majorero robado; el ladrón se esconde en Betancuria | hablar → pistas ×2 → mazmorra corta → derrotar jefe menor |
| La Palma | Llevar la lente perdida al observatorio del Roque de los Muchachos | hablar → recoger (cueva) → llegar (subida con enemigos) |
| La Gomera | Aprender el silbo gomero para despertar al bosque de Garajonay | hablar ×2 (mini-puzzle de silbidos) → llegar (corazón del bosque) |
| El Hierro | Descifrar los petroglifos de El Julan con ayuda del lagarto gigante | hablar → recoger ×3 (fragmentos) → llegar (El Julan) |
| Tenerife | **Final:** la mazmorra del Teide (requiere los 7 símbolos) | mazmorra completa → jefe final → epílogo |

Cada misión referencia como máximo **1 mapa de detalle nuevo** (pueblo o mazmorra) además de la vista de isla, para acotar el trabajo de mapas: ~10–12 tilemaps en total en la fase 1.

## 7. Datos y estructura del proyecto

```
canaryquest/
├── index.html
├── package.json, vite.config.ts, tsconfig.json
├── AGENTS.md                  # guía para agentes/colaboradores
├── art/                       # ilustraciones fuente (no van al build)
│   ├── islas/*.jpg            # 7 vistas de isla (1254×1254)
│   ├── mapa-mundo.png         # 2752×1536, fondo del mapa de viaje
│   ├── mapa-mundo-1280.jpg    # versión ligera
│   └── archipielago-aereo.png # fondo de la pantalla de título
├── public/assets/
│   ├── islas/                 # ilustraciones optimizadas para el juego
│   ├── tilesets/              # Pipoya, Tuxemon extruido (32 px)
│   ├── maps/                  # mapas Tiled (.tmj) + colisiones de islas
│   ├── sprites/               # héroe, NPCs, enemigos, ferry, avión
│   └── audio/
├── src/
│   ├── main.ts                # config Phaser (pixelArt, Scale.FIT)
│   ├── scenes/                # Boot, Preload, Title, TravelMap, Island, Detail, UI
│   ├── systems/               # QuestManager, SaveManager, DialogueManager, …
│   ├── data/                  # islas.ts, quests/, dialogos/, items.ts
│   └── types/
├── tests/                     # Vitest: sistemas puros
└── docs/                      # arquitectura y decisiones, en español
    ├── arquitectura.md        # visión general + diagrama de escenas
    ├── decisiones.md          # ADRs: por qué Phaser, 32 px, híbrido…
    ├── como-anadir-contenido.md  # receta: nueva isla / misión / mapa
    ├── prompts-assets.md      # prompts IA para generar arte que falte
    └── creditos.md            # licencias de todos los assets
```

- Convención de datos: cada isla es un objeto `{ id, nombre, ilustracion, puerto?, aeropuerto?, pois[], conexiones[] }`.
- Las misiones son JSON declarativos; añadir una misión no debe requerir tocar código de sistemas.

## 8. Assets

**Del usuario (en `art/`):** 7 ilustraciones de islas, mapa-mundo (2 resoluciones) y vista aérea del archipiélago. Falta la ilustración de **La Graciosa** → prompt preparado en `docs/prompts-assets.md` (mismo estilo que las demás).

**Reutilizados de intentos previos (32 px):**
- Tilesets Pipoya (`[Base]BaseChip_pipo*.png`, agua animada `[A]Water_pipo.png`, etc., con sus `.tsx` de Tiled) — desde `canarias-rpg/canarias-quest/main/worlds/maps/`. **Verificar licencia Pipoya antes de publicar.**
- Tileset Tuxemon 32 px **ya extruido** (`tuxemon-sample-32px-extruded.png`, CC-BY-SA) — desde `canaryquest-no`.
- Sprites de héroe formato RPG Maker 3×4 (`hero.png`, `female.png`, 96×128).
- Audio de BrowserQuest (música .ogg + ~10 SFX, CC-BY-SA 3.0) — ya renombrados en `canarias-rpg/public/assets/audio/`.
- Contenido de datos: 7 islas, items canarios, diálogos y la narrativa guanche de `canarias-rpg`.

**Por generar (prompts en `docs/prompts-assets.md`):** ilustración de La Graciosa, sprite del héroe canario (si el genérico no convence), avión ATR de Binter, ferry estilo Fred Olsen/Armas, enemigos temáticos (alimañas, guacanchas), símbolos guanches (8 iconos).

Todas las licencias y atribuciones se documentan en `docs/creditos.md`.

## 9. Manejo de errores y casos límite

- **Guardado corrupto o de versión antigua:** se valida contra un esquema con nº de versión; si no valida, se ofrece empezar de nuevo (no se rompe el arranque).
- **Asset que no carga:** PreloadScene muestra el error en pantalla (no pantalla negra silenciosa).
- **Tap-to-move contra colisión:** el héroe se detiene sin quedarse vibrando (se cancela el objetivo al colisionar).
- **Cambiar de isla con misión a medias:** permitido; el estado de cada misión es independiente y persiste.
- **Pantallas pequeñas:** `Scale.FIT` con resolución base 960×540 y zoom de cámara ajustado; los botones táctiles se sitúan con márgenes seguros (safe areas iOS).

## 10. Proceso y testing (lecciones de los 5 intentos previos)

Los intentos `canarias-rpg`, `rpg2`, `rpg3` y `canaryquest-no` murieron por: 4 cambios de motor, indecisión 16/32 px, un callejón sin salida generando tiles SVG, **cero commits** del trabajo real, y construir ~3.000 líneas de sistemas para una sola quest. En consecuencia:

1. **Commits frecuentes desde el minuto uno.** Cada feature jugable se commitea.
2. **Las decisiones de §2 no se revisitan** salvo bloqueo técnico real y documentado en `docs/decisiones.md`.
3. **Contenido antes que andamiaje:** cada sistema se implementa cuando la primera misión lo necesita. Orden de construcción: vertical slice de La Graciosa (tutorial completo jugable) → mapa de viaje → resto de islas.
4. **Tests con Vitest** para la lógica pura (QuestManager, SaveManager, InventoryManager, grafo de viajes). El gameplay se verifica jugando en navegador (servidor Vite + pruebas manuales/automatizadas con el navegador).
5. **Documentación en español en `docs/`** mantenida al ritmo del código; `AGENTS.md` como punto de entrada para futuros agentes.

## 11. Fuera de alcance (fase 1)

- Multijugador, backend, cuentas.
- i18n (se deja el texto centralizado para facilitarlo después).
- Niveles/XP, tiendas, economía.
- Más de una misión por isla.
- Apps nativas (la web móvil es el objetivo; empaquetar con Capacitor sería fase posterior).
