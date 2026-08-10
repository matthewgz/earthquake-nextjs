import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import fetchEarthquakes, {
  ERROR_CODES,
  clearCache,
  projectFeatures,
} from './fetchEarthquakes.js'

const originalFetch = globalThis.fetch

const feature = (id, overrides = {}) => ({
  type: 'Feature',
  id,
  properties: {
    place: `lugar ${id}`,
    mag: 5.5,
    time: 1785614566638,
    url: `https://earthquake.usgs.gov/eventpage/${id}`,
    // Campos que USGS envía y la app no usa; deben desaparecer al proyectar.
    ids: ',us1,',
    sources: ',us,',
    rms: 0.73,
    ...overrides.properties,
  },
  geometry: { type: 'Point', coordinates: [155.3, 49.3, 49.7] },
  ...overrides,
})

const jsonResponse = (body, { status = 200 } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => 'application/json; charset=utf-8' },
  json: async () => body,
  text: async () => JSON.stringify(body),
})

// Así responde USGS a un parámetro inválido: 400 con cuerpo de texto plano.
const textResponse = (body, { status = 400 } = {}) => ({
  ok: false,
  status,
  headers: { get: () => 'text/plain;charset=UTF-8' },
  json: async () => {
    throw new SyntaxError('Unexpected token E in JSON at position 0')
  },
  text: async () => body,
})

const stubFetch = (handler) => {
  globalThis.fetch = async (url, options) => handler(String(url), options)
}

describe('projectFeatures', () => {
  test('reduce la feature a los campos que usa la app', () => {
    const [projected] = projectFeatures([feature('us1')])

    assert.deepEqual(Object.keys(projected).sort(), [
      'geometry',
      'id',
      'properties',
    ])
    // Campos internos de USGS que la app no usa y que multiplican el peso de
    // una respuesta amplia (~719 KB sin proyectar).
    assert.equal(projected.properties.rms, undefined)
    assert.equal(projected.properties.ids, undefined)
    assert.equal(projected.properties.sources, undefined)
  })

  test('conserva los campos informativos que USGS ya envía', () => {
    const [projected] = projectFeatures([
      feature('us1', {
        properties: {
          felt: 287,
          cdi: 7.4,
          mmi: 7.02,
          alert: 'yellow',
          tsunami: 1,
          sig: 1032,
          magType: 'mww',
          type: 'quarry blast',
          status: 'reviewed',
        },
      }),
    ])

    // Venían en la misma respuesta que ya pedíamos y se estaban descartando.
    assert.equal(projected.properties.felt, 287)
    assert.equal(projected.properties.cdi, 7.4)
    assert.equal(projected.properties.mmi, 7.02)
    assert.equal(projected.properties.alert, 'yellow')
    assert.equal(projected.properties.tsunami, 1)
    assert.equal(projected.properties.sig, 1032)
    assert.equal(projected.properties.magType, 'mww')
    assert.equal(projected.properties.type, 'quarry blast')
    assert.equal(projected.properties.status, 'reviewed')
  })

  test('conserva la profundidad como tercera coordenada', () => {
    const [projected] = projectFeatures([feature('us1')])

    assert.equal(projected.geometry.coordinates[2], 49.7)
  })

  test('rellena tipo y tsunami cuando faltan', () => {
    const [projected] = projectFeatures([
      feature('us1', { properties: { type: null, tsunami: null } }),
    ])

    assert.equal(projected.properties.type, 'earthquake')
    assert.equal(projected.properties.tsunami, 0)
  })

  test('descarta features sin coordenadas utilizables', () => {
    const sinGeometria = { id: 'x', properties: {}, geometry: null }
    const coordsNulas = {
      id: 'y',
      properties: {},
      geometry: { coordinates: [null, null] },
    }

    assert.equal(projectFeatures([sinGeometria, coordsNulas]).length, 0)
  })

  test('tolera entradas que no son array', () => {
    assert.deepEqual(projectFeatures(undefined), [])
    assert.deepEqual(projectFeatures(null), [])
  })

  test('rellena place ausente en vez de mostrar undefined', () => {
    const [projected] = projectFeatures([
      feature('us1', { properties: { place: null } }),
    ])

    assert.equal(projected.properties.place, 'Ubicación desconocida')
  })
})

