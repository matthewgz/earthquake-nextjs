import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  getAlertInfo,
  getDepth,
  getDepthLabel,
  getEventTypeLabel,
  getIntensityLabel,
} from './earthquakeInfo.js'

describe('getEventTypeLabel', () => {
  test('no etiqueta los sismos naturales', () => {
    // El 97% de los eventos son `earthquake`: etiquetarlos llenaría de ruido
    // todas las tarjetas.
    assert.equal(getEventTypeLabel('earthquake'), null)
    assert.equal(getEventTypeLabel(null), null)
    assert.equal(getEventTypeLabel(undefined), null)
  })

  test('traduce los tipos que USGS mezcla en el mismo feed', () => {
    assert.equal(getEventTypeLabel('quarry blast'), 'Voladura de cantera')
    assert.equal(getEventTypeLabel('explosion'), 'Explosión')
    assert.equal(getEventTypeLabel('landslide'), 'Deslizamiento')
    assert.equal(getEventTypeLabel('ice quake'), 'Sismo de hielo')
  })

  test('un tipo desconocido se muestra tal cual, no se oculta', () => {
    assert.equal(getEventTypeLabel('sonic boom'), 'sonic boom')
  })
})

describe('getAlertInfo', () => {
  test('cubre los cuatro niveles PAGER', () => {
    for (const level of ['green', 'yellow', 'orange', 'red']) {
      const info = getAlertInfo(level)

      assert.ok(info, `falta el nivel ${level}`)
      assert.ok(info.label)
      assert.match(info.color, /^#[0-9a-f]{6}$/i)
    }
  })

  test('devuelve null cuando no hay alerta', () => {
    // La mayoría de los sismos no la traen: 458 de 500 en una muestra real.
    assert.equal(getAlertInfo(null), null)
    assert.equal(getAlertInfo(undefined), null)
    assert.equal(getAlertInfo('purple'), null)
  })
})

describe('getIntensityLabel', () => {
  test('traduce la escala Mercalli', () => {
    assert.equal(getIntensityLabel(1), 'No sentido')
    assert.equal(getIntensityLabel(3.1), 'Débil')
    assert.equal(getIntensityLabel(4.5), 'Ligero')
    assert.equal(getIntensityLabel(7.4), 'Muy fuerte')
    assert.equal(getIntensityLabel(10), 'Extremo')
  })

  test('devuelve null si no hay dato', () => {
    assert.equal(getIntensityLabel(null), null)
    assert.equal(getIntensityLabel(undefined), null)
    assert.equal(getIntensityLabel('7.4'), null)
  })
})

describe('getDepth / getDepthLabel', () => {
  test('la profundidad es la tercera coordenada del GeoJSON', () => {
    assert.equal(
      getDepth({ geometry: { coordinates: [179.4, -33.8, 226] } }),
      226,
    )
  })

  test('devuelve null si falta o no es numérica', () => {
    assert.equal(getDepth({ geometry: { coordinates: [1, 2] } }), null)
    assert.equal(getDepth({ geometry: { coordinates: [1, 2, null] } }), null)
    assert.equal(getDepth({}), null)
    assert.equal(getDepth(undefined), null)
  })

  test('acepta profundidad 0 (sismo en superficie)', () => {
    // Un `|| null` la habría descartado por falsy.
    assert.equal(getDepth({ geometry: { coordinates: [1, 2, 0] } }), 0)
    assert.equal(getDepthLabel(0), 'superficial')
  })

  test('clasifica según los umbrales de USGS', () => {
    assert.equal(getDepthLabel(10), 'superficial')
    assert.equal(getDepthLabel(69.9), 'superficial')
    assert.equal(getDepthLabel(70), 'intermedio')
    assert.equal(getDepthLabel(226), 'intermedio')
    assert.equal(getDepthLabel(300), 'profundo')
    assert.equal(getDepthLabel(600), 'profundo')
  })
})
