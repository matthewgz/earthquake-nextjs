'use client'

import React from 'react'

import { INTENSITY_SCALE } from 'utils/earthquakeInfo'

import styled from 'styled-components'

const Container = styled.div`
  background: rgba(17, 20, 38, 0.85);
  border-radius: 6px;
  bottom: 24px;
  color: white;
  padding: 10px 12px;
  position: absolute;
  right: 12px;
  /* Por encima de los paneles de Leaflet, por debajo del cajón de resultados. */
  z-index: 500;
`

const Title = styled.p`
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
`

const Scale = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
`

const Step = styled.li`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: 9px;
  gap: 3px;
  width: 30px;
`

const Swatch = styled.span`
  background: ${(props) => props.$color};
  display: block;
  height: 10px;
  width: 100%;
`

const Caption = styled.p`
  font-size: 9px;
  margin-top: 6px;
  max-width: 270px;
  opacity: 0.75;
`

/**
 * Sin esto los colores del mapa no comunican nada. Se usan los números romanos
 * porque es como se publica la escala de Mercalli.
 */
const IntensityLegend = ({ showsContours, showsReports }) => (
  <Container role="group" aria-label="Escala de intensidad Mercalli">
    <Title>Intensidad percibida</Title>
    <Scale>
      {INTENSITY_SCALE.map((step) => (
        <Step key={step.roman}>
          <Swatch $color={step.color} aria-hidden="true" />
          <span>{step.roman}</span>
        </Step>
      ))}
    </Scale>
    <Caption>
      {showsContours && showsReports
        ? 'Líneas: estimación a partir de sismógrafos. Relleno: reportes de personas.'
        : showsReports
          ? 'Relleno: reportes de personas que estaban ahí.'
          : 'Líneas: estimación a partir de sismógrafos.'}
    </Caption>
  </Container>
)

export default IntensityLegend