describe('fetchEarthquakes', () => {
  beforeEach(() => {
    clearCache()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('combina /query y /count y los pide en paralelo', async () => {
    const started = []

    stubFetch(async (url) => {
      started.push(url.includes('/count') ? 'count' : 'query')

      return url.includes('/count')
        ? jsonResponse({ count: 42, maxAllowed: 20000 })
        : jsonResponse({ features: [feature('us1'), feature('us2')] })
    })

    const result = await fetchEarthquakes('format=geojson&a=1')

    assert.equal(result.features.length, 2)
    // El total viene de /count, no del número de features: con `limit`
    // presente, `metadata.count` desaparece de la respuesta de /query.
    assert.equal(result.total, 42)
    assert.deepEqual(started.sort(), ['count', 'query'])
  })

  test('no revienta ante el 400 con cuerpo text/plain de USGS', async () => {
    stubFetch(async (url) =>
      url.includes('/count')
        ? jsonResponse({ count: 0 })
        : textResponse(
            'Error 400: Bad Request\n\nBad minmagnitude value "abc"',
          ),
    )

    // El código anterior llamaba a res.json() sin comprobar nada: esto lanzaba
    // un SyntaxError que quedaba como unhandled rejection y dejaba el spinner
    // girando para siempre.
    const error = await fetchEarthquakes('bad=1').then(
      () => null,
      (e) => e,
    )

    assert.ok(error, 'debería rechazar')
    assert.equal(error.code, ERROR_CODES.badRequest)
    assert.match(error.detail, /Bad minmagnitude/)
  })

  test('clasifica los 5xx como error de red, no de petición', async () => {
    stubFetch(async () => textResponse('Service Unavailable', { status: 503 }))

    const error = await fetchEarthquakes('a=1').then(
      () => null,
      (e) => e,
    )

    assert.equal(error.code, ERROR_CODES.network)
  })

  test('detecta el exceso de resultados que reporta /count', async () => {
    stubFetch(async (url) =>
      url.includes('/count')
        ? jsonResponse({
            count: 994743,
            maxAllowed: 20000,
            error: 'Result exceeds search limit',
          })
        : jsonResponse({ features: [feature('us1')] }),
    )

    const error = await fetchEarthquakes('a=1').then(
      () => null,
      (e) => e,
    )

    assert.equal(error.code, ERROR_CODES.tooMany)
  })

  test('un fallo de red se traduce a código network', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    const error = await fetchEarthquakes('a=1').then(
      () => null,
      (e) => e,
    )

    assert.equal(error.code, ERROR_CODES.network)
  })

  test('propaga AbortError sin envolverlo', async () => {
    stubFetch(async () => {
      const error = new Error('aborted')
      error.name = 'AbortError'
      throw error
    })

    const error = await fetchEarthquakes('a=1').then(
      () => null,
      (e) => e,
    )

    // El hook distingue el aborto de un fallo real para no mostrar un error
    // cuando simplemente llegó una petición más nueva.
    assert.equal(error.name, 'AbortError')
    assert.equal(error.code, undefined)
  })

  test('sigue funcionando si /count falla', async () => {
    stubFetch(async (url) => {
      if (url.includes('/count')) {
        throw new TypeError('Failed to fetch')
      }

      return jsonResponse({ features: [feature('us1')] })
    })

    const result = await fetchEarthquakes('a=1')

    assert.equal(result.features.length, 1)
    assert.equal(result.total, 1)
  })

  test('marca truncated cuando hay más resultados que el tope', async () => {
    const many = Array.from({ length: 1000 }, (_, i) => feature(`us${i}`))

    stubFetch(async (url) =>
      url.includes('/count')
        ? jsonResponse({ count: 10630 })
        : jsonResponse({ features: many }),
    )

    const result = await fetchEarthquakes('a=1')

    assert.equal(result.truncated, true)
    assert.equal(result.total, 10630)
    assert.equal(result.features.length, 1000)
  })

  test('cachea por consulta y no vuelve a pedir', async () => {
    let calls = 0

    stubFetch(async (url) => {
      calls += 1

      return url.includes('/count')
        ? jsonResponse({ count: 1 })
        : jsonResponse({ features: [feature('us1')] })
    })

    await fetchEarthquakes('a=1')
    await fetchEarthquakes('a=1')

    assert.equal(calls, 2, 'la segunda llamada debe salir de la caché')

    await fetchEarthquakes('a=2')

    assert.equal(calls, 4, 'una consulta distinta sí golpea la red')
  })

  test('la caché no crece sin límite', async () => {
    stubFetch(async (url) =>
      url.includes('/count')
        ? jsonResponse({ count: 1 })
        : jsonResponse({ features: [feature('us1')] }),
    )

    for (let i = 0; i < 25; i += 1) {
      await fetchEarthquakes(`q=${i}`)
    }

    let calls = 0

    stubFetch(async (url) => {
      calls += 1

      return url.includes('/count')
        ? jsonResponse({ count: 1 })
        : jsonResponse({ features: [feature('us1')] })
    })

    // La entrada 0 ya fue desalojada (tope de 20); la 24 sigue en caché.
    await fetchEarthquakes('q=0')
    assert.equal(calls, 2)

    await fetchEarthquakes('q=24')
    assert.equal(calls, 2)
  })
})
