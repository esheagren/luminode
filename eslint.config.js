import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const jsParserOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
}

export default [
  {
    ignores: [
      'dist',
      '.next',
      'node_modules',
      'coverage',
      'output',
      'spikes',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ...jsParserOptions,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: [
      'api/**/*.js',
      'server/**/*.js',
      'scripts/**/*.js',
      'vite.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: jsParserOptions,
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
]
