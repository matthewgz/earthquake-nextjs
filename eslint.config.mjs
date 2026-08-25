import { createRequire } from 'node:module'

import * as espree from 'espree'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const require = createRequire(import.meta.url)

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', '.yarn/**'],
  },
  ...nextCoreWebVitals,
  {
    // eslint-config-next aplica su propio parser a los .js/.jsx/.mjs, y ese
    // parser no implementa `addGlobals` en su ScopeManager, que ESLint 10 exige
    // cuando la config declara globals: el lint peta con
    // "scopeManager.addGlobals is not a function". Este proyecto es JS puro, asi
    // que todos sus ficheros pasaban por ahi. espree (el parser por defecto de
    // ESLint) los cubre igual de bien.
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: espree,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // eslint-config-next deja `react.version: 'detect'`, y la autodetección de
    // eslint-plugin-react llama a context.getFilename(), que ESLint 10 eliminó.
    // Darle la versión instalada evita esa rama.
    // Ver jsx-eslint/eslint-plugin-react#3977.
    settings: {
      react: { version: require('react/package.json').version },
    },
  },
  {
    files: ['**/*.{js,jsx,mjs}'],
    // El `files` es imprescindible: sin el, este objeto aplicaba a TODOS los
    // ficheros, incluidos aquellos para los que eslint-config-next no registra
    // react-hooks, y ESLint abortaba al cargar la config con "could not find
    // plugin react-hooks". Acotandolo, el plugin lo aporta el config de Next.
    rules: {
      // Esta regla detecta mecánicamente la clase de bug (deps faltantes en efectos)
      // que estaba detrás de la mayoría de los problemas reportados.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]

export default eslintConfig
