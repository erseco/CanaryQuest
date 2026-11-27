# Créditos y licencias de assets

| Asset | Ruta en el juego | Origen | Licencia |
|---|---|---|---|
| Ilustraciones de islas (7) | `public/assets/islas/*.jpg` | Generadas con IA para este proyecto (Ernesto) | Propias |
| Mapa original del archipiélago | `public/assets/islas/mapa-mundo.jpg` | Generada con IA para este proyecto | Propia |
| Vista aérea (título) | `public/assets/titulo/archipielago-aereo.jpg` | Generada con IA (canarias.win) | Propia |
| Tileset pueblo 32 px extruido | `public/assets/tilesets/tuxemon-32px-extruido.png` | Proyecto [Tuxemon](https://github.com/Tuxemon/Tuxemon), vía plantilla phaser-rpg | CC-BY-SA 4.0 |
| Mapa del pueblo | `public/assets/maps/pueblo.tmj` | "tuxemon-town" de la plantilla [phaser-rpg](https://github.com/remarkablegames/phaser-rpg) (remarkablemark) | MIT (mapa), tiles CC-BY-SA 4.0 |
| Tilesets Wang dunas/plaza/ciudad/club 32 px | `public/assets/tilesets/pixellab-*.png` | Generados con [PixelLab API](https://www.pixellab.ai/) para este proyecto | Propios (cuenta CanaryQuest) |
| Props mapa (casas, catedral, Chistera, cómico…) | `public/assets/sprites/pixellab-*.png` | Generados con PixelLab (`map-objects`) | Propios |
| Mapas dunas, Las Palmas, Isleta, Chistera | `public/assets/maps/*.tmj` | Layout propio sobre tilesets PixelLab | Propio |
| Tilesets Wang cumbre (camino, risco, presa) y casa-cueva 32 px | `public/assets/tilesets/pixellab-cumbre-*.png`, `pixellab-casa-cueva-32.png` | PixelLab (`scripts/pixellab-generate.py roque-nublo`) | Propios |
| Pino canario | `public/assets/sprites/pixellab-pino-canario.png` | PixelLab (`map-objects`) | Propio |
| Terrenos Wang LPC (lava, picón, tierra roja, arena, camino, agua, hierba, musgo) y props (laurel, arbusto, agujas volcánicas, roca de malpaís) | `public/assets/tilesets/lpc-*.png`, `public/assets/sprites/lpc-*.png` (fuentes en `art/lpc/`, recoloreados por `scripts/lpc-a-wang.py`) | [Liberated Pixel Cup](https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles), Lanea «Sharm» Zimmerman (ver `art/lpc/CREDITS.TXT`) | CC-BY-SA 3.0 / GPL 3.0 (también OGA-BY 3.0) |
| Logo, favicon e imagen Open Graph | `public/logo.png`, `public/favicon.png`, `public/og-image.jpg` | Generados por `scripts/generar-logo.py` a partir del mapa del archipiélago (fuente bitmap de Pillow) | Propios |
| Mapas Timanfaya, Jameos, Garajonay y Betancuria | `public/assets/maps/*.tmj` | Generados por `scripts/generar-mapas-islas.py` | Propios |
| Mapas Roque Nublo y casa-cueva | `public/assets/maps/roque-nublo.tmj`, `casa-cueva.tmj` | Generados por `scripts/generar-mapas-cumbre.py` | Propios |
| Atlas del héroe "misa" | `public/assets/sprites/atlas.png/.json` | Tutorial oficial de Phaser 3 / plantilla phaser-rpg | Libre uso en juegos Phaser |
| Sprite héroe RPG-Maker | `public/assets/sprites/hero.png` | Intento previo canarias-rpg (formato RPG Maker 3×4) | Verificar antes de publicar |
| Enemigos (cangrejo, culebra, rata, murciélago, goblin, esqueleto, espectro), NPCs, cofre, espada y humo | `public/assets/sprites/bq/` (imágenes a escala 2 + JSON de animación) | [BrowserQuest](https://github.com/mozilla/BrowserQuest) (Mozilla / Little Workshop) | CC-BY-SA 3.0 |
| Música (título, mapa, isla) | `public/assets/audio/*.ogg` | BrowserQuest | CC-BY-SA 3.0 |
| Efectos de sonido | `public/assets/audio/*.mp3` | BrowserQuest | CC-BY-SA 3.0 |

## Cartografía y visitas

- Carta de Canarias y ocho relieves insulares en `public/assets/islas/*.webp`. Obra derivada del MDT200 del Instituto Geográfico Nacional de España (IGN), mediante el servicio de coberturas del Sistema Cartográfico Nacional. La proyección del paseo exagera las alturas. Vegetación, edificios, embarcaciones y caminos se ilustran a escala de juego. [Servicio MDT](https://www.idee.es/csw-codsi-idee/srv/api/records/spaignwcs_mdt) · [Condiciones de uso IGN, CC BY 4.0](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf).
- Suelo y trazado de las visitas en `public/assets/visitas/*-pnoa.webp`. Obra derivada de las ortofotos PNOA de máxima actualidad, © Instituto Geográfico Nacional y productores del PNOA, consultadas el 26 de noviembre de 2026. Recortes del servicio WMS en longitud/latitud, con el norte arriba. La Caleta abarca de (−17.8890, 27.7997) a (−17.8863, 27.8015). Vegueta abarca de (−15.4170, 28.09955) a (−15.41385, 28.1014). [Servicio PNOA](https://pnoa.ign.es/web/portal/pnoa-imagen/visualizadores-y-servicios-web) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es).
- Referencias locales para las piscinas, la plaza, los perros de Santa Ana y los edificios que la cierran. [Turismo de El Hierro, La Caleta](https://elhierro.travel/piscinas-naturales/el-hierro/piscinas-de-la-caleta/) · [Turismo de Las Palmas de Gran Canaria, plaza de Santa Ana](https://lpavisit.com/atractivo/plaza-de-santa-ana/) · [Casas Consistoriales](https://lpavisit.com/atractivo/casas-consistoriales/).

## Recursos evaluados y no incluidos en el build

- **TongaApp** (UCTICEE, Gobierno de Canarias): ~1.200 ilustraciones canarias
  (flora, fauna, antiguos canarios, personajes, arquitectura…). Licencia
  **CC BY-NC-SA**: la cláusula *no comercial* no es compatible con distribuir
  el juego como software libre (GPLv3). `scripts/descargar-tongapp.sh` las baja
  a `art/tongapp/` (ignorado por git) como referencia de estilo/contenido. Solo
  podrían entrar en el juego con permiso expreso de sus autores para
  relicenciarlas (p. ej. CC BY-SA).
- **Zelda-like tilesets** de ArMM1998 (16 px, CC0): compatible, pero a 16 px
  choca con la decisión de 32 px (ADR-2); útil como referencia o reescalado.

## Pendiente de verificación antes de publicar

- `hero.png`: procede de un intento previo sin fichero de licencia; parece asset de RPG Maker (requiere licencia de RPG Maker para uso). **Sustituir por sprite propio** (prompt en `docs/prompts-assets.md`) antes de publicar.
- Tilesets Pipoya (si se incorporan en fase 2): gratuitos con condiciones — verificar en https://pipoya.net antes de usar en producción.

## Atribución requerida en la página del juego

> Música, efectos de sonido, enemigos y NPCs: BrowserQuest © Mozilla & Little Workshop, CC-BY-SA 3.0 · Terrenos y árboles: Liberated Pixel Cup, Lanea «Sharm» Zimmerman, CC-BY-SA 3.0 / GPL 3.0 · Tiles del pueblo: proyecto Tuxemon, CC-BY-SA 4.0 · Mapa del pueblo: plantilla phaser-rpg de remarkablemark, MIT.

## Puerto de Mogán en 3D

- Arquitectura, vegetación, personajes y sombreado del agua creados para CanaryQuest. Las cuatro texturas de superficie y la panorámica del horizonte se generaron para esta escena con ImageGen. GPL-3.0.
- Pesquero, velero, bote de remos, barco de pasajeros y paleta de Kenney, **Watercraft Kit 2.1**, CC0. La licencia original acompaña a los modelos en `public/assets/puerto/License.txt`. [Pack original](https://kenney.nl/assets/watercraft-kit)
- Renderizado con Three.js, MIT.

## Faro de Orchilla y La Restinga

Las dos visitas son maquetas originales. Las coordenadas de acceso se guardan en
`src/data/geografia.json`. En Orchilla se representan la torre octogonal, la
casa anexa y el malpaís. En La Restinga, el paseo, un pantalán y la dársena
pesquera. Las distancias, las casas y los barcos se adaptan al paseo jugable.

- [Ficha de campo del IGN en Orchilla](https://www.ign.es/web/resources/gravimetria/absoluta/HIER_FARO.pdf) y [descripción del faro en CanariWiki](https://www3.gobiernodecanarias.org/medusa/wiki/index.php?title=Faro_de_Orchilla).
- [Ficha y visita panorámica del puerto de La Restinga, Puertos Canarios](https://puertoscanarios.es/project/la-restinga/).

## Paseo de Playa del Inglés

La maqueta de Pepe Chiringo, las figuras y la torre del CITA, las fachadas del
RIU y las dunas se han modelado para el juego. La ruta comprime la distancia
entre las paradas. El pasaje que comunica la avenida con el mirador sigue la
descripción del [Plan Director de la reserva](https://www.idecanarias.es/resources/PLA_ENP_URB/GC/AD/C-07_Las_Dunas_de_Maspalomas/RNE/TIP/pd_rne_dma_mi.pdf).
El viajero de las escenas 3D comparte modelo con Mogán. La hoja
`public/assets/sprites/viajero.png` contiene vistas del mismo modelo para los mapas 2D.

### Referencias del trazado de Maspalomas

- Geometría del recorrido © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL. El [local de Pepe Chiringo](https://www.openstreetmap.org/node/719885194), las avenidas [de Francia](https://www.openstreetmap.org/way/27504540) y [de Tirajana](https://www.openstreetmap.org/way/27504939), y el [mirador](https://www.openstreetmap.org/node/301958026) se proyectan sobre el mismo plano. La escala horizontal equivale a 0,16 unidades por metro. La posición de la fachada sur del CITA se aproxima sobre la ortofoto.
- Suelo urbano en `maspalomas-pnoa.webp`: obra derivada de Ortofoto PNOA máxima actualidad © IGN y productores PNOA, CC BY 4.0. Recorte del WMS que abarca de (−15.5804, 27.7430) a (−15.5722, 27.7540).
- Recortes PNOA de referencia en `public/assets/visitas/` (coordenadas longitud/latitud): `mogan-pnoa.webp` (−15.7684, 27.8164 a −15.7614, 27.8217), `agaete-pnoa.webp` (−15.7145, 28.0982 a −15.7067, 28.1046), `la-caleta-pnoa.webp` (−17.8890, 27.7997 a −17.8863, 27.8015), `las-palmas-pnoa.webp` (−15.4170, 28.09955 a −15.41385, 28.1014), `orchilla-pnoa.webp` (−18.1498, 27.7052 a −18.1453, 27.7082), `la-restinga-pnoa.webp` (−17.9834, 27.6381 a −17.9782, 27.6423) y `maspalomas-pnoa.webp` (−15.5804, 27.7430 a −15.5722, 27.7540). Recopilados el 26 de noviembre de 2026 para contrastar las visitas; las seis primeras quedan como referencias para integrar en sus maquetas.
- La cadena sitúa el local de Playa del Inglés en el bajo 4 del hotel Rey Carlos, esquina de Tirajana con Francia. [Directorio oficial](https://pepechiringo.es/restaurantes/).
- Referencias fotográficas para modelar arcadas, torretas y rótulo del CITA y contrastar el aspecto del hotel. [Fotografías del CITA](https://www.dunasmap.com/post/cita-shopping-centre-playa-del-ingles) · [RIU Palace, fotografía de 2025](https://commons.wikimedia.org/wiki/File:Riu_Palace_Maspalomas,_2025-01.jpg). La maqueta agrupa los motivos decorativos del centro.

El archivo `public/assets/puerto/mogan.glb` reúne la maqueta original, el
viajero, el interior y los barcos acreditados en «Puerto de Mogán en 3D».
Se exportó desde la escena Three.js con `scripts/exportar-mogan.html`.
