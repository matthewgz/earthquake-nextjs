'use client'

import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

import { MIN_MAGNITUDE } from '../utils/constants'
import { clampToToday, compareISO, todayISO } from '../utils/dateRange'

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

export const Provider = ({ children, isMobile: mobile }) => {
  const [showFilters, setShowFilters] = useState(false)

  const [showResults, setShowResults] = useState(false)

  const [minMagnitude, setMinMagnitude] = useState(MIN_MAGNITUDE)

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

  /**
   * Guarda únicamente lo que el usuario eligió explícitamente. Mientras no haya
   * elegido nada, el rango efectivo cae a `today`, que es `null` en el servidor
   * y el día local en el navegador.
   *
   * `start` es el inicio del rango y `end` el final. (Antes se llamaban `to` y
   * `from`, con los significados invertidos: `to` era en realidad el inicio.)
   */
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null })

  const range = useMemo(
    () => ({
      start: selectedRange.start ?? today,
      end: selectedRange.end ?? today,
    }),
    [selectedRange, today],
  )

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
