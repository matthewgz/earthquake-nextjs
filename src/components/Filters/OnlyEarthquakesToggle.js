import React, { useContext, useId } from 'react'

import { Context } from 'context/index'

import styled from 'styled-components'

// El espaciado lo ponen los contenedores de Filters (móvil y escritorio los
// distribuyen de forma distinta), no cada control por su cuenta.
const Container = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`

const Checkbox = styled.input`
  accent-color: #93aebf;
  cursor: pointer;
  height: 16px;
  margin: 0;
  width: 16px;

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Label = styled.label`
  cursor: pointer;
  font-size: 13px;
  line-height: 1.3;
`

/**
 * USGS publica en el mismo feed voladuras de cantera, explosiones,
 * deslizamientos y sismos de hielo. Son ~2% del total y solo asoman con
 * magnitudes bajas, pero sin este filtro se presentaban como si fueran
 * terremotos. Va activado por defecto.
 */
const OnlyEarthquakesToggle = () => {
  const { onlyEarthquakes, setOnlyEarthquakes, setShowFilters } =
    useContext(Context)

  const id = useId()

  return (
    <Container>
      <Checkbox
        id={id}
        type="checkbox"
        checked={onlyEarthquakes}
        onChange={(event) => {
          setOnlyEarthquakes(event.target.checked)
          setShowFilters(false)
        }}
      />
      <Label htmlFor={id}>Solo sismos naturales</Label>
    </Container>
  )
}

export default OnlyEarthquakesToggle
