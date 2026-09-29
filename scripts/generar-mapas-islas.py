#!/usr/bin/env python3
"""Genera las zonas de detalle de Lanzarote, La Gomera y Fuerteventura con terrenos LPC.

Los tiles LPC tienen fondo transparente, así que cada terreno va en su propia capa
(base opaca + capas encima) y pueden solaparse sin restricciones. Las capas cuyos
tiles tienen `collides` bloquean al jugador (lava, agua).

Uso: python3 scripts/lpc-a-wang.py && python3 scripts/generar-mapas-islas.py
"""

from __future__ import annotations

import json
import math
import random
from typing import Callable

from mapas_comun import MAPS, T, capa_tiles, dist_segmento, mapa, obj, tileset, variantes, wang_lookup

Rejilla = Callable[[int, int], bool]


def ruido(x: float, y: float, s: int = 0) -> float:
    """Ruido suave determinista en [-1.1, 1.1] (suma de senos)."""
    return (
        math.sin(x * 0.31 + s) * 0.5
        + math.sin(y * 0.27 - s * 2) * 0.4
        + math.sin((x + y) * 0.13 + s * 3) * 0.2
    )


def cerca_de_camino(x: float, y: float, tramos: list, ancho: float) -> bool:
    return any(dist_segmento(x, y, a, b) < ancho for t in tramos for a, b in zip(t, t[1:]))


class Zona:
    """Acumula capas de terreno (rejillas de vértices) y objetos, y escribe el .tmj."""

    def __init__(self, nombre: str, w: int, h: int, base: str, semilla: int):
        self.nombre, self.w, self.h = nombre, w, h
        self.rnd = random.Random(semilla)
        self.base = base
        self.capas: list[tuple[str, str, Rejilla, int | None]] = []
        self.objetos: list[dict] = []
        self.propiedades: dict = {}
        self.ocupado: list[tuple[float, float, float]] = []  # (x, y, radio) en px

    def capa(self, terreno: str, etiqueta: str, rejilla: Rejilla, colision: int | None = None) -> None:
        self.capas.append((terreno, etiqueta, rejilla, colision))

    def objeto(self, nombre: str, tipo: str, tx: float, ty: float, props: dict | None = None, radio: float = 40) -> None:
        self.objetos.append(obj(len(self.objetos) + 1, nombre, tipo, tx * T, ty * T, props))
        self.ocupado.append((tx * T, ty * T, radio))

    def esparcir(
        self, nombre: str, n: int, libre: Callable[[float, float], bool], sep: float, props: dict | None = None
    ) -> int:
        """Coloca hasta n props separados `sep` px entre sí y de lo ya colocado."""
        puestos = 0
        for _ in range(n * 40):
            if puestos >= n:
                break
            tx, ty = self.rnd.uniform(1, self.w - 1), self.rnd.uniform(1, self.h - 1)
            px, py = tx * T, ty * T
            if not libre(tx, ty):
                continue
            if any(math.hypot(px - ox, py - oy) < max(sep, r) for ox, oy, r in self.ocupado):
                continue
            self.objetos.append(obj(len(self.objetos) + 1, nombre, "decor", px, py, props))
            self.ocupado.append((px, py, sep))
            puestos += 1
        return puestos

    def teselar(self, terreno: str, rejilla: Rejilla, gid: int) -> list[int]:
        lookup, var = wang_lookup(terreno), variantes(terreno)
        lleno = lookup[(True,) * 4]
        v = [[rejilla(x, y) for x in range(self.w + 1)] for y in range(self.h + 1)]
        data = []
        for y in range(self.h):
            for x in range(self.w):
                c = (v[y][x], v[y][x + 1], v[y + 1][x], v[y + 1][x + 1])
                if not any(c):
                    data.append(0)
                elif all(c) and var and self.rnd.random() < 0.35:
                    data.append(gid + self.rnd.choice(var))
                else:
                    data.append(gid + (lookup[c] if c != (True,) * 4 else lleno))
        return data

    def guardar(self) -> None:
        tss, capas, gid = [], [], 1
        todas = [(self.base, "base", lambda x, y: True, None)] + self.capas
        for i, (terreno, etiqueta, rejilla, colision) in enumerate(todas):
            ts = tileset(terreno, gid, "vacío", etiqueta, colision)
            tss.append(ts)
            nombre = "Below Player" if i == 0 else etiqueta
            capas.append(capa_tiles(i + 1, nombre, self.w, self.h, self.teselar(terreno, rejilla, gid)))
            gid += ts["tilecount"]
        capas.append(capa_tiles(len(capas) + 1, "Above Player", self.w, self.h, [0] * (self.w * self.h)))
        m = mapa(self.w, self.h, tss, capas, self.objetos)
        if self.propiedades:
            m["properties"] = [
                {"name": k, "type": "bool", "value": v} for k, v in self.propiedades.items()
            ]
        (MAPS / f"{self.nombre}.tmj").write_text(json.dumps(m))
        print(f"{self.nombre}.tmj {self.w}x{self.h} objetos: {len(self.objetos)}")


