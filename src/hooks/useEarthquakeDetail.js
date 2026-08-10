'use client'

import { useEffect, useReducer } from 'react'

import fetchEarthquakeDetail from 'utils/fetchEarthquakeDetail'

const initialState = { status: 'idle', detail: null }

const reducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return initialState
    case 'START':
      return { status: 'loading', detail: null }
    case 'SUCCESS':
      return { status: 'success', detail: action.detail }
    case 'ERROR':
      // Un fallo aquí no merece un mensaje de error: el detalle es información
      // complementaria y la tarjeta sigue siendo útil sin él.
      return { status: 'error', detail: null }
    default:
      return state
  }
}

/**
 * Carga bajo demanda el detalle del sismo seleccionado.
 *
 * Mismo patrón de guardias que `useEarthquakes`, por el mismo motivo: abrir
 * varios sismos seguidos lanza peticiones solapadas y la más lenta podría
 * pisar a la más reciente. Aquí no hace falta debounce porque la acción es un
 * clic deliberado, no el barrido de un selector.
 */
const useEarthquakeDetail = (id) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!id) {
      dispatch({ type: 'RESET' })

      return
    }

    const controller = new AbortController()
    let cancelled = false

    dispatch({ type: 'START' })

    fetchEarthquakeDetail(id, { signal: controller.signal })
      .then((detail) => {
        if (!cancelled) {
          dispatch({ type: 'SUCCESS', detail })
        }
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          dispatch({ type: 'ERROR' })
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id])

  return state
}

export default useEarthquakeDetail
