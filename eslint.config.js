import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'art/**', 'public/**', 'canaryquest.zip'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Phaser y escenas usan _time / _delta como firmas de update.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // El código de juego mezcla optional chaining con aserciones de Phaser.
      '@typescript-eslint/no-explicit-any': 'off',
      // Preferir const cuando no se reasigna.
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
