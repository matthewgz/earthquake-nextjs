import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Esta regla detecta mecánicamente la clase de bug (deps faltantes en efectos)
      // que estaba detrás de la mayoría de los problemas reportados.
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]

export default eslintConfig
