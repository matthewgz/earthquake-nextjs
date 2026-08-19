import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { getBoundaryLabel, isSubduction } from './tectonicPlates.js'

describe('getBoundaryLabel', () => {
  test('nombra las dos placas del tramo', () => {
    assert.equal(
      getBoundaryLabel({ PlateA: 'NZ', PlateB: 'SA' }),
      'Nazca – Sudamérica',
    )
  })

  test('señala los tramos de subducción', () => {
    // Son los 65 tramos donde una placa se hunde bajo otra: donde ocurren los
    // sismos profundos y los de mayor magnitud.
    assert.equal(
      getBoundaryLabel({ PlateA: 'NZ', PlateB: 'SA', Type: 'subduction' }),
      'Nazca – Sudamérica · Zona de subducción',
    )
  })

  test('un código sin traducción se muestra tal cual, no se oculta', () => {
    assert.equal(
      getBoundaryLabel({ PlateA: 'ZZ', PlateB: 'PA' }),
      'ZZ – Pacífico',
    )
  })

  test('sin placas identificadas devuelve null para omitir el tooltip', () => {
    assert.equal(getBoundaryLabel({}), null)
    assert.equal(getBoundaryLabel(null), null)
    assert.equal(getBoundaryLabel(undefined), null)
  })

  test('con una sola placa no deja la raya suelta', () => {
    assert.equal(getBoundaryLabel({ PlateA: 'CO' }), 'Cocos')
  })
})

describe('isSubduction', () => {
  test('solo el valor exacto del modelo cuenta', () => {
    assert.equal(isSubduction({ Type: 'subduction' }), true)
    assert.equal(isSubduction({ Type: '' }), false)
    assert.equal(isSubduction({}), false)
    assert.equal(isSubduction(null), false)
  })
})
