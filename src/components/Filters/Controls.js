import React, { useContext } from 'react'

import Select from 'components/Select'
import DatePicker from 'components/DatePicker'
import OnlyEarthquakesToggle from './OnlyEarthquakesToggle'
import { Context } from 'context/index'

/**
 * Los tres controles de filtro. Móvil y escritorio comparten estos elementos y
 * solo difieren en el contenedor que los envuelve.
 *
 * Los `min`/`max` son la primera capa de validación: reemplazan al antiguo prop
 * `disabledDays`, que `DatePicker` recibía pero nunca aplicaba, de modo que se
 * podía elegir "Hasta" antes de "Desde" o una fecha futura y USGS respondía 200
 * con cero resultados, indistinguible de "no hubo sismos".
 */
const Controls = () => {
  const { range, today, setRangeStart, setRangeEnd } = useContext(Context)

  return (
    <>
      <Select />
      <DatePicker
        title="Desde"
        value={range.start}
        max={range.end ?? today}
        onChange={setRangeStart}
      />
      <DatePicker
        title="Hasta"
        value={range.end}
        min={range.start}
        max={today}
        onChange={setRangeEnd}
      />
      <OnlyEarthquakesToggle />
    </>
  )
}

export default Controls
