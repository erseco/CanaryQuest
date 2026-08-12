# CanaryQuest — atajos de desarrollo
.PHONY: help install up dev test build package preview clean

help:
	@echo "make up / make dev  - servidor de desarrollo (Vite)"
	@echo "make test           - tests unitarios (Vitest)"
	@echo "make build          - type-check + build estático en dist/"
	@echo "make package        - build + canaryquest.zip listo para subir a una web"
	@echo "make preview        - servir el build de producción"
	@echo "make install        - instalar dependencias"
	@echo "make clean          - borrar dist/ y el zip"

install:
	npm install

up: dev

dev:
	npm run dev

test:
	npm test

build:
	npm run build

package: build
	rm -f canaryquest.zip
	cd dist && zip -qr ../canaryquest.zip .
	@echo "✔ canaryquest.zip creado ($$(du -h canaryquest.zip | cut -f1)) — sube su contenido a cualquier hosting o itch.io"

preview:
	npm run preview

clean:
	rm -rf dist canaryquest.zip
