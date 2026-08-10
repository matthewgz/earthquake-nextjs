import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  EMPTY_FILTERS,
  buildFilterSearch,
  parseFilterParams,
} from './filterParams.js'

describe('parseFilterParams', () => {
  test('lee unos filtros bien formados', () => {
    assert.deepEqual(
      parseFilterParams('?mag=5&desde=2026-08-01&hasta=2026-08-10'),
      { minMagnitude: 5, start: '2026-08-01', end: '2026-08-10' },
    )
  })

  test('acepta magnitud 0', () => {
    // Un `Number(raw) || null` la habría descartado por falsy, que es la misma
    // clase de bug que hacía que el selector mostrara el placeholder con 0.
    assert.equal(parseFilterParams('?mag=0').minMagnitude, 0)
  })

  test('descarta magnitudes fuera del conjunto de opciones', () => {
    for (const search of [
      '?mag=abc',
      '?mag=10',
      '?mag=-1',
      '?mag=5.5',
      '?mag=',
      '?mag=%3Cscript%3E',
    ]) {
      assert.equal(
        parseFilterParams(search).minMagnitude,
        null,
        `debería descartar ${search}`,
      )
    }
  })

  test('descarta fechas mal formadas o inexistentes', () => {
    for (const search of [
      '?desde=ayer',
      '?desde=2026-8-1',
      '?desde=01-08-2026',
      '?desde=2026-02-31',
      '?desde=2026-13-01',
      '?desde=',
    ]) {
      assert.equal(
        parseFilterParams(search).start,
        null,
        `debería descartar ${search}`,
      )
    }
  })

  test('los parámetros son independientes entre sí', () => {
    // Una fecha inválida no debe tumbar la magnitud, ni al revés.
    assert.deepEqual(
      parseFilterParams('?mag=7&desde=basura&hasta=2026-08-10'),
      {
        minMagnitude: 7,
        start: null,
        end: '2026-08-10',
      },
    )
  })

  test('sin parámetros devuelve todo nulo', () => {
    assert.deepEqual(parseFilterParams(''), EMPTY_FILTERS)
    assert.deepEqual(parseFilterParams(undefined), EMPTY_FILTERS)
    assert.deepEqual(parseFilterParams('?otro=1'), EMPTY_FILTERS)
  })
})

describe('buildFilterSearch', () => {
  test('serializa en un orden estable', () => {
    const search = buildFilterSearch({
      minMagnitude: 5,
      start: '2026-08-01',
      end: '2026-08-10',
    })

    assert.equal(search, '?mag=5&desde=2026-08-01&hasta=2026-08-10')
  })

  test('serializa la magnitud 0', () => {
    const search = buildFilterSearch({
      minMagnitude: 0,
      start: '2026-08-01',
      end: '2026-08-01',
    })

    assert.match(search, /mag=0/)
  })

  test('ida y vuelta sin pérdida', () => {
    const filtros = {
      minMagnitude: 3,
      start: '2026-01-31',
      end: '2026-02-01',
    }

    assert.deepEqual(parseFilterParams(buildFilterSearch(filtros)), filtros)
  })
})
