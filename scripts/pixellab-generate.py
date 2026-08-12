#!/usr/bin/env python3
"""Genera tilesets y props con la API de PixelLab (no commitear el secret).

Uso:
  # Opción A: secret en .env (recomendado; no se pushea)
  python3 scripts/pixellab-generate.py

  # Opción B: variable de entorno
  export PIXELLAB_API_KEY='…'
  python3 scripts/pixellab-generate.py

Salida:
  art/pixellab/          fuentes + meta
  public/assets/tilesets/pixellab-*.png
  public/assets/sprites/pixellab-*.png
"""

from __future__ import annotations

import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Instala pillow: pip3 install pillow", file=sys.stderr)
    sys.exit(1)

API = "https://api.pixellab.ai/v2"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "art" / "pixellab"
PUBLIC_TS = ROOT / "public" / "assets" / "tilesets"
PUBLIC_SP = ROOT / "public" / "assets" / "sprites"


def load_dotenv() -> None:
    """Carga KEY=VALUE desde .env del repo si existe (sin dependencia extra)."""
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


def api(method: str, path: str, body: dict | None = None):
    token = os.environ.get("PIXELLAB_API_KEY")
    if not token:
        raise SystemExit(
            "Falta PIXELLAB_API_KEY. Crea .env (copia .env.example) o exporta la variable."
        )
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.status, json.loads(r.read().decode())


def wait_job(job_id: str, timeout: int = 300) -> dict:
    t0 = time.time()
    while time.time() - t0 < timeout:
        _, data = api("GET", f"/background-jobs/{job_id}")
        s = str(data.get("status", "")).lower()
        print(" job", job_id[:8], s)
        if s in ("completed", "complete", "succeeded", "success", "done"):
            return data
        if s in ("failed", "error"):
            raise RuntimeError(data)
        time.sleep(3)
    raise TimeoutError(job_id)


def b64_to_image(img_obj) -> Image.Image:
    if isinstance(img_obj, dict):
        b64 = img_obj.get("base64") or img_obj.get("data") or ""
    else:
        b64 = str(img_obj)
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")


def download_url(url: str, dest: Path) -> Image.Image:
    token = os.environ["PIXELLAB_API_KEY"]
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
    except urllib.error.HTTPError:
        with urllib.request.urlopen(url, timeout=60) as r:
            raw = r.read()
    dest.write_bytes(raw)
    return Image.open(io.BytesIO(raw)).convert("RGBA")


