# Cómo añadir contenido

## Añadir una misión a una isla existente

1. **Define la misión** en `src/data/misiones.ts`: id, isla, título, pasos
   (`hablar | recoger | derrotar | llegar`) y recompensa.
2. **Escribe los diálogos** en `src/data/dialogos.ts` (una clave por estado:
   encargo, en curso, entrega, completada).
3. **Coloca el NPC** en la escena correspondiente (`new Npc(...)` en
   DetailScene o IslandScene) y añade su caso en el `npc-hablar` del
   `Orquestador.ts` siguiendo el patrón de `hablarConPastor()`.
4. **Coloca los objetos/enemigos** que pidan los pasos (mira cómo
   IslandScene crea cabras y alimaña en `crearFauna()`; el pickup se
   condiciona al paso activo con `qm.pasoActual(id)`).
5. **Test**: añade un caso en `tests/questManager.test.ts` recorriendo los
   pasos de la misión nueva.

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
