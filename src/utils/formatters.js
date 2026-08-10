/**
 * Formateo de fechas y horas para mostrar, con `Intl` nativo.
 *
 * Sustituye a `moment`, que además de pesar ~72 KB en el bundle solo se usaba
 * para formateo de un solo paso. `Intl` da la etiqueta de zona horaria con una
 * opción, algo incómodo de conseguir con moment.
 *
 * Los formateadores se construyen una sola vez a nivel de módulo: instanciar
 * `Intl.DateTimeFormat` en cada render es caro y era el único coste real de
 * este cambio.
 */

/**
 * Español de Latinoamérica: usa 12 horas con «a.m.»/«p.m.», que es la
 * convención de la región y coincide con lo que mostraba la app. Con `es` a
 * secas, `Intl` formatea en 24 horas.
 */
const LOCALE = 'es-419'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeStyle: 'short',
})

// `shortOffset` da «GMT-5», legible para cualquiera. `short` daría «PET», que
// casi nadie reconoce.
const timeZoneFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZoneName: 'shortOffset',
})

/** `time` es epoch en milisegundos, tal como lo entrega USGS. */
export const formatEventDate = (time) => dateFormatter.format(time)

export const formatEventTime = (time) => timeFormatter.format(time)

/** ISO 8601 completo, para el atributo `datetime` de `<time>`. */
export const toDateTimeAttribute = (time) => new Date(time).toISOString()

/**
 * Etiqueta de la zona horaria del navegador, p. ej. «GMT-5».
 *
 * Se muestra una vez en la cabecera del panel de resultados para que quede
 * claro en qué zona están las horas de los sismos. USGS entrega los tiempos en
 * UTC y aquí se muestran en hora local.
 */
export const getTimeZoneLabel = () =>
  timeZoneFormatter
    .formatToParts(Date.now())
    .find((part) => part.type === 'timeZoneName')?.value ?? ''