def timanfaya() -> None:
    """Montañas del Fuego: picón rojo, malpaís negro, cráteres de lava y la Ruta de los Volcanes."""
    W, H = 70, 45
    z = Zona("timanfaya", W, H, "lpc-tierra-roja", 5100)
    ruta = [[(35, 45), (35, 38), (26, 32), (24, 24), (32, 16), (38, 9)], [(26, 32), (48, 30), (56, 22)]]
    crateres = [(14, 12, 6), (56, 12, 5), (54, 38, 4), (12, 36, 5)]

    def en_ruta(x: float, y: float, ancho: float = 1.3) -> bool:
        return cerca_de_camino(x, y, ruta, ancho)

    def lava(x: int, y: int) -> bool:
        if en_ruta(x, y, 2.6):
            return False
        crater = any(math.hypot(x - cx, y - cy) < r + ruido(x, y, 1) for cx, cy, r in crateres)
        colada = abs(y - (22 + 6 * math.sin(x * 0.2))) < 1.2 and 44 < x < 66  # río de lava al este
        return crater or colada

    def picon(x: int, y: int) -> bool:  # malpaís negro alrededor de cráteres y en manchas
        borde = any(math.hypot(x - cx, y - cy) < r + 3.5 for cx, cy, r in crateres)
        return (borde or ruido(x, y, 7) > 0.55) and not en_ruta(x, y, 1.8)

    z.capa("lpc-picon", "malpaís", picon)
    z.capa("lpc-camino", "camino", lambda x, y: en_ruta(x, y))
    z.capa("lpc-lava", "lava", lava, colision=2)

    z.objeto("Spawn Point", "", 35, 43)
    z.objeto("crater-timanfaya", "hito", 38, 10)
    z.objeto("crater-timanfaya", "zona", 38, 9)
    for tx, ty in [(20, 20), (46, 18), (30, 38), (58, 30), (10, 26), (44, 40)]:
        z.objeto("murcielago", "enemigo", tx, ty)
    for tx, ty in [(40, 12), (18, 30)]:
        z.objeto("esqueleto", "enemigo", tx, ty)

    def libre(tx: float, ty: float) -> bool:
        return not en_ruta(tx, ty, 2.2) and not lava(round(tx), round(ty)) and not lava(round(tx), round(ty) + 1)

    z.esparcir("aguja-volcanica", 60, libre, 70, {"solido": True})
    z.esparcir("roca-malpais", 40, libre, 60, {"solido": True})
    z.guardar()


def jameos() -> None:
    """Jameos del Agua: tubo volcánico con el lago donde vive el cangrejito ciego."""
    W, H = 30, 17
    z = Zona("jameos", W, H, "lpc-picon", 5200)
    senda = [[(15, 17), (15, 12), (7, 9), (6, 5)], [(15, 12), (23, 9), (24, 5)]]

    def lago(x: int, y: int) -> bool:
        return ((x - 15) / 7) ** 2 + ((y - 6) / 3.2) ** 2 < 1 + 0.1 * ruido(x, y, 3)

    z.capa("lpc-camino", "senda", lambda x, y: cerca_de_camino(x, y, senda, 1.2) and not lago(x, y))
    z.capa("lpc-agua", "lago", lago, colision=2)
    z.objeto("Spawn Point", "", 15, 15.5)
    z.objeto("jameos-del-agua", "hito", 15, 13)
    z.objeto("jameos-del-agua", "zona", 15, 11)
    z.objeto("guardiana-jameos", "npc", 11, 12, {"sprite": "lavanpc"})
    z.objeto("agua-jameos", "cofre", 24, 5, {"item": "agua-jameos"})
    z.esparcir("roca-malpais", 10, lambda tx, ty: not lago(round(tx), round(ty)) and not cerca_de_camino(tx, ty, senda, 2), 64, {"solido": True})
    z.guardar()


