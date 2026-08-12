# Arquitectura de CanaryQuest

## Visión general

Juego 100 % cliente (build estático de Vite). Sin backend: el estado vive en
memoria (registry de Phaser) y se persiste en `localStorage`.

```
BootScene ─► PreloadScene ─► TitleScene
                                 │ elegir partida (nueva/continuar)
                                 │ + iniciarOrquestador()
                                 │ + launch UIScene (overlay permanente)
                                 ▼
        ┌──────────────── IslandScene ───────────────┐
        │ (ilustración + polígono andable + POIs)     │
        │                                             │
   POI pueblo                POI puerto/aeropuerto    │
        ▼                            ▼                │
   DetailScene                TravelMapScene ─────────┘
   (tilemap Tiled)            (elegir isla, animación ferry/avión)
```

`UIScene` corre en paralelo desde que empieza la partida: corazones, misión
activa, caja de diálogo, botón de mute y controles táctiles.

## Escenas

| Escena | Fichero | Responsabilidad |
|---|---|---|
| Boot | `scenes/BootScene.ts` | Arranque mínimo, pasa a Preload |
| Preload | `scenes/PreloadScene.ts` | Carga de assets con barra y errores visibles; crea animaciones y texturas generadas (cabra, ferry, avión, tajo, símbolo) |
| Title | `scenes/TitleScene.ts` | Fondo aéreo, Nueva partida/Continuar, arranca el Orquestador y la UI |
| Island | `scenes/IslandScene.ts` | Overworld: ilustración + polígono andable + POIs. Sin NPCs ni monstruos. |
| Detail | `scenes/DetailScene.ts` | Sitios jugables (pueblo, dunas, Las Palmas, Isleta, Chistera…): tilemaps, NPCs, puertas entre Details, salida al padre o a la isla |
| TravelMap | `scenes/TravelMapScene.ts` | Mapa del archipiélago; destinos según `destinosDesde()`; animación de viaje |
| UI | `scenes/UIScene.ts` | HUD (corazones/misión), DialogueBox, mute, pad táctil + botón de ataque |

## Sistemas (src/sistemas/)

- **`QuestManager.ts`** (puro, testeado): misiones data-driven con pasos
  `hablar | recoger | derrotar | llegar`. Avanza al recibir eventos
  normalizados (`notificar`). Estado exportable/importable para guardado.
- **`SaveManager.ts`** (puro, testeado): partida versionada en localStorage;
  datos corruptos o de versión desconocida ⇒ `null` (nunca rompe el arranque).
- **`viajes.ts`** (puro, testeado): grafo de ferris (rutas simplificadas de
  Fred Olsen/Naviera Armas) y red de vuelos de Binter (todas las islas con
  aeropuerto entre sí; La Graciosa solo en barco desde Lanzarote).
- **`Orquestador.ts`**: pegamento único entre eventos del juego, QuestManager
  y guardado. Decide el diálogo del pastor según el estado de la misión.
- **`Jugador.ts`**: movimiento 8 direcciones (teclado/WASD, pad táctil y
  tap-to-move con cancelación al colisionar), espada con cooldown,
  daño con invulnerabilidad parpadeante. El movimiento se valida contra un
  callback `puedeEstar(x, y)` (polígono en islas; en tilemaps se omite y
  manda el collider de arcade).
- **`Enemigo.ts`**: patrulla + persecución por radio, muerte con animación.
- **`Npc.ts`**: sprite con indicador «!» y radio de interacción.
- **`DialogueBox.ts`**: caja inferior con typewriter (30 cps), avance con
  Espacio/Enter/tap, cola de líneas y callback al terminar.
- **`Musica.ts`**: una pista de fondo compartida; respeta el bloqueo de audio
  del navegador (espera al primer gesto).

## Contratos de eventos globales (`game.events`)

| Evento | Payload | Emisor → Receptor |
|---|---|---|
| `npc-hablar` | `{ npc }` | escenas → Orquestador |
| `dialogo` | `{ clave, alTerminar? }` | Orquestador/escenas → UIScene |
| `recoger` / `derrotado` / `llegar` | `{ item }` / `{ enemigo }` / `{ poi }` | escenas → Orquestador |
| `dano` / `curar` | — | escenas → UIScene |
| `jugador-muerto` | — | UIScene → escena activa (respawn en la entrada) |
| `mision-cambiada` | — | Orquestador → UIScene (repintar HUD) |
| `simbolo-conseguido` | `{ isla }` | Orquestador → UIScene (toast) |
| `atacar` | — | UIScene (botón táctil) → escena activa |
| `escena-cambiada` | `{ escena, islaId? }` | escenas → Orquestador (autosave) |

Regla: las escenas de juego se suscriben en `create()` y se dan de baja en su
evento `shutdown` (si no, los listeners se duplican al reentrar).

## Estado y guardado

- `registry.get('partida')`: objeto `Partida` vivo (isla actual, símbolos,
  misiones, inventario, corazones).
- `registry.get('vida')` / `'vida-max'`: en medios corazones, gestionado por UIScene.
- `registry.get('quest-manager')`: instancia única del QuestManager.
- Autosave: en cada cambio de escena y cada avance de misión (Orquestador).

## Colisiones de islas (el "híbrido")

Cada isla ilustrada puede tener `public/assets/maps/islas/<isla>.tmj`
(formato Tiled JSON): capa de objetos `colisiones` con un polígono llamado
`andable` (la costa) y capa `pois` con puntos (`spawn`, `pueblo`, `puerto`,
`aeropuerto`, hitos). Se edita abriendo el fichero en Tiled con la
ilustración como capa de imagen. Si una isla no tiene `.tmj`, IslandScene usa
un rectángulo genérico con margen y los POIs de transporte de `data/islas.ts`
(estado "pendiente de pulir"). Con `?debug=1` se pinta el polígono.

## Detección de errores frecuentes

- **Transiciones de escena**: usar siempre el patrón `saliendo = true` antes
  de `fadeOut` — llamar a `fadeOut` cada frame lo reinicia y el evento
  `camerafadeoutcomplete` no llega nunca (bug real que ya nos pasó).
- **Audio**: no reproducir directamente en `create()` del título; usar
  `Musica.reproducir`, que espera el desbloqueo del navegador.
- **Texturas con atlas trimmed**: los frames del héroe están recortados; el
  cuerpo físico se ajusta con `setSize/setOffset` en `Jugador`.
