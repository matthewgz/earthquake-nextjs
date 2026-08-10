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

  /**
   * Nunca devuelve el detalle de un sismo distinto al pedido.
   *
   * El id cambia en cuanto se pulsa otro sismo, pero el estado del reducer se
   * actualiza después, en un efecto. Sin esta comprobación existe un render
   * intermedio en el que se pinta el sismo nuevo con el detalle del anterior, y
   * eso bastaba para dejar el mapa con las capas equivocadas: `GeoJSON` de
   * react-leaflet crea su capa al montarse y **no la rehace cuando cambia
   * `data`**, así que la capa nacía con los datos viejos y se quedaba así.
   *
   * Solo se notaba con la caché caliente —es decir, al volver a un sismo ya
   * visto—: con la caché fría el estado pasa por `detail: null` entre medias,
   * la capa se desmonta y al remontarse toma los datos correctos por casualidad.
   */
  const detail = state.detail?.id === id ? state.detail : null

  return { ...state, detail }
}

export default useEarthquakeDetail
