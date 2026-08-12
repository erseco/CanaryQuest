# CanaryQuest — Guía para agentes y colaboradores

RPG pixel-art de las Islas Canarias para navegador (escritorio y móvil).
Estilo Zelda de SNES / juego de Stranger Things de Android. Todo en español.

## Comandos

```bash
npm run dev        # servidor de desarrollo (Vite)
npm test           # tests unitarios (Vitest)
npm run lint       # ESLint (también: make lint)
npm run fix        # ESLint --fix (también: make fix)
npm run build      # type-check + build estático en dist/
npm run preview    # servir el build
```

Añade `?debug=1` a la URL para ver los polígonos de colisión de las islas.

## Stack (decisiones cerradas — no cambiar sin leer docs/decisiones.md)

- **Phaser 4 + TypeScript strict + Vite**. Sin más librerías de juego.
- **Tiles de 32 px** para los mapas de detalle (pueblos/mazmorras).
- **Mapas híbridos**: las islas son ilustraciones (JPG) con polígonos de
  colisión definidos en formato Tiled; los pueblos/mazmorras son tilemaps
  Tiled normales.

## Estructura

```
src/
├── main.ts              # config Phaser + registro de escenas
├── scenes/              # Boot → Preload → Title → Island/Detail/TravelMap + UI (overlay)
├── sistemas/            # lógica: QuestManager, SaveManager, viajes (puros y testeados),
│                        #   Jugador, Enemigo, Npc, DialogueBox, Musica, Orquestador
└── data/                # islas.ts, misiones.ts, dialogos.ts (todo el contenido)
public/assets/           # islas/, maps/, tilesets/, sprites/, audio/
art/                     # ilustraciones fuente (no van al build)
docs/                    # arquitectura, decisiones, guías y créditos, en español
tests/                   # Vitest para sistemas puros
```

## Reglas del proyecto

1. **Commit tras cada feature jugable.** Los 4 intentos previos murieron sin commits.
2. **Contenido antes que andamiaje**: no crear sistemas hasta que una misión los necesite.
3. La lógica de juego (misiones, guardado, viajes) es **TypeScript puro sin Phaser**
   y se testea con Vitest. Las escenas solo orquestan.
4. Los eventos globales viajan por `game.events` (ver contratos en
   `docs/arquitectura.md`). `src/sistemas/Orquestador.ts` los conecta con el
   QuestManager y el guardado.
5. Textos de juego en `src/data/dialogos.ts` — nunca hardcodeados en escenas.
6. Al añadir assets, registrar origen y licencia en `docs/creditos.md`.
7. No añadir atribuciones de IA en commits ni código.

## Cómo probar el juego como agente

Con el servidor dev corriendo y Chrome DevTools MCP: `window.game` expone la
instancia de Phaser. Patrón para playtest programático:

```js
const g = window.game;
g.scene.getScene('Title').elegir(0);           // empezar
const isla = g.scene.getScene('Island');
isla.jugador.setPosition(x, y);                // teletransporte
isla.activarPoi();                             // entrar en POI cercano
g.registry.get('quest-manager').pasoActual('pastor-roque-nublo');
```

Ojo: la automatización del navegador puede emitir clicks sintéticos que
activan el tap-to-move; verifica el estado con `evaluate_script`, no asumas
que la escena está donde la dejaste.

## Estado actual y siguiente trabajo

Ver `docs/superpowers/specs/` (diseño) y `docs/superpowers/plans/` (plan del
vertical slice, completado). Pendiente en `docs/prompts-assets.md`: arte de
La Graciosa y sprites propios. Las islas sin `.tmj` propio usan colisiones
rectangulares genéricas — afinar con Tiled copiando el patrón de
`public/assets/maps/islas/gran-canaria.tmj`.
