import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['tests/__data__/']
  },

  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  prettier,

  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic': stylistic
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-case-declarations': 'off',
      '@stylistic/linebreak-style': ['error', 'windows'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never']
    }
  }
]
