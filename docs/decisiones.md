# Decisiones de arquitectura (ADRs)

Formato corto: contexto → decisión → consecuencias. Estas decisiones están
**cerradas**; reabrirlas exige un bloqueo técnico real documentado aquí.

## ADR-1: Phaser 4 + TypeScript + Vite (no RPGJS, no Kaplay, no vanilla)

**Contexto.** Hubo 5 intentos previos con 4 motores distintos (BrowserQuest
engine, Phaser puro, Phaser+grid-engine, RPGJS v4, plantilla phaser-rpg).
Cada cambio de motor descartó el trabajo anterior. Ninguno llegó a jugable.
El vertical slice nació en Phaser 3.90; en 2026 se migró a Phaser 4 (guía
oficial: `Geom.Point` → `Vector2`, filtros en lugar de FX/máscaras, etc.).

**Decisión.** Phaser 4.x con TypeScript estricto y Vite. Sin librerías de
juego adicionales (ni grid-engine ni phaser-jsx).

**Por qué.** Phaser trae de serie lo que este juego necesita (tilemaps Tiled,
cámara con follow, física arcade, entrada táctil, escalado responsive), tiene
la mayor comunidad y documentación del ecosistema HTML5, y era el motor con
más código y mapas previos reutilizables. Las alternativas: RPGJS impone su
estructura cliente/servidor (sobredimensionado para un juego single-player
estático); Kaplay es más simple pero sin soporte Tiled nativo; vanilla canvas
implica reimplementar cámara/colisiones/animaciones.

**Consecuencias.** Bundle de ~340 KB gzip (aceptable); a cambio, cero código
de infraestructura propio. En v4 no usar `Geom.Point` (eliminado): vértices
de geometría con `Phaser.Math.Vector2`.

## ADR-2: tiles de 32 px

**Contexto.** La indecisión 16 px vs 32 px obligó a rehacer mapas en cada
intento previo (llegó a escribirse un reescalador 16→32).

**Decisión.** 32 px en todos los mapas de detalle.

**Por qué.** Los mejores tilesets disponibles (Tuxemon extruido, Pipoya) son
de 32 px; casa con la densidad de las ilustraciones; se ve bien en móvil sin
zoom fraccionario.

## ADR-3: mapas híbridos (ilustración + polígonos vs. todo tiles)

**Contexto.** Las 8 ilustraciones de islas generadas con IA tienen una
calidad visual imposible de reproducir con tiles en un tiempo razonable.

**Decisión.** Las vistas de isla usan la ilustración como fondo con un
polígono de colisión («andable») y puntos de interés definidos en un fichero
Tiled (`.tmj`). Pueblos, interiores y mazmorras usan tilemaps Tiled 32 px.

**Por qué.** Máximo impacto visual con mínimo trabajo de mapas; los `.tmj`
siguen siendo editables en Tiled (la ilustración se carga como capa de
imagen); los tilemaps ofrecen la flexibilidad Zelda donde importa (colisiones
finas, puertas, cofres).

**Consecuencias.** Dos sistemas de colisión (polígono manual en islas,
arcade collider en tilemaps). `Jugador` los unifica con el callback
`puedeEstar`. Refinar una costa = editar el polígono en Tiled, no repintar.

## ADR-4: lógica pura separada de Phaser

**Decisión.** `QuestManager`, `SaveManager` y `viajes` no importan Phaser y
se testean con Vitest (22 tests). Las escenas emiten eventos normalizados y
`Orquestador` los traduce.

**Por qué.** El bug típico de los intentos previos era estado de misión
repartido por las escenas. Centralizar permite testear la progresión sin
navegador y hace el guardado trivial (exportar/importar el estado del
QuestManager).

## ADR-5: guardado versionado en localStorage

**Decisión.** Un solo slot, objeto `Partida` con `version: 1`, validación
estructural al cargar; lo inválido devuelve `null` y se ofrece partida nueva.

**Por qué.** Sin backend por diseño (build estático). El campo `version`
permite migraciones futuras sin romper partidas.

## ADR-6: misiones data-driven

**Decisión.** Las 8 misiones están definidas como datos en
`src/data/misiones.ts` (pasos tipados); añadir una misión no toca sistemas.

**Consecuencia.** El Orquestador solo contiene la lógica de *diálogo* por
NPC (qué línea toca según el estado), que es lo único genuinamente ad-hoc.

## ADR-7: proceso — commits frecuentes y contenido primero

Lecciones directas de la autopsia de los 5 intentos (ver spec §10): commit
tras cada feature jugable; ningún sistema se construye antes de que una
misión lo necesite; las decisiones cerradas no se revisitan.
