'use client'

import React, { useId } from 'react'

import styled from 'styled-components'

const Container = styled.div`
  background: rgba(17, 20, 38, 0.85);
  border-radius: 6px;
  color: white;
  padding: 10px 12px;
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 500;
`

const Title = styled.p`
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
`

const Row = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;

  & + & {
    margin-top: 4px;
  }
`

const Checkbox = styled.input`
  accent-color: #93aebf;
  cursor: pointer;
  height: 14px;
  margin: 0;
  width: 14px;

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Label = styled.label`
  cursor: pointer;
  font-size: 11px;
`

/**
 * Aparece solo cuando el sismo abierto tiene alguna de las dos capas. Las dos
 * son independientes a propósito: una es el modelo de USGS y la otra son
 * reportes de personas, y compararlas es justamente lo interesante.
 */
const LayerToggles = (props) => {
  const {
    hasContours,
    hasReports,
    showContours,
    showReports,
    onToggleContours,
    onToggleReports,
  } = props

  const contoursId = useId()
  const reportsId = useId()

  if (!hasContours && !hasReports) {
    return null
  }

  return (
    <Container>
      <Title>Capas del sismo</Title>
      {hasContours && (
        <Row>
          <Checkbox
            id={contoursId}
            type="checkbox"
            checked={showContours}
            onChange={(event) => onToggleContours(event.target.checked)}
          />
          <Label htmlFor={contoursId}>Intensidad estimada</Label>
        </Row>
      )}
      {hasReports && (
        <Row>
          <Checkbox
            id={reportsId}
            type="checkbox"
            checked={showReports}
            onChange={(event) => onToggleReports(event.target.checked)}
          />
          <Label htmlFor={reportsId}>Reportes de personas</Label>
        </Row>
      )}
    </Container>
  )
}

export default LayerToggles
