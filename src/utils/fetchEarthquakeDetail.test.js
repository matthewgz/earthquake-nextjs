import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import fetchEarthquakeDetail, {
  clearDetailCache,
} from './fetchEarthquakeDetail.js'

const originalFetch = globalThis.fetch

const json = (body) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => body,
})

const CONTOUR_URL =
  'https://earthquake.usgs.gov/product/shakemap/x/cont_mmi.json'

const detailResponse = (products) => json({ properties: { products } })

const contours = {
  type: 'FeatureCollection',
  features: [
    { properties: { value: 4.5 }, geometry: { type: 'MultiLineString' } },
  ],
}

const REPORTS_URL =
  'https://earthquake.usgs.gov/product/dyfi/x/dyfi_geo_10km.geojson'

const reports = {
  type: 'FeatureCollection',
  features: [
    {
      properties: { cdi: 7.4, nresp: 3, name: 'UTM:(17M)<br>Eloy Alfaro' },
      geometry: { type: 'Polygon', coordinates: [[[0, 0]]] },
    },
  ],
}

const withProducts = (products) => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('cont_mmi')) return json(contours)
    if (String(url).includes('dyfi_geo')) return json(reports)

    return detailResponse(products)
  }
}

describe('fetchEarthquakeDetail', () => {
  beforeEach(() => {
    clearDetailCache()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('extrae duración, reportes y contornos', async () => {
    withProducts({
      'moment-tensor': [
        {
          properties: {
            'sourcetime-duration': '7',
            'sourcetime-type': 'triangle',
          },
        },
      ],
      dyfi: [
        {
          properties: { 'num-responses': '287', maxmmi: '7.4' },
          contents: { 'dyfi_geo_10km.geojson': { url: REPORTS_URL } },
        },
      ],
      shakemap: [
        { contents: { 'download/cont_mmi.json': { url: CONTOUR_URL } } },
      ],
    })

    const detail = await fetchEarthquakeDetail('us1')

    assert.equal(detail.ruptureDuration, 7)
    assert.equal(detail.responses, 287)
    assert.equal(detail.maxReportedIntensity, 7.4)
    assert.equal(detail.intensityContours.features.length, 1)
    assert.equal(detail.feltReports.features.length, 1)
  })

  test('las dos capas son independientes entre sí', async () => {
    // Un sismo puede tener ShakeMap sin que nadie haya reportado, y al revés.
    withProducts({
      shakemap: [
        { contents: { 'download/cont_mmi.json': { url: CONTOUR_URL } } },
      ],
    })

    const soloModelo = await fetchEarthquakeDetail('us-a')

    assert.ok(soloModelo.intensityContours)
    assert.equal(soloModelo.feltReports, null)

    clearDetailCache()
    withProducts({
      dyfi: [
        {
          properties: { 'num-responses': '4' },
          contents: { 'dyfi_geo_10km.geojson': { url: REPORTS_URL } },
        },
      ],
    })

    const soloReportes = await fetchEarthquakeDetail('us-b')

    assert.equal(soloReportes.intensityContours, null)
    assert.ok(soloReportes.feltReports)
  })

  test('devuelve nulos cuando el evento no tiene productos derivados', async () => {
    // El caso normal por debajo de magnitud 5: sin ShakeMap ni tensor de
    // momento. La UI tiene que degradar, no romperse.
    withProducts({})

    const detail = await fetchEarthquakeDetail('us2')

    assert.equal(detail.ruptureDuration, null)
    assert.equal(detail.responses, null)
    assert.equal(detail.maxReportedIntensity, null)
    assert.equal(detail.intensityContours, null)
  })

  test('ignora una duración ausente o cero', async () => {
    withProducts({ 'moment-tensor': [{ properties: {} }] })
    assert.equal((await fetchEarthquakeDetail('us3')).ruptureDuration, null)

    clearDetailCache()
    withProducts({
      'moment-tensor': [{ properties: { 'sourcetime-duration': '0' } }],
    })
    assert.equal((await fetchEarthquakeDetail('us4')).ruptureDuration, null)
  })

  test('un fallo al traer los contornos no tumba el resto del detalle', async () => {
    globalThis.fetch = async (url) => {
      if (String(url).includes('cont_mmi')) {
        throw new TypeError('Failed to fetch')
      }

      return detailResponse({
        dyfi: [{ properties: { 'num-responses': '14' } }],
        shakemap: [
          { contents: { 'download/cont_mmi.json': { url: CONTOUR_URL } } },
        ],
      })
    }

    const detail = await fetchEarthquakeDetail('us5')

    assert.equal(detail.responses, 14)
    assert.equal(detail.intensityContours, null)
  })

  test('cachea por evento', async () => {
    let calls = 0

    globalThis.fetch = async (url) => {
      calls += 1

      return String(url).includes('cont_mmi')
        ? json(contours)
        : detailResponse({})
    }

    await fetchEarthquakeDetail('us6')
    await fetchEarthquakeDetail('us6')

    assert.equal(calls, 1, 'la segunda apertura no debe volver a pedir')

    await fetchEarthquakeDetail('us7')

    assert.equal(calls, 2)
  })

  test('propaga el error si falla la ficha principal', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 404,
      headers: { get: () => 'text/plain' },
    })

    await assert.rejects(() => fetchEarthquakeDetail('inexistente'))
  })
})
