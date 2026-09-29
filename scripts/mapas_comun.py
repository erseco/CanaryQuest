"""Utilidades compartidas por los generadores de mapas .tmj (Tiled) con tilesets Wang de esquinas."""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "art" / "pixellab"
ART_LPC = ROOT / "art" / "lpc"
MAPS = ROOT / "public" / "assets" / "maps"
T = 32  # px por tile


def leer_layout(nombre: str) -> list[dict]:
    """Layout Wang: `lpc-*` en art/lpc, el resto (PixelLab) en art/pixellab."""
    carpeta = ART_LPC if nombre.startswith("lpc-") else ART
    return json.loads((carpeta / f"{nombre}-layout.json").read_text())


def wang_lookup(nombre: str) -> dict[tuple[bool, bool, bool, bool], int]:
    """(NW, NE, SW, SE) con True = terreno 'upper' → id local del tile (sin variantes)."""
    return {
        tuple(t["corners"][k] == "upper" for k in ("NW", "NE", "SW", "SE")): t["local_id"]
        for t in leer_layout(nombre)
        if not t.get("variante")
    }


def variantes(nombre: str) -> list[int]:
    """Ids de los tiles de relleno alternativos (terreno completo), si el tileset los trae."""
    return [t["local_id"] for t in leer_layout(nombre) if t.get("variante")]


def tileset(nombre: str, firstgid: int, bajo: str, alto: str, colision_desde: int | None) -> dict:
    """Tileset embebido con wangset de esquinas; `colision_desde` = nº de esquinas altas que bloquean."""
    layout = leer_layout(nombre)
    tiles, wangtiles = [], []
    for t in layout:
        altas = [t["corners"][k] == "upper" for k in ("NE", "SE", "SW", "NW")]
        choca = colision_desde is not None and sum(altas) >= colision_desde
        tiles.append(
            {"id": t["local_id"], "properties": [{"name": "collides", "type": "bool", "value": choca}]}
        )
        ne, se, sw, nw = (2 if a else 1 for a in altas)
        wangtiles.append({"tileid": t["local_id"], "wangid": [0, ne, 0, se, 0, sw, 0, nw]})
    nombre_ts = nombre if nombre.startswith("lpc-") else f"pixellab-{nombre}"
    filas = (len(layout) + 3) // 4
    return {
        "firstgid": firstgid,
        "name": nombre_ts,
        "image": f"../tilesets/{nombre_ts}-32.png",
        "imagewidth": 128,
        "imageheight": filas * T,
        "tilewidth": T,
        "tileheight": T,
        "tilecount": len(layout),
        "columns": 4,
        "margin": 0,
        "spacing": 0,
        "tiles": tiles,
        "wangsets": [
            {
                "name": nombre,
                "type": "corner",
                "tile": -1,
                "colors": [
                    {"name": bajo, "color": "#3a9d23", "tile": -1, "probability": 1},
                    {"name": alto, "color": "#8b5a2b", "tile": -1, "probability": 1},
                ],
                "wangtiles": wangtiles,
            }
        ],
    }


def capa_tiles(lid: int, nombre: str, w: int, h: int, data: list[int]) -> dict:
    return {
        "id": lid, "name": nombre, "type": "tilelayer", "x": 0, "y": 0,
        "width": w, "height": h, "opacity": 1, "visible": True, "data": data,
    }


def obj(oid: int, nombre: str, tipo: str, x: float, y: float, props: dict | None = None) -> dict:
    o = {
        "id": oid, "name": nombre, "type": tipo, "x": round(x), "y": round(y),
        "width": 0, "height": 0, "rotation": 0, "visible": True, "point": True,
    }
    if props:
        o["properties"] = [
            {"name": k, "type": {bool: "bool", float: "float"}.get(type(v), "string"), "value": v}
            for k, v in props.items()
        ]
    return o


def mapa(w: int, h: int, tilesets: list, capas: list, objetos: list) -> dict:
    return {
        "compressionlevel": -1, "type": "map", "version": "1.10", "tiledversion": "1.10.2",
        "orientation": "orthogonal", "renderorder": "right-down", "infinite": False,
        "width": w, "height": h, "tilewidth": T, "tileheight": T,
        "nextlayerid": len(capas) + 2, "nextobjectid": len(objetos) + 1,
        "tilesets": tilesets,
        "layers": capas + [{
            "id": len(capas) + 1, "name": "Objects", "type": "objectgroup", "x": 0, "y": 0,
            "opacity": 1, "visible": True, "draworder": "topdown", "objects": objetos,
        }],
    }


def teselar(v: list[list[str]], w: int, h: int, terreno: str, gid: int, lookup: dict) -> list[int]:
    """Tile Wang por celda según sus 4 vértices; 0 donde no hay nada de `terreno`."""
    data = []
    for y in range(h):
        for x in range(w):
            c = (v[y][x] == terreno, v[y][x + 1] == terreno, v[y + 1][x] == terreno, v[y + 1][x + 1] == terreno)
            data.append(gid + lookup[c] if any(c) else 0)
    return data


def dist_segmento(px: float, py: float, a: tuple, b: tuple) -> float:
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


