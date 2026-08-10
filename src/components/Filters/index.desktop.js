import React from 'react'

import Controls from './Controls'

import styled from 'styled-components'

const Container = styled.div`
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: flex-end;

  /*
    Los tres primeros controles (magnitud y las dos fechas) van a ancho fijo;
    el último es la casilla, que se ajusta a su contenido.
  */
  & > *:not(:last-child) {
    width: 250px;
  }
`

const FiltersDesktop = () => (
  <Container>
    <Controls />
  </Container>
)

export default FiltersDesktop