def garajonay() -> None:
    """Bosque de laurisilva de Garajonay: musgo, senderos, un barranco con agua y niebla."""
    W, H = 70, 45
    z = Zona("garajonay", W, H, "lpc-musgo", 5300)
    z.propiedades["niebla"] = True
    sendas = [
        [(35, 45), (33, 36), (22, 30), (18, 20), (26, 12), (35, 7)],
        [(33, 36), (46, 32), (54, 22), (47, 12), (35, 7)],
    ]

    def barranco(x: int, y: int) -> bool:
        cx = 10 + y * 1.1 + 3 * math.sin(y * 0.3)  # arroyo en diagonal
        return abs(x - cx) < 1.3 + 0.4 * ruido(x, y, 5) and not cerca_de_camino(x, y, sendas, 2.4)

    z.capa("lpc-hierba", "claros", lambda x, y: ruido(x, y, 11) > 0.6 or math.hypot(x - 35, y - 7) < 5)
    z.capa("lpc-camino", "sendero", lambda x, y: cerca_de_camino(x, y, sendas, 1.1))
    z.capa("lpc-agua", "barranco", barranco, colision=2)

    z.objeto("Spawn Point", "", 35, 43)
    z.objeto("maestra-silbo", "npc", 31, 40, {"sprite": "forestnpc"})
    z.objeto("corazon-garajonay", "hito", 35, 7)
    z.objeto("corazon-garajonay", "zona", 35, 5)
    for tx, ty in [(24, 24), (50, 26), (14, 12), (58, 14), (42, 38), (12, 36)]:
        z.objeto("rata", "enemigo", tx, ty)

    def libre(tx: float, ty: float) -> bool:
        return (
            not cerca_de_camino(tx, ty, sendas, 2.5)
            and not barranco(round(tx), round(ty))
            and not barranco(round(tx), round(ty) + 1)
            and math.hypot(tx - 35, ty - 7) > 6
        )

    z.esparcir("laurel", 170, libre, 62, {"solido": True})
    z.esparcir("arbusto", 50, libre, 40)
    z.guardar()


def betancuria() -> None:
    """Fuerteventura: arena, malpaís, palmeras y la villa de Betancuria al norte."""
    W, H = 70, 45
    z = Zona("betancuria", W, H, "lpc-arena", 5400)
    caminos = [[(35, 45), (35, 34), (28, 24), (30, 12)], [(35, 34), (52, 30), (60, 20)]]
    villa = (30, 9)

    def malpais(x: int, y: int) -> bool:
        return ruido(x, y, 21) > 0.45 and math.hypot(x - villa[0], y - villa[1]) > 10 and not cerca_de_camino(x, y, caminos, 2)

    z.capa("lpc-picon", "malpaís", malpais)
    z.capa("lpc-hierba", "vega de la villa", lambda x, y: math.hypot(x - villa[0], (y - villa[1]) * 1.3) < 9 + ruido(x, y, 4))
    z.capa("lpc-camino", "camino", lambda x, y: cerca_de_camino(x, y, caminos, 1.2))

    z.objeto("Spawn Point", "", 35, 43)
    z.objeto("quesera", "npc", 38, 41, {"sprite": "villagegirl"})
    z.objeto("testigo-dunas", "npc", 60, 18, {"sprite": "desertnpc"})
    z.objeto("betancuria", "hito", 30, 13)
    z.objeto("betancuria", "zona", 30, 3)
    for i, (tx, ty) in enumerate([(24, 7), (36, 7), (22, 12), (38, 12)]):
        z.objeto("casa-canaria", "decor", tx, ty, {"solido": True, "escala": 2.0}, radio=70)
    for tx, ty in [(26, 18), (36, 17), (44, 9)]:
        z.objeto("ladron", "enemigo", tx, ty)
    for tx, ty in [(14, 30), (50, 38), (58, 8)]:
        z.objeto("culebra", "enemigo", tx, ty)

    def libre(tx: float, ty: float) -> bool:
        return not cerca_de_camino(tx, ty, caminos, 2.5) and math.hypot(tx - villa[0], ty - villa[1]) > 9

    z.esparcir("palmera", 30, libre, 90, {"solido": True})
    z.esparcir("roca-malpais", 45, lambda tx, ty: libre(tx, ty) and malpais(round(tx), round(ty)), 50, {"solido": True})
    z.esparcir("aguja-ocre", 25, libre, 60, {"solido": True})
    z.esparcir("arbusto", 20, libre, 50)  # tabaibas
    z.guardar()


if __name__ == "__main__":
    timanfaya()
    jameos()
    garajonay()
    betancuria()
