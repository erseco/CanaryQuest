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

## ADR-8. Puerto de Mogán en 3D

La prueba necesita girar la cámara alrededor de edificios y caminar detrás de
ellos. Las ilustraciones y tilemaps del ADR-3 representan una sola vista.
PuertoScene carga Three.js bajo demanda para dibujar este lugar en volumen.
Las misiones, el guardado y el resto de las islas siguen en el mismo juego.
Cuando el navegador carece de WebGL 2, se abre el mapa Tiled del pueblo.

## ADR-9: Three.js para los lugares 3D (no Babylon.js ni PlayCanvas)

**Contexto.** El puerto de Mogán del juego (`src/puerto`) está hecho en
Three.js. En noviembre de 2026 se montó una página de prueba, `mogan.html`,
que cargaba el mismo pueblo exportado a GLB en Babylon.js y en PlayCanvas, y
se llegó a anotar Babylon.js como motor de la aventura 3D. La prueba nunca
igualó al puerto del juego: le faltaban el fondo pintado, los reflejos del
agua, la cámara en perspectiva, el día y la noche y los paneles.

**Decisión.** Los lugares 3D se hacen en Three.js, cargado bajo demanda desde
una escena de Phaser como en el ADR-8. Se retiran Babylon.js, PlayCanvas, la
página de prueba, su GLB y el exportador.

**Por qué.** El 3D de CanaryQuest son pueblos para pasear y hablar, al estilo
de una aventura gráfica, sin combate. Para eso Three.js ya da el resultado que
se busca. Todo lo que hace bonito el puerto tiene equivalente en Babylon.js,
así que portarlo costaría reescribir unas 2.400 líneas para obtener el mismo
aspecto. Lo que Babylon.js trae de más (rutas para multitudes, física, mezcla
de animaciones) sirve a un juego de acción, que no es este. Además el puerto
se construye por código: Three.js añade 147 KB gzip y los recursos no llegan
a 1 MB, frente a los 391 KB gzip de Babylon.js o los 528 KB de PlayCanvas más
un GLB de 9,7 MB.

**Consecuencias.** Un solo motor 3D en `package.json`. No iniciar escenas en
Babylon.js ni PlayCanvas. La prueba comparativa queda en el historial de git
(commits `c500343` y `3b100b1`). Godot solo vuelve a ser candidato si las
versiones instalables pasan a ser prioritarias. También se descartó, tras ver
una maqueta, un 2.5D de recortables pixel-art sobre suelo 3D: la referencia
estética de los lugares 3D es el puerto de Mogán.

## ADR-10: los lugares 3D son pueblos montados por datos

**Contexto.** El Puerto de Mogán es la referencia de aspecto del juego. Las
demás visitas 3D (`src/atlas`) usaban una ortofoto como suelo y edificios de
caja lisa, y desentonaban.

**Decisión.** Cada lugar se describe en `src/data/pueblos.ts` (trazado, casas,
rincones, salidas) y se dibuja con la maqueta del puerto: mismas fachadas,
agua con reflejos, horizonte pintado, luz, interiores y paneles. Mogán creció
así hasta la playa, un segundo canal y el espigón con faro, y La Restinga fue
la primera visita convertida.

**Consecuencias.** Un pueblo de muelle y canales es sobre todo datos. Un lugar
con identidad propia (La Restinga, Orchilla, La Caleta, Agaete, Valverde,
Las Palmas) se traza sobre su ortofoto PNOA en `src/puerto/sitios/<lugar>.ts`
con las piezas del `Taller`, y declara en `plano.suelos` por dónde se camina.
Las dunas de Maspalomas, la última visita de `src/atlas`, son ya un lugar de
este tipo; su `plano.cota` da la altura de la arena y su `rastro` lleva a la
misión de las cabras.
