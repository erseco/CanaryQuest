#!/usr/bin/env python3
"""Convierte terrenos LPC (plantilla 3×6 de 32 px, fondo transparente) en hojas Wang de esquinas
compatibles con los generadores de mapas, y compone props (laurel, rocas volcánicas).

Fuentes en art/lpc/ (Liberated Pixel Cup, Sharm: CC-BY-SA 3.0 / GPL 3.0 / OGA-BY 3.0).
Salida: public/assets/tilesets/lpc-<nombre>-32.png, art/lpc/lpc-<nombre>-layout.json
        public/assets/sprites/lpc-<prop>.png

Uso: python3 scripts/lpc-a-wang.py   (requiere Pillow)
"""

from __future__ import annotations

import colorsys
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "art" / "lpc"
TILESETS = ROOT / "public" / "assets" / "tilesets"
SPRITES = ROOT / "public" / "assets" / "sprites"
T = 32

# (NW, NE, SW, SE) con True = hay terreno → (columna, fila) en la plantilla LPC
PLANTILLA = {
    (True, True, True, True): (1, 3),
    (False, False, False, True): (0, 2),
    (False, False, True, False): (2, 2),
    (False, True, False, False): (0, 4),
    (True, False, False, False): (2, 4),
    (False, False, True, True): (1, 2),
    (True, True, False, False): (1, 4),
    (False, True, False, True): (0, 3),
    (True, False, True, False): (2, 3),
    (True, True, True, False): (1, 0),
    (True, True, False, True): (2, 0),
    (True, False, True, True): (1, 1),
    (False, True, True, True): (2, 1),
}
ESQUINAS = ("NW", "NE", "SW", "SE")


def recolorear(im: Image.Image, tono: float = 0.0, sat: float = 1.0, luz: float = 1.0) -> Image.Image:
    """Desplaza el tono (grados) y escala saturación/luminosidad conservando el alfa."""
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            r2, g2, b2 = colorsys.hsv_to_rgb((h + tono / 360) % 1, min(1, s * sat), min(1, v * luz))
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return im


def tile(src: Image.Image, col: int, fila: int) -> Image.Image:
    return src.crop((col * T, fila * T, col * T + T, fila * T + T))


def terreno(nombre: str, fuente: str, **color: float) -> None:
    src = Image.open(ART / fuente).convert("RGBA")
    if color:
        src = recolorear(src, **color)
    tiles: list[tuple[tuple[bool, ...], Image.Image, bool]] = []
    for i in range(16):
        c = tuple(bool(i >> (3 - k) & 1) for k in range(4))  # NW, NE, SW, SE
        if c in PLANTILLA:
            im = tile(src, *PLANTILLA[c])
        else:  # vacío o diagonal: se compone con las esquinas sueltas
            im = Image.new("RGBA", (T, T))
            for k in range(4):
                if c[k]:
                    solo = tuple(j == k for j in range(4))
                    im.alpha_composite(tile(src, *PLANTILLA[solo]))
        tiles.append((c, im, False))
    for col in range(3):  # variantes de relleno (fila 5) para romper la repetición
        tiles.append(((True,) * 4, tile(src, col, 5), True))

    cols = 4
    hoja = Image.new("RGBA", (cols * T, ((len(tiles) + cols - 1) // cols) * T))
    layout = []
    for i, (c, im, variante) in enumerate(tiles):
        x, y = (i % cols) * T, (i // cols) * T
        hoja.paste(im, (x, y))
        layout.append({
            "local_id": i,
            "corners": {k: "upper" if v else "lower" for k, v in zip(ESQUINAS, c)},
            "variante": variante,
            "x": x,
            "y": y,
        })
    hoja.save(TILESETS / f"lpc-{nombre}-32.png")
    (ART / f"lpc-{nombre}-layout.json").write_text(json.dumps(layout, indent=2))
    print("tileset", nombre, hoja.size)


def props() -> None:
    copas = Image.open(ART / "treetop.png").convert("RGBA")
    troncos = Image.open(ART / "trunk.png").convert("RGBA")
    # Laurel de la laurisilva: copa redonda LPC más oscura y fría sobre su tronco
    laurel = Image.new("RGBA", (96, 128))
    laurel.alpha_composite(troncos.crop((0, 0, 96, 96)), (0, 32))
    laurel.alpha_composite(recolorear(copas.crop((0, 0, 96, 96)), tono=25, sat=1.1, luz=0.72), (0, 0))
    laurel.save(SPRITES / "lpc-laurel.png")
    # Tabaiba/brezo: la misma copa en pequeño, sin tronco
    arbusto = recolorear(copas.crop((0, 0, 96, 96)), tono=35, sat=0.9, luz=0.8).resize((48, 48), Image.NEAREST)
    arbusto.save(SPRITES / "lpc-arbusto.png")
    montes = Image.open(ART / "mountains.png").convert("RGBA")
    montes.crop((64, 256, 96, 288)).save(SPRITES / "lpc-aguja-volcanica.png")
    montes.crop((32, 256, 64, 288)).save(SPRITES / "lpc-aguja-ocre.png")
    rocas = Image.open(ART / "rock.png").convert("RGBA")
    recolorear(rocas.crop((0, 0, 32, 32)), sat=0.4, luz=0.35).save(SPRITES / "lpc-roca-malpais.png")
    print("props: laurel, arbusto, agujas, roca-malpais")


if __name__ == "__main__":
    terreno("lava", "lava.png")
    terreno("picon", "lavarock.png")
    terreno("tierra-roja", "dirt.png", tono=-18, sat=1.5, luz=0.85)
    terreno("arena", "dirt.png", tono=8, sat=0.75, luz=1.25)
    terreno("camino", "dirt2.png")
    terreno("agua", "water.png")
    terreno("hierba", "grass.png")
    terreno("musgo", "grass.png", tono=15, sat=1.1, luz=0.7)
    props()
