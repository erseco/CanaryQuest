#!/usr/bin/env python3
"""Genera el logo, el favicon y la imagen Open Graph a partir del mapa del archipiélago.

Texto con la fuente bitmap de Pillow reescalada sin suavizado (aspecto pixel-art, sin
licencias de fuentes). Salida en public/: logo.png (512²), favicon.png (64²),
og-image.jpg (1200×630).

Uso: python3 scripts/generar-logo.py   (requiere Pillow)
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DORADO = (244, 197, 66, 255)
AZUL = (10, 26, 58, 255)
BLANCO = (255, 255, 255, 255)


def texto_pixel(texto: str, escala: int, color: tuple, borde: int = 1) -> Image.Image:
    """Texto bitmap ampliado `escala` veces con contorno azul (en píxeles de la fuente)."""
    fuente = ImageFont.load_default_imagefont()
    x0, y0, x1, y1 = fuente.getbbox(texto)
    w, h = x1 - x0 + 2 * borde, y1 - y0 + 2 * borde
    capa = Image.new("RGBA", (w, h))
    d = ImageDraw.Draw(capa)
    for dx in range(-borde, borde + 1):
        for dy in range(-borde, borde + 1):
            d.text((borde - x0 + dx, borde - y0 + dy), texto, font=fuente, fill=AZUL)
    d.text((borde - x0, borde - y0), texto, font=fuente, fill=color)
    return capa.resize((w * escala, h * escala), Image.NEAREST)


def fondo(tamano: tuple[int, int], recorte: tuple[int, int, int, int]) -> Image.Image:
    mapa = Image.open(ROOT / "art" / "mapa-mundo-1280.jpg").convert("RGBA").crop(recorte)
    mapa = mapa.resize(tamano, Image.LANCZOS)
    mapa = ImageEnhance.Brightness(mapa).enhance(0.7)
    velo = Image.new("RGBA", tamano, (10, 26, 58, 90))
    mapa.alpha_composite(velo)
    return mapa


def centrar(base: Image.Image, capa: Image.Image, y: int) -> None:
    base.alpha_composite(capa, ((base.width - capa.width) // 2, y))


def banda(base: Image.Image, y0: int, y1: int) -> None:
    """Franja semitransparente para que el texto se lea sobre el mapa."""
    base.alpha_composite(Image.new("RGBA", (base.width, y1 - y0), (10, 26, 58, 200)), (0, y0))


def logo() -> None:
    img = fondo((512, 512), (520, 180, 900, 560))  # Gran Canaria y Tenerife
    centrar(img, texto_pixel("CANARY", 10, DORADO), 120)
    centrar(img, texto_pixel("QUEST", 10, BLANCO), 250)
    img.save(PUBLIC / "logo.png")
    img.resize((64, 64), Image.LANCZOS).save(PUBLIC / "favicon.png")


def og() -> None:
    # Recorte sin el borde derecho (marca de agua de la herramienta de IA)
    img = fondo((1200, 630), (0, 50, 1200, 680))
    centrar(img, texto_pixel("CANARYQUEST", 10, DORADO), 150)
    banda(img, 315, 440)
    centrar(img, texto_pixel("RPG pixel-art de las Islas Canarias", 3, BLANCO), 330)
    centrar(img, texto_pixel("Juega gratis en el navegador", 3, DORADO), 390)
    img.convert("RGB").save(PUBLIC / "og-image.jpg", quality=85, optimize=True)


if __name__ == "__main__":
    logo()
    og()
    print("public/logo.png, public/favicon.png, public/og-image.jpg")
