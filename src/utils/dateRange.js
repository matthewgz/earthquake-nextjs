/**
 * Manejo de fechas del calendario LOCAL del usuario.
 *
 * Regla central: el único estado de fecha en la app es un string `YYYY-MM-DD`
 * que representa un día del calendario local. Ningún objeto `Date` entra al
 * estado, porque `new Date('2026-08-10')` se parsea como medianoche **UTC**
 * (ECMAScript trata los strings solo-fecha como UTC), y eso desplazaba un día
 * entero la consulta para cualquier usuario en una zona negativa.
 *
 * La conversión a instante absoluto ocurre en un solo lugar, justo antes de
 * armar la query, con `startOfLocalDayUTC` / `endOfLocalDayUTC`.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

const parseISODate = (iso) => {
  const match = ISO_DATE_RE.exec(typeof iso === 'string' ? iso : '')

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  // Rechaza fechas sintácticamente válidas pero inexistentes (2026-02-31,
  // 2026-13-01). El constructor de Date las "desborda" al mes siguiente en
  // silencio, así que comparamos contra lo que realmente construyó.
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

/** Formatea un `Date` como `YYYY-MM-DD` usando sus componentes LOCALES. */
export const toISODate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null
  }

  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** El día de hoy en el calendario local (no en UTC). */
export const todayISO = () => toISODate(new Date())

/**
 * Instante UTC del comienzo de ese día local.
 *
 * `new Date(year, month, day, ...)` se construye en hora local aplicando las
 * reglas de horario de verano vigentes *en esa fecha concreta*, así que
 * `toISOString()` sale correcto sin cálculo de offset manual. Esto es lo que
 * hace inviable la alternativa de armar un sufijo `-04:00` a mano:
 * `getTimezoneOffset()` devuelve el offset de HOY, que es incorrecto al cruzar
 * un cambio de horario.
 *
 * Caso borde: en un día de adelanto de hora en el que la medianoche local no
 * existe, el motor resuelve a la 01:00 local. El instante resultante sigue
 * estando al inicio real de los datos del día, así que no se pierde nada.
 */
export const startOfLocalDayUTC = (iso) => {
  const parts = parseISODate(iso)

  if (!parts) {
    return null
  }

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    0,
    0,
    0,
    0,
  ).toISOString()
}

/** Instante UTC del final de ese día local (23:59:59.999). */
export const endOfLocalDayUTC = (iso) => {
  const parts = parseISODate(iso)

  if (!parts) {
    return null
  }

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    23,
    59,
    59,
    999,
  ).toISOString()
}

/** `true` si el string es un día del calendario realmente existente. */
export const isValidISODate = (iso) => parseISODate(iso) !== null

/**
 * Compara dos fechas `YYYY-MM-DD`. El orden lexicográfico de este formato
 * coincide con el cronológico, así que no hace falta construir `Date`.
 */
export const compareISO = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** Suma (o resta) días respetando límites de mes y año. */
export const addDaysISO = (iso, days) => {
  const parts = parseISODate(iso)

  if (!parts) {
    return null
  }

  return toISODate(new Date(parts.year, parts.month - 1, parts.day + days))
}

/**
 * Normaliza un rango que puede venir de la URL, de estado persistido o de un
 * input manipulado. Nunca lanza: corrige en silencio y deja que la UI refleje
 * la corrección.
 *
 * - descarta valores no parseables y los reemplaza por hoy
 * - recorta cualquier fecha futura a hoy (USGS no tiene datos del futuro)
 * - invierte el rango si viene al revés
 */
export const sanitizeRange = (raw) => {
  const today = todayISO()

  const clamp = (value) => {
    if (!isValidISODate(value)) {
      return today
    }

    return compareISO(value, today) > 0 ? today : value
  }

  const start = clamp(raw?.start)
  const end = clamp(raw?.end)

  return compareISO(start, end) > 0
    ? { start: end, end: start }
    : { start, end }
}
