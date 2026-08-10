/**
 * Construcción de URLs para el servicio FDSN Event de USGS.
 *
 * Reemplaza al antiguo `getUrlAPI`, que concatenaba strings sin codificar y
 * enviaba los datetimes sin zona horaria (USGS los interpreta como UTC, así que
 * la ventana consultada quedaba desplazada por el offset del usuario).
 */

// Rutas relativas con extensión explícita: estos módulos son puros y se
// ejecutan también bajo `node --test`, que no conoce los alias de jsconfig.
import {
  compareISO,
  endOfLocalDayUTC,
  startOfLocalDayUTC,
} from './dateRange.js'
import { MAX_RESULTS } from './constants.js'

const DEFAULT_SERVICE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1'

/**
 * Devuelve la raíz del servicio (sin `/query` ni querystring).
 *
 * Tolera la forma antigua de la variable de entorno
 * (`.../fdsnws/event/1/query?format=geojson`) además de la canónica
 * (`.../fdsnws/event/1`), para no romper entornos ya configurados. Hace falta
 * la raíz porque además de `/query` consultamos `/count`.
 */
const getServiceUrl = () => {
  const configured = process.env.NEXT_PUBLIC_ENV_URL_API?.trim()

  if (!configured) {
    return DEFAULT_SERVICE_URL
  }

  return configured
    .split('?')[0]
    .replace(/\/(query|count)\/?$/, '')
    .replace(/\/$/, '')
}

/**
 * Serializa los filtros a un querystring estable, o `null` si son inválidos.
 *
 * Devolver `null` en vez de una URL rota es deliberado: USGS responde HTTP 200
 * con `features: []` ante un rango invertido, así que un rango inválido se
 * vería igual que "no hubo sismos". Aquí se corta antes de pedir.
 *
 * El string resultante también sirve como clave de caché y de deduplicación,
 * porque el orden de los parámetros es fijo.
 */
export const buildQuery = ({ minMagnitude, start, end }) => {
  const starttime = startOfLocalDayUTC(start)
  const endtime = endOfLocalDayUTC(end)

  if (!starttime || !endtime) {
    return null
  }

  if (compareISO(start, end) > 0) {
    return null
  }

  const magnitude = Number(minMagnitude)

  if (!Number.isFinite(magnitude) || magnitude < 0 || magnitude > 10) {
    return null
  }

  // `limit` no es opcional: sin él, un rango amplio con magnitud baja supera el
  // tope de 20.000 resultados de USGS y la API responde 400 (verificado).
  return new URLSearchParams({
    format: 'geojson',
    starttime,
    endtime,
    minmagnitude: String(magnitude),
    limit: String(MAX_RESULTS),
    orderby: 'time',
  }).toString()
}

export const getQueryUrl = (query) => `${getServiceUrl()}/query?${query}`

/**
 * `/count` devuelve el total real. Hace falta porque `metadata.count`
 * desaparece de la respuesta de `/query` en cuanto se envía `limit`
 * (verificado), y sin él no podríamos distinguir "1000 resultados" de
 * "los primeros 1000 de 10.411".
 */
export const getCountUrl = (query) => {
  const params = new URLSearchParams(query)

  // `/count` también respeta `limit`: pasárselo devuelve como mucho
  // MAX_RESULTS y anula justo el dato que veníamos a buscar (verificado:
  // 10.411 sin `limit` frente a 1.000 con él). `orderby` no aporta nada a un
  // conteo.
  params.delete('limit')
  params.delete('orderby')

  return `${getServiceUrl()}/count?${params.toString()}`
}
