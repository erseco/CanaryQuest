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
