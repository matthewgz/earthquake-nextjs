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

const Group = styled.p`
  font-size: 10px;
  font-weight: 600;
  margin-top: 8px;
  opacity: 0.6;
  text-transform: uppercase;
`

const Row = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
  margin-top: 4px;
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

const Hint = styled.span`
  font-size: 10px;
  opacity: 0.7;
`

/**
 * Control de capas del mapa, siempre visible.
 *
 * Antes solo aparecía con un sismo abierto, porque solo ofrecía sus dos capas.
 * Las placas tectónicas son contexto global —no dependen de ninguna
 * selección—, así que el panel se divide en dos bloques: lo que se puede ver
 * siempre, y lo que solo existe mientras haya un sismo abierto.
 *
 * Las capas del sismo siguen siendo independientes entre sí a propósito: una es
 * el modelo de USGS y la otra son reportes de personas, y compararlas es
 * justamente lo interesante.
 */
const LayerToggles = (props) => {
  const {
    hasContours,
    hasReports,
    showContours,
    showReports,
    showPlates,
    platesStatus,
    onToggleContours,
    onToggleReports,
    onTogglePlates,
  } = props

  const contoursId = useId()
  const reportsId = useId()
  const platesId = useId()

  const hasEarthquakeLayers = hasContours || hasReports

  return (
    <Container role="group" aria-label="Capas del mapa">
      <Title>Capas</Title>
      <Row>
        <Checkbox
          id={platesId}
          type="checkbox"
          checked={showPlates}
          onChange={(event) => onTogglePlates(event.target.checked)}
        />
        <Label htmlFor={platesId}>Placas tectónicas</Label>
        {/*
          El archivo son 164 KB que se piden al encender la capa, así que en
          una conexión lenta hay un hueco entre marcar la casilla y ver las
          líneas. Sin este aviso parecería que el interruptor no funciona.
        */}
        {platesStatus === 'loading' && <Hint>Cargando…</Hint>}
        {platesStatus === 'error' && <Hint>No se pudo cargar</Hint>}
      </Row>

      {hasEarthquakeLayers && (
        <>
          <Group>Del sismo</Group>
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
        </>
      )}
    </Container>
  )
}

export default LayerToggles
