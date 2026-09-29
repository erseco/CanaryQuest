# Cómo añadir contenido

## Añadir una misión a una isla existente

1. **Define la misión** en `src/data/misiones.ts`: id, isla, título, pasos
   (`hablar | recoger | derrotar | llegar`) y recompensa (`simbolo-<isla>` o
   `corazon`).
2. **Escribe los diálogos** en `src/data/dialogos.ts`: el `dialogo` de cada
   paso `hablar`, más `<mision>-en-curso`, `<mision>-completada` y, si la
   misión termina sin NPC (en un `llegar`/`recoger`), `<mision>-fin`.
3. **No hace falta tocar el Orquestador**: cualquier NPC que aparezca en un
   paso `hablar` activa y avanza su misión solo (`hablarConNpcDeMision`).
4. **Coloca en el mapa (capa `Objects`)** lo que pidan los pasos:
   - NPC: tipo `npc`, `name` = id del paso, propiedad `sprite` (villager,
     villagegirl, priest, forestnpc, desertnpc, lavanpc, beachnpc).
   - Enemigos: tipo `enemigo`, `name` = especie de `src/data/enemigos.ts`
     (culebra, rata, murcielago, ladron, esqueleto, alimana). Reaparecen al
     volver a entrar al mapa.
   - Objetos: tipo `cofre` con propiedad `item` (la espada es `espada`).
   - Lugares: tipo `hito` (cuenta como `llegar`) y tipo `zona` (cartel).
5. **Test**: añade un caso en `tests/questManager.test.ts` recorriendo los
   pasos de la misión nueva.

## Generar zonas con terrenos (paisajes de isla)

Los mapas grandes se generan por código y siguen siendo editables en Tiled
(llevan *wangsets* para el pincel de terrenos):

- `scripts/generar-mapas-cumbre.py`: Roque Nublo y casa-cueva (tilesets PixelLab).
- `scripts/lpc-a-wang.py`: convierte terrenos LPC de `art/lpc/` en hojas Wang
  (lava, picón, tierra roja, arena, camino, agua, hierba, musgo) y props.
- `scripts/generar-mapas-islas.py`: Timanfaya, Jameos, Garajonay, Betancuria.
  Cada terreno es una capa; los tiles con `collides` (lava, agua) bloquean.
  Propiedad de mapa `niebla: true` para la bruma de laurisilva.

Para que una isla sin `.tmj` de overworld tenga entradas, añade `zonas` en
`src/data/islas.ts` (mapa, etiqueta y posición sobre la ilustración).
Regenerar un mapa **sobrescribe** los retoques hechos a mano en Tiled.

## Afinar las colisiones de una isla (quitar el rectángulo genérico)

1. Copia `public/assets/maps/islas/gran-canaria.tmj` como plantilla a
   `<isla>.tmj`.
2. Ábrelo en [Tiled](https://www.mapeditor.org): añade la ilustración de
   `public/assets/islas/<isla>.jpg` como **capa de imagen** para calcar.
3. Edita el polígono `andable` (capa `colisiones`) siguiendo la costa, y los
   puntos de la capa `pois`: `spawn`, `pueblo` (tipo `entrada`), `puerto` y
   `aeropuerto` (tipo `transporte`), hitos (tipo `hito`).
4. Registra la carga en `PreloadScene` (`this.load.tilemapTiledJSON('map-<isla>', ...)`).
5. Comprueba con `?debug=1` (el polígono se pinta en magenta).

## Añadir un pueblo/mazmorra nuevo

1. Crea el mapa en Tiled a 32 px con el tileset
   `tuxemon-32px-extruido.png` (o añade otro tileset con licencia clara a
   `docs/creditos.md`). Capas: `Below Player`, `World` (tiles con propiedad
   `collides: true`), `Above Player`, y objetos con un `Spawn Point`.
2. Expórtalo como JSON a `public/assets/maps/<nombre>.tmj` y cárgalo en
   PreloadScene como `map-<nombre>`.
3. Entra desde un POI: en el `.tmj` de la isla añade un punto tipo `entrada`
   con el nombre del mapa, y amplía `activarPoi()` de IslandScene si hace
   falta un caso nuevo.

## Añadir una isla nueva (cuando exista su ilustración)

1. Copia la ilustración a `art/islas/` y una versión optimizada a
   `public/assets/islas/<isla>.jpg` (1254×1254 aprox.).
2. En `src/data/islas.ts`, rellena `ilustracion` (deja de ser `null`) y
   revisa puerto/aeropuerto/mapaMundo.
3. La carga en PreloadScene es automática (recorre `ISLAS`).
4. Sigue «Afinar las colisiones» para su `.tmj` y añade su misión.

## Checklist antes de commitear contenido

- [ ] `npm test` y `npm run build` en verde.
- [ ] Playthrough manual de la misión nueva (o programático, ver AGENTS.md).
- [ ] Licencias de assets nuevos anotadas en `docs/creditos.md`.
