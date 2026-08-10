export const MIN_MAGNITUDE = 5

export const PER_PAGE = 10

/**
 * Tope de resultados por consulta. USGS rechaza con HTTP 400 cualquier consulta
 * que supere los 20.000 resultados, y renderizar siquiera unos miles de markers
 * de Leaflet congela el navegador. Con este límite el 400 es inalcanzable y el
 * mapa se mantiene fluido; cuando hay más resultados se avisa en la UI.
 */
export const MAX_RESULTS = 1000

/**
 * Espera antes de disparar la petición tras cambiar un filtro. Evita emitir una
 * request por cada paso intermedio cuando se recorre el selector rápido.
 */
export const DEBOUNCE_MS = 300

export const MAGNITUDE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// TODO(fase 4): se elimina al reemplazar el reducer de ClientHome por useEarthquakes.
export const TYPES = {
  start: 'START',
  loaded: 'LOADED',
  more: 'MORE',
  reset: 'RESET',
}
