import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { juego: 'index.html' } }, chunkSizeWarningLimit: 1600 },
  // Las copias de trabajo de los agentes (.claude/worktrees) no son parte del proyecto.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
  server: { watch: { ignored: ['**/.claude/**'] } },
});
