# Créditos y licencias de assets

| Asset | Ruta en el juego | Origen | Licencia |
|---|---|---|---|
| Ilustraciones de islas (7) | `public/assets/islas/*.jpg` | Generadas con IA para este proyecto (Ernesto) | Propias |
| Mapa original del archipiélago | `public/assets/islas/mapa-mundo.jpg` | Generada con IA para este proyecto | Propia |
| Vista aérea (título) | `public/assets/titulo/archipielago-aereo.jpg` | Generada con IA (canarias.win) | Propia |
| Tileset pueblo 32 px extruido | `public/assets/tilesets/tuxemon-32px-extruido.png` | Proyecto [Tuxemon](https://github.com/Tuxemon/Tuxemon), vía plantilla phaser-rpg | CC-BY-SA 4.0 |
| Mapa del pueblo | `public/assets/maps/pueblo.tmj` | "tuxemon-town" de la plantilla [phaser-rpg](https://github.com/remarkablegames/phaser-rpg) (remarkablemark) | MIT (mapa), tiles CC-BY-SA 4.0 |
| Tilesets Wang dunas/plaza/ciudad 32 px | `public/assets/tilesets/pixellab-*.png` | Generados con [PixelLab API](https://www.pixellab.ai/) para este proyecto | Propios (cuenta CanaryQuest) |
| Props mapa (casas, catedral…) | `public/assets/sprites/pixellab-*.png` | Generados con PixelLab (`map-objects`) | Propios |
| Mapas dunas y Las Palmas | `public/assets/maps/*.tmj` | Layout propio sobre tilesets PixelLab | Propio |
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

## Ferris y avión del mapa de viajes

Dibujos originales hechos con el canvas 2D en `src/sistemas/vehiculos.ts`, sin
ficheros de imagen. Cada naviera lleva sus colores y su nombre en texto, nunca
su logotipo. Naviera Armas aparece con el casco blanco, la proa y la popa rojas
barridas de gris, «ARMAS» en rojo y la contraseña azul y amarilla en la
chimenea. Fred. Olsen Express aparece con el casco blanco, la superestructura
amarilla y la franja azul, y Líneas Romero con un catamarán turquesa con boca de
tiburón. El ATR 72-600 de Binter se ve desde arriba, con el fuselaje blanco, las
franjas verdes y azul de la cola, el morro verde y «Binter» en el techo.

- Fotografías de Wikimedia Commons consultadas para formas y colores: [Volcán de Taburiente](https://commons.wikimedia.org/wiki/File:ARMAS_Ferry_Volcan_de_Taburiente_2.jpg), [Volcán de Tindaya](https://commons.wikimedia.org/wiki/File:Vessel_Volc%C3%A1n_de_Tindaya.JPG), [Volcán de Tagoro](https://commons.wikimedia.org/wiki/File:HSC_Volc%C3%A1n_de_Tagoro,_Port_of_Las_Palmas,_Gran_Canaria,_12._January_2020,_side_view.jpg), [Bencomo Express](https://commons.wikimedia.org/wiki/File:Bencomo_Express_2021_01.jpg), [Benchijigua Express](https://commons.wikimedia.org/wiki/File:Benchijigua_Express_01_2019-12.JPG), [ATR 72-600 EC-MXQ](https://commons.wikimedia.org/wiki/File:Binter_Canarias_ATR_72-600_(EC-MXQ)_@_TFS,_Jan_2019.jpg) y [E195-E2 EC-NHA](https://commons.wikimedia.org/wiki/File:EC-NHA_Embraer_195-E2_Binter_arrecife_29-02-20.jpg). La ilustración del catamarán de [Líneas Romero](https://www.lineasromero.com/) se consultó en su web. Solo se usaron como referencia; no se incluyen en el juego.

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

## Playa de Las Canteras (Las Palmas de Gran Canaria)

Maqueta original hecha con primitivas en `src/puerto/sitios/canteras.ts` y
`canteras-plano.ts`, sin modelos ni texturas nuevas. La orilla, el paseo, La
Barra, La Puntilla con su plaza y su varadero, Playa Chica y la Peña de la Vieja
se trazaron sobre recortes PNOA de (−15,456; 28,126) a (−15,426; 28,156) y se
«desenrollaron»: el arco de la bahía corre en línea a lo largo de x, a unos 19 m
por unidad, y de través a unos 7 m, para que la cámara lo recorra entero. La
Barra queda más cerca de la orilla que en la realidad (unos 200 m), para que se
vea con la playa. El arco de La Cícer y el Auditorio Alfredo Kraus se comprimen
al fondo, dentro del horizonte pintado. Los edificios de la primera línea, el
hotel Reina Isabel, el bloque azul, la casa antigua de dos plantas, los bloques
escalonados de La Cícer y la torre Woermann se modelan a partir de fotografías,
sin copiar sus fachadas. Los recortes PNOA se usaron solo como consulta y no están
en el repositorio.

- [Ortofoto PNOA, servicio WMS del IGN](https://www.ign.es/wms-inspire/pnoa-ma), © Instituto Geográfico Nacional y productores del PNOA, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es).
- Posiciones de la playa, La Puntilla, la heladería de la Peña de la Vieja, el hotel Reina Isabel, la torre Woermann y el Auditorio: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL, consultadas con Nominatim.
- [Playa de Las Canteras, Wikipedia](https://es.wikipedia.org/wiki/Playa_de_Las_Canteras) y [Las Canteras beach, Wikipedia](https://en.wikipedia.org/wiki/Las_Canteras_beach): La Barra de arenisca, de unos dos kilómetros a unos doscientos metros de la orilla; el nombre, de la piedra que se sacaba de ella; la Peña a unos 60 m; Playa Chica; el Teide que se ve en los días claros.
- [Las Canteras, LPA Mar](https://lpamar.laspalmasgc.es/las-playas/las-canteras?locale=en) y [LPA Visit](https://lpavisit.com/en/?p=18976): sectores de la playa, La Puntilla como último refugio de los pescadores, el Teide visible desde la playa.
- [Las Canteras bit by bit, Gran Canaria Info](https://gran-canaria-info.com/beaches/gran-canaria-beaches-las-canteras-bit-by-bit): barcas varadas en La Puntilla, Playa Chica sin hamacas, viejas y pejeverdes, La Cícer sin barra y con olas.
- [Auditorio Alfredo Kraus, Wikipedia](https://en.wikipedia.org/wiki/Auditorio_Alfredo_Kraus): obra de Óscar Tusquets, inaugurada en 1997; [RTVE Canarias, 25.º aniversario](https://rtvc.es/auditorio-alfredo-kraus-25-aniversario/): «Desde el principio imaginé el edificio entre una fortaleza y un faro, que protegiera la playa de Las Canteras»; [«The voice of the ocean», Gran Canaria](https://grancanaria.com/blog/en/article/the-voice-of-the-ocean): la sala sinfónica abre una ventana al mar tras el escenario.
- [El Teide desde Las Canteras, miplayadelascanteras.com](https://miplayadelascanteras.com/2019/12/15/el-teide-desde-las-canteras/) y [eldiario.es](https://www.eldiario.es/canariasahora/sociedad/fotografia-desde-gran-canaria-teide-nieve-hoy_1_9929816.html).
- Fotografías de Wikimedia Commons consultadas para formas y colores: [el Auditorio desde la entrada](https://commons.wikimedia.org/wiki/File:Auditorio_Alfredo_Kraus_01.jpg), [el Auditorio y su linterna](https://commons.wikimedia.org/wiki/File:Auditorio_alfredo_kraus_las_palmas_de_gran_canaria.jpg), [la Peña de la Vieja](https://commons.wikimedia.org/wiki/File:Las_Canteras_Beach-Pe%C3%B1a_la_Vieja.jpg), [barcas y nasas en La Puntilla](https://commons.wikimedia.org/wiki/File:Canteras_Beach-Nasas_%26_boats_in_La_Puntilla.jpg), [La Puntilla](https://commons.wikimedia.org/wiki/File:Canteras_Beach-La_Puntilla-Gran_Canaria.jpg), [el varadero](https://commons.wikimedia.org/wiki/File:La_Puntilla,_playa_de_Las_Canteras_en_Las_Palmas_de_Gran_Canaria.jpg), [La Puntilla al anochecer](https://commons.wikimedia.org/wiki/File:200214_Las_Canteras_-_Blick_auf_La_Puntilla_am_Abend.jpg), [Playa Chica](https://commons.wikimedia.org/wiki/File:Playa_las_canteras_chica_atardecer_palmas_gran_canaria.jpg), [el paseo](https://commons.wikimedia.org/wiki/File:Las_Canteras_Beach_Avenue-Las_Palmas_Gran_Canaria.jpg), [sus terrazas](https://commons.wikimedia.org/wiki/File:20150209_Strandleben_am_Paseo_des_Las_Canteras.jpg), [sus edificios](https://commons.wikimedia.org/wiki/File:Playa_las_canteras_paseo_palmas_de_gran_canaria.jpg) y [el hotel Reina Isabel](https://commons.wikimedia.org/wiki/File:Hotel_Reina_Isabel,_Las_Palmas_de_Gran_Canaria.jpg). Solo se usaron como referencia; no se incluyen en el juego.

## La Fortaleza de Chipude (La Gomera)

Maqueta original hecha con primitivas en `src/puerto/sitios/chipude.ts`, sin
assets nuevos. La cornisa de la mesa se trazó sobre las curvas de nivel del IGN
(la de 1.240 m y las que se apiñan bajo ella) y la ortofoto PNOA; la iglesia, la
plaza, Pavón, el collado (1.125 m) y la zona arqueológica, sobre las posiciones
de OpenStreetMap. Los recortes, de (−17.300, 28.090) a (−17.268, 28.118), se
usaron solo como consulta y no están en el repositorio. Licencias de
composición: el conjunto gira 131° para que la mesa quede al fondo del
encuadre y el pueblo 41° más para que la iglesia mire a la cámara; la distancia
del pueblo a la mesa se acorta a la mitad; la mesa va a escala 1:15 y algo más
ancha en la punta sur; las alturas se comprimen (la cima a 13 sobre la plaza);
se omiten la carretera a Pavón y el campo de fútbol.

- [Ortofoto PNOA, servicio WMS del IGN](https://www.ign.es/wms-inspire/pnoa-ma) y [curvas de nivel del MDT, servicio WMS del IGN](https://servicios.idee.es/wms-inspire/mdt), © Instituto Geográfico Nacional y productores del PNOA, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es) (scne.es).
- Posiciones de la iglesia, la plaza, Pavón, el collado, la era y la zona arqueológica: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL, consultadas con la API Overpass.
- [Fortaleza de Chipude, Hispanopedia (Wikipedia en español)](https://es.hispanopedia.com/wiki/Fortaleza_de_Chipude): 1.243 m, domo intrusivo, única entrada por un paso estrecho, posible Argodey de las crónicas, estudios de Bethencourt Alfonso (1874), la Universidad de La Laguna (1973), Pellicer y Navarro Mederos.
- [The historic fortress of Chipude, Jardín Tecina](https://www.jardin-tecina.com/?p=8650) y [El Cercado and the pottery tradition of La Gomera](https://www.jardin-tecina.com/?p=8507): recintos de piedra y ofrendas de cabras como creencia; loza sin torno, alisada con callao y pintada con almagre.
- [Chipude, Hispanopedia](https://es.hispanopedia.com/wiki/Chipude), [Loceras de El Cercado](https://es.hispanopedia.com/wiki/Loceras_de_El_Cercado) y [Chipude, Hello Canary Islands](https://www.hellocanaryislands.com/places-full-of-charm/la-gomera/chipude/): ermita de Candelaria hecha parroquia en el siglo XVII, cereal en las tierras altas, fiesta del 15 de agosto.
- Fotografías de referencia de [Wikimedia Commons, categoría Chipude](https://commons.wikimedia.org/wiki/Category:Chipude) (la iglesia de dos naves con su campanario de cantería) y de la [Fortaleza](https://commons.wikimedia.org/wiki/Category:Monumento_Natural_de_La_Fortaleza), solo como consulta.
- Ruta habitual desde Pavón por la canal de la arista nordeste: SummitPost y la guía Rother de La Gomera (collado de la Fortaleza, 1.125 m), vistas en resultados de búsqueda.

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
## Playa Blanca (Lanzarote)

El pueblo 3D de Playa Blanca (`src/puerto/sitios/playa-blanca.ts`) se ha
modelado para el juego con las piezas de la maqueta del puerto: el puerto del
ferry con su dársena pesquera, la playa del Pueblo, la iglesia de Nuestra Señora
del Carmen con su espadaña, el paseo sobre la lava, Playa Dorada entre sus
escolleras, la Marina Rubicón con la torrecilla de la capitanía, el Castillo de
las Coloradas (Torre del Águila) sobre la punta del Águila, la Montaña Roja, Los
Ajaches y, enfrente, Lobos y la costa norte de Fuerteventura. El ferry, compartido
con Agaete (`src/puerto/sitios/ferry.ts`), lleva la librea de Naviera Armas: casco
blanco, raya roja y gris, el rótulo ARMAS y el banderín de la casa en las chimeneas.
No se ha copiado ninguna imagen al juego: las fotografías y ortofotos solo sirvieron de referencia.

### Referencias del trazado de Playa Blanca

- Ortofoto PNOA máxima actualidad © IGN y productores PNOA, [CC BY 4.0](https://www.scne.es/). Recortes del WMS consultados entre (−13.845, 28.848) y (−13.805, 28.868).
- Posiciones de la iglesia, las playas, los muelles, la Marina Rubicón y el castillo: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL, consultados con la API Overpass.
- Fechas del Castillo de las Coloradas (1741–1744, incendio de 1749 y lápida de 1769) según [Lanzarote Information](https://lanzaroteinformation.co.uk/?p=12336), [Hispanopedia](https://es.hispanopedia.com/wiki/Playa_Blanca_(Lanzarote)) y [Burgenwelt](https://www.burgenwelt.org/spanien/coloradas/burgenwelt-coloradas-objektseite.pdf).
- Fotografías de referencia en Wikimedia Commons: iglesia del Carmen, de Frank Vincentz (CC BY-SA 3.0) y Dguendel (CC BY 4.0); Castillo de las Coloradas, de Marc Ryckaert (CC BY 3.0) y Wiki05 (CC0); Marina Rubicón, de Luis Miguel Bugallo Sánchez y Frank Vincentz (CC BY-SA 3.0); Playa Dorada, de Mark (CC BY 2.0) y Frank Vincentz (CC BY-SA 3.0).
- Ferry de Naviera Armas: fotografías del Volcán de Tindaya en Playa Blanca y Corralejo, de Frank Vincentz (CC BY-SA 3.0) y Ein Dahmer (CC BY-SA 4.0), y el [distintivo de los buques de Naviera Armas](https://commons.wikimedia.org/wiki/File:Distintivo_de_los_buques_de_Naviera_Armas.JPG), de Carlos Teixidor Cadenas (CC BY-SA 3.0).
- Travesía Playa Blanca–Corralejo (unos 13 km, entre 25 y 35 minutos): [Ferryhopper](https://www.ferryhopper.com/es/ferry-routes/direct/playa-blanca-corralejo) y [Direct Ferries](https://www.directferries.es/ferry_playa_blanca_corralejo.htm). Mercadillo de la Marina Rubicón los miércoles y sábados: [mercadillos.org](https://mercadillos.org/es/playa-blanca/mercadillo-marina-rubicon). Procesión marítima de la Virgen del Carmen: [La Voz de Lanzarote](https://www.lavozdelanzarote.com/en/news/culture/playa-blanca-and-its-seafaring-tradition-surrender-to-the-virgen-carmen_236548_102.html).

## La Isleta (Las Palmas de Gran Canaria)

Maqueta original hecha con primitivas en `src/puerto/sitios/isleta.ts`, sin
modelos ni texturas nuevas. El trazado sigue la ortofoto PNOA y el callejero de
OpenStreetMap con el norte arriba, comprimido a escala de juego: la dársena con
el muelle de los pesqueros y un carguero; la avenida del puerto; el Castillo de
La Luz en su jardín (mampostería, almenas de cantería, torreones redondos al
noreste y al suroeste, garita al noroeste y las cajas de acero corten de la
reforma de 2015) con el edificio de la fundación al este; la iglesia de La Luz
con sus tres rosetones y su tejado de bóvedas al oeste; las calles Juan Rejón,
La Naval y una calle alta unidas por cuestas y escaleras, entre casas de
colores con azoteas, depósitos de agua y plantas a medio acabar; los tanques de
combustible y las grúas de la terminal de contenedores al este; los volcanes y
los cuarteles al norte, y El Confital al noroeste. Licencias de composición: la
pendiente del barrio está suavizada, la puerta del castillo se ha llevado a la
cara sur para que se vea desde el puerto, El Confital está más cerca del barrio
que en la realidad y la terminal de contenedores, frente a la dársena. Los
colores de la fachada de la iglesia y las grúas no se han verificado. La
Chistera es un local del juego; no se corresponde con ningún local real de La
Isleta. Los recortes PNOA, de (−15.450, 28.130) a (−15.395, 28.185) y sus
ampliaciones, se usaron solo como consulta y no están en el repositorio.

- [Ortofoto PNOA, servicio WMS del IGN](https://www.ign.es/wms-inspire/pnoa-ma), © Instituto Geográfico Nacional y productores del PNOA, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es).
- Calles, plazas, el castillo y las parroquias: © colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright), ODbL, consultados con la API Overpass.
- [Castillo de la Luz, Wikipedia](https://es.wikipedia.org/wiki/Castillo_de_la_Luz): construido en piedra en 1494 sobre un arrecife, incendiado por la armada de Van der Does en 1599, hoy a más de 150 m del mar y sede de la Fundación Martín Chirino desde 2015.
- [La Isleta, Wikipedia](https://es.wikipedia.org/wiki/La_Isleta_(Las_Palmas_de_Gran_Canaria)), [Paisaje protegido de La Isleta](https://es.wikipedia.org/wiki/Paisaje_protegido_de_La_Isleta) y [El Confital](https://es.wikipedia.org/wiki/El_Confital): zona militar, fiestas de La Naval, la ola de El Confital y el derribo de las chabolas en 2004.
- [La Isleta in Gran Canaria, Lopesan](https://www.lopesan.com/blog/en/?p=15158): el ataque de Drake en 1595 y el Puerto de La Luz de 1883.
- [Rehabilitación de la iglesia de La Luz, RTVC](https://rtvc.es/rehabilitacion-iglesia-de-la-luz-las-palmas-de-gran-canaria-28-septiembre-202/): inaugurada en 1914, tres rosetones, bóvedas de media naranja y la Virgen de Luján Pérez.
- Fotografías de Wikimedia Commons consultadas para formas y colores: [el castillo](https://commons.wikimedia.org/wiki/File:Castillo_de_la_Luz_D81_5344_(27910263459).jpg), [su garita](https://commons.wikimedia.org/wiki/File:Castilo_de_La_Luz-torreon_Las-Palmas-Gran-Canaria.jpg), [casas de la calle Coronel Rocha](https://commons.wikimedia.org/wiki/File:Residential_by_Calle_del_Coronel_Rocha_in_La_Isleta,_Las_Palmas_de_Gran_Canaria,_Gran_Canaria,_2023_May.jpg) y [La Isleta desde el interior de la isla](https://commons.wikimedia.org/wiki/File:Mirando_hacia_La_Isleta_-_panoramio.jpg). Solo se usaron como referencia; no se incluyen en el juego.
## Playa de Las Teresitas y San Andrés

Maqueta original hecha con primitivas en `src/puerto/sitios/teresitas.ts` y
`teresitas-plano.ts`, sin assets nuevos. La media luna de la playa, el
rompeolas exento con sus dos bocas, los espigones, el paseo azul, la mediana de
palmeras, el aparcamiento, la cofradía, el cauce del barranco, el castillo y la
avenida de San Andrés se trazaron sobre recortes de la ortofoto PNOA de
(−16.205, 28.495) a (−16.175, 28.520), usados solo como consulta y fuera del
repositorio. Licencias: la curva de la playa se aplana a la mitad de su hondura
y se ensancha; el pueblo se comprime en manzanas rectas al oeste del barranco y
el cauce se endereza; el castillo queda detrás de la avenida y no en su glorieta.

- [Ortofoto PNOA, servicio WMS del IGN](https://www.ign.es/wms-inspire/pnoa-ma), © Instituto Geográfico Nacional y productores del PNOA, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es) (scne.es).
- [Playa de Las Teresitas, Wikipedia](https://es.wikipedia.org/wiki/Playa_de_Las_Teresitas): 1.300 m por 80, rompeolas de casi un kilómetro a unos 150 m con una boca en cada punta, espigones de la cofradía y de la punta de los Órganos, embarque de la Virgen del Carmen.
- Diario de Avisos sobre [la arena del Sáhara](https://diariodeavisos.elespanol.com/2022/05/las-teresitas-sahara/) (obras desde 1968, unas 270.000 toneladas en 1973), [los kioscos](https://diariodeavisos.elespanol.com/2026/03/luz-verde-quioscos-las-teresitas/) y [el castillo](https://diariodeavisos.elespanol.com/2023/04/castillo-de-san-andres/).
- [Castle of San Andrés, Wikipedia](https://en.wikipedia.org/wiki/Castle_of_San_Andr%C3%A9s): torre de hacia 1706, media torre derribada por el barranco, Bien de Interés Cultural, disparos sobre el HMS Theseus en 1797 (contado como tradición).
