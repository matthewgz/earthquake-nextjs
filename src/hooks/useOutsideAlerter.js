import { useEffect, useRef } from 'react'

/**
 * Cierra un panel al hacer clic fuera o al pulsar Escape.
 *
 * `callback` se guarda en una ref en lugar de ir en las dependencias: así el
 * listener no se vuelve a suscribir en cada render y, a la vez, siempre se
 * invoca la versión actual. (Antes `callback` simplemente faltaba en las
 * dependencias, y solo funcionaba por casualidad porque todos los llamadores
 * pasaban un `setState`, que React garantiza estable.)
 */
const useOutsideAlerter = (ref, callback) => {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callbackRef.current(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        callbackRef.current(false)
      }
    }

    // `pointerdown` en lugar de `mousedown`: cubre también táctil, donde antes
    // el cierre al tocar fuera no funcionaba.
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [ref])
}

export default useOutsideAlerter
