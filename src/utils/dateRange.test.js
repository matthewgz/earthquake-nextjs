import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  addDaysISO,
  compareISO,
  endOfLocalDayUTC,
  isValidISODate,
  sanitizeRange,
  startOfLocalDayUTC,
  todayISO,
  toISODate,
} from './dateRange.js'

const originalTZ = process.env.TZ

const withTZ = (tz, fn) => {
  process.env.TZ = tz
  try {
    fn()
  } finally {
    process.env.TZ = originalTZ
  }
}

describe('startOfLocalDayUTC / endOfLocalDayUTC', () => {
  // Este es el bug que reportó el usuario: elegir "10 ago" tiene que consultar
  // SU 10 de agosto, no el 10 de agosto UTC.
  const cases = [
    {
      tz: 'UTC',
      start: '2026-08-10T00:00:00.000Z',
      end: '2026-08-10T23:59:59.999Z',
    },
    {
      tz: 'America/Caracas', // UTC-4 fijo, sin horario de verano
      start: '2026-08-10T04:00:00.000Z',
      end: '2026-08-11T03:59:59.999Z',
    },
    {
      tz: 'Asia/Tokyo', // UTC+9: el día local empieza el día UTC anterior
      start: '2026-08-09T15:00:00.000Z',
      end: '2026-08-10T14:59:59.999Z',
    },
    {
      tz: 'Australia/Lord_Howe', // UTC+10:30, offset con media hora
      start: '2026-08-09T13:30:00.000Z',
      end: '2026-08-10T13:29:59.999Z',
    },
  ]

  for (const { tz, start, end } of cases) {
    test(`${tz}: el día local se traduce al instante UTC correcto`, () => {
      withTZ(tz, () => {
        assert.equal(startOfLocalDayUTC('2026-08-10'), start)
        assert.equal(endOfLocalDayUTC('2026-08-10'), end)
      })
    })
  }

  test('el offset se calcula para la fecha destino, no para hoy', () => {
    // Santiago cambia de UTC-3 (verano austral) a UTC-4 (invierno). Un enfoque
    // basado en getTimezoneOffset() del momento actual daría uno de los dos
    // valores para ambas fechas; construir el Date en hora local no.
    withTZ('America/Santiago', () => {
      assert.equal(startOfLocalDayUTC('2026-01-15'), '2026-01-15T03:00:00.000Z')
      assert.equal(startOfLocalDayUTC('2026-07-15'), '2026-07-15T04:00:00.000Z')
    })
  })

  test('cruza correctamente la transición de horario de verano', () => {
    withTZ('America/Santiago', () => {
      // El cambio ocurre entre estos dos días: el offset pasa de -4 a -3.
      assert.equal(startOfLocalDayUTC('2026-09-06'), '2026-09-06T04:00:00.000Z')
      assert.equal(startOfLocalDayUTC('2026-09-07'), '2026-09-07T03:00:00.000Z')
    })
  })

  test('la ventana de un día es contigua sin huecos ni solapes', () => {
    withTZ('America/Caracas', () => {
      const finDelDia = endOfLocalDayUTC('2026-08-10')
      const inicioDelSiguiente = startOfLocalDayUTC('2026-08-11')

      assert.equal(
        new Date(inicioDelSiguiente).getTime() - new Date(finDelDia).getTime(),
        1,
      )
    })
  })

  test('devuelve null ante entradas inválidas', () => {
    for (const invalid of [
      null,
      undefined,
      '',
      'hoy',
      '2026-8-10',
      '10-08-2026',
      '2026-02-31', // día inexistente
      '2026-13-01', // mes inexistente
      new Date(),
      12345,
    ]) {
      assert.equal(startOfLocalDayUTC(invalid), null)
      assert.equal(endOfLocalDayUTC(invalid), null)
    }
  })
})

