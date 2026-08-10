'use client'

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

import { MIN_MAGNITUDE } from '../utils/constants'
import {
  clampToToday,
  compareISO,
  sanitizeRange,
  todayISO,
} from '../utils/dateRange'
import {
  EMPTY_FILTERS,
  buildFilterSearch,
  parseFilterParams,
} from '../utils/filterParams'

export const Context = createContext(null)

// El día local no cambia mientras la pestaña está abierta (salvo a medianoche,
// que no vale la pena vigilar), así que no hay nada a lo que suscribirse.
const subscribe = () => () => {}

const getTodaySnapshot = () => todayISO()

// En el servidor no existe la zona horaria del navegador: devolver `null` hace
// que el marcado inicial sea idéntico en ambos lados y evita el desajuste de
// hidratación, sin recurrir a un setState dentro de un efecto.
const getTodayServerSnapshot = () => null

/**
 * Ancho por debajo del cual se usa el diseño móvil. Coincide con el punto en
 * que los tres filtros dejan de caber en la barra superior.
 */
const MOBILE_QUERY = '(max-width: 767px)'

const subscribeToViewport = (onChange) => {
  const list = window.matchMedia(MOBILE_QUERY)

  list.addEventListener('change', onChange)

  return () => list.removeEventListener('change', onChange)
}

const getIsMobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches

/**
 * Filtros leídos de la URL.
 *
 * Se usa `window.location` y no `useSearchParams` a propósito: ese hook obliga
 * a envolver el consumidor en `<Suspense>` y hace que la ruta se resuelva en
 * cliente, cuando aquí el componente de servidor no depende para nada de los
 * parámetros.
 *
 * `getSnapshot` tiene que devolver siempre la misma referencia mientras el
 * querystring no cambie; si construyera un objeto nuevo en cada llamada,
 * `useSyncExternalStore` entraría en un bucle de renders.
 */
let cachedSearch = null
let cachedFilters = EMPTY_FILTERS

const getUrlFiltersSnapshot = () => {
  const { search } = window.location

  if (search !== cachedSearch) {
    cachedSearch = search
    cachedFilters = parseFilterParams(search)
  }

  return cachedFilters
}

const getUrlFiltersServerSnapshot = () => EMPTY_FILTERS

const subscribeToHistory = (onChange) => {
  window.addEventListener('popstate', onChange)

  return () => window.removeEventListener('popstate', onChange)
}

export const Provider = ({ children, isMobile: mobile }) => {
  const [showFilters, setShowFilters] = useState(false)

  const [showResults, setShowResults] = useState(false)

  /**
   * Como con el rango: el estado guarda solo lo que el usuario eligió de forma
   * explícita, y mientras tanto se cae a la URL y luego al valor por defecto.
   * Así no hace falta sincronizar nada con un efecto.
   */
  const [selectedMagnitude, setMinMagnitude] = useState(null)

  const [marker, setMarker] = useState({
    id: null,
    position: null,
    zoom: 4,
  })

  /**
   * El User-Agent detectado en el servidor sirve de pista para el primer
   * render (evita el salto de layout), pero a partir de la hidratación manda el
   * ancho real de la ventana.
   *
   * Antes el valor se congelaba en `useState`: nunca reaccionaba a un cambio de
   * tamaño ni de orientación, y las tablets caían siempre en el diseño de
   * escritorio porque UAParser no las clasifica como `mobile`.
   */
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    getIsMobileSnapshot,
    () => mobile,
  )

  const today = useSyncExternalStore(
    subscribe,
    getTodaySnapshot,
    getTodayServerSnapshot,
  )

  const urlFilters = useSyncExternalStore(
    subscribeToHistory,
    getUrlFiltersSnapshot,
    getUrlFiltersServerSnapshot,
  )

  const minMagnitude =
    selectedMagnitude ?? urlFilters.minMagnitude ?? MIN_MAGNITUDE

  /**
   * Guarda únicamente lo que el usuario eligió explícitamente. Mientras no haya
   * elegido nada, el rango efectivo cae a `today`, que es `null` en el servidor
   * y el día local en el navegador.
   *
   * `start` es el inicio del rango y `end` el final. (Antes se llamaban `to` y
   * `from`, con los significados invertidos: `to` era en realidad el inicio.)
   */
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null })

  const range = useMemo(() => {
    const start = selectedRange.start ?? urlFilters.start ?? today
    const end = selectedRange.end ?? urlFilters.end ?? today

    // Sin fechas todavía (primer render en servidor) no hay nada que sanear.
    if (!start || !end) {
      return { start, end }
    }

    // La URL puede venir manipulada o con un rango invertido; se normaliza en
    // silencio en lugar de propagar un estado imposible.
    return sanitizeRange({ start, end })
  }, [selectedRange, urlFilters, today])

  /**
   * Al mover un extremo por encima del otro, arrastra el otro con él en lugar
   * de rechazar la selección en silencio. Es lo que se espera de un selector de
   * rango y garantiza que siempre se cumpla `start <= end`.
   */
  const setRangeStart = useCallback((value) => {
    setSelectedRange((prev) => {
      const start = clampToToday(value)
      const currentEnd = prev.end ?? todayISO()

      return {
        start,
        end: compareISO(start, currentEnd) > 0 ? start : currentEnd,
      }
    })
  }, [])

  const setRangeEnd = useCallback((value) => {
    setSelectedRange((prev) => {
      const end = clampToToday(value)
      const currentStart = prev.start ?? todayISO()

      return {
        start: compareISO(end, currentStart) < 0 ? end : currentStart,
        end,
      }
    })
  }, [])

  /**
   * Refleja los filtros en la URL para que la vista sea compartible y sobreviva
   * a un refresco.
   *
   * Se usa `replaceState` en lugar de `router.push`: cada paso intermedio de
   * una interacción rápida se convertiría en una entrada de historial, y además
   * el componente de servidor no depende de estos parámetros, así que una
   * navegación de Next solo provocaría una ida y vuelta inútil.
   */
  useEffect(() => {
    if (!range.start || !range.end) {
      return
    }

    const search = buildFilterSearch({ minMagnitude, ...range })

    if (search !== window.location.search) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${search}`,
      )
    }
  }, [minMagnitude, range])

  /**
   * Sin memoizar, `value` era un objeto nuevo en cada render y hacía que TODOS
   * los consumidores se re-renderizaran ante cualquier cambio de estado,
   * incluidos los cientos de markers del mapa al abrir el panel de filtros.
   */
  const value = useMemo(
    () => ({
      showFilters,
      showResults,
      minMagnitude,
      range,
      today,
      isMobile,
      marker,
      setShowFilters,
      setShowResults,
      setMinMagnitude,
      setRangeStart,
      setRangeEnd,
      setMarker,
    }),
    [
      showFilters,
      showResults,
      minMagnitude,
      range,
      today,
      isMobile,
      marker,
      setRangeStart,
      setRangeEnd,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export default Context
