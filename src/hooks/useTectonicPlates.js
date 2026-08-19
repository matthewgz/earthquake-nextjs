'use client'

import { useEffect, useRef, useState } from 'react'

import fetchTectonicPlates from 'utils/fetchTectonicPlates'

const initialState = { status: 'idle', data: null }

/**
 * Carga los límites de placa la primera vez que se enciende la capa.
 *
 * A diferencia de `useEarthquakeDetail`, **los datos se conservan al apagar la
 * capa**. Son siempre los mismos 164 KB y no dependen de ninguna selección, así
 * que volver a encenderla debe ser instantáneo en vez de vaciar el estado y
 * repintar desde cero. De ahí el ref: sirve de guarda sin meter el estado en
 * las dependencias del efecto, que es lo que convertiría un error de red en un
 * bucle de reintentos (fallo → cambia el estado → se re-ejecuta el efecto →
 * vuelve a fallar). Con `enabled` como única dependencia, el reintento es un
 * gesto explícito del usuario: apagar y encender.
 *
 * Tampoco hay `AbortController`: la descarga la comparte y cachea
 * `fetchTectonicPlates`, y abortarla al desmontar rompería la caché para los
 * demás. Basta con descartar el resultado tardío.
 */
const useTectonicPlates = (enabled) => {
  const [state, setState] = useState(initialState)
  const loaded = useRef(false)

  useEffect(() => {
    if (!enabled || loaded.current) {
      return
    }

    let cancelled = false

    setState({ status: 'loading', data: null })

    fetchTectonicPlates()
      .then((data) => {
        // La marca se pone junto al estado, no antes: si la carga se descartó
        // por apagar la capa a media descarga, marcarla como cargada dejaría el
        // estado congelado en «cargando» al volver a encenderla.
        if (!cancelled) {
          loaded.current = true
          setState({ status: 'success', data })
        }
      })
      .catch(() => {
        // Un fallo aquí no merece pantalla de error: es una capa de contexto y
        // el mapa sigue siendo útil sin ella. El interruptor lo indica.
        if (!cancelled) {
          setState({ status: 'error', data: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}

export default useTectonicPlates
