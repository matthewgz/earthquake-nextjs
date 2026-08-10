import { getCountUrl, getQueryUrl } from './usgsApi.js'
import { MAX_RESULTS } from './constants.js'

/**
 * Códigos de error normalizados. La UI los traduce a mensajes; aquí no se
 * guarda texto para usuario.
 */
export const ERROR_CODES = {
  badRequest: 'bad_request',
  tooMany: 'too_many',
  network: 'network',
}

export class EarthquakeApiError extends Error {
  constructor(code, detail) {
    super(`USGS: ${code}`)
    this.name = 'EarthquakeApiError'
    this.code = code
    this.detail = detail
  }
}

/**
 * Reduce una feature de GeoJSON a lo que la app realmente usa.
 *
 * Una consulta amplia devuelve ~719 KB de JSON con decenas de campos por
 * evento (`ids`, `sources`, `types`, `dmin`, `rms`, `gap`…). Sin proyectar,
 * React y Leaflet arrastran esos objetos completos por cada marker.
 */
const projectFeature = (feature) => {
  const source = feature.properties ?? {}

  return {
    id: feature.id,
    properties: {
      place: source.place ?? 'Ubicación desconocida',
      mag: source.mag ?? null,
      time: source.time ?? null,
      url: source.url ?? null,

      // Todo lo de aquí abajo ya venía en la respuesta y se estaba tirando.
      // Mostrarlo no cuesta ninguna petición adicional.

      /** Cuántas personas reportaron haberlo sentido (programa «Did You Feel It?»). */
      felt: source.felt ?? null,
      /** Intensidad percibida por la gente, 0–10. */
      cdi: source.cdi ?? null,
      /** Intensidad medida por instrumentos, 0–10. */
      mmi: source.mmi ?? null,
      /** Alerta PAGER de víctimas y daños: green | yellow | orange | red. */
      alert: source.alert ?? null,
      /** 1 si hubo aviso de tsunami asociado. */
      tsunami: source.tsunami ?? 0,
      /** Significancia 0–1000; combina magnitud, alcance y reportes. */
      sig: source.sig ?? null,
      /** Escala usada para la magnitud (mb, mww, ml…). */
      magType: source.magType ?? null,
      /** earthquake, quarry blast, explosion, landslide, ice quake… */
      type: source.type ?? 'earthquake',
      /** `reviewed` si lo validó un sismólogo; `automatic` si no. */
      status: source.status ?? null,
    },
    geometry: {
      // [longitud, latitud, profundidad en km]
      coordinates: [
        feature.geometry?.coordinates?.[0],
        feature.geometry?.coordinates?.[1],
        feature.geometry?.coordinates?.[2] ?? null,
      ],
    },
  }
}

export const projectFeatures = (features) =>
  (Array.isArray(features) ? features : [])
    // Sin coordenadas no se puede pintar el marker y Leaflet lanzaría al
    // recibir NaN.
    .filter(
      (feature) =>
        Number.isFinite(feature?.geometry?.coordinates?.[0]) &&
        Number.isFinite(feature?.geometry?.coordinates?.[1]),
    )
    .map(projectFeature)

/**
 * Lee la respuesta comprobando el `content-type` antes de parsear.
 *
 * USGS responde a los parámetros inválidos con **HTTP 400 y cuerpo
 * `text/plain`** (verificado). Llamar a `res.json()` a ciegas —como hacía el
 * código anterior— lanza un SyntaxError que quedaba como unhandled rejection y
 * dejaba el spinner girando indefinidamente.
 */
const readBody = async (res) => {
  const contentType = res.headers.get('content-type') ?? ''

  if (!contentType.includes('json')) {
    return { json: null, text: await res.text() }
  }

  try {
    return { json: await res.json(), text: null }
  } catch {
    return { json: null, text: null }
  }
}

/**
 * Caché en memoria por sesión, con tope LRU.
 *
 * Sustituye a la caché compartida que daría un proxy en servidor. Cubre el
 * patrón real de uso —volver a un filtro ya consultado— sin tocar la red.
 */
const CACHE_LIMIT = 20
const cache = new Map()

const readCache = (key) => {
  if (!cache.has(key)) {
    return undefined
  }

  // Reinsertar mueve la entrada al final: la primera del Map es la más antigua.
  const value = cache.get(key)
  cache.delete(key)
  cache.set(key, value)

  return value
}

const writeCache = (key, value) => {
  cache.set(key, value)

  while (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value)
  }
}

export const clearCache = () => cache.clear()

/**
 * Trae los sismos de una consulta ya construida.
 *
 * `/query` y `/count` van en paralelo: `/count` es barato y nunca lanza (aun
 * por encima del máximo responde 200 con el error como campo JSON), y hace
 * falta porque `metadata.count` desaparece de `/query` en cuanto se envía
 * `limit`.
 */
const fetchEarthquakes = async (query, { signal } = {}) => {
  const cached = readCache(query)

  if (cached) {
    return cached
  }

  let queryRes
  let countRes

  try {
    ;[queryRes, countRes] = await Promise.all([
      fetch(getQueryUrl(query), { signal }),
      fetch(getCountUrl(query), { signal }).catch(() => null),
    ])
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    throw new EarthquakeApiError(ERROR_CODES.network, error?.message)
  }

  if (!queryRes.ok) {
    const { json, text } = await readBody(queryRes)

    throw new EarthquakeApiError(
      queryRes.status >= 500 ? ERROR_CODES.network : ERROR_CODES.badRequest,
      json ?? text,
    )
  }

  const { json } = await readBody(queryRes)

  if (!json) {
    throw new EarthquakeApiError(ERROR_CODES.network, 'respuesta ilegible')
  }

  const features = projectFeatures(json.features)

  // `/count` es best-effort: si falla, se cae al número de features traídas.
  let total = features.length

  if (countRes?.ok) {
    const { json: countJson } = await readBody(countRes)

    if (countJson?.error) {
      throw new EarthquakeApiError(ERROR_CODES.tooMany, countJson.error)
    }

    if (Number.isFinite(countJson?.count)) {
      total = countJson.count
    }
  }

  const result = {
    features,
    total,
    truncated: features.length >= MAX_RESULTS && total > features.length,
  }

  writeCache(query, result)

  return result
}

export default fetchEarthquakes