def pack_tiles(tiles: list, out_png: Path, tile_w: int = 32, cols: int = 4) -> list:
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * tile_w, rows * tile_w), (0, 0, 0, 0))
    layout = []
    for i, tile in enumerate(tiles):
        im = b64_to_image(tile.get("image") or tile.get("image_data"))
        if im.size != (tile_w, tile_w):
            im = im.resize((tile_w, tile_w), Image.NEAREST)
        x, y = (i % cols) * tile_w, (i // cols) * tile_w
        sheet.paste(im, (x, y))
        layout.append(
            {
                "local_id": i,
                "name": tile.get("name"),
                "corners": tile.get("corners"),
                "x": x,
                "y": y,
            }
        )
    sheet.save(out_png)
    print("wrote", out_png, sheet.size)
    return layout


def create_tileset(name: str, lower: str, upper: str, transition: str = "", seed: int = 1):
    body = {
        "lower_description": lower,
        "upper_description": upper,
        "transition_description": transition,
        "tile_size": {"width": 32, "height": 32},
        "mode": "standard",
        "view": "high top-down",
        "outline": "single color black outline",
        "shading": "medium shading",
        "detail": "medium detail",
        "transition_size": 0.25,
        "text_guidance_scale": 8.0,
        "seed": seed,
    }
    print(f"\n=== Tileset {name} ===")
    _, data = api("POST", "/create-tileset", body)
    tileset_id = data["tileset_id"]
    if data.get("background_job_id"):
        wait_job(data["background_job_id"])
    for _ in range(60):
        _, ts = api("GET", f"/tilesets/{tileset_id}")
        tileset = ts.get("tileset") or ts
        tiles = tileset.get("tiles") if isinstance(tileset, dict) else None
        if tiles and (tiles[0].get("image") or tiles[0].get("image_data")):
            (OUT / f"{name}.meta.json").write_text(
                json.dumps({"id": tileset_id, "request": body}, indent=2)
            )
            return tiles
        time.sleep(3)
    raise RuntimeError(tileset_id)


def create_map_object(name: str, description: str, size: int = 64, seed: int | None = None):
    body = {
        "description": description,
        "image_size": {"width": size, "height": size},
        "view": "high top-down",
        "outline": "single color outline",
        "shading": "medium shading",
        "detail": "medium detail",
        "text_guidance_scale": 8.0,
    }
    if seed is not None:
        body["seed"] = seed
    print(f"\n=== Object {name} ===")
    _, data = api("POST", "/map-objects", body)
    obj_id = data["object_id"]
    if data.get("background_job_id"):
        wait_job(data["background_job_id"])
    for _ in range(40):
        _, obj = api("GET", f"/map-objects/{obj_id}")
        url = obj.get("download_url")
        if url and obj.get("status") == "completed":
            im = download_url(url, OUT / f"obj-{name}.png")
            im.save(PUBLIC_SP / f"pixellab-{name}.png")
            (OUT / f"obj-{name}.meta.json").write_text(
                json.dumps({"id": obj_id, "request": body}, indent=2)
            )
            print("saved", name, im.size)
            return
        time.sleep(2)
    raise RuntimeError(name)


def main() -> None:
    load_dotenv()
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLIC_TS.mkdir(parents=True, exist_ok=True)
    PUBLIC_SP.mkdir(parents=True, exist_ok=True)

    dunes = create_tileset(
        "dunas-sand",
        lower="16-bit SNES Zelda A Link to the Past style golden fine sand dunes of Maspalomas Canary Islands, soft pixel clusters, warm ochre and pale gold sand, high top-down RPG floor tile",
        upper="16-bit SNES Zelda style sparse dry dune grass tufts and slightly darker packed sand path, Canary Islands desert scrub, high top-down RPG tile",
        transition="soft sand ridge between loose sand and packed path, pixel art",
        seed=1101,
    )
    pack_tiles(dunes, OUT / "dunas-sand-sheet.png")
    Image.open(OUT / "dunas-sand-sheet.png").save(PUBLIC_TS / "pixellab-dunas-32.png")

    plaza = create_tileset(
        "pueblo-plaza",
        lower="16-bit SNES Zelda style dusty earth and dirt path of a Canarian village, warm brown soil, high top-down RPG floor",
        upper="16-bit SNES Zelda style light gray cobblestone plaza tiles of a white Canarian town, clean stone pavement, high top-down RPG floor",
        transition="edge where dirt path meets cobblestone plaza, SNES pixel art",
        seed=2202,
    )
    pack_tiles(plaza, OUT / "pueblo-plaza-sheet.png")
    Image.open(OUT / "pueblo-plaza-sheet.png").save(PUBLIC_TS / "pixellab-pueblo-32.png")

    create_map_object(
        "casa-canaria",
        "16-bit SNES Zelda A Link to the Past style top-down Canarian whitewashed village house with flat roof and small wooden door and window, transparent background, game map prop 64x64",
        64,
        301,
    )
    create_map_object(
        "palmera",
        "16-bit SNES Zelda style top-down Canary Islands palm tree with green fronds and brown trunk, transparent background, map prop",
        64,
        302,
    )
    create_map_object(
        "roca-duna",
        "16-bit SNES Zelda style top-down dark volcanic rock boulder on sand, Canary Islands, transparent background, map prop",
        48,
        303,
    )
    print("\nListo. Revisa art/pixellab/ y public/assets/")


if __name__ == "__main__":
    main()
