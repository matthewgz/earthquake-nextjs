import React, { useContext, useId, useRef } from 'react'
import { MdDateRange } from 'react-icons/md'
import { Context } from 'context/index'

import styled from 'styled-components'

const InnerContainer = styled.div`
  align-items: center;
  background: #7b92a6;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  display: flex;
  font-size: 18px;
  height: 56px;
  justify-content: flex-end;
  padding: 0 16px;
  position: relative;
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Label = styled.label`
  font-size: 12px;
  left: 16px;
  position: absolute;
  top: 4px;
  cursor: pointer;
`

const Text = styled.p`
  bottom: 8px;
  left: 16px;
  position: absolute;
`

const Container = styled.div`
  position: relative;
  margin-top: 16px;
`

const NativeDateInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`

/**
 * `YYYY-MM-DD` -> `DD-MM-YYYY` para mostrar.
 *
 * Es manipulación de string a propósito: el valor ya es un día del calendario
 * local, así que convertirlo a `Date` para formatearlo solo reintroduciría la
 * ambigüedad UTC/local que causaba el desplazamiento de un día.
 */
const formatForDisplay = (iso) => {
  if (!iso) {
    return '—'
  }

  const [year, month, day] = iso.split('-')

  return `${day}-${month}-${year}`
}

/**
 * Envoltorio sobre un `<input type="date">` nativo.
 *
 * Trabaja exclusivamente con strings `YYYY-MM-DD`. Antes hacía
 * `new Date(e.target.value)`, que ECMAScript parsea como medianoche **UTC**;
 * al reformatearlo luego en hora local, los usuarios en zonas negativas
 * perdían un día entero.
 */
const DatePicker = (props) => {
  const { title, value, min, max, onChange } = props

  const { setShowFilters } = useContext(Context)

  const inputId = useId()
  const inputRef = useRef(null)

  const handleChange = (event) => {
    const nextValue = event.target.value

    // El input puede quedar vacío (botón de limpiar del calendario nativo);
    // en ese caso se conserva el valor anterior en vez de romper el rango.
    if (!nextValue) {
      return
    }

    onChange(nextValue)
    setShowFilters(false)
  }

  const handleContainerClick = (event) => {
    // El click sobre el input ya abre su propio calendario; volver a llamar a
    // showPicker() ahí lanza NotAllowedError en algunos navegadores.
    if (event.target === inputRef.current) {
      return
    }

    inputRef.current?.showPicker?.()
  }

  return (
    <Container>
      <InnerContainer onClick={handleContainerClick}>
        <Label htmlFor={inputId}>{title}:</Label>
        <Text aria-hidden="true">{formatForDisplay(value)}</Text>
        <MdDateRange size={32} aria-hidden="true" />
        <NativeDateInput
          id={inputId}
          ref={inputRef}
          type="date"
          value={value ?? ''}
          min={min ?? undefined}
          max={max ?? undefined}
          onChange={handleChange}
        />
      </InnerContainer>
    </Container>
  )
}

export default DatePicker
