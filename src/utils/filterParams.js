import { isValidISODate } from './dateRange.js'
import { MAGNITUDE_OPTIONS } from './constants.js'

/**
 * Nombres de los parámetros de la URL. En español para que el enlace se lea
 * bien: `?mag=5&desde=2026-08-01&hasta=2026-08-10`.
 */
export const PARAM_KEYS = {
  magnitude: 'mag',
  start: 'desde',
  end: 'hasta',
  onlyEarthquakes: 'solosismos',
}

export const EMPTY_FILTERS = Object.freeze({
  minMagnitude: null,
  start: null,
  end: null,
  onlyEarthquakes: null,
})

/**
 * Lee los filtros de un querystring. Todo lo que no sea válido se descarta en
 * silencio y se cae al valor por defecto: una URL manipulada no debe romper la
 * app ni mostrar un error.
 */
export const parseFilterParams = (search) => {
  const params = new URLSearchParams(search ?? '')

  // Se exige un valor no vacío antes de convertir: `Number('')` es 0, que es
  // una magnitud perfectamente válida, así que `?mag=` se habría interpretado
  // como «magnitud 0» en lugar de como parámetro ausente.
  const rawMagnitude = params.get(PARAM_KEYS.magnitude)?.trim()
  const magnitude = Number(rawMagnitude)

  const start = params.get(PARAM_KEYS.start)
  const end = params.get(PARAM_KEYS.end)

  // Solo `1`/`0` explícitos cuentan; cualquier otra cosa se trata como ausente
  // para que el valor por defecto de la app siga mandando.
  const rawOnlyEarthquakes = params.get(PARAM_KEYS.onlyEarthquakes)

  return {
    minMagnitude:
      rawMagnitude && MAGNITUDE_OPTIONS.includes(magnitude) ? magnitude : null,
    start: isValidISODate(start) ? start : null,
    end: isValidISODate(end) ? end : null,
    onlyEarthquakes:
      rawOnlyEarthquakes === '1'
        ? true
        : rawOnlyEarthquakes === '0'
          ? false
          : null,
  }
}

/** Serializa los filtros al querystring, con orden fijo para poder comparar. */
export const buildFilterSearch = ({
  minMagnitude,
  start,
  end,
  onlyEarthquakes,
}) => {
  const params = new URLSearchParams()

  params.set(PARAM_KEYS.magnitude, String(minMagnitude))
  params.set(PARAM_KEYS.start, start)
  params.set(PARAM_KEYS.end, end)
  params.set(PARAM_KEYS.onlyEarthquakes, onlyEarthquakes ? '1' : '0')

  return `?${params.toString()}`
}
