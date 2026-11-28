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
- Pesquero, velero, bote de remos y paleta de Kenney, **Watercraft Kit 2.1**, CC0. La licencia original acompaña a los modelos en `public/assets/puerto/License.txt`. [Pack original](https://kenney.nl/assets/watercraft-kit)
- Renderizado con Three.js, MIT.

## Faro de Orchilla y La Restinga

Las dos son maquetas originales hechas con las piezas del puerto de Mogán
(`src/puerto/sitios/`). Su trazado sigue los recortes PNOA de
`public/assets/visitas/`, comprimido a escala de juego. En Orchilla se
representan la torre, la casa del farero en U, la pista que baja revolviendo
al embarcadero y el monumento al meridiano cero. En La Restinga, la avenida
marítima, la playa de arena negra, el pantalán, el muelle viejo, el varadero
con su pórtico y el dique rompeolas con su escollera.

- [Ficha de campo del IGN en Orchilla](https://www.ign.es/web/resources/gravimetria/absoluta/HIER_FARO.pdf) y [descripción del faro en CanariWiki](https://www3.gobiernodecanarias.org/medusa/wiki/index.php?title=Faro_de_Orchilla).
- [Ficha y visita panorámica del puerto de La Restinga, Puertos Canarios](https://puertoscanarios.es/project/la-restinga/).
- [Monumento al Meridiano Cero, El Hierro Travel](https://elhierro.travel/en/what-to-do/monumento-al-meridiano-cero) y [Embarcadero del Faro de Orchilla, Hello Canary Islands](https://www.hellocanaryislands.com/natural-pools/el-hierro/embarcadero-del-faro-de-orchilla/).

## Valverde

Maqueta original hecha con primitivas en `src/puerto/sitios/valverde.ts`, sin
assets nuevos. El trazado (calle Doctor Quintero Magdaleno de norte a sur, la
iglesia y su plaza al borde del barranco, el Ayuntamiento al sur de la plaza,
el Cabildo y la casa de las Quinteras hacia poniente) se tomó de un recorte de
la ortofoto PNOA y de las posiciones de OpenStreetMap, y se comprimió a escala
de juego. Para que las fachadas se vean desde la cámara, el Cabildo pasa a la
acera de la iglesia y la casa de las Quinteras mira al sur. El recorte PNOA, de
(−17.9180, 27.8050) a (−17.9124, 27.8090), se usó solo como consulta y no está
en el repositorio.

- [Ortofoto PNOA, servicio WMS del IGN](https://www.ign.es/wms-inspire/pnoa-ma), © Instituto Geográfico Nacional y productores del PNOA, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es).
- Posiciones de la iglesia, el Ayuntamiento, el Cabildo y la casa de las Quinteras: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL, consultadas con la API Overpass.
- [Valverde (El Hierro), Hispanopedia](https://es.hispanopedia.com/wiki/Valverde_(El_Hierro)): fachada de cantería con arco de medio punto, campanario octogonal con cúpula e imagen de la Virgen, y casas consistoriales de piedra levantadas tras el incendio de 1899.
- [Iglesia de Nuestra Señora de la Concepción, El Hierro Travel](https://elhierro.travel/en/museums-and-places-of-interest/el-hierro/iglesia-de-nuestra-senora-de-la-concepcion/) y [Lonely Planet](https://www.lonelyplanet.com/points-of-interest/iglesia-de-santa-maria-de-la-concepcion/1462646): torre con mirador en lo alto.
- [La villa histórica de Valverde](https://www.hellocanaryislands.com/places-full-of-charm/el-hierro/the-historical-town-of-valverde/) y [Centro Etnográfico Casa de Las Quinteras](https://www.hellocanaryislands.com/museums-and-places-of-interest/el-hierro/centro-etnografico-casa-de-las-quinteras/), Hello Canary Islands.
## Piscinas de La Caleta

Maqueta original con las piezas del puerto de Mogán (`src/puerto/sitios/caleta.ts`
y su plano, `caleta-plano.ts`), sin assets nuevos. El trazado se midió sobre
`public/assets/visitas/la-caleta-pnoa.webp` a 2,5 m por unidad, y los
contornos de los vasos se trazaron sobre la misma ortofoto. Se representan los
tres vasos sobre la plataforma de hormigón con su muro de rompiente, el
solárium con las cuatro jardineras redondas y sus parterres, la caseta redonda
del mirador con su escalera, la carretera en serpentina con la horquilla, los
coches aparcados y el aparcamiento, la cancha del cruce, el paseo de la orilla
y el camino de la barandilla blanca, la escalera al mar y las casas de los dos
barrios.

- [Piscinas de La Caleta, Turismo de El Hierro](https://elhierro.travel/piscinas-naturales/el-hierro/piscinas-de-la-caleta/) y [La Caleta pools, Hello Canary Islands](https://www.hellocanaryislands.com/natural-pools/el-hierro/la-caleta-pools/): escaleras al mar, duchas en los accesos, solárium y la cascada con la pleamar.
- Grabados rupestres de La Caleta, descubiertos por Aquilino Padrón y destruidos en parte en 1920 para hacer grava: [«El arqueólogo herreño prófugo del cólera que reescribió la historia de Canarias», Vozpópuli](https://www.vozpopuli.com/espana/canarias/el-arqueologo-herreno-profugo-del-colera-que-reescribio-la-historia-de-canarias.html).
## Puerto de las Nieves (Agaete)

Maqueta original hecha con primitivas en `src/puerto/sitios/agaete.ts`. El
trazado sigue el recorte PNOA `agaete-pnoa.webp`, girado un cuarto de vuelta
para que el mar abierto (al oeste) quede delante, y comprime las distancias:
las Salinas al norte, el pueblo con su playa y la ermita, la dársena tras el
dique, el ferry de Tenerife en el muelle del sur, el muelle viejo, la playa de
las Nieves y el Dedo de Dios al pie de los riscos de Tamadaba, que en realidad
queda al sur del puerto. El ferry se modela con los colores de la naviera de la
línea (casco blanco con franja azul y puente amarillo).

- Posición del Dedo de Dios (28,0964, −15,7081) y caída del pináculo con la tormenta Delta en 2005: [Wikipedia](https://es.wikipedia.org/wiki/Dedo_de_Dios) y [Gran Canaria, «El Dedo de Dios and the Roque Partido»](https://www.grancanaria.com/blog/en/article/el-dedo-de-dios-and-the-roque-partido-two-names-for-the-same-symbol).
- Las Salinas de Agaete, tres piscinas unidas por túneles volcánicos y protegidas por columnas de roca: [Hello Canary Islands](https://www.hellocanaryislands.com/natural-pools/gran-canaria/las-salinas-de-agaete/) y [Turismo de Gran Canaria](https://grancanaria.com/turismo/en/beaches/natural-pools/las-salinas-de-agaete).
- Ermita de Nuestra Señora de las Nieves y su tríptico atribuido a Joos van Cleve: [Lonely Planet](https://www.lonelyplanet.com/canary-islands/gran-canaria/agaete-and-puerto-de-las-nieves/attractions/ermita-nuestra-senora-de-las-nieves/a/poi-sig/1463261/355138) y [Destinia](https://destinia.com/que-ver-y-hacer-en-agaete/31718).
- Fotografías de Wikimedia Commons consultadas para formas y colores: [fachada de la ermita](https://commons.wikimedia.org/wiki/File:Fachada_de_la_Ermita_de_Las_Nieves.jpg), [la ermita y su jardín](https://commons.wikimedia.org/wiki/File:Puerto_de_las_Nieves_2016_11.jpg), [el Dedo de Dios desde el puerto](https://commons.wikimedia.org/wiki/File:El_Dedo_de_Dios_desde_el_Puerto_de_las_Nieves_(Agaete).jpg), [el Dedo de Dios antes de caer, septiembre de 2005](https://commons.wikimedia.org/wiki/File:Dedo_de_Dios_am_30.09.2005.jpg), [la terminal y el pueblo](https://commons.wikimedia.org/wiki/File:Puerto_de_las_Nieves_2010.jpg) y [el ferry ante los riscos de Tamadaba](https://commons.wikimedia.org/wiki/File:Ferry_a_Tenerife_(1264670907).jpg). Solo se usaron como referencia; no se incluyen en el juego.
## Vegueta (Las Palmas de Gran Canaria)

Maqueta original hecha con primitivas en `src/puerto/sitios/vegueta.ts`, sin
modelos ni texturas nuevas. La plaza de Santa Ana, sus calles, las hileras de
palmeras y la fila de perros siguen la ortofoto PNOA de
`public/assets/visitas/las-palmas-pnoa.webp` y el callejero de OpenStreetMap,
giradas 30° y comprimidas a escala de juego. Se representan la catedral (fachada
neoclásica de cantería gris con dos torres, rosetón, cimborrio y bóvedas blancas),
las Casas Consistoriales con su soportal de nueve arcos, la Casa Regental, el
Palacio Episcopal con su portada de alfiz, los ocho perros, la casa de Viera y
Clavijo, el patio de los Naranjos, el Pilar Nuevo, la Casa de Colón, la plazoleta
del Espíritu Santo con su templete y su ermita, y casas canarias con balcones de tea.

- Callejero, árboles y esculturas: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL, consultados con la API Overpass.
- [Plaza de Santa Ana, Wikipedia](https://es.wikipedia.org/wiki/Plaza_de_Santa_Ana_(Las_Palmas_de_Gran_Canaria)), [Catedral de Canarias, Wikipedia](https://es.wikipedia.org/wiki/Catedral_de_Canarias) y [Las Palmas Cathedral, Wikipedia](https://en.wikipedia.org/wiki/Las_Palmas_Cathedral).
- [Santa Ana Square, LPA Visit](https://lpavisit.com/en/?p=19107) y [guía del barrio de Vegueta, eldiario.es](https://www.eldiario.es/_2d2e8a7c).

## Dunas de Maspalomas

Maqueta original con las piezas del puerto de Mogán (`src/puerto/sitios/dunas.ts`
y su plano sin Three.js, `dunas-plano.ts`), sin assets nuevos: los rizos de la
arena y los rótulos se pintan en un lienzo al cargar. Se representan Playa del
Inglés en su terraza (la rotonda de Tirajana y Francia, Pepe Chiringo en los
bajos del hotel Rey Carlos, el Centro Comercial CITA con sus réplicas de la
torre Eiffel, la torre de Pisa y el Arco de Triunfo, la avenida de Alemania),
el Riu Palace en media luna con el pasaje público al Mirador de las Dunas y su
escalera a la arena, el Paseo Costa Canaria por el borde, el campo de dunas con
crestas que el alisio empuja al suroeste, la hoya de matorral, los montículos de
balancones de la playa del Inglés, el sendero balizado, la Charca con sus cañas,
el palmeral del Oasis, el campo de golf y el Faro de Maspalomas con la casa del
torrero y la plaza del paseo de Meloneras. El viajero de las escenas 3D comparte
modelo con Mogán. La hoja `public/assets/sprites/viajero.png` contiene vistas del
mismo modelo para los mapas 2D.

Licencias de composición: Playa del Inglés va a unos 20 m por unidad y las dunas
a unos 33; la Charca, el palmeral y el faro, a más de 2 km del mirador, se han
acercado a la esquina suroeste y agrandado; las avenidas se ensanchan y se
enderezan; el Paseo Costa Canaria arranca en el mirador, aunque el real empieza
junto a la esquina nordeste del hotel; se omiten los hoteles entre el palmeral,
la Charca y el faro; el puente entre las dos medialunas del Riu y los colores de
Pepe Chiringo no están contrastados con fotografías.

- Trazado sobre la [ortofoto PNOA, servicio WMS del IGN](https://www.ign.es/wms-inspire/pnoa-ma), © Instituto Geográfico Nacional y productores del PNOA, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es). Recortes consultados el 28 de noviembre de 2026 en longitud/latitud: el conjunto de (−15.602, 27.730) a (−15.566, 27.762), el faro y la Charca de (−15.6010, 27.7335) a (−15.5897, 27.7435) y Playa del Inglés de (−15.5810, 27.7420) a (−15.5675, 27.7540). Solo se usaron como referencia; no se incluyen en el juego.
- Geometría de las avenidas de Tirajana, Francia y Alemania, del Paseo Costa Canaria, del [Mirador Las Dunas](https://www.openstreetmap.org/node/301958026) y del [local de Pepe Chiringo](https://www.openstreetmap.org/node/719885194) © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL. Dirección del local en el [directorio de Pepe Chiringo](https://pepechiringo.es/restaurantes/).
- Faro de Maspalomas: torre troncocónica de sillería gris azulada de 56 m, obra de Juan de León y Castillo, encendida el 1 de febrero de 1890, con la casa del torrero adosada al norte y hoy centro etnográfico. [Wikipedia](https://es.wikipedia.org/wiki/Faro_de_Maspalomas).
- Reserva natural de unas 400 ha, protegida desde 1987, y origen marino de la arena: [Wikipedia, Maspalomas Dunes](https://en.wikipedia.org/wiki/Maspalomas_Dunes). Charca y aves limícolas: [Birding Places](https://birdingplaces.eu/es/birdingplaces/spain/la-charca-de-maspalomas). Balancones y dunas en montículo de la playa del Inglés: [proyecto MASDUNAS, Adaptecca](https://adaptecca.es/en/casos-practicos/environmental-restoration-maspalomas-dune-system-masdunas-project-0).
- CITA, inaugurado hacia 1970, con monumentos de cartón piedra en sus fachadas y un Volkswagen rosa en el patio: [Dunas Map](https://www.dunasmap.com/post/cita-shopping-centre-playa-del-ingles). Riu Palace Maspalomas, de estilo colonial y primer hotel Palace de la cadena: [Riu](https://www.riu.com/blog/riu-te-ensena-el-antes-y-el-despues-del-riu-palace-maspalomas/). El pasaje público que cruza el hotel hacia el mirador sigue el [Plan Director de la reserva](https://www.idecanarias.es/resources/PLA_ENP_URB/GC/AD/C-07_Las_Dunas_de_Maspalomas/RNE/TIP/pd_rne_dma_mi.pdf).
