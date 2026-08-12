# 🏝️ CanaryQuest

RPG pixel-art de las **Islas Canarias** para navegador, al estilo Zelda de
SNES / Stranger Things de Android. Recorre las 8 islas, resuelve la misión de
cada una y reúne los 8 símbolos guanches para despertar al espíritu del Teide.

Viaja entre islas en **avión de Binter** o en **ferry** (Fred Olsen /
Naviera Armas) desde el puerto o aeropuerto de cada isla.

## Jugar

```bash
npm install      # o: make install
npm run dev      # o: make up (http://localhost:5173)
```

- **Escritorio:** flechas/WASD para moverte, click para caminar hacia un
  punto, `E`/`ENTER` para interactuar, `ESPACIO` para la espada.
- **Móvil:** toca para caminar, pad virtual + botón ⚔ en pantalla.

## Publicar

`npm run build` genera un build 100 % estático en `dist/` que funciona en
cualquier hosting (GitHub Pages, itch.io, un Apache cualquiera…).
`make package` además lo empaqueta en `canaryquest.zip` listo para subir.
`make help` lista todos los atajos.

## Documentación

- `AGENTS.md` — guía rápida para colaboradores y agentes.
- `docs/arquitectura.md` — cómo está montado (escenas, sistemas, eventos).
- `docs/decisiones.md` — por qué Phaser, 32 px, mapas híbridos… (ADRs).
- `docs/como-anadir-contenido.md` — recetas: nueva misión, isla, mazmorra.
- `docs/prompts-assets.md` — prompts IA para el arte pendiente.
- `docs/creditos.md` — licencias de todos los assets.

## Estado

Vertical slice jugable: Gran Canaria completa (pueblo, misión del pastor del
Roque Nublo, combate, guardado) y las 7 islas ilustradas visitables. La
Graciosa aparecerá cuando exista su ilustración (prompt listo en docs).
