/**
 * Límites de placa del modelo PB2002 (Peter Bird, 2003), en la conversión a
 * GeoJSON de Hugo Ahlenius / Nordpil.
 *
 * El archivo es estático y vive en `public/` en vez de pedirse a su origen en
 * cada visita: el dato no ha cambiado desde 2003, así se evita depender de un
 * tercero en caliente y de su CORS. Aun así **no entra en el bundle**: se pide
 * la primera vez que alguien enciende la capa, y quien no la use no descarga
 * sus 164 KB.
 */

const SOURCE = '/placas-tectonicas.geojson'

// Se guarda la promesa y no el resultado: si el usuario enciende y apaga la
// capa rápido, los montajes comparten una sola descarga en lugar de lanzar una
// por cada uno.
let pending = null

export const clearPlatesCache = () => {
  pending = null
}

const request = async () => {
  const res = await fetch(SOURCE)

  if (!res.ok) {
    throw new Error(`Placas ${res.status}`)
  }

  const data = await res.json()

  if (data?.type !== 'FeatureCollection' || !data.features?.length) {
    throw new Error('Placas: GeoJSON inesperado')
  }

  return data
}

/**
 * Deliberadamente **sin `AbortController`**, al revés que el fetch del detalle
 * de un sismo. Aquí la descarga se comparte entre todos los montajes de la
 * capa y su resultado se cachea para siempre; abortarla porque un montaje se
 * desmonte dejaría la promesa cacheada rechazada para todos los demás. Quien
 * llama descarta el resultado tardío con una bandera, que es lo único que hace
 * falta.
 */
const fetchTectonicPlates = () => {
  if (!pending) {
    pending = request().catch((error) => {
      // Sin esto, un fallo de red dejaría la capa rota para siempre: la
      // promesa rechazada se serviría en cada reintento.
      pending = null

      throw error
    })
  }

  return pending
}

export default fetchTectonicPlates
