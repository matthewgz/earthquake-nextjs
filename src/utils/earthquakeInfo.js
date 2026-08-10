/**
 * Traducción de los códigos de USGS a texto legible.
 *
 * Vive aparte de los componentes porque lo consumen tanto la tarjeta como el
 * panel de detalle, y porque son datos, no presentación.
 */

/** Tipos de evento que USGS publica junto a los sismos naturales. */
const EVENT_TYPE_LABELS = {
  earthquake: null, // el caso normal: no hace falta etiquetarlo
  'quarry blast': 'Voladura de cantera',
  quarry_blast: 'Voladura de cantera',
  explosion: 'Explosión',
  'mining explosion': 'Explosión minera',
  'nuclear explosion': 'Explosión nuclear',
  landslide: 'Deslizamiento',
  'ice quake': 'Sismo de hielo',
  'rock burst': 'Estallido de roca',
  'volcanic eruption': 'Erupción volcánica',
  'other event': 'Otro evento',
}

/**
 * Devuelve una etiqueta solo cuando el evento NO es un sismo natural. Así la
 * tarjeta no se llena de ruido en el 97% de los casos, pero una voladura de
 * cantera deja de presentarse como si fuera un terremoto.
 */
export const getEventTypeLabel = (type) => {
  if (!type || type === 'earthquake') {
    return null
  }

  return EVENT_TYPE_LABELS[type] ?? type
}

/**
 * Niveles de alerta PAGER, la estimación de USGS del impacto esperado en
 * víctimas y pérdidas económicas.
 */
const ALERT_LEVELS = {
  green: { label: 'Sin víctimas probables', color: '#2e7d32' },
  yellow: { label: 'Impacto local', color: '#c8a415' },
  orange: { label: 'Impacto regional', color: '#d97706' },
  red: { label: 'Impacto grave', color: '#c62828' },
}

export const getAlertInfo = (alert) => ALERT_LEVELS[alert] ?? null

/**
 * Descripción de la escala Mercalli modificada, que es lo que miden `cdi`
 * (percibida por personas) y `mmi` (medida por instrumentos).
 */
/**
 * Paleta oficial de ShakeMap para la escala Mercalli. Se mantiene idéntica a la
 * de USGS a propósito: cualquiera que haya visto uno de sus mapas reconoce los
 * colores, y reinventarlos solo añadiría confusión.
 */
export const INTENSITY_SCALE = [
  { max: 2, color: '#bfccff', roman: 'I' },
  { max: 3, color: '#a0e6ff', roman: 'II–III' },
  { max: 4, color: '#80ffff', roman: 'IV' },
  { max: 5, color: '#7aff93', roman: 'V' },
  { max: 6, color: '#ffff00', roman: 'VI' },
  { max: 7, color: '#ffc800', roman: 'VII' },
  { max: 8, color: '#ff9100', roman: 'VIII' },
  { max: 9, color: '#ff0000', roman: 'IX' },
  { max: Infinity, color: '#c80000', roman: 'X+' },
]

export const getIntensityColor = (intensity) =>
  INTENSITY_SCALE.find((step) => intensity < step.max)?.color ?? '#c80000'

export const getIntensityLabel = (intensity) => {
  if (!Number.isFinite(intensity)) {
    return null
  }

  if (intensity < 2) return 'No sentido'
  if (intensity < 4) return 'Débil'
  if (intensity < 5) return 'Ligero'
  if (intensity < 6) return 'Moderado'
  if (intensity < 7) return 'Fuerte'
  if (intensity < 8) return 'Muy fuerte'
  if (intensity < 9) return 'Severo'
  if (intensity < 10) return 'Violento'

  return 'Extremo'
}

/**
 * Clasificación estándar de USGS por profundidad. Importa porque, a igual
 * magnitud, un sismo superficial se siente mucho más que uno profundo.
 */
export const getDepthLabel = (depthKm) => {
  if (!Number.isFinite(depthKm)) {
    return null
  }

  if (depthKm < 70) return 'superficial'
  if (depthKm < 300) return 'intermedio'

  return 'profundo'
}

/** Profundidad en km a partir de la geometría GeoJSON. */
export const getDepth = (feature) => {
  const depth = feature?.geometry?.coordinates?.[2]

  return Number.isFinite(depth) ? depth : null
}
