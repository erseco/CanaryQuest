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

## Puertos, aeropuertos y líneas

Los puertos, aeropuertos y lugares tienen coordenadas geográficas en
`src/data/geografia.json` (longitud, latitud). Los nombres y conexiones de ferry
se definen en `src/data/islas.ts`. La carta del archipiélago y el mapa de paseo
usan las mismas coordenadas. Los muelles se ajustan al punto de tierra cercano.

## Regenerar el relieve y las colisiones

1. Descarga el ArcGrid del IGN con la URL de `scripts/generar-carta.py`.
2. En un entorno Python con numpy, scipy, Pillow y rasterio ejecuta
   `python scripts/generar-carta.py recorte.asc` y
   `python scripts/generar-relieves.py recorte.asc`.
3. El segundo script escribe una ilustración de 1920 × 1600 y un mapa Tiled
   por isla. Genera el polígono costero, entradas y terminales en la misma
   proyección. Los cambios manuales en esos ocho mapas se sobrescriben.
4. `npm test` comprueba que todas las entradas y terminales están en tierra.
   Abre el juego con `?debug=1` para ver la costa transitable en magenta.

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

## Checklist antes de commitear contenido

- [ ] `npm test` y `npm run build` en verde.
- [ ] Playthrough manual de la misión nueva (o programático, ver AGENTS.md).
- [ ] Licencias de assets nuevos anotadas en `docs/creditos.md`.
