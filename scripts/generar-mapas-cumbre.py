#!/usr/bin/env python3
"""Genera roque-nublo.tmj (cumbre de Gran Canaria) y casa-cueva.tmj con tilesets Wang de PixelLab.

Solo biblioteca estándar y determinista (semilla fija). El resultado es un .tmj normal con
wangsets de esquina: se puede seguir retocando en Tiled con el pincel de terrenos.

Uso: python3 scripts/generar-mapas-cumbre.py
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "art" / "pixellab"
MAPS = ROOT / "public" / "assets" / "maps"
T = 32  # px por tile


def wang_lookup(nombre: str) -> dict[tuple[bool, bool, bool, bool], int]:
    """(NW, NE, SW, SE) con True = terreno 'upper' → id local del tile."""
    layout = json.loads((ART / f"{nombre}-layout.json").read_text())
    return {
        tuple(t["corners"][k] == "upper" for k in ("NW", "NE", "SW", "SE")): t["local_id"]
        for t in layout
    }


def tileset(nombre: str, firstgid: int, bajo: str, alto: str, colision_desde: int | None) -> dict:
    """Tileset embebido con wangset de esquinas; `colision_desde` = nº de esquinas altas que bloquean."""
    layout = json.loads((ART / f"{nombre}-layout.json").read_text())
    tiles, wangtiles = [], []
    for t in layout:
        altas = [t["corners"][k] == "upper" for k in ("NE", "SE", "SW", "NW")]
        choca = colision_desde is not None and sum(altas) >= colision_desde
        tiles.append(
            {"id": t["local_id"], "properties": [{"name": "collides", "type": "bool", "value": choca}]}
        )
        ne, se, sw, nw = (2 if a else 1 for a in altas)
        wangtiles.append({"tileid": t["local_id"], "wangid": [0, ne, 0, se, 0, sw, 0, nw]})
    return {
        "firstgid": firstgid,
        "name": f"pixellab-{nombre}",
        "image": f"../tilesets/pixellab-{nombre}-32.png",
        "imagewidth": 128,
        "imageheight": 128,
        "tilewidth": T,
        "tileheight": T,
        "tilecount": 16,
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


def cumbre() -> None:
    rnd = random.Random(4400)
    W, H = 80, 50
    v = [["g"] * (W + 1) for _ in range(H + 1)]  # vértices: g hierba, c camino, r risco, a agua

    def ruido(x: int, y: int) -> float:
        return math.sin(x * 0.7 + y * 0.3) * 0.6 + math.sin(y * 0.9 - x * 0.4) * 0.5

    # Riscos: anillo exterior (con salida al sur), macizo del Roque y roquedo de la casa-cueva
    for y in range(H + 1):
        for x in range(W + 1):
            borde = min(x, y, W - x, H - y)
            grosor = 2.5 + ruido(x, y)
            salida_sur = y > H - 6 and 35 <= x <= 45
            if borde < grosor and not salida_sur:
                v[y][x] = "r"
            if ((x - 40) / 13) ** 2 + ((y - 7) / 7) ** 2 < 1 + 0.12 * ruido(x, y):
                v[y][x] = "r"
            if ((x - 13) / 6) ** 2 + ((y - 21) / 5) ** 2 < 1 + 0.15 * ruido(x, y):
                v[y][x] = "r"
            if ((x - 63) / 8) ** 2 + ((y - 27) / 5) ** 2 < 1 + 0.1 * ruido(x, y):
                v[y][x] = "a"  # presa

    # Camino: tronco sur→Roque y ramales a la casa-cueva y a la presa
    tramos = [
        [(40, 50), (40, 43), (34, 37), (31, 31), (35, 24), (40, 15)],
        [(31, 31), (24, 29), (13, 28)],
        [(35, 24), (44, 27), (52, 30), (54, 33)],
    ]
    segs = [(a, b) for t in tramos for a, b in zip(t, t[1:])]
    for y in range(H + 1):
        for x in range(W + 1):
            if v[y][x] == "g" and min(dist_segmento(x, y, a, b) for a, b in segs) < 1.3:
                v[y][x] = "c"
    # El camino no puede tocar riscos/agua: sus tiles van en otra capa y taparían la tierra
    for y in range(H + 1):
        for x in range(W + 1):
            if v[y][x] == "c" and any(
                v[yy][xx] in "ra"
                for yy in range(max(0, y - 1), min(H, y + 1) + 1)
                for xx in range(max(0, x - 1), min(W, x + 1) + 1)
            ):
                v[y][x] = "g"

    camino, risco, presa = (wang_lookup(n) for n in ("cumbre-camino", "cumbre-risco", "cumbre-presa"))
    abajo = teselar(v, W, H, "c", 1, camino)
    base_hierba = 1 + camino[(False, False, False, False)]
    abajo = [t or base_hierba for t in abajo]
    mundo = [r or a for r, a in zip(teselar(v, W, H, "r", 17, risco), teselar(v, W, H, "a", 33, presa))]

    objetos = [
        obj(1, "Spawn Point", "", 40 * T, 47 * T),
        obj(2, "roque-nublo", "zona", 40 * T, 15 * T),
        obj(3, "presa", "zona", 63 * T, 34 * T),
        # Fachada encalada contra el roquedo, como las casas-cueva de Artenara
        obj(4, "casa-canaria", "decor", 13 * T, 27 * T, {"solido": True, "escala": 2.0}),
        obj(5, "casa-cueva", "puerta", 13 * T, 27 * T + 12, {"etiqueta": "Entrar en la casa-cueva"}),
    ]

    # Pinar: muestreo con distancia mínima, fuera de caminos, riscos, agua y claros
    def libre(px: float, py: float) -> bool:
        tx, ty = px / T, py / T
        if not (2 < tx < W - 2 and 2 < ty < H - 2):
            return False
        cerca = [v[int(ty) + dy][int(tx) + dx] for dy in (-1, 0, 1, 2) for dx in (-1, 0, 1, 2)]
        if any(c != "g" for c in cerca):
            return False
        if min(dist_segmento(tx, ty, a, b) for a, b in segs) < 2.5:
            return False
        claros = [(40, 44, 4), (14, 31, 4), (40, 18, 5), (56, 35, 3), (22, 12, 3), (58, 12, 3),
                  (26, 40, 3), (60, 42, 3), (48, 20, 3), (68, 18, 3), (10, 38, 3), (52, 38, 3), (30, 20, 3)]
        return all(math.hypot(tx - cx, ty - cy) > r for cx, cy, r in claros)

    pinos: list[tuple[float, float]] = []
    for _ in range(6000):
        px, py = rnd.uniform(0, W * T), rnd.uniform(0, H * T)
        if libre(px, py) and all(math.hypot(px - qx, py - qy) > 58 for qx, qy in pinos):
            pinos.append((px, py))
    for px, py in pinos:
        objetos.append(obj(len(objetos) + 1, "pino-canario", "decor", px, py, {"solido": True}))

    # Enemigos en claros del pinar (lejos de la entrada sur y de la casa-cueva)
    culebras = [(22, 12), (58, 12), (26, 40), (60, 42), (48, 20), (68, 18), (10, 38)]
    for tx, ty in culebras:
        objetos.append(obj(len(objetos) + 1, "culebra", "enemigo", tx * T, ty * T))
    for tx, ty in [(52, 38), (30, 20)]:
        objetos.append(obj(len(objetos) + 1, "rata", "enemigo", tx * T, ty * T))

    tss = [
        tileset("cumbre-camino", 1, "hierba", "camino", None),
        tileset("cumbre-risco", 17, "hierba", "risco", 2),
        tileset("cumbre-presa", 33, "hierba", "agua", 2),
    ]
    capas = [
        capa_tiles(1, "Below Player", W, H, abajo),
        capa_tiles(2, "World", W, H, mundo),
        capa_tiles(3, "Above Player", W, H, [0] * (W * H)),
    ]
    (MAPS / "roque-nublo.tmj").write_text(json.dumps(mapa(W, H, tss, capas, objetos)))
    print("roque-nublo.tmj", W, "x", H, "pinos:", len(pinos))


def casa_cueva() -> None:
    """Interior de una pantalla: sala excavada con salida por el borde sur."""
    W, H = 30, 17
    v = [["r"] * (W + 1) for _ in range(H + 1)]  # r pared de toba, s suelo
    for y in range(H + 1):
        for x in range(W + 1):
            sala = 8 <= x <= 22 and 4 <= y <= 12
            alcoba = 4 <= x <= 9 and 6 <= y <= 10  # dormitorio al oeste
            pasillo = 14 <= x <= 16 and y >= 12
            if sala or alcoba or pasillo:
                v[y][x] = "s"
    cueva = wang_lookup("casa-cueva")
    # En este tileset 'lower' es el suelo y 'upper' la pared
    mundo = teselar(v, W, H, "r", 1, cueva)
    suelo = 1 + cueva[(False, False, False, False)]
    mundo = [t or suelo for t in mundo]
    tss = [tileset("casa-cueva", 1, "suelo", "pared", 1)]
    capas = [
        capa_tiles(1, "Below Player", W, H, [0] * (W * H)),
        capa_tiles(2, "World", W, H, mundo),
        capa_tiles(3, "Above Player", W, H, [0] * (W * H)),
    ]
    objetos = [
        obj(1, "Spawn Point", "", 15.5 * T, 14 * T),
        obj(2, "abuela", "npc", 12 * T, 7 * T, {"sprite": "priest"}),
        obj(3, "espada", "cofre", 19 * T, 6 * T, {"item": "espada"}),
    ]
    (MAPS / "casa-cueva.tmj").write_text(json.dumps(mapa(W, H, tss, capas, objetos)))
    print("casa-cueva.tmj", W, "x", H)


if __name__ == "__main__":
    cumbre()
    casa_cueva()
