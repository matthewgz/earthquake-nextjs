import React, { useContext } from 'react'

import Desktop from './index.desktop'
import Mobile from './index.mobile'
import { Context } from 'context/index'

/**
 * Las dos variantes se importan de forma estática, no con `next/dynamic`.
 *
 * El code-splitting aquí ya no compensa: ambas comparten `Controls` y solo se
 * diferencian en el contenedor que lo envuelve, así que el trozo que se
 * ahorraba era una plantilla de estilos. A cambio, cada `dynamic()` crea un
 * límite de streaming, y Next deja colgando de `<body>` un contenedor oculto
 * con la versión renderizada en el servidor: quedaban en el documento un juego
 * duplicado de selectores de fecha, magnitud y casilla.
 *
 * Además, desde que el diseño se decide con `matchMedia` en tiempo de ejecución
 * y no solo con el User-Agent, cualquiera de las dos variantes puede hacer
 * falta tras un cambio de tamaño de ventana, así que cargarlas por separado
 * tampoco ahorra nada en la práctica.
 */
const Filters = () => {
  const { isMobile } = useContext(Context)

  return isMobile ? <Mobile /> : <Desktop />
}

export default Filters