describe('todayISO / toISODate', () => {
  test('devuelve el día del calendario local, no el UTC', () => {
    // 2026-08-10T02:00:00Z es todavía el 9 de agosto en Caracas (UTC-4).
    const instante = new Date('2026-08-10T02:00:00.000Z')

    withTZ('America/Caracas', () => {
      assert.equal(toISODate(instante), '2026-08-09')
    })

    withTZ('UTC', () => {
      assert.equal(toISODate(instante), '2026-08-10')
    })

    withTZ('Asia/Tokyo', () => {
      assert.equal(toISODate(instante), '2026-08-10')
    })
  })

  test('todayISO devuelve un formato válido y estable', () => {
    const today = todayISO()

    assert.match(today, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(isValidISODate(today))
  })

  test('toISODate rechaza no-fechas', () => {
    assert.equal(toISODate(null), null)
    assert.equal(toISODate('2026-08-10'), null)
    assert.equal(toISODate(new Date('no es una fecha')), null)
  })
})

describe('compareISO', () => {
  test('ordena cronológicamente', () => {
    assert.equal(compareISO('2026-08-09', '2026-08-10'), -1)
    assert.equal(compareISO('2026-08-10', '2026-08-10'), 0)
    assert.equal(compareISO('2026-08-11', '2026-08-10'), 1)
  })

  test('ordena bien cruzando mes y año', () => {
    assert.equal(compareISO('2026-01-31', '2026-02-01'), -1)
    assert.equal(compareISO('2025-12-31', '2026-01-01'), -1)
    // Sin padding esto fallaría: '2026-9-01' > '2026-10-01' lexicográficamente.
    assert.equal(compareISO('2026-09-01', '2026-10-01'), -1)
  })
})

describe('addDaysISO', () => {
  test('suma y resta cruzando límites de mes y año', () => {
    assert.equal(addDaysISO('2026-08-10', 1), '2026-08-11')
    assert.equal(addDaysISO('2026-08-31', 1), '2026-09-01')
    assert.equal(addDaysISO('2026-12-31', 1), '2027-01-01')
    assert.equal(addDaysISO('2026-01-01', -1), '2025-12-31')
    assert.equal(addDaysISO('2026-03-01', -1), '2026-02-28')
    assert.equal(addDaysISO('2024-03-01', -1), '2024-02-29') // año bisiesto
    assert.equal(addDaysISO('2026-08-10', 0), '2026-08-10')
    assert.equal(addDaysISO('2026-08-10', -30), '2026-07-11')
  })

  test('no se desplaza al cruzar un cambio de horario', () => {
    withTZ('America/Santiago', () => {
      assert.equal(addDaysISO('2026-09-06', 1), '2026-09-07')
    })
  })

  test('devuelve null ante entrada inválida', () => {
    assert.equal(addDaysISO('basura', 1), null)
  })
})

describe('sanitizeRange', () => {
  test('invierte un rango al revés', () => {
    assert.deepEqual(
      sanitizeRange({ start: '2020-08-10', end: '2020-08-01' }),
      { start: '2020-08-01', end: '2020-08-10' },
    )
  })

  test('recorta fechas futuras a hoy', () => {
    const today = todayISO()
    const result = sanitizeRange({ start: '2020-01-01', end: '2999-12-31' })

    assert.equal(result.start, '2020-01-01')
    assert.equal(result.end, today)
  })

  test('reemplaza valores basura por hoy', () => {
    const today = todayISO()

    assert.deepEqual(sanitizeRange({ start: 'ayer', end: null }), {
      start: today,
      end: today,
    })
    assert.deepEqual(sanitizeRange(undefined), { start: today, end: today })
    assert.deepEqual(sanitizeRange({}), { start: today, end: today })
  })

  test('deja intacto un rango válido y pasado', () => {
    assert.deepEqual(
      sanitizeRange({ start: '2020-08-01', end: '2020-08-10' }),
      { start: '2020-08-01', end: '2020-08-10' },
    )
  })

  test('el resultado siempre cumple start <= end', () => {
    const entradas = [
      { start: '2999-01-01', end: '2020-01-01' },
      { start: 'x', end: '2020-01-01' },
      { start: '2020-01-01', end: 'x' },
      { start: '2999-01-01', end: '2999-01-02' },
    ]

    for (const entrada of entradas) {
      const { start, end } = sanitizeRange(entrada)

      assert.ok(
        compareISO(start, end) <= 0,
        `${JSON.stringify(entrada)} produjo ${start} > ${end}`,
      )
    }
  })
})
