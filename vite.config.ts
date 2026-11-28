import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { juego: 'index.html' } }, chunkSizeWarningLimit: 1600 },
  // Las copias de trabajo de los agentes (.claude/worktrees) no son parte del proyecto.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
  // Solo la carpeta .claude de esta copia: un servidor arrancado dentro de una de ellas sí vigila sus ficheros.
  server: { watch: { ignored: [fileURLToPath(new URL('./.claude/**', import.meta.url))] } },
});
