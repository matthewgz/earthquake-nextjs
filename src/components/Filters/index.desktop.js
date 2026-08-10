import React from 'react'

import Controls from './Controls'

import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > * {
    width: 250px;
    padding: 0;
    margin: 0;
    margin-left: 16px;
  }
`

const FiltersDesktop = () => (
  <Container>
    <Controls />
  </Container>
)

export default FiltersDesktop
