# Prompts para generar los assets pendientes

Los assets marcados como «generado» en el juego (cabra, ferry, avión, símbolo,
tajo de espada) son texturas de programador creadas en runtime
(`PreloadScene.crearTexturasGeneradas`). Sustituirlos por arte real es
opcional pero deseable. Estos prompts reproducen el estilo de las
ilustraciones existentes.

## Estilo base (prefijo común para TODOS los prompts de mapa)

> Vibrant 16-bit pixel art in the style of SNES-era JRPG world maps
> (Zelda: A Link to the Past aesthetic), bright saturated colors, clean
> pixel clusters, blue ocean background (#1a54c8), soft dithering on
> coastlines with white foam edge, top-down slightly angled view.

## 1. Ilustración de La Graciosa (la única isla que falta) — PRIORITARIA

> [estilo base] Map of La Graciosa island (Canary Islands): small flat
> sandy island with golden dunes and low ochre volcano cones (Montaña
> Amarilla, Montaña Bermeja), tiny white fishing village Caleta de Sebo
> with a small harbor pier on the southeast coast, sandy paths instead of
> roads, turquoise shallow water around white-sand beaches (Playa de las
> Conchas), a few fishing boats, no trees except scattered palm trees.
> Pixel-art label "LA GRACIOSA" at the top in white retro game font.
> Square 1254×1254 image, island fills most of the frame.

Guárdala como `art/islas/la-graciosa.jpg` + copia optimizada en
`public/assets/islas/la-graciosa.jpg`, y en `src/data/islas.ts` pon la ruta
en `ilustracion`.

## 2. Sprite del héroe canario (sustituto del atlas «misa»)

> 16-bit pixel art character spritesheet, SNES JRPG style, top-down view:
> young Canarian shepherd kid wearing a white shirt, black vest and a small
> black-and-white brimmed hat (traditional Canarian outfit), holding a
> wooden shepherd staff. 4 directions (down, up, left, right), 4 walking
> frames each, 32×64 pixels per frame, transparent background, arranged in
> a grid. Bright friendly colors, black outline.

## 3. Cabra (sustituye la textura generada `cabra`)

> 16-bit pixel art sprite, SNES style: small white-and-brown Canarian goat
> (cabra majorera) with curved horns, side view and front view, idle + 2
> walking frames, 24×24 pixels per frame, transparent background.

## 4. Ferry (sustituye `ferry`; estilos Fred Olsen y Naviera Armas)

> 16-bit pixel art sprite of a small inter-island ferry ship seen from
> above-side (3/4 top-down), white superstructure, blue hull with a red
> stripe, tiny waves at the bow, 64×40 pixels, transparent background.
> Variant A: blue+red livery. Variant B: white+red livery.

## 5. Avión ATR de Binter (sustituye `avion`)

> 16-bit pixel art sprite of a small twin-propeller regional airplane
> (ATR-72 style) seen from above, white fuselage with turquoise tail and
> engine nacelles, 64×48 pixels, transparent background.

## 6. Alimaña / enemigos temáticos (sustituye al cangrejo de BrowserQuest)

> 16-bit pixel art enemy spritesheet, SNES Zelda style, top-down: [pick one]
> a) wild dog (perro salvaje) sandy-colored, b) giant lizard (lagarto de
> El Hierro) green with spines, c) cave bat. 4-direction walk cycles,
> 3 frames each, 32×32 per frame, transparent background, slight menacing
> look but kid-friendly.

## 7. Los 8 símbolos guanches (sustituye `simbolo`)

> Set of 8 pixel-art icons, 24×24 each, transparent background: ancient
> Guanche spiral petroglyphs carved in golden stone, each slightly
> different (spiral, double spiral, concentric circles, meander, zigzag,
> sun, triangle pattern, labyrinth), glowing golden outline, SNES item-icon
> style.

## 8. Retratos de NPCs para diálogos (mejora futura)

> Pixel art portrait 64×64, SNES RPG dialogue style, bust of [an old
> Canarian shepherd with white beard and black hat / a fisherwoman with
> headscarf / an astronomer with glasses], warm colors, dark blue
> background matching #0a1a3a.

## Cómo integrarlos

1. Colocar el PNG en `public/assets/sprites/` (o `islas/`).
2. Cargarlo en `PreloadScene.preload()` con la clave que ya usa el juego
   (`cabra`, `ferry`, `avion`, `simbolo`…): al usar la misma clave, el resto
   del código no cambia; basta borrar la textura generada equivalente en
   `crearTexturasGeneradas`.
3. Anotar licencia/origen en `docs/creditos.md`.
