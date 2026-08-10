'use client'

import { useCallback, useContext, useEffect, useReducer, useRef } from 'react'

import { Context } from 'context/index'
import { DEBOUNCE_MS, PER_PAGE } from 'utils/constants'
import { buildQuery } from 'utils/usgsApi'
import fetchEarthquakes, { ERROR_CODES } from 'utils/fetchEarthquakes'

export const STATUS = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error',
  invalidRange: 'invalid_range',
}

const getInitialState = (features, total) => ({
  status: STATUS.success,
  features,
  // `visible` se re-slicea siempre desde 0, nunca se concatena. El acumulador
  // `after` del reducer anterior era justo lo que permitía que la paginación se
  // intercalara con una petición de filtro y corrompiera la lista.
  visible: features.slice(0, PER_PAGE),
  page: 1,
  total,
  truncated: false,
  error: null,
})

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: STATUS.loading, error: null }

    case 'FETCH_SUCCESS':
      return {
        ...state,
        status: STATUS.success,
        features: action.features,
        visible: action.features.slice(0, PER_PAGE),
        page: 1,
        total: action.total,
        truncated: action.truncated,
        error: null,
      }

    case 'FETCH_ERROR':
      return { ...state, status: STATUS.error, error: action.error }

    case 'INVALID_RANGE':
      return { ...state, status: STATUS.invalidRange, error: null }

    case 'PAGE_NEXT': {
      const page = state.page + 1

      return {
        ...state,
        page,
        visible: state.features.slice(0, page * PER_PAGE),
      }
    }

    default:
      return state
  }
}

/**
 * Fuente única de datos de sismos.
 *
 * Reemplaza al reducer y los dos efectos de `ClientHome`, donde vivían los
 * bugs reportados:
 *
 * - No había AbortController, debounce ni guardia de secuencia: tres cambios
 *   rápidos de magnitud lanzaban tres peticiones solapadas y ganaba la que
 *   respondiera última, que solía ser la más antigua porque los rangos con más
 *   resultados tardan más.
 * - La acción `MORE` nunca ponía `loading: false`; solo lo limpiaba `RESET`,
 *   que estaba detrás de una comparación profunda contra los datos iniciales.
 *   Si un filtro devolvía datos iguales a los iniciales, el spinner se quedaba
 *   girando para siempre y el scroll infinito moría con él.
 */
const useEarthquakes = ({ initialData, initialQuery, initialTotal }) => {
  const { minMagnitude, range } = useContext(Context)

  const [state, dispatch] = useReducer(reducer, undefined, () =>
    getInitialState(initialData, initialTotal),
  )

  // La consulta que ya trajo el servidor. Si el navegador deriva la misma, no
  // hay nada que pedir; si difiere (zonas horarias distintas), se hace
  // exactamente una petición correctiva.
  const lastQuery = useRef(initialQuery)

  // Contador monotónico: la red de seguridad frente a `abort()`, que no es
  // síncrono respecto a una promesa ya resuelta pero aún no consumida.
  const requestId = useRef(0)

  // Se incrementa al reintentar, para forzar la re-ejecución del efecto sin
  // tocar los filtros.
  const [retryCount, retry] = useReducer((count) => count + 1, 0)

  const query = buildQuery({
    minMagnitude,
    start: range.start,
    end: range.end,
  })

  useEffect(() => {
    // `null` con rango sin inicializar (pre-hidratación) no es un error: aún no
    // hay nada que consultar.
    if (!query) {
      if (range.start && range.end) {
        dispatch({ type: 'INVALID_RANGE' })
      }

      return
    }

    if (query === lastQuery.current && retryCount === 0) {
      return
    }

    const controller = new AbortController()
    const id = ++requestId.current

    const timer = setTimeout(async () => {
      dispatch({ type: 'FETCH_START' })

      try {
        const result = await fetchEarthquakes(query, {
          signal: controller.signal,
        })

        if (id !== requestId.current) {
          return
        }

        lastQuery.current = query

        dispatch({
          type: 'FETCH_SUCCESS',
          features: result.features,
          total: result.total,
          truncated: result.truncated,
        })
      } catch (error) {
        if (error?.name === 'AbortError' || id !== requestId.current) {
          return
        }

        dispatch({
          type: 'FETCH_ERROR',
          error: { code: error?.code ?? ERROR_CODES.network },
        })
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, range.start, range.end, retryCount])

  // Estable y sin dependencias: por eso `Results` ya no necesita guardar `load`
  // en una ref, y desaparece con ello su bug de orden de efectos.
  const loadMore = useCallback(() => {
    dispatch({ type: 'PAGE_NEXT' })
  }, [])

  return {
    ...state,
    // Derivado, no almacenado: así es imposible que el estado quede diciendo
    // "hay más" cuando ya no lo hay.
    hasMore: state.visible.length < state.features.length,
    loadMore,
    retry,
  }
}

export default useEarthquakes
