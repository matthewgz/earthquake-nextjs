import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  PLATES_PREFERENCE,
  readLayerPreference,
  writeLayerPreference,
} from './layerPreferences.js'

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

const useStorage = (storage) => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

/** Doble mínimo: solo se usan `getItem` y `setItem`. */
const fakeStorage = () => {
  const values = new Map()

  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
  }
}

/** Safari en navegación privada se comporta así. */
const throwingStorage = () => ({
  getItem: () => {
    throw new Error('storage bloqueado')
  },
  setItem: () => {
    throw new Error('storage bloqueado')
  },
})

beforeEach(() => useStorage(fakeStorage()))

afterEach(() => {
  if (original) {
    Object.defineProperty(globalThis, 'localStorage', original)
  } else {
    delete globalThis.localStorage
  }
})

describe('readLayerPreference', () => {
  test('sin nada guardado manda el valor por defecto', () => {
    assert.equal(readLayerPreference(PLATES_PREFERENCE, false), false)
    assert.equal(readLayerPreference(PLATES_PREFERENCE, true), true)
  })

  test('un false guardado gana al valor por defecto', () => {
    // El caso que importa: apagar la capa tiene que sobrevivir a la recarga
    // aunque el defecto de la app sea encenderla.
    writeLayerPreference(PLATES_PREFERENCE, false)

    assert.equal(readLayerPreference(PLATES_PREFERENCE, true), false)
  })

  test('lee lo que se escribió', () => {
    writeLayerPreference(PLATES_PREFERENCE, true)

    assert.equal(readLayerPreference(PLATES_PREFERENCE, false), true)
  })

  test('un valor corrupto se interpreta como apagado, no rompe', () => {
    globalThis.localStorage.setItem(PLATES_PREFERENCE, 'sí')

    assert.equal(readLayerPreference(PLATES_PREFERENCE, true), false)
  })
})

describe('sin almacenamiento disponible', () => {
  test('leer devuelve el valor por defecto en vez de lanzar', () => {
    useStorage(throwingStorage())

    assert.equal(readLayerPreference(PLATES_PREFERENCE, true), true)
  })

  test('escribir no lanza', () => {
    useStorage(throwingStorage())

    assert.doesNotThrow(() => writeLayerPreference(PLATES_PREFERENCE, true))
  })

  test('tampoco lanza si `localStorage` no existe', () => {
    delete globalThis.localStorage

    assert.equal(readLayerPreference(PLATES_PREFERENCE, false), false)
    assert.doesNotThrow(() => writeLayerPreference(PLATES_PREFERENCE, true))
  })
})
