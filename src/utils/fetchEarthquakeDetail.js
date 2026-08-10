/**
 * Detalle de un sismo concreto.
 *
 * El feed principal solo trae un resumen. Los productos derivados (ShakeMap,
 * «Did You Feel It?», tensor de momento) viven en un endpoint aparte que exige
 * **una petición por evento**, así que solo se pide cuando el usuario abre un
 * sismo, nunca para la lista completa.
 *
 * Los archivos de producto están en otro path de USGS pero tienen
 * `access-control-allow-origin: *` (verificado), así que se pueden pedir
 * directamente desde el navegador.
 */

import { getDetailUrl } from './usgsApi.js'

const CACHE_LIMIT = 30
const cache = new Map()

const readCache = (id) => {
  if (!cache.has(id)) {
    return undefined
  }

  const value = cache.get(id)
  cache.delete(id)
  cache.set(id, value)

  return value
}

const writeCache = (id, value) => {
  cache.set(id, value)

  while (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value)
  }
}

export const clearDetailCache = () => cache.clear()

const readJson = async (url, signal) => {
  const res = await fetch(url, { signal })

  if (!res.ok) {
    throw new Error(`USGS ${res.status}`)
  }

  return res.json()
}

const firstProduct = (products, name) => products?.[name]?.[0] ?? null

/**
 * Duración de la ruptura, en segundos.
 *
 * OJO: es la duración de la función de fuente del tensor de momento, un valor
 * **modelado** a partir del momento sísmico (el campo hermano
 * `sourcetime-type` vale `triangle`). No es cuánto tiempo se percibió el
 * temblor: en un M7 la gente siente el movimiento bastante más que los ~33 s
 * que dura la ruptura. Por eso la UI lo etiqueta como estimación de ruptura y
 * no como «duró X segundos».
 *
 * Solo existe para eventos con tensor de momento, es decir prácticamente solo
 * a partir de magnitud 5.
 */
const getRuptureDuration = (products) => {
  const value = Number(
    firstProduct(products, 'moment-tensor')?.properties?.[
      'sourcetime-duration'
    ],
  )

  return Number.isFinite(value) && value > 0 ? value : null
}

const getContentUrl = (product, key) => product?.contents?.[key]?.url ?? null

const fetchEarthquakeDetail = async (id, { signal } = {}) => {
  const cached = readCache(id)

  if (cached) {
    return cached
  }

  const detail = await readJson(getDetailUrl(id), signal)
  const products = detail?.properties?.products ?? {}

  const shakemap = firstProduct(products, 'shakemap')
  const dyfi = firstProduct(products, 'dyfi')

  // Contornos de intensidad de ShakeMap: el «hasta dónde se sintió», modelado.
  const contourUrl = getContentUrl(shakemap, 'download/cont_mmi.json')

  const result = {
    id,
    ruptureDuration: getRuptureDuration(products),
    /** Nº de reportes ciudadanos, y la intensidad máxima que reportaron. */
    responses: Number(dyfi?.properties?.['num-responses']) || null,
    maxReportedIntensity: Number(dyfi?.properties?.maxmmi) || null,
    /** GeoJSON de líneas de isointensidad, o `null` si el evento no tiene ShakeMap. */
    intensityContours: contourUrl
      ? await readJson(contourUrl, signal).catch(() => null)
      : null,
  }

  writeCache(id, result)

  return result
}

export default fetchEarthquakeDetail
