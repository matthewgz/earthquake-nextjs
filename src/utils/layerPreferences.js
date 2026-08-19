/**
 * Preferencias de capas del mapa, persistidas entre visitas.
 *
 * Todo pasa por `try/catch` a propósito: Safari en navegación privada y
 * cualquier navegador con el almacenamiento bloqueado **lanzan** al tocar
 * `localStorage`, y que el usuario prefiera ver las placas no puede ser motivo
 * para tumbar el mapa entero.
 */

export const PLATES_PREFERENCE = 'sismos:placas'

export const readLayerPreference = (key, fallback = false) => {
  try {
    const stored = globalThis.localStorage?.getItem(key)

    // Se distingue «no hay nada guardado» de «guardado como false»: solo en el
    // primer caso manda el valor por defecto.
    return stored === null || stored === undefined ? fallback : stored === '1'
  } catch {
    return fallback
  }
}

export const writeLayerPreference = (key, value) => {
  try {
    globalThis.localStorage?.setItem(key, value ? '1' : '0')
  } catch {
    // Sin almacenamiento la preferencia simplemente no sobrevive a la recarga.
  }
}
