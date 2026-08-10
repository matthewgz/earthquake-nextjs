import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { buildQuery, getCountUrl, getQueryUrl } from './usgsApi.js'

const originalTZ = process.env.TZ

const withTZ = (tz, fn) => {
  process.env.TZ = tz
  try {
    fn()
  } finally {
    process.env.TZ = originalTZ
  }
}

const params = (query) => Object.fromEntries(new URLSearchParams(query))

describe('buildQuery', () => {
  test('envía instantes con zona explícita, derivados del día local', () => {
    // El bug original: se enviaba `starttime=2026-08-10T00:00:00` sin zona,
    // y USGS lo lee como UTC aunque se hubiera armado desde hora local.
    withTZ('America/Caracas', () => {
      const result = params(
        buildQuery({ minMagnitude: 5, start: '2026-08-10', end: '2026-08-10' }),
      )

      assert.equal(result.starttime, '2026-08-10T04:00:00.000Z')
      assert.equal(result.endtime, '2026-08-11T03:59:59.999Z')
    })
  })

  test('la misma fecha produce instantes distintos en zonas distintas', () => {
    const enCaracas = params(
      (() => {
        let q
        withTZ('America/Caracas', () => {
          q = buildQuery({
            minMagnitude: 5,
            start: '2026-08-10',
            end: '2026-08-10',
          })
        })
        return q
      })(),
    )

    const enTokio = params(
      (() => {
        let q
        withTZ('Asia/Tokyo', () => {
          q = buildQuery({
            minMagnitude: 5,
            start: '2026-08-10',
            end: '2026-08-10',
          })
        })
        return q
      })(),
    )

    assert.notEqual(enCaracas.starttime, enTokio.starttime)
    assert.equal(enTokio.starttime, '2026-08-09T15:00:00.000Z')
  })

  test('incluye siempre limit y orderby', () => {
    const result = params(
      buildQuery({ minMagnitude: 0, start: '2020-01-01', end: '2026-08-10' }),
    )

    // Sin `limit` esta misma consulta devuelve HTTP 400 por exceder el tope de
    // 20.000 resultados de USGS.
    assert.equal(result.limit, '1000')
    assert.equal(result.orderby, 'time')
    assert.equal(result.format, 'geojson')
  })

  test('añade eventtype solo cuando se piden únicamente sismos naturales', () => {
    const base = { minMagnitude: 5, start: '2026-08-10', end: '2026-08-10' }

    assert.equal(
      params(buildQuery({ ...base, onlyEarthquakes: true })).eventtype,
      'earthquake',
    )
    assert.equal(
      params(buildQuery({ ...base, onlyEarthquakes: false })).eventtype,
      undefined,
    )
    assert.equal(params(buildQuery(base)).eventtype, undefined)
  })

  test('acepta magnitud 0 (es un valor válido, no ausencia de filtro)', () => {
    const result = params(
      buildQuery({ minMagnitude: 0, start: '2026-08-10', end: '2026-08-10' }),
    )

    assert.equal(result.minmagnitude, '0')
  })

  test('devuelve null ante un rango invertido', () => {
    // USGS responde 200 con features vacío ante esto, indistinguible de
    // "no hubo sismos". Se corta antes de pedir.
    assert.equal(
      buildQuery({ minMagnitude: 5, start: '2026-08-11', end: '2026-08-10' }),
      null,
    )
  })

  test('devuelve null ante fechas o magnitudes inválidas', () => {
    const base = { minMagnitude: 5, start: '2026-08-10', end: '2026-08-10' }

    assert.equal(buildQuery({ ...base, start: 'ayer' }), null)
    assert.equal(buildQuery({ ...base, end: null }), null)
    assert.equal(buildQuery({ ...base, start: '2026-02-31' }), null)
    assert.equal(buildQuery({ ...base, minMagnitude: 'abc' }), null)
    assert.equal(buildQuery({ ...base, minMagnitude: -1 }), null)
    assert.equal(buildQuery({ ...base, minMagnitude: 99 }), null)
    assert.equal(buildQuery({ ...base, minMagnitude: undefined }), null)
  })

  test('es estable: los mismos filtros producen la misma clave', () => {
    const a = buildQuery({
      minMagnitude: 5,
      start: '2026-08-01',
      end: '2026-08-10',
    })
    const b = buildQuery({
      minMagnitude: 5,
      start: '2026-08-01',
      end: '2026-08-10',
    })

    assert.equal(a, b)
  })
})

describe('getQueryUrl / getCountUrl', () => {
  const query = buildQuery({
    minMagnitude: 5,
    start: '2026-08-10',
    end: '2026-08-10',
  })

  test('apuntan al mismo servicio con distinto endpoint', () => {
    assert.match(getQueryUrl(query), /\/fdsnws\/event\/1\/query\?/)
    assert.match(getCountUrl(query), /\/fdsnws\/event\/1\/count\?/)
  })

  test('la URL de /count no lleva limit ni orderby', () => {
    // `/count` respeta `limit`: con `limit=1000` devuelve 1000 en vez del total
    // real (verificado contra la API: 10.411 sin él). Mandárselo anularía el
    // único motivo por el que consultamos este endpoint.
    const countParams = new URLSearchParams(new URL(getCountUrl(query)).search)

    assert.equal(countParams.get('limit'), null)
    assert.equal(countParams.get('orderby'), null)
    // Los filtros que definen el conjunto sí tienen que seguir ahí.
    assert.equal(countParams.get('minmagnitude'), '5')
    assert.ok(countParams.get('starttime'))
    assert.ok(countParams.get('endtime'))
  })

  test('la URL de /query sí conserva limit', () => {
    const queryParams = new URLSearchParams(new URL(getQueryUrl(query)).search)

    assert.equal(queryParams.get('limit'), '1000')
  })

  test('tolera la forma antigua de la variable de entorno', () => {
    const original = process.env.NEXT_PUBLIC_ENV_URL_API

    try {
      process.env.NEXT_PUBLIC_ENV_URL_API =
        'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson'

      assert.equal(
        getQueryUrl('a=1'),
        'https://earthquake.usgs.gov/fdsnws/event/1/query?a=1',
      )
      assert.equal(
        getCountUrl('a=1'),
        'https://earthquake.usgs.gov/fdsnws/event/1/count?a=1',
      )
    } finally {
      process.env.NEXT_PUBLIC_ENV_URL_API = original
    }
  })

  test('tolera la forma canónica y una barra final', () => {
    const original = process.env.NEXT_PUBLIC_ENV_URL_API

    try {
      process.env.NEXT_PUBLIC_ENV_URL_API =
        'https://earthquake.usgs.gov/fdsnws/event/1/'

      assert.equal(
        getQueryUrl('a=1'),
        'https://earthquake.usgs.gov/fdsnws/event/1/query?a=1',
      )
    } finally {
      process.env.NEXT_PUBLIC_ENV_URL_API = original
    }
  })
})
